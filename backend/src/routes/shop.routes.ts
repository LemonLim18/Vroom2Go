import { Router } from 'express';
import { getShops, getShopById, updateShopProfile, getMyShop } from '../controllers/shop.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getShops);
router.get('/:id', getShopById);

router.get('/profile', protect, authorize('SHOP'), getMyShop);
router.put('/profile', protect, authorize('SHOP'), updateShopProfile);

export default router;
