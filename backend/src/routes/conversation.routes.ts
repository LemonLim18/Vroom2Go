import { Router } from 'express';
import { getConversation, sendMessage } from '../controllers/conversation.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.get('/:shopId', protect, getConversation);
router.post('/:shopId/messages', protect, sendMessage);

export default router;
