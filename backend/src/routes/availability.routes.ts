import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  getShopAvailability,
  getShopWeeklyAvailability,
  createTimeSlots,
  deleteTimeSlot,
} from '../controllers/availability.controller';

const router = Router();

// Public: Get shop availability for a specific date
router.get('/shops/:shopId/availability', getShopAvailability);

// Public: Get shop availability for a week
router.get('/shops/:shopId/availability/week', getShopWeeklyAvailability);

// Protected: Shop owner creates time slots
router.post('/shops/availability', protect, createTimeSlots);

// Protected: Shop owner deletes a time slot
router.delete('/shops/availability/:slotId', protect, deleteTimeSlot);

export default router;
