import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { 
    createQuoteRequest, 
    getDriverRequests, 
    getShopRequests, 
    getShopRespondedRequests,
    createQuote,
    acceptQuote,
    getQuoteById
} from '../controllers/quote.controller';

const router = express.Router();

router.post('/requests', protect, createQuoteRequest);
router.get('/requests/driver', protect, getDriverRequests);
router.get('/requests/shop', protect, getShopRequests);
router.get('/requests/shop/responded', protect, getShopRespondedRequests);
router.post('/requests/:id/respond', protect, createQuote);
router.put('/:id/accept', protect, acceptQuote);
router.get('/:id', protect, getQuoteById);

export default router;
