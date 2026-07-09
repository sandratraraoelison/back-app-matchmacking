/**
 * Exemple d'utilisation du client Socket.io
 * À utiliser côté frontend (React, Vue, etc.)
 */

import io, { Socket } from 'socket.io-client';

interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: Date;
}

class ChatClient {
  private socket: Socket | null = null;
  private token: string | null = null;

  /**
   * Initialiser la connexion Socket.io
   */
  connect(serverUrl: string, token: string): void {
    this.token = token;

    this.socket = io(serverUrl, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.setupListeners();
  }

  /**
   * Configurer les event listeners
   */
  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('message:receive', (data: { message: Message; senderId: string }) => {
      console.log('New message:', data.message);
      // Mettre à jour l'état du chat
    });

    this.socket.on('message:sent', (data: { message: Message }) => {
      console.log('Message sent:', data.message);
    });

    this.socket.on('typing:indicator', (data: { senderId: string; isTyping: boolean }) => {
      console.log(`User ${data.senderId} is ${data.isTyping ? 'typing' : 'stopped typing'}`);
    });

    this.socket.on('user:online', (data: { userId: string; username: string }) => {
      console.log(`${data.username} is online`);
    });

    this.socket.on('user:offline', (data: { userId: string; username: string }) => {
      console.log(`${data.username} is offline`);
    });

    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
  }

  /**
   * Envoyer un message
   */
  sendMessage(receiverId: string, content: string): void {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('message:send', {
      receiverId,
      content,
    });
  }

  /**
   * Indiquer le début de la frappe
   */
  startTyping(receiverId: string): void {
    if (!this.socket) return;
    this.socket.emit('typing:start', { receiverId });
  }

  /**
   * Indiquer l'arrêt de la frappe
   */
  stopTyping(receiverId: string): void {
    if (!this.socket) return;
    this.socket.emit('typing:stop', { receiverId });
  }

  /**
   * Rejoindre une conversation
   */
  joinConversation(conversationId: string): void {
    if (!this.socket) return;
    this.socket.emit('conversation:join', { conversationId });
  }

  /**
   * Quitter une conversation
   */
  leaveConversation(conversationId: string): void {
    if (!this.socket) return;
    this.socket.emit('conversation:leave', { conversationId });
  }

  /**
   * Marquer les messages comme lus
   */
  markAsRead(conversationId: string): void {
    if (!this.socket) return;
    this.socket.emit('message:read', { conversationId });
  }

  /**
   * Obtenir les utilisateurs en ligne
   */
  getOnlineUsers(): void {
    if (!this.socket) return;
    this.socket.emit('users:online', {});
  }

  /**
   * Déconnecter
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

// Utilisation
const client = new ChatClient();
client.connect('http://localhost:5000', 'your-jwt-token');

// Envoyer un message
client.sendMessage('user-id-2', 'Salut!');

// Indiquer la frappe
client.startTyping('user-id-2');
setTimeout(() => client.stopTyping('user-id-2'), 3000);

export default ChatClient;
