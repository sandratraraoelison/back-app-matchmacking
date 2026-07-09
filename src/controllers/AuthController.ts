import { Request, Response } from 'express';
import { authService } from '@/services/AuthService';
import { ApiResponse } from '@/utils/response';
import { userRegisterSchema, userLoginSchema } from '@/utils/validators';
import { logger } from '@/utils/logger';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, username, password, firstName, lastName, interests } =
        userRegisterSchema.parse(req.body);

      const result = await authService.register(
        email,
        username,
        password,
        firstName,
        lastName,
        interests
      );

      ApiResponse.created(res, result, 'Utilisateur créé avec succès');
    } catch (error) {
      logger.error('Register controller error:', error);
      if (error instanceof Error && 'issues' in error) {
        ApiResponse.validationError(res, (error as any).issues);
      } else if (error instanceof Error && error.message.includes('Email ou username')) {
        ApiResponse.conflict(res, error.message);
      } else {
        ApiResponse.error(res, "Erreur lors de l'inscription", 'REGISTER_ERROR', 500);
      }
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = userLoginSchema.parse(req.body);

      const result = await authService.login(email, password);

      ApiResponse.success(res, result, 'Connexion réussie');
    } catch (error) {
      logger.error('Login controller error:', error);
      if (error instanceof Error && error.message.includes('Email ou password')) {
        ApiResponse.unauthorized(res, 'Email ou password incorrect');
      } else {
        ApiResponse.error(res, 'Erreur lors de la connexion', 'LOGIN_ERROR', 500);
      }
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        ApiResponse.badRequest(res, 'Refresh token manquant');
        return;
      }

      const result = await authService.refreshToken(refreshToken);

      ApiResponse.success(res, result, 'Token renouvelé');
    } catch (error) {
      logger.error('Refresh token controller error:', error);
      ApiResponse.unauthorized(res, 'Token invalide ou expiré');
    }
  }
}

export const authController = new AuthController();
