import mongoose, { Schema, Document } from 'mongoose';
import { IMatch } from '@/types';

interface IMatchDocument extends Omit<IMatch, '_id'>, Document {}

const matchSchema = new Schema<IMatchDocument>(
  {
    user1Id: {
      type: String,
      ref: 'User',
      required: true,
      index: true,
    },
    user2Id: {
      type: String,
      ref: 'User',
      required: true,
      index: true,
    },
    compatibility: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    commonInterests: [String],
    status: {
      type: String,
      enum: ['matched', 'rejected', 'pending'],
      default: 'pending',
      index: true,
    },
    matchedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      index: { expireAfterSeconds: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user pairs
matchSchema.index({ user1Id: 1, user2Id: 1 }, { unique: true });

export const Match = mongoose.model<IMatchDocument>('Match', matchSchema);
