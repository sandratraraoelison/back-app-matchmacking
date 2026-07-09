import { Router } from 'express';
import { authController } from '@/controllers/AuthController';
import { validateBody } from '@/middlewares/validation';
import { userRegisterSchema, userLoginSchema } from '@/utils/validators';

const router = Router();

/**
 * @route POST /auth/register
 * @desc Register a new user
 * @public
 */
router.post('/register', validateBody(userRegisterSchema), (req, res) => {
  authController.register(req, res);
});

/**
 * @route POST /auth/login
 * @desc Login user
 * @public
 */
router.post('/login', validateBody(userLoginSchema), (req, res) => {
  authController.login(req, res);
});

/**
 * @route POST /auth/refresh
 * @desc Refresh access token
 * @public
 */
router.post('/refresh', (req, res) => {
  authController.refreshToken(req, res);
});

export default router;
