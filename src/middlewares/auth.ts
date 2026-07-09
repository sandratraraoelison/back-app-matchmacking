import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@/utils/jwt';
import { ApiResponse } from '@/utils/response';
import { IAuthPayload } from '@/types';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: IAuthPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      ApiResponse.unauthorized(res, 'Token absent ou invalide');
      return;
    }

    const token = authHeader.substring(7);
    const decoded = JwtService.verifyAccessToken(token);

    if (!decoded) {
      ApiResponse.unauthorized(res, 'Token expiré ou invalide');
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    ApiResponse.unauthorized(res, "Erreur d'authentification");
  }
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = JwtService.verifyAccessToken(token);

      if (decoded) {
        req.user = decoded;
      }
    }

    next();
  } catch (error) {
    next();
  }
};
