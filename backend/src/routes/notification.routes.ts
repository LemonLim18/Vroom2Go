import { Router } from 'express';
import { 
  getMyNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification 
} from '../controllers/notification.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Get all notifications for current user
router.get('/', protect, getMyNotifications);

// Mark all as read
router.put('/read-all', protect, markAllAsRead);

// Mark single notification as read
router.put('/:id/read', protect, markAsRead);

// Delete notification
router.delete('/:id', protect, deleteNotification);

export default router;
