import { Request, Response } from 'express';
import { userService } from '@/services/UserService';
import { ApiResponse } from '@/utils/response';
import { userUpdateSchema } from '@/utils/validators';
import { logger } from '@/utils/logger';
import { AppError } from '@/middlewares/errorHandler';

export class UserController {
  async getPublicProfile(userId: string) {
    const { email: _email, ...publicProfile } = await userService.getUserProfile(userId);
    return publicProfile;
  }
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        ApiResponse.unauthorized(res);
        return;
      }

      const user = await userService.getUserProfile(userId);

      ApiResponse.success(res, user, 'Profil récupéré');
    } catch (error) {
      logger.error('Get profile controller error:', error);
      if (error instanceof Error && error.message.includes('non trouvé')) {
        ApiResponse.notFound(res, 'Utilisateur non trouvé');
      } else {
        ApiResponse.error(res, 'Erreur lors de la récupération du profil', 'GET_PROFILE_ERROR');
      }
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        ApiResponse.unauthorized(res);
        return;
      }

      const updates = userUpdateSchema.parse(req.body);

      const user = await userService.updateUserProfile(userId, updates);

      ApiResponse.success(res, user, 'Profil mis à jour');
    } catch (error) {
      logger.error('Update profile controller error:', error);
      if (error instanceof AppError) {
        ApiResponse.error(res, error.message, error.code, error.statusCode);
      } else if (error instanceof Error && 'issues' in error) {
        ApiResponse.validationError(res, (error as any).issues);
      } else {
        ApiResponse.error(res, 'Erreur lors de la mise à jour du profil', 'UPDATE_PROFILE_ERROR');
      }
    }
  }

  async searchUsers(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { q, limit } = req.query;

      if (!userId) {
        ApiResponse.unauthorized(res);
        return;
      }

      if (!q || typeof q !== 'string') {
        ApiResponse.badRequest(res, 'Query parameter "q" est requis');
        return;
      }

      const limitNum = limit ? parseInt(limit as string) : 20;

      const users = await userService.searchUsers(q, Math.min(limitNum, 100), userId);

      ApiResponse.success(res, users, 'Utilisateurs trouvés');
    } catch (error) {
      logger.error('Search users controller error:', error);
      ApiResponse.error(res, 'Erreur lors de la recherche', 'SEARCH_ERROR');
    }
  }

  async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        ApiResponse.unauthorized(res);
        return;
      }

      await userService.deleteUser(userId);

      ApiResponse.success(res, null, 'Compte supprimé');
    } catch (error) {
      logger.error('Delete account controller error:', error);
      ApiResponse.error(res, 'Erreur lors de la suppression du compte', 'DELETE_ERROR');
    }
  }
}

export const userController = new UserController();
