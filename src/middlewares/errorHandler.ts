import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/utils/response';
import { logger } from '@/utils/logger';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code: string = 'INTERNAL_SERVER_ERROR'
  ) {
    super(message);
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Error occurred:', err);

  if (err instanceof AppError) {
    ApiResponse.error(res, err.message, err.code, err.statusCode);
    return;
  }

  if (err instanceof SyntaxError) {
    ApiResponse.badRequest(res, 'Invalid JSON');
    return;
  }

  ApiResponse.error(res, 'Internal Server Error', 'INTERNAL_SERVER_ERROR', 500);
};

export const notFoundHandler = (_req: Request, res: Response): void => {
  ApiResponse.notFound(res, 'Route non trouvée');
};
