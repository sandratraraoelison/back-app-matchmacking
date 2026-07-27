import { Server, Socket } from 'socket.io';
import { JwtService } from '@/utils/jwt';
import { messageService } from '@/services/MessageService';
import { IMessage, ISocketUser } from '@/types';
import { logger } from '@/utils/logger';

class SocketManager {
  private connectedUsers: Map<string, ISocketUser> = new Map();
  private io?: Server;

  /**
   * Initialize socket.io events
   */
  setupEvents(io: Server): void {
    this.io = io;
    io.on('connection', (socket: Socket) => {
      logger.info(`User connected: ${socket.id}`);

      // Authenticate socket connection
      this.authenticateSocket(socket);

      // Handle messaging events
      this.setupMessagingEvents(socket, io);

      // Handle user status events
      this.setupUserStatusEvents(socket);

      // Handle disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket, io);
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error('Socket error:', error);
      });
    });
  }

  notifyMessageUpdated(message: IMessage): void {
    this.io?.to(`user:${message.senderId}`).emit('message:updated', message);
    this.io?.to(`user:${message.receiverId}`).emit('message:updated', message);
  }

  notifyMessageDeleted(senderId: string, receiverId: string, messageId: string): void {
    const payload = { messageId };
    this.io?.to(`user:${senderId}`).emit('message:deleted', payload);
    this.io?.to(`user:${receiverId}`).emit('message:deleted', payload);
  }

  /**
   * Authenticate socket connection using JWT
   */
  private authenticateSocket(socket: Socket): void {
    const token = socket.handshake.auth.token;

    if (!token) {
      socket.emit('error', { message: 'Token required' });
      socket.disconnect();
      return;
    }

    const decoded = JwtService.verifyAccessToken(token);

    if (!decoded) {
      socket.emit('error', { message: 'Invalid or expired token' });
      socket.disconnect();
      return;
    }

    // Attach user info to socket
    socket.data.userId = decoded.userId;
    socket.data.username = decoded.username;

    // Store in connected users map
    this.connectedUsers.set(decoded.userId, {
      userId: decoded.userId,
      socketId: socket.id,
      connectedAt: new Date(),
    });

    // Join user-specific room
    socket.join(`user:${decoded.userId}`);

    // Notify other users that this user is online
    socket.broadcast.emit('user:online', {
      userId: decoded.userId,
      username: decoded.username,
    });

    logger.info(`User authenticated: ${decoded.userId}`);
  }

  /**
   * Setup messaging events
   */
  private setupMessagingEvents(socket: Socket, io: Server): void {
    /**
     * Message event: user sends a message
     */
    socket.on('message:send', async (data: {
      receiverId: string;
      content: string;
      messageType?: 'text' | 'image' | 'file' | 'audio';
      attachmentName?: string;
      attachmentMimeType?: string;
      attachmentSize?: number;
    }) => {
      try {
        const senderId = socket.data.userId;
        const {
          receiverId,
          content,
          messageType = 'text',
          attachmentName,
          attachmentMimeType,
          attachmentSize,
        } = data;

        if (!receiverId || !content) {
          socket.emit('error', { message: 'Missing receiverId or content' });
          return;
        }

        // Save message to database
        const message = await messageService.sendMessage(
          senderId,
          receiverId,
          content,
          messageType,
          attachmentName,
          attachmentMimeType,
          attachmentSize
        );

        // Get conversation
        const conversation = await messageService.getOrCreateConversation(senderId, receiverId);

        // Emit to receiver if online
        const receiverSocket = this.connectedUsers.get(receiverId);
        if (receiverSocket) {
          io.to(`user:${receiverId}`).emit('message:receive', {
            message,
            conversationId: conversation._id,
            senderId,
          });
        }

        // Confirm to sender
        socket.emit('message:sent', {
          message,
          conversationId: conversation._id,
        });
      } catch (error) {
        logger.error('Message send error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    /**
     * Typing indicator event
     */
    socket.on('typing:start', (data: { receiverId: string }) => {
      const senderId = socket.data.userId;
      const { receiverId } = data;

      io.to(`user:${receiverId}`).emit('typing:indicator', {
        senderId,
        isTyping: true,
      });
    });

    socket.on('typing:stop', (data: { receiverId: string }) => {
      const senderId = socket.data.userId;
      const { receiverId } = data;

      io.to(`user:${receiverId}`).emit('typing:indicator', {
        senderId,
        isTyping: false,
      });
    });

    /**
     * Message read event
     */
    socket.on('message:read', async (data: { conversationId: string }) => {
      try {
        const userId = socket.data.userId;
        const { conversationId } = data;

        await messageService.markMessagesAsRead(conversationId, userId);

        // Notify other participant
        io.to(conversationId).emit('message:read', { userId });
      } catch (error) {
        logger.error('Message read error:', error);
      }
    });
  }

  /**
   * Setup user status events
   */
  private setupUserStatusEvents(socket: Socket): void {
    /**
     * Get online users
     */
    socket.on('users:online', () => {
      const onlineUsers = Array.from(this.connectedUsers.values());
      socket.emit('users:online:list', onlineUsers);
    });

    /**
     * Join conversation room for real-time updates
     */
    socket.on('conversation:join', (data: { conversationId: string }) => {
      const { conversationId } = data;
      socket.join(conversationId);
      logger.info(`User ${socket.data.userId} joined conversation ${conversationId}`);
    });

    /**
     * Leave conversation room
     */
    socket.on('conversation:leave', (data: { conversationId: string }) => {
      const { conversationId } = data;
      socket.leave(conversationId);
      logger.info(`User ${socket.data.userId} left conversation ${conversationId}`);
    });
  }

  /**
   * Handle socket disconnect
   */
  private handleDisconnect(socket: Socket, io: Server): void {
    const userId = socket.data.userId;

    if (userId) {
      this.connectedUsers.delete(userId);

      // Notify other users that this user is offline
      io.emit('user:offline', {
        userId,
        username: socket.data.username,
      });

      logger.info(`User disconnected: ${userId}`);
    }
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}

export const socketManager = new SocketManager();
