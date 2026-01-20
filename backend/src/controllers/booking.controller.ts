import { Request, Response } from 'express';
import { PrismaClient, BookingStatus, JobStatus } from '@prisma/client';
import { notifyBookingStatusChange, notifyBookingConfirmed } from './notification.controller';

const prisma = new PrismaClient();

/**
 * @desc    Create a new booking
 * @route   POST /api/bookings
 * @access  Private
 */
export const createBooking = async (req: any, res: Response) => {
  try {
    const { 
      shopId, 
      vehicleId, 
      serviceId, 
      quoteId, 
      scheduledDate, 
      scheduledTime, 
      method, 
      notes 
    } = req.body;

    // Basic validation
    if (!shopId || !vehicleId || !scheduledDate || !scheduledTime) {
      return res.status(400).json({ message: 'Missing required booking fields' });
    }

    const booking = await prisma.booking.create({
      data: {
        userId: req.user.id,
        shopId: parseInt(shopId),
        vehicleId: parseInt(vehicleId),
        serviceId: serviceId ? parseInt(serviceId) : null,
        quoteId: quoteId ? parseInt(quoteId) : null,
        scheduledDate: new Date(scheduledDate),
        scheduledTime: new Date(scheduledTime),
        method: method || 'DROP_OFF',
        notes,
        status: BookingStatus.PENDING
      }
    });

    res.status(201).json(booking);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get user's bookings
 * @route   GET /api/bookings
 * @access  Private
 */
export const getMyBookings = async (req: any, res: Response) => {
  try {
    const where: any = {};
    
    // If shop owner, see shop's bookings. If user, see their own.
    if (req.user.role === 'SHOP') {
      const shop = await prisma.shop.findUnique({ where: { userId: req.user.id } });
      if (!shop) return res.status(404).json({ message: 'Shop not found' });
      where.shopId = shop.id;
    } else {
      where.userId = req.user.id;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        shop: { select: { name: true, address: true, imageUrl: true, phone: true, userId: true } },
        vehicle: { select: { make: true, model: true, year: true, licensePlate: true } },
        service: { select: { name: true } },
        user: { select: { id: true, name: true, email: true, phone: true } },
        quote: { select: { totalEstimate: true } }
      },
      orderBy: { scheduledDate: 'desc' }
    });

    res.json(bookings);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get booking by ID
 * @route   GET /api/bookings/:id
 * @access  Private
 */
export const getBookingById = async (req: any, res: Response) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        shop: true,
        vehicle: true,
        service: true,
        quote: { include: { items: true } },
        updates: { orderBy: { createdAt: 'desc' } },
        invoice: { include: { items: true } },
        payments: true,
        reviews: true
      }
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Security check: Only user or shop can view
    if (booking.userId !== req.user.id && (req.user.role !== 'SHOP' || booking.shop.userId !== req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }

    res.json(booking);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update booking status
 * @route   PUT /api/bookings/:id/status
 * @access  Private (Shop)
 */
export const updateBookingStatus = async (req: any, res: Response) => {
  try {
    const { status } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { shop: true }
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Only shop owner can update status
    if (booking.shop.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: status as BookingStatus }
    });

    // Create a job update record too
    await prisma.jobUpdate.create({
      data: {
        bookingId: booking.id,
        status: JobStatus.IN_PROGRESS, // Simplification for now
        message: `Booking status updated to ${status}`,
        createdBy: req.user.id
      }
    });

    // Notify the customer about status change
    try {
      if (status === 'CONFIRMED') {
        notifyBookingConfirmed(booking.userId, booking.shop.name || 'Your shop', booking.id);
      } else {
        notifyBookingStatusChange(booking.userId, status, booking.id);
      }
    } catch (notifyErr) {
      console.warn('Failed to send booking notification:', notifyErr);
    }

    res.json(updatedBooking);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
