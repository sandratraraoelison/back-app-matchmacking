import { Router } from 'express';
import { aiController } from '@/controllers/AIController';
import { authenticate } from '@/middlewares/auth';
import { validateBody } from '@/middlewares/validation';
import { aiMessageSchema } from '@/utils/validators';

const router = Router();

/**
 * @route POST /ai/message
 * @desc Send message to AI
 * @private
 */
router.post('/message', authenticate, validateBody(aiMessageSchema), (req, res) => {
  aiController.sendMessage(req, res);
});

router.post('/translate', authenticate, (req, res) => {
  aiController.translate(req, res);
});

/**
 * @route GET /ai/history
 * @desc Get AI conversation history
 * @private
 */
router.get('/history', authenticate, (req, res) => {
  aiController.getConversationHistory(req, res);
});

/**
 * @route GET /ai/conversations
 * @desc Get all AI conversations
 * @private
 */
router.get('/conversations', authenticate, (req, res) => {
  aiController.getConversations(req, res);
});

export default router;
