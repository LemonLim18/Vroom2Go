import { Request, Response } from 'express';
import { PrismaClient, InvoiceStatus } from '@prisma/client';
import { notifyInvoiceReady, notifyPaymentReceived } from './notification.controller';

const prisma = new PrismaClient();

/**
 * @desc    Get invoice by booking ID
 * @route   GET /api/invoices/booking/:bookingId
 * @access  Private
 */
export const getInvoiceByBookingId = async (req: any, res: Response) => {
  try {
    const bookingId = parseInt(req.params.bookingId);

    const invoice = await prisma.invoice.findUnique({
      where: { bookingId },
      include: {
        items: true,
        booking: {
          include: {
            shop: { select: { id: true, name: true, address: true, phone: true, imageUrl: true } },
            vehicle: { select: { make: true, model: true, year: true, licensePlate: true } },
            quote: { select: { totalEstimate: true } }
          }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Check authorization: user must own the booking or be the shop owner
    const booking = invoice.booking;
    if (booking.userId !== req.user.id) {
      const shop = await prisma.shop.findUnique({ where: { id: booking.shopId } });
      if (!shop || shop.userId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to view this invoice' });
      }
    }

    // Transform to frontend expected format
    const frontendInvoice = transformInvoiceForFrontend(invoice);
    res.json(frontendInvoice);
  } catch (error: any) {
    console.error('Get invoice error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get all invoices for current user (as customer or shop owner)
 * @route   GET /api/invoices
 * @access  Private
 */
export const getMyInvoices = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let where: any = {};

    if (userRole === 'SHOP') {
      // Shop owner: get invoices for their shop's bookings
      const shop = await prisma.shop.findUnique({ where: { userId } });
      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }
      where = { booking: { shopId: shop.id } };
    } else {
      // Customer: get invoices for their bookings
      where = { booking: { userId } };
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        items: true,
        booking: {
          include: {
            shop: { select: { id: true, name: true, address: true, imageUrl: true } },
            vehicle: { select: { make: true, model: true, year: true } },
            quote: { select: { totalEstimate: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const frontendInvoices = invoices.map(transformInvoiceForFrontend);
    res.json(frontendInvoices);
  } catch (error: any) {
    console.error('Get invoices error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Create invoice for a completed booking (Shop only)
 * @route   POST /api/invoices
 * @access  Private (Shop)
 */
export const createInvoice = async (req: any, res: Response) => {
  try {
    const { bookingId, items, notes, evidencePhotos } = req.body;

    // Verify shop ownership
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(bookingId) },
      include: { shop: true }
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.shop.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to create invoice for this booking' });
    }

    // Check if invoice already exists
    const existingInvoice = await prisma.invoice.findUnique({ where: { bookingId: parseInt(bookingId) } });
    if (existingInvoice) {
      return res.status(400).json({ message: 'Invoice already exists for this booking' });
    }

    // Calculate totals from line items
    let partsCost = 0;
    let laborCost = 0;

    const processedItems = items.map((item: any) => {
      const itemTotal = Number(item.unitPrice) * (item.quantity || 1);
      if (item.type === 'PARTS') {
        partsCost += itemTotal;
      } else {
        laborCost += itemTotal;
      }
      return {
        description: item.description,
        type: item.type || 'LABOR',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice,
        totalPrice: itemTotal,
        photoUrl: item.photoUrl
      };
    });

    const subtotal = partsCost + laborCost;
    const taxRate = 0.08; // 8% tax
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;
    const depositApplied = Number(booking.depositAmount) || 0;
    const amountDue = totalAmount - depositApplied;

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${booking.id}`;

    const invoice = await prisma.invoice.create({
      data: {
        bookingId: parseInt(bookingId),
        invoiceNumber,
        subtotal,
        taxAmount,
        totalAmount,
        depositApplied,
        amountDue,
        status: InvoiceStatus.PENDING,
        items: {
          create: processedItems
        }
      },
      include: {
        items: true,
        booking: {
          include: {
            shop: { select: { id: true, name: true } },
            vehicle: { select: { make: true, model: true, year: true } },
            quote: { select: { totalEstimate: true } }
          }
        }
      }
    });

    // Notify the customer that their invoice is ready
    try {
      notifyInvoiceReady(booking.userId, booking.id);
    } catch (notifyErr) {
      console.warn('Failed to send invoice notification:', notifyErr);
    }

    res.status(201).json(transformInvoiceForFrontend(invoice));
  } catch (error: any) {
    console.error('Create invoice error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Approve invoice (Customer only)
 * @route   PUT /api/invoices/:id/approve
 * @access  Private
 */
export const approveInvoice = async (req: any, res: Response) => {
  try {
    const invoiceId = parseInt(req.params.id);

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { booking: true }
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Only the booking owner can approve
    if (invoice.booking.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to approve this invoice' });
    }

    if (invoice.status === InvoiceStatus.PAID) {
      return res.status(400).json({ message: 'Invoice already approved and paid' });
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: InvoiceStatus.PAID,
        approvedAt: new Date(),
        paidAt: new Date()
      },
      include: {
        items: true,
        booking: {
          include: {
            shop: { select: { id: true, name: true } },
            vehicle: { select: { make: true, model: true, year: true } },
            quote: { select: { totalEstimate: true } }
          }
        }
      }
    });

    // Also update booking status
    await prisma.booking.update({
      where: { id: invoice.bookingId },
      data: { status: 'COMPLETED' }
    });

    res.json(transformInvoiceForFrontend(updatedInvoice));
  } catch (error: any) {
    console.error('Approve invoice error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Transform database invoice to frontend expected format
 */
function transformInvoiceForFrontend(invoice: any) {
  const booking = invoice.booking;
  const quoteTotal = Number(booking?.quote?.totalEstimate) || 0;
  const finalTotal = Number(invoice.totalAmount);
  const variance = quoteTotal > 0 ? ((finalTotal - quoteTotal) / quoteTotal) * 100 : 0;

  // Calculate parts and labor totals from items
  let partsCostTotal = 0;
  let laborCostTotal = 0;

  invoice.items?.forEach((item: any) => {
    if (item.type === 'PARTS') {
      partsCostTotal += Number(item.totalPrice);
    } else {
      laborCostTotal += Number(item.totalPrice);
    }
  });

  return {
    id: String(invoice.id),
    bookingId: String(invoice.bookingId),
    quoteId: booking?.quote ? String(booking.quoteId) : '',
    invoiceNumber: invoice.invoiceNumber,
    lineItems: invoice.items?.map((item: any) => ({
      id: String(item.id),
      description: item.description,
      partName: item.type === 'PARTS' ? item.description : undefined,
      partCost: item.type === 'PARTS' ? Number(item.totalPrice) : 0,
      laborHours: item.type === 'LABOR' ? 1 : 0,
      laborRate: item.type === 'LABOR' ? Number(item.unitPrice) : 0,
      quantity: item.quantity,
      subtotal: Number(item.totalPrice)
    })) || [],
    partsCostTotal,
    laborCostTotal,
    shopFees: 0, // Could be added to schema later
    taxes: Number(invoice.taxAmount),
    finalTotal,
    variance,
    evidencePhotos: invoice.items
      ?.filter((item: any) => item.photoUrl)
      .map((item: any) => item.photoUrl) || [],
    notes: '', // Could be added to schema
    approvedByOwner: invoice.status === 'PAID',
    depositApplied: Number(invoice.depositApplied),
    amountDue: Number(invoice.amountDue),
    status: invoice.status,
    createdAt: invoice.createdAt.toISOString(),
    // Include related data for display
    shop: booking?.shop,
    vehicle: booking?.vehicle
  };
}
