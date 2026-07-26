import express, { Express } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { config } from '@/config/environment';
import { connectDatabase } from '@/config/database';
import { socketManager } from '@/services/SocketManager';
import { authenticate } from '@/middlewares/auth';
import { errorHandler, notFoundHandler } from '@/middlewares/errorHandler';
import { logger } from '@/utils/logger';

// Import routes
import authRoutes from '@/routes/auth';
import userRoutes from '@/routes/users';
import matchRoutes from '@/routes/matches';
import messageRoutes from '@/routes/messages';
import aiRoutes from '@/routes/ai';
import postRoutes from '@/routes/posts';

class App {
  private app: Express;
  private httpServer: ReturnType<typeof createServer>;
  private io: Server;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = new Server(this.httpServer, {
      cors: {
        origin: config.allowedOrigins,
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddlewares();
    this.setupRoutes();
    this.setupSocketIO();
    this.setupErrorHandling();
  }

  /**
   * Setup Express middlewares
   */
  private setupMiddlewares(): void {
    // Security middlewares
    this.app.use(helmet());
    this.app.use(
      cors({
        origin: config.allowedOrigins,
        credentials: true,
      })
    );

    // Body parsing middlewares
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ limit: '10mb', extended: true }));

    // Request logging
    this.app.use((req, _res, next) => {
      logger.info(`${req.method} ${req.path}`);
      next();
    });

    // Health check
    this.app.get('/health', (_req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        connectedUsers: this.io.engine.clientsCount,
      });
    });
  }

  /**
   * Setup application routes
   */
  private setupRoutes(): void {
    // Public routes
    this.app.use('/api/auth', authRoutes);

    // Protected routes
    this.app.use('/api/users', authenticate, userRoutes);
    this.app.use('/api/matches', authenticate, matchRoutes);
    this.app.use('/api/messages', authenticate, messageRoutes);
    this.app.use('/api/ai', authenticate, aiRoutes);
    this.app.use('/api/posts', authenticate, postRoutes);

    // 404 handler
    this.app.use('*', notFoundHandler);
  }

  /**
   * Setup Socket.IO
   */
  private setupSocketIO(): void {
    socketManager.setupEvents(this.io);

    // Middleware for Socket.IO authentication
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      next();
    });
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    try {
      // Connect to database
      await connectDatabase();

      // Start HTTP server
      this.httpServer.listen(config.port, () => {
        logger.info(`✓ Server running on port ${config.port}`);
        logger.info(`✓ Environment: ${config.nodeEnv}`);
        logger.info(`✓ Socket.IO CORS: ${config.socketCors}`);
      });

      // Graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Setup graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);

      // Close Socket.IO
      this.io.close();

      // Close HTTP server
      this.httpServer.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }
}

// Initialize and start the application
const app = new App();
app.start();
