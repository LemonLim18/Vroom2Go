import { Router } from 'express';
import { createBooking, getMyBookings, getBookingById, updateBookingStatus } from '../controllers/booking.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.post('/', protect, createBooking);
router.get('/', protect, getMyBookings);
router.get('/:id', protect, getBookingById);
router.put('/:id/status', protect, authorize('SHOP'), updateBookingStatus);

export default router;
