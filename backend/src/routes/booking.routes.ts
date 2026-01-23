import { Router } from 'express';
import { createBooking, getMyBookings, getBookingById, updateBookingStatus, cancelBooking, rescheduleBooking } from '../controllers/booking.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.post('/', protect, createBooking);
router.get('/my', protect, getMyBookings);
router.get('/', protect, getMyBookings);
router.get('/:id', protect, getBookingById);
router.put('/:id/status', protect, authorize('SHOP'), updateBookingStatus);
router.put('/:id/reschedule', protect, rescheduleBooking);
router.put('/:id/cancel', protect, cancelBooking);

export default router;
