import mongoose, { Document, Schema } from 'mongoose';
import { IPost } from '@/types';

interface IPostDocument extends Omit<IPost, '_id'>, Document {}

const postSchema = new Schema<IPostDocument>({
  authorId: { type: String, ref: 'User', required: true, index: true },
  content: { type: String, required: true, trim: true, maxlength: 5000 },
  image: { type: String, default: null },
  mood: { type: String, trim: true, maxlength: 60 },
  location: { type: String, trim: true, maxlength: 120 },
  likesCount: { type: Number, default: 0, min: 0 },
  commentsCount: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

postSchema.index({ authorId: 1, createdAt: -1 });
export const Post = mongoose.model<IPostDocument>('Post', postSchema);
