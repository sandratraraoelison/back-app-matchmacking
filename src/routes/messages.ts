import { Router } from 'express';
import { messageController } from '@/controllers/MessageController';
import { authenticate } from '@/middlewares/auth';
import { validateBody } from '@/middlewares/validation';
import { messageSchema } from '@/utils/validators';

const router = Router();

/**
 * @route POST /messages/send
 * @desc Send a message
 * @private
 */
router.post('/send', authenticate, validateBody(messageSchema), (req, res) => {
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
