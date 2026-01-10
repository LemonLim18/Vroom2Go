import { Router } from 'express';
import { getShops, getShopById, updateShopProfile, getMyShop, getShopAnalytics } from '../controllers/shop.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getShops);
router.get('/profile', protect, authorize('SHOP'), getMyShop);
router.get('/analytics', protect, authorize('SHOP'), getShopAnalytics);
router.put('/profile', protect, authorize('SHOP'), updateShopProfile);

router.get('/:id', getShopById);

export default router;
