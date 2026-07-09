import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ApiResponse } from '@/utils/response';

export const validateBody =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error: unknown) {
      if (error instanceof Error && 'issues' in error) {
        const issues = (error as { issues: unknown[] }).issues;
        ApiResponse.validationError(res, issues);
      } else {
        ApiResponse.badRequest(res, 'Validation error');
      }
    }
  };

export const validateQuery =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated as any;
      next();
    } catch (error: unknown) {
      if (error instanceof Error && 'issues' in error) {
        const issues = (error as { issues: unknown[] }).issues;
        ApiResponse.validationError(res, issues);
      } else {
        ApiResponse.badRequest(res, 'Validation error');
      }
    }
  };

export const validateParams =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated as any;
      next();
    } catch (error: unknown) {
      if (error instanceof Error && 'issues' in error) {
        const issues = (error as { issues: unknown[] }).issues;
        ApiResponse.validationError(res, issues);
      } else {
        ApiResponse.badRequest(res, 'Validation error');
      }
    }
  };
