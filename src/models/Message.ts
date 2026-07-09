import mongoose, { Schema, Document } from 'mongoose';
import { IMessage, IConversation } from '@/types';

interface IMessageDocument extends Omit<IMessage, '_id'>, Document {}

interface IConversationDocument extends Omit<IConversation, '_id'>, Document {}

const messageSchema = new Schema<IMessageDocument>(
  {
    senderId: {
      type: String,
      ref: 'User',
      required: true,
      index: true,
    },
    receiverId: {
      type: String,
      ref: 'User',
      required: true,
      index: true,
    },
    conversationId: {
      type: String,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'file'],
      default: 'text',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, receiverId: 1 });

const conversationSchema = new Schema<IConversationDocument>(
  {
    participants: [
      {
        type: String,
        ref: 'User',
      },
    ],
    lastMessage: messageSchema,
    lastMessageAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound index for participants
conversationSchema.index({ participants: 1 });

export const Message = mongoose.model<IMessageDocument>('Message', messageSchema);
export const Conversation = mongoose.model<IConversationDocument>(
  'Conversation',
  conversationSchema
);
