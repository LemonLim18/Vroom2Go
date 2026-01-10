import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { 
    createQuoteRequest, 
    getDriverRequests, 
    getShopRequests, 
    createQuote 
} from '../controllers/quote.controller';

const router = express.Router();

router.post('/requests', protect, createQuoteRequest);
router.get('/requests/driver', protect, getDriverRequests);
router.get('/requests/shop', protect, getShopRequests);
router.post('/requests/:id/respond', protect, createQuote);

export default router;
