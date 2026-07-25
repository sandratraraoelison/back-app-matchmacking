import { z } from 'zod';

// User Validators
export const userRegisterSchema = z.object({
  email: z.string().email('Email invalide'),
  username: z.string().min(3, 'Username minimum 3 caractères').max(30),
  password: z.string().min(8, 'Password minimum 8 caractères'),
  firstName: z.string().min(2, 'Prénom minimum 2 caractères'),
  lastName: z.string().min(2, 'Nom minimum 2 caractères'),
  interests: z.array(z.string()).optional(),
});

export const userLoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const userUpdateSchema = z.object({
  email: z.string().email('Email invalide').optional(),
  username: z.string().min(3, 'Username minimum 3 caractères').max(30).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  bio: z.string().max(500).optional(),
  location: z.string().optional(),
  interests: z.array(z.string()).optional(),
  avatar: z.string().url().nullable().optional(),
});

// Message Validators
export const messageSchema = z.object({
  content: z.string().min(1, 'Message ne peut pas être vide').max(5000),
  messageType: z.enum(['text', 'image', 'file']).default('text'),
});

export const messageSendSchema = messageSchema.extend({
  receiverId: z.string().nonempty('receiverId est requis'),
});

export const conversationSchema = z.object({
  participants: z.array(z.string()).min(2, 'Au moins 2 participants'),
});

// Match Request Validators
export const matchRequestSchema = z.object({
  toUserId: z.string(),
  message: z.string().max(500).optional(),
});

// AI Chat Validators
export const aiMessageSchema = z.object({
  content: z.string().min(1, 'Message ne peut pas être vide').max(10000),
  conversationId: z.string().optional(),
});

// Pagination Validator
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

// Utility function to validate data
export const validateData = <T>(schema: z.ZodSchema, data: unknown): T => {
  return schema.parse(data) as T;
};

// Utility function to safely validate data
export const safeValidateData = <T>(schema: z.ZodSchema, data: unknown) => {
  const result = schema.safeParse(data);
  return {
    success: result.success,
    data: result.success ? (result.data as T) : null,
    errors: result.success ? null : result.error.errors,
  };
};
