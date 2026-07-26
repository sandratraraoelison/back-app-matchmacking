import { Router, raw } from 'express';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { authenticate } from '@/middlewares/auth';
import { ApiResponse } from '@/utils/response';
import { Post } from '@/models/Post';

const router = Router();
const createPostSchema = z.object({
  content: z.string().trim().min(1).max(5000),
  image: z.string().max(500).optional(),
  mood: z.string().trim().max(60).optional(),
  location: z.string().trim().max(120).optional(),
});

const imageTypes: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

router.post('/upload-image', authenticate, raw({ type: () => true, limit: '10mb' }), async (req, res) => {
  const mimeType = String(req.headers['content-type'] || '').split(';')[0].toLowerCase();
  if (!imageTypes[mimeType] || !Buffer.isBuffer(req.body) || req.body.length === 0) {
    ApiResponse.badRequest(res, 'Image invalide');
    return;
  }
  const fileName = `post-${req.user!.userId}-${randomUUID()}${imageTypes[mimeType]}`;
  const uploadDir = path.resolve(process.cwd(), 'uploads');
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, fileName), req.body);
  ApiResponse.created(res, { url: `/api/posts/files/${fileName}` });
});

router.get('/files/:fileName', authenticate, async (req, res) => {
  const fileName = path.basename(req.params.fileName);
  const image = `/api/posts/files/${fileName}`;
  const ownsPendingImage = fileName.startsWith(`post-${req.user!.userId}-`);
  const post = await Post.exists({ image });
  if (!ownsPendingImage && !post) {
    ApiResponse.forbidden(res, 'Accès à cette image refusé');
    return;
  }
  res.sendFile(path.resolve(process.cwd(), 'uploads', fileName), (error) => {
    if (error && !res.headersSent) ApiResponse.notFound(res, 'Image introuvable');
  });
});

router.post('/', authenticate, async (req, res) => {
  const parsed = createPostSchema.safeParse(req.body);
  if (!parsed.success) {
    ApiResponse.validationError(res, parsed.error.errors);
    return;
  }
  const post = await Post.create({ authorId: req.user!.userId, ...parsed.data });
  ApiResponse.created(res, post, 'Publication créée');
});

router.get('/user/:userId', authenticate, async (req, res) => {
  const posts = await Post.find({ authorId: req.params.userId }).sort({ createdAt: -1 }).limit(100).lean();
  ApiResponse.success(res, posts);
});

export default router;
