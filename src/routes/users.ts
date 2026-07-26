import { Router } from 'express';
import { userController } from '@/controllers/UserController';
import { authenticate } from '@/middlewares/auth';
import { validateBody } from '@/middlewares/validation';
import { userUpdateSchema } from '@/utils/validators';

const router = Router();

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
