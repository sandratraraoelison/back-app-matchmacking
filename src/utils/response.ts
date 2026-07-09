import { Response } from 'express';
import { ISuccessResponse, IErrorResponse } from '@/types';

export class ApiResponse {
  static success<T>(res: Response, data: T, message = 'Success', statusCode = 200): Response {
    const response: ISuccessResponse<T> = {
      success: true,
      data,
      message,
    };
    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data: T, message = 'Created successfully'): Response {
    return this.success(res, data, message, 201);
  }

  static error(
    res: Response,
    message: string,
    code = 'INTERNAL_SERVER_ERROR',
    statusCode = 500,
    details?: unknown
  ): Response {
    const response: IErrorResponse = {
      success: false,
      message,
      code,
      details,
    };
    return res.status(statusCode).json(response);
  }

  static badRequest(res: Response, message = 'Bad Request', details?: unknown): Response {
    return this.error(res, message, 'BAD_REQUEST', 400, details);
  }

  static unauthorized(res: Response, message = 'Unauthorized'): Response {
    return this.error(res, message, 'UNAUTHORIZED', 401);
  }

  static forbidden(res: Response, message = 'Forbidden'): Response {
    return this.error(res, message, 'FORBIDDEN', 403);
  }

  static notFound(res: Response, message = 'Not Found'): Response {
    return this.error(res, message, 'NOT_FOUND', 404);
  }

  static conflict(res: Response, message = 'Conflict'): Response {
    return this.error(res, message, 'CONFLICT', 409);
  }

  static validationError(res: Response, details: unknown): Response {
    return this.error(res, 'Validation failed', 'VALIDATION_ERROR', 422, details);
  }
}
