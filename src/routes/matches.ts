import { Router } from 'express';
import { matchmakingController } from '@/controllers/MatchmakingController';
import { authenticate } from '@/middlewares/auth';
import { validateBody } from '@/middlewares/validation';
import { matchRequestSchema } from '@/utils/validators';

const router = Router();

/**
 * @route GET /matches/potential
 * @desc Get potential matches for current user
 * @private
 */
router.get('/potential', authenticate, (req, res) => {
  matchmakingController.getPotentialMatches(req, res);
});

/**
 * @route GET /matches/list
 * @desc Get all matches for current user
 * @private
 */
router.get('/list', authenticate, (req, res) => {
  matchmakingController.getUserMatches(req, res);
});

/**
 * @route POST /matches/create
 * @desc Create a match with another user
 * @private
 */
router.post('/create', authenticate, validateBody(matchRequestSchema), (req, res) => {
  matchmakingController.createMatch(req, res);
});

/**
 * @route POST /matches/reject
 * @desc Reject a potential match
 * @private
 */
router.post('/reject', authenticate, validateBody(matchRequestSchema), (req, res) => {
  matchmakingController.rejectMatch(req, res);
});

export default router;
