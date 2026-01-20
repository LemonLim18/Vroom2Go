import { Router } from 'express';
import { 
  getInvoiceByBookingId, 
  getMyInvoices, 
  createInvoice, 
  approveInvoice 
} from '../controllers/invoice.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// Get all invoices for current user (customer or shop)
router.get('/', protect, getMyInvoices);

// Get invoice by booking ID
router.get('/booking/:bookingId', protect, getInvoiceByBookingId);

// Create invoice (Shop only)
router.post('/', protect, authorize('SHOP'), createInvoice);

// Approve invoice (Customer only)
router.put('/:id/approve', protect, approveInvoice);

export default router;
