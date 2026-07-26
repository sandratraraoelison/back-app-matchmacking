// User Types
export interface IUser {
  _id?: string;
  email: string;
  username: string;
  password?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  interests: string[];
  location?: string;
  createdAt: Date;
  updatedAt: Date;
  isOnline: boolean;
  lastSeen?: Date;
}

export interface IUserProfile extends Omit<IUser, 'password'> {
  matchingScore?: number;
}

// Authentication Types
export interface IAuthPayload {
  userId: string;
  email: string;
  username: string;
}

export interface IAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: IUserProfile;
}

// Matchmaking Types
export interface IMatch {
  _id?: string;
  user1Id: string;
  user2Id: string;
  compatibility: number;
  commonInterests: string[];
  matchedAt: Date;
  status: 'matched' | 'rejected' | 'pending';
  expiresAt?: Date;
}

export interface IMatchRequest {
  _id?: string;
  fromUserId: string;
  toUserId: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

// Messaging Types
export interface IMessage {
  _id?: string;
  senderId: string;
  receiverId: string;
  conversationId: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'audio';
  attachmentName?: string;
  attachmentMimeType?: string;
  attachmentSize?: number;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IConversation {
  _id?: string;
  participants: string[];
  lastMessage?: IMessage;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPost {
  _id?: string;
  authorId: string;
  content: string;
  image?: string;
  mood?: string;
  location?: string;
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// AI Chat Types
export interface IAIMessage {
  _id?: string;
  userId: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  tokens: number;
  createdAt: Date;
}

export interface IAIConversation {
  _id?: string;
  userId: string;
  title: string;
  messages: IAIMessage[];
  memory: IAIMemory[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface IAIMemory {
  key: string;
  value: string;
  importance: number;
  updatedAt: Date;
}

// Socket Events Types
export interface ISocketUser {
  userId: string;
  socketId: string;
  connectedAt: Date;
}

export interface ITypingIndicator {
  senderId: string;
  receiverId: string;
  isTyping: boolean;
}

// Error Response Type
export interface IErrorResponse {
  success: false;
  message: string;
  code: string;
  details?: unknown;
}

// Success Response Type
export interface ISuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}
