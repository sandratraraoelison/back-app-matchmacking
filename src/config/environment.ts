import dotenv from 'dotenv';
import { logger } from '@/utils/logger';

dotenv.config();

interface IEnvironmentConfig {
  port: number;
  nodeEnv: string;
  mongodbUri: string;
  jwtSecret: string;
  jwtExpire: string;
  refreshTokenSecret: string;
  refreshTokenExpire: string;
  openaiApiKey: string;
  allowedOrigins: string[];
  socketCors: string;
  logLevel: string;
  aiMemorySize: number;
  aiModel: string;
}

const getConfig = (): IEnvironmentConfig => {
  const config: IEnvironmentConfig = {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/backend-api',
    jwtSecret: process.env.JWT_SECRET || 'default-secret-key-change-in-production',
    jwtExpire: process.env.JWT_EXPIRE || '7d',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'default-refresh-secret',
    refreshTokenExpire: process.env.REFRESH_TOKEN_EXPIRE || '30d',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
    socketCors: process.env.SOCKET_CORS || 'http://localhost:3000',
    logLevel: process.env.LOG_LEVEL || 'info',
    aiMemorySize: parseInt(process.env.AI_MEMORY_SIZE || '10', 10),
    aiModel: process.env.AI_MODEL || 'gpt-3.5-turbo',
  };

  // Validate required configurations
  if (config.nodeEnv === 'production' && !process.env.JWT_SECRET) {
    logger.error('JWT_SECRET is required in production environment');
    process.exit(1);
  }

  return config;
};

export const config = getConfig();
