import { Message, Conversation } from '@/models/Message';
import { IMessage, IConversation } from '@/types';
import { AppError } from '@/middlewares/errorHandler';
import { logger } from '@/utils/logger';

export class MessageService {
  /**
   * Get or create a conversation between two users
   */
  async getOrCreateConversation(user1Id: string, user2Id: string): Promise<IConversation> {
    try {
      const participants = [user1Id, user2Id].sort();

      let conversation = await Conversation.findOne({
        participants: { $all: participants, $size: 2 },
      });

      if (!conversation) {
        conversation = new Conversation({
          participants,
        });
        await conversation.save();
        logger.info(`Conversation created between ${user1Id} and ${user2Id}`);
      }

      return {
        _id: conversation._id?.toString(),
        participants: conversation.participants.map((p) => p.toString()),
        lastMessage: conversation.lastMessage as IMessage | undefined,
        lastMessageAt: conversation.lastMessageAt,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      };
    } catch (error) {
      logger.error('Get or create conversation error:', error);
      throw new AppError('Erreur lors de la création de la conversation', 500);
    }
  }

  /**
   * Send a message
   */
  async sendMessage(
    senderId: string,
    receiverId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' | 'audio' = 'text',
    attachmentName?: string,
    attachmentMimeType?: string,
    attachmentSize?: number
  ): Promise<IMessage> {
    try {
      // Get or create conversation
      const conversation = await this.getOrCreateConversation(senderId, receiverId);

      // Create message
      const message = new Message({
        senderId,
        receiverId,
        conversationId: conversation._id,
        content,
        messageType,
        attachmentName,
        attachmentMimeType,
        attachmentSize,
        isRead: false,
      });

      await message.save();

      // Update conversation
      await Conversation.findByIdAndUpdate(conversation._id, {
        lastMessage: message,
        lastMessageAt: new Date(),
      });

      logger.info(`Message sent from ${senderId} to ${receiverId}`);

      return {
        _id: message._id?.toString(),
        senderId: message.senderId.toString(),
        receiverId: message.receiverId.toString(),
        conversationId: message.conversationId.toString(),
        content: message.content,
        messageType: message.messageType,
        attachmentName: message.attachmentName,
        attachmentMimeType: message.attachmentMimeType,
        attachmentSize: message.attachmentSize,
        isRead: message.isRead,
        editedAt: message.editedAt,
        deletedAt: message.deletedAt,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Send message error:', error);
      throw new AppError("Erreur lors de l'envoi du message", 500);
    }
  }

  /**
   * Get messages for a conversation
   */
  async getConversationMessages(conversationId: string, page = 1, limit = 50): Promise<IMessage[]> {
    try {
      const skip = (page - 1) * limit;

      const messages = await Message.find({ conversationId, deletedAt: null })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean();

      return messages.map((msg) => ({
        _id: msg._id?.toString(),
        senderId: msg.senderId.toString(),
        receiverId: msg.receiverId.toString(),
        conversationId: msg.conversationId.toString(),
        content: msg.content,
        messageType: msg.messageType,
        attachmentName: msg.attachmentName,
        attachmentMimeType: msg.attachmentMimeType,
        attachmentSize: msg.attachmentSize,
        isRead: msg.isRead,
        editedAt: msg.editedAt,
        deletedAt: msg.deletedAt,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
      }));
    } catch (error) {
      logger.error('Get conversation messages error:', error);
      throw new AppError('Erreur lors de la récupération des messages', 500);
    }
  }

  /**
   * Edit a text message. Only its sender may edit it.
   */
  async editMessage(messageId: string, userId: string, content: string): Promise<IMessage> {
    const message = await Message.findOne({
      _id: messageId,
      senderId: userId,
      deletedAt: null,
    });

    if (!message) {
      throw new AppError('Message non trouvé', 404, 'MESSAGE_NOT_FOUND');
    }
    if (message.messageType !== 'text') {
      throw new AppError('Seuls les messages texte peuvent être modifiés', 400, 'MESSAGE_NOT_EDITABLE');
    }

    message.content = content;
    message.editedAt = new Date();
    await message.save();

    await Conversation.updateOne(
      { _id: message.conversationId, 'lastMessage._id': message._id },
      {
        $set: {
          'lastMessage.content': message.content,
          'lastMessage.editedAt': message.editedAt,
          'lastMessage.updatedAt': message.updatedAt,
        },
      }
    );

    return {
      _id: message._id.toString(),
      senderId: message.senderId.toString(),
      receiverId: message.receiverId.toString(),
      conversationId: message.conversationId.toString(),
      content: message.content,
      messageType: message.messageType,
      attachmentName: message.attachmentName,
      attachmentMimeType: message.attachmentMimeType,
      attachmentSize: message.attachmentSize,
      isRead: message.isRead,
      editedAt: message.editedAt,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }

  /**
   * Soft-delete a message. The record remains auditable but is no longer returned.
   */
  async deleteMessage(messageId: string, userId: string): Promise<{ receiverId: string; conversationId: string }> {
    const message = await Message.findOne({
      _id: messageId,
      senderId: userId,
      deletedAt: null,
    });

    if (!message) {
      throw new AppError('Message non trouvé', 404, 'MESSAGE_NOT_FOUND');
    }

    message.deletedAt = new Date();
    await message.save();

    const latestMessage = await Message.findOne({
      conversationId: message.conversationId,
      deletedAt: null,
    }).sort({ createdAt: -1 });

    if (latestMessage) {
      await Conversation.findByIdAndUpdate(message.conversationId, {
        lastMessage: latestMessage,
        lastMessageAt: latestMessage.createdAt,
      });
    } else {
      await Conversation.findByIdAndUpdate(message.conversationId, {
        $unset: { lastMessage: 1, lastMessageAt: 1 },
      });
    }

    return {
      receiverId: message.receiverId.toString(),
      conversationId: message.conversationId.toString(),
    };
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      await Message.updateMany(
        {
          conversationId,
          receiverId: userId,
          isRead: false,
        },
        {
          isRead: true,
        }
      );

      logger.info(`Messages marked as read for ${userId}`);
    } catch (error) {
      logger.error('Mark messages as read error:', error);
    }
  }

  /**
   * Get user conversations
   */
  async getUserConversations(userId: string, page = 1, limit = 20): Promise<IConversation[]> {
    try {
      const skip = (page - 1) * limit;

      const conversations = await Conversation.find({
        participants: userId,
      })
        .skip(skip)
        .limit(limit)
        .sort({ updatedAt: -1 })
        .lean();

      return conversations.map((conv) => ({
        _id: conv._id?.toString(),
        participants: conv.participants.map((p) => p.toString()),
        lastMessage: conv.lastMessage as IMessage | undefined,
        lastMessageAt: conv.lastMessageAt,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      }));
    } catch (error) {
      logger.error('Get user conversations error:', error);
      throw new AppError('Erreur lors de la récupération des conversations', 500);
    }
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    try {
      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        throw new AppError('Conversation non trouvée', 404, 'CONVERSATION_NOT_FOUND');
      }

      if (!conversation.participants.map((p) => p.toString()).includes(userId)) {
        throw new AppError('Accès non autorisé', 403, 'FORBIDDEN');
      }

      await Conversation.findByIdAndDelete(conversationId);
      await Message.deleteMany({ conversationId });

      logger.info(`Conversation deleted: ${conversationId}`);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Delete conversation error:', error);
      throw new AppError('Erreur lors de la suppression de la conversation', 500);
    }
  }
}

export const messageService = new MessageService();
