import { Request, Response } from 'express';
import { messageService } from '@/services/MessageService';
import { ApiResponse } from '@/utils/response';
import { messageSendSchema } from '@/utils/validators';
import { logger } from '@/utils/logger';

export class MessageController {
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        ApiResponse.unauthorized(res);
        return;
      }

      const {
        receiverId,
        content,
        messageType,
        attachmentName,
        attachmentMimeType,
        attachmentSize,
      } = messageSendSchema.parse(req.body);

      const message = await messageService.sendMessage(
        userId,
        receiverId,
        content,
        messageType,
        attachmentName,
        attachmentMimeType,
        attachmentSize
      );

      ApiResponse.created(res, message, 'Message envoyé');
    } catch (error) {
      logger.error('Send message controller error:', error);
      if (error instanceof Error && 'issues' in error) {
        ApiResponse.validationError(res, (error as any).issues);
      } else {
        ApiResponse.error(res, "Erreur lors de l'envoi du message", 'SEND_MESSAGE_ERROR');
      }
    }
  }

  async getMessages(req: Request, res: Response): Promise<void> {
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

      const messages = await messageService.getConversationMessages(
        conversationId as string,
        pageNum,
        limitNum
      );

      ApiResponse.success(res, messages, 'Messages récupérés');
    } catch (error) {
      logger.error('Get messages controller error:', error);
      ApiResponse.error(res, 'Erreur lors de la récupération des messages', 'GET_MESSAGES_ERROR');
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

      const conversations = await messageService.getUserConversations(userId, pageNum, limitNum);

      ApiResponse.success(res, conversations, 'Conversations récupérées');
    } catch (error) {
      logger.error('Get conversations controller error:', error);
      ApiResponse.error(
        res,
        'Erreur lors de la récupération des conversations',
        'GET_CONVERSATIONS_ERROR'
      );
    }
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        ApiResponse.unauthorized(res);
        return;
      }

      const { conversationId } = req.body;

      if (!conversationId) {
        ApiResponse.badRequest(res, 'conversationId est requis');
        return;
      }

      await messageService.markMessagesAsRead(conversationId, userId);

      ApiResponse.success(res, null, 'Messages marqués comme lus');
    } catch (error) {
      logger.error('Mark as read controller error:', error);
      ApiResponse.error(res, 'Erreur lors de la marque des messages', 'MARK_READ_ERROR');
    }
  }
}

export const messageController = new MessageController();
