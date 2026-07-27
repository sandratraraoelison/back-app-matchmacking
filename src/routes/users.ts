import { Router, raw } from 'express';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { userController } from '@/controllers/UserController';
import { authenticate } from '@/middlewares/auth';
import { validateBody } from '@/middlewares/validation';
import { userUpdateSchema } from '@/utils/validators';

const router = Router();

const avatarExtensions: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

router.post('/avatar', authenticate, raw({ type: () => true, limit: '5mb' }), async (req, res) => {
  const mimeType = String(req.headers['content-type'] || '').split(';')[0].toLowerCase();
  if (!avatarExtensions[mimeType]) {
    res.status(400).json({ success: false, message: 'Format accepté : JPG, PNG, WebP ou GIF.' });
    return;
  }
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    res.status(400).json({ success: false, message: 'Image vide.' });
    return;
  }
  const fileName = `${req.user?.userId}-${randomUUID()}${avatarExtensions[mimeType]}`;
  const avatarDir = path.resolve(process.cwd(), 'uploads', 'avatars');
  await mkdir(avatarDir, { recursive: true });
  await writeFile(path.join(avatarDir, fileName), req.body);
  const url = `${req.protocol}://${req.get('host')}/uploads/avatars/${fileName}`;
  res.status(201).json({ success: true, data: { url } });
});

/**
 * @route GET /users/profile
 * @desc Get current user profile
 * @private
 */
router.get('/profile', authenticate, (req, res) => {
  userController.getProfile(req, res);
});

/**
 * @route PUT /users/profile
 * @desc Update current user profile
 * @private
 */
router.put('/profile', authenticate, validateBody(userUpdateSchema), (req, res) => {
  userController.updateProfile(req, res);
});

/**
 * @route GET /users/search
 * @desc Search users
 * @private
 */
router.get('/search', authenticate, (req, res) => {
  userController.searchUsers(req, res);
});

router.get('/:userId', authenticate, async (req, res) => {
  try {
    const user = await userController.getPublicProfile(req.params.userId);
    res.json({ success: true, data: user });
  } catch {
    res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
  }
});

/**
 * @route DELETE /users/account
 * @desc Delete current user account
 * @private
 */
router.delete('/account', authenticate, (req, res) => {
  userController.deleteAccount(req, res);
});

export default router;
