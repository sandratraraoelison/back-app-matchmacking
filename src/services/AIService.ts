import axios from 'axios';
import { AIConversation, AIMessage } from '@/models/AIChat';
import { IAIConversation, IAIMessage } from '@/types';
import { AppError } from '@/middlewares/errorHandler';
import { logger } from '@/utils/logger';
import { config } from '@/config/environment';

interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class AIService {
  private apiKey = config.openaiApiKey;
  private model = config.aiModel;
  private memorySize = config.aiMemorySize;

  /**
   * Get or create AI conversation
   */
  async getOrCreateConversation(userId: string): Promise<IAIConversation> {
    try {
      let conversation = await AIConversation.findOne({
        userId,
        isActive: true,
      });

      if (!conversation) {
        conversation = new AIConversation({
          userId,
          title: 'New Conversation',
          messages: [],
          memory: [],
          isActive: true,
        });
        await conversation.save();
        logger.info(`AI conversation created for user ${userId}`);
      }

      return this.mapAIConversation(conversation);
    } catch (error) {
      logger.error('Get or create AI conversation error:', error);
      throw new AppError('Erreur lors de la création de la conversation IA', 500);
    }
  }

  /**
   * Send message to AI and get response
   */
  async sendMessage(
    userId: string,
    content: string,
    conversationId?: string
  ): Promise<{ userMessage: IAIMessage; assistantMessage: IAIMessage }> {
    try {
      // Get or create conversation
      let conversation = conversationId
        ? await AIConversation.findById(conversationId)
        : await AIConversation.findOne({
            userId,
            isActive: true,
          });

      if (!conversation) {
        conversation = new AIConversation({
          userId,
          title: content.substring(0, 50),
          messages: [],
          memory: [],
          isActive: true,
        });
      }

      // Store user message
      const userMessage = new AIMessage({
        userId,
        conversationId: conversation._id,
        role: 'user',
        content,
        tokens: Math.ceil(content.length / 4),
      });

      await userMessage.save();

      // Build conversation history
      const messages = await this.buildConversationHistory(conversation, content);

      // Call OpenAI API
      const aiResponse = await this.callOpenAI(messages);

      // Extract assistant content and tokens
      const assistantContent = aiResponse.choices[0].message.content;
      const tokens = aiResponse.usage.completion_tokens;

      // Store assistant message
      const assistantMessage = new AIMessage({
        userId,
        conversationId: conversation._id,
        role: 'assistant',
        content: assistantContent,
        tokens,
      });

      await assistantMessage.save();

      // Update memory if important
      await this.updateMemory(conversation, content);

      logger.info(`AI message processed for user ${userId}`);

      return {
        userMessage: this.mapAIMessage(userMessage),
        assistantMessage: this.mapAIMessage(assistantMessage),
      };
    } catch (error) {
      logger.error('Send AI message error:', error);
      throw new AppError("Erreur lors de la communication avec l'IA", 500);
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(
    conversationId: string,
    page = 1,
    limit = 50
  ): Promise<IAIMessage[]> {
    try {
      const skip = (page - 1) * limit;

      const messages = await AIMessage.find({ conversationId })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: 1 })
        .lean();

      return messages.map((msg) => this.mapAIMessage(msg));
    } catch (error) {
      logger.error('Get conversation history error:', error);
      throw new AppError("Erreur lors de la récupération de l'historique", 500);
    }
  }

  /**
   * Get all conversations for a user
   */
  async getUserConversations(userId: string, page = 1, limit = 20): Promise<IAIConversation[]> {
    try {
      const skip = (page - 1) * limit;

      const conversations = await AIConversation.find({ userId })
        .skip(skip)
        .limit(limit)
        .sort({ updatedAt: -1 })
        .lean();

      return conversations.map((conv) => this.mapAIConversation(conv));
    } catch (error) {
      logger.error('Get user conversations error:', error);
      throw new AppError('Erreur lors de la récupération des conversations', 500);
    }
  }

  /**
   * Build conversation history for API call
   */
  private async buildConversationHistory(
    conversation: any,
    userContent: string
  ): Promise<OpenAIMessage[]> {
    const messages: OpenAIMessage[] = [];

    // Add system message with memory context
    const memoryContext = this.buildMemoryContext(conversation.memory);
    const systemPrompt = `Tu es un assistant IA utile et bienveillant. ${memoryContext}`;

    messages.push({
      role: 'system',
      content: systemPrompt,
    });

    // Add recent messages from conversation
    const recentMessages = await AIMessage.find({
      conversationId: conversation._id,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    recentMessages.reverse().forEach((msg) => {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    });

    // Add current user message
    messages.push({
      role: 'user',
      content: userContent,
    });

    return messages;
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(messages: OpenAIMessage[]): Promise<any> {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.model,
          messages,
          temperature: 0.7,
          max_tokens: 1000,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('OpenAI API error:', error.response?.data || error.message);
      throw new AppError("Erreur lors de l'appel à l'API OpenAI", 500);
    }
  }

  /**
   * Update conversation memory
   */
  private async updateMemory(conversation: any, userContent: string): Promise<void> {
    try {
      // Simple memory extraction - in production, use NLP to identify key info
      const keywordRegex = /(\w+):\s*([^,]+)/g;
      const matches = userContent.matchAll(keywordRegex);

      for (const match of matches) {
        const existingMemory = conversation.memory.find((m: any) => m.key === match[1]);

        if (existingMemory) {
          existingMemory.value = match[2];
          existingMemory.importance = Math.min(100, existingMemory.importance + 10);
          existingMemory.updatedAt = new Date();
        } else if (conversation.memory.length < this.memorySize) {
          conversation.memory.push({
            key: match[1],
            value: match[2],
            importance: 50,
            updatedAt: new Date(),
          });
        }
      }

      // Keep only top N memories by importance
      conversation.memory.sort((a: any, b: any) => b.importance - a.importance);
      conversation.memory = conversation.memory.slice(0, this.memorySize);

      await conversation.save();
    } catch (error) {
      logger.error('Update memory error:', error);
    }
  }

  /**
   * Build memory context for system prompt
   */
  private buildMemoryContext(memory: any[]): string {
    if (memory.length === 0) {
      return '';
    }

    const memoryItems = memory
      .sort((a: any, b: any) => b.importance - a.importance)
      .slice(0, 5)
      .map((item: any) => `${item.key}: ${item.value}`)
      .join(', ');

    return `Important: ${memoryItems}.`;
  }

  /**
   * Map AI conversation to DTO
   */
  private mapAIConversation(conversation: any): IAIConversation {
    return {
      _id: conversation._id?.toString(),
      userId: conversation.userId.toString(),
      title: conversation.title,
      messages: conversation.messages?.map((msg: any) => this.mapAIMessage(msg)) || [],
      memory: conversation.memory || [],
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      isActive: conversation.isActive,
    };
  }

  /**
   * Map AI message to DTO
   */
  private mapAIMessage(message: any): IAIMessage {
    return {
      _id: message._id?.toString(),
      userId: message.userId.toString(),
      conversationId: message.conversationId.toString(),
      role: message.role,
      content: message.content,
      tokens: message.tokens,
      createdAt: message.createdAt,
    };
  }
}

export const aiService = new AIService();
