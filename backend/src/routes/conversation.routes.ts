import { Router } from 'express';
import { listConversations, getConversationById, sendMessage, getOrCreateConversation, sendMessageToUser, markConversationAsRead } from '../controllers/conversation.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Retrieve all conversations for the user
router.get('/', protect, listConversations);

// IMPORTANT: Specific routes must come BEFORE parameterized routes
// Helper: Get or create conversation with specific user (by User ID)
router.get('/user/:userId', protect, getOrCreateConversation);

// Helper: Send message directly to a user (by User ID) - creates convo if needed
router.post('/user/:userId/messages', protect, sendMessageToUser);

// Get specific conversation by ID (must come after /user routes)
router.get('/:id', protect, getConversationById);

// Send message to a specific conversation
router.post('/:id/messages', protect, sendMessage);

// Mark conversation as read
router.put('/:id/read', protect, markConversationAsRead);

export default router;
