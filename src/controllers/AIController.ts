import { Request, Response } from 'express';
import { aiService } from '@/services/AIService';
import { ApiResponse } from '@/utils/response';
import { aiMessageSchema, translationSchema } from '@/utils/validators';
import { logger } from '@/utils/logger';

export class AIController {
  async translate(req: Request, res: Response): Promise<void> {
    try {
      const { content, targetLanguage } = translationSchema.parse(req.body);
      const translation = await aiService.translateText(content, targetLanguage);
      ApiResponse.success(res, { translation }, 'Texte traduit');
    } catch (error) {
      logger.error('AI translation error:', error);
      if (error instanceof Error && 'issues' in error) {
        ApiResponse.validationError(res, (error as any).issues);
      } else {
        ApiResponse.error(res, 'Traduction indisponible', 'AI_TRANSLATION_ERROR');
      }
    }
  }
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        ApiResponse.unauthorized(res);
        return;
      }

      const { content, conversationId } = aiMessageSchema.parse(req.body);

      const result = await aiService.sendMessage(userId, content, conversationId);

      ApiResponse.created(res, result, "Message traité par l'IA");
    } catch (error) {
      logger.error('Send AI message controller error:', error);
      if (error instanceof Error && 'issues' in error) {
        ApiResponse.validationError(res, (error as any).issues);
      } else {
        ApiResponse.error(res, 'Erreur lors du traitement du message', 'AI_MESSAGE_ERROR');
      }
    }
  }

  async getConversationHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        ApiResponse.unauthorized(res);
        return;
      }

      const { conversationId, page, limit } = req.query;

      if (!conversationId) {
        ApiResponse.badRequest(res, 'conversationId est requis');
        return;
      }

      const pageNum = page ? parseInt(page as string) : 1;
      const limitNum = limit ? parseInt(limit as string) : 50;

      const history = await aiService.getConversationHistory(
        conversationId as string,
        pageNum,
        limitNum
      );

      ApiResponse.success(res, history, 'Historique récupéré');
    } catch (error) {
      logger.error('Get conversation history controller error:', error);
      ApiResponse.error(res, "Erreur lors de la récupération de l'historique", 'GET_HISTORY_ERROR');
    }
  }

  async getConversations(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        ApiResponse.unauthorized(res);
        return;
      }

      const { page, limit } = req.query;
      const pageNum = page ? parseInt(page as string) : 1;
      const limitNum = limit ? parseInt(limit as string) : 20;

      const conversations = await aiService.getUserConversations(userId, pageNum, limitNum);

      ApiResponse.success(res, conversations, 'Conversations récupérées');
    } catch (error) {
      logger.error('Get AI conversations controller error:', error);
      ApiResponse.error(
        res,
        'Erreur lors de la récupération des conversations',
        'GET_CONVERSATIONS_ERROR'
      );
    }
  }
}

export const aiController = new AIController();
