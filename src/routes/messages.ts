import { Router, raw } from 'express';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { messageController } from '@/controllers/MessageController';
import { authenticate } from '@/middlewares/auth';
import { validateBody } from '@/middlewares/validation';
import { messageSendSchema } from '@/utils/validators';
import { ApiResponse } from '@/utils/response';
import { Message } from '@/models/Message';

const router = Router();

const allowedMimeTypes = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/wav',
  'application/pdf', 'text/plain',
]);
const extensions: Record<string, string> = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif',
  'audio/webm': '.webm', 'audio/ogg': '.ogg', 'audio/mpeg': '.mp3',
  'audio/mp4': '.m4a', 'audio/wav': '.wav', 'application/pdf': '.pdf', 'text/plain': '.txt',
};

router.post('/upload', authenticate, raw({ type: () => true, limit: '15mb' }), async (req, res) => {
  try {
    const mimeType = String(req.headers['content-type'] || '').split(';')[0].toLowerCase();
    if (!allowedMimeTypes.has(mimeType)) {
      ApiResponse.badRequest(res, 'Type de fichier non autorisé');
      return;
    }
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      ApiResponse.badRequest(res, 'Fichier vide');
      return;
    }
    const originalName = decodeURIComponent(String(req.headers['x-file-name'] || 'fichier')).slice(0, 255);
    const fileName = `${req.user?.userId}-${randomUUID()}${extensions[mimeType]}`;
    const uploadDir = path.resolve(process.cwd(), 'uploads');
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), req.body);
    ApiResponse.created(res, {
      url: `/api/messages/files/${fileName}`,
      name: originalName,
      mimeType,
      size: req.body.length,
    }, 'Fichier envoyé');
  } catch {
    ApiResponse.error(res, "Erreur lors de l'envoi du fichier", 'UPLOAD_ERROR');
  }
});

router.get('/files/:fileName', authenticate, async (req, res) => {
  const userId = req.user?.userId;
  const fileName = path.basename(req.params.fileName);
  const content = `/api/messages/files/${fileName}`;
  const ownsPendingFile = Boolean(userId && fileName.startsWith(`${userId}-`));
  const message = await Message.findOne({
    content,
    $or: [{ senderId: userId }, { receiverId: userId }],
  }).lean();
  if (!ownsPendingFile && !message) {
    ApiResponse.forbidden(res, 'Accès au fichier refusé');
    return;
  }
  res.sendFile(path.resolve(process.cwd(), 'uploads', fileName), (error) => {
    if (error && !res.headersSent) ApiResponse.notFound(res, 'Fichier introuvable');
  });
});

/**
 * @route POST /messages/send
 * @desc Send a message
 * @private
 */
router.post('/send', authenticate, validateBody(messageSendSchema), (req, res) => {
  messageController.sendMessage(req, res);
});

/**
 * @route GET /messages
 * @desc Get messages from a conversation
 * @private
 */
router.get('/', authenticate, (req, res) => {
  messageController.getMessages(req, res);
});

/**
 * @route GET /messages/conversations
 * @desc Get all conversations for current user
 * @private
 */
router.get('/conversations', authenticate, (req, res) => {
  messageController.getConversations(req, res);
});

/**
 * @route POST /messages/mark-read
 * @desc Mark messages as read
 * @private
 */
router.post('/mark-read', authenticate, (req, res) => {
  messageController.markAsRead(req, res);
});

export default router;
