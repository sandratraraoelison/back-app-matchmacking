import mongoose from 'mongoose';
import { logger } from '@/utils/logger';
import { config } from '@/config/environment';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = config.mongodbUri;

    await mongoose.connect(mongoUri, {
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
    });

    logger.info(`✓ Database connected successfully at ${mongoUri}`);

    // Handle connection events
    mongoose.connection.on('disconnected', () => {
      logger.warn('Database disconnected');
    });

    mongoose.connection.on('error', (error) => {
      logger.error('Database connection error:', error);
    });
  } catch (error) {
    logger.error(
      `Failed to connect to database at ${config.mongodbUri}. ` +
        'Vérifiez que MongoDB est démarré et que MONGODB_URI est correct.',
      error
    );
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('Database disconnected');
  } catch (error) {
    logger.error('Error disconnecting from database:', error);
  }
};
