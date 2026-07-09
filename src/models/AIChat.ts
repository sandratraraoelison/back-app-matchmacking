import mongoose, { Schema, Document } from 'mongoose';
import { IAIMessage, IAIConversation, IAIMemory } from '@/types';

interface IAIMessageDocument extends Omit<IAIMessage, '_id'>, Document {}

interface IAIConversationDocument extends Omit<IAIConversation, '_id'>, Document {}

const aiMemorySchema = new Schema<IAIMemory>({
  key: {
    type: String,
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
  importance: {
    type: Number,
    min: 0,
    max: 100,
    default: 50,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const aiMessageSchema = new Schema<IAIMessageDocument>(
  {
    userId: {
      type: String,
      ref: 'User',
      required: true,
      index: true,
    },
    conversationId: {
      type: String,
      ref: 'AIConversation',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 10000,
    },
    tokens: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const aiConversationSchema = new Schema<IAIConversationDocument>(
  {
    userId: {
      type: String,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      default: 'New Conversation',
    },
    messages: [aiMessageSchema],
    memory: [aiMemorySchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
aiConversationSchema.index({ userId: 1, createdAt: -1 });
aiMessageSchema.index({ conversationId: 1, createdAt: 1 });

export const AIMessage = mongoose.model<IAIMessageDocument>('AIMessage', aiMessageSchema);
export const AIConversation = mongoose.model<IAIConversationDocument>(
  'AIConversation',
  aiConversationSchema
);
