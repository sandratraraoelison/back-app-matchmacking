import { Request, Response } from 'express';
import { matchmakingService } from '@/services/MatchmakingService';
import { ApiResponse } from '@/utils/response';
import { matchRequestSchema } from '@/utils/validators';
import { logger } from '@/utils/logger';

export class MatchmakingController {
  async getPotentialMatches(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        ApiResponse.unauthorized(res);
        return;
      }

      const { limit } = req.query;
      const limitNum = limit ? parseInt(limit as string) : 10;

      const matches = await matchmakingService.getPotentialMatches(userId, limitNum);

      ApiResponse.success(res, matches, 'Matchs potentiels récupérés');
    } catch (error) {
      logger.error('Get potential matches controller error:', error);
      ApiResponse.error(res, 'Erreur lors de la récupération des matchs', 'GET_MATCHES_ERROR');
    }
  }

  async createMatch(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        ApiResponse.unauthorized(res);
        return;
      }

      const { toUserId } = matchRequestSchema.parse(req.body);

      const match = await matchmakingService.createMatch(userId, toUserId);

      ApiResponse.created(res, match, 'Match créé avec succès');
    } catch (error) {
      logger.error('Create match controller error:', error);
      if (error instanceof Error && 'issues' in error) {
        ApiResponse.validationError(res, (error as any).issues);
      } else if (error instanceof Error && error.message.includes('existant')) {
        ApiResponse.conflict(res, error.message);
      } else {
        ApiResponse.error(res, 'Erreur lors de la création du match', 'CREATE_MATCH_ERROR');
      }
    }
  }

  async rejectMatch(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        ApiResponse.unauthorized(res);
        return;
      }

      const { toUserId } = matchRequestSchema.parse(req.body);

      const match = await matchmakingService.rejectMatch(userId, toUserId);

      ApiResponse.success(res, match, 'Match rejeté');
    } catch (error) {
      logger.error('Reject match controller error:', error);
      if (error instanceof Error && 'issues' in error) {
        ApiResponse.validationError(res, (error as any).issues);
      } else {
        ApiResponse.error(res, 'Erreur lors du rejet du match', 'REJECT_MATCH_ERROR');
      }
    }
  }

  async getUserMatches(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        ApiResponse.unauthorized(res);
        return;
      }

      const { page, limit } = req.query;
      const pageNum = page ? parseInt(page as string) : 1;
      const limitNum = limit ? parseInt(limit as string) : 20;

      const matches = await matchmakingService.getUserMatches(userId, pageNum, limitNum);

      ApiResponse.success(res, matches, 'Matchs récupérés');
    } catch (error) {
      logger.error('Get user matches controller error:', error);
      ApiResponse.error(res, 'Erreur lors de la récupération des matchs', 'GET_MATCHES_ERROR');
    }
  }
}

export const matchmakingController = new MatchmakingController();
