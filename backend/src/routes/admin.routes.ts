import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import {
  getAdminStats,
  getAllUsers,
  getPendingShops,
  verifyShop,
  getAllDisputes,
  resolveDispute,
  getRecentBookings
} from '../controllers/admin.controller';

const router = Router();

// All routes require admin authentication
router.use(protect, authorize('ADMIN'));

// Dashboard stats
router.get('/stats', getAdminStats);

// Users management
router.get('/users', getAllUsers);

// Shop verification
router.get('/shops/pending', getPendingShops);
router.put('/shops/:id/verify', verifyShop);

// Disputes
router.get('/disputes', getAllDisputes);
router.put('/disputes/:id/resolve', resolveDispute);

// Recent activity
router.get('/bookings/recent', getRecentBookings);

export default router;
