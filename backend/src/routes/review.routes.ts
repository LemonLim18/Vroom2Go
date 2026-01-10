import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { 
  createReview, 
  getShopReviews, 
  respondToReview,
  checkBookingReview 
} from '../controllers/review.controller';

const router = express.Router();

// Public routes
router.get('/shop/:shopId', getShopReviews);

// Protected routes
router.post('/', protect, createReview);
router.put('/:id/respond', protect, respondToReview);
router.get('/check/:bookingId', protect, checkBookingReview);

export default router;
