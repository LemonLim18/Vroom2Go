import { Request, Response } from 'express';
import fs from 'fs';
import { PrismaClient, BookingStatus, JobStatus } from '@prisma/client';
import { notifyBookingStatusChange, notifyBookingConfirmed, notifyBookingCancelled } from './notification.controller';
import { bookSlot, releaseSlot } from './availability.controller';

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

    // Check for existing booking for this quote to prevent unique constraint error
    if (quoteId) {
       const existing = await prisma.booking.findUnique({ where: { quoteId: parseInt(quoteId) } });
       if (existing) {
          return res.status(409).json({ message: 'A booking already exists for this quote.', bookingId: existing.id });
       }
    }

    // Sanitize Booking Method to match Enum
    const validMethods = ['DROP_OFF', 'WAIT', 'MOBILE'];
    const safeMethod = validMethods.includes(method) ? method : 'DROP_OFF';

    // 1. Create the booking first
    const booking = await prisma.booking.create({
      data: {
        userId: req.user.id,
        shopId: parseInt(shopId),
        vehicleId: parseInt(vehicleId),
        serviceId: serviceId ? parseInt(serviceId) : null,
        quoteId: quoteId ? parseInt(quoteId) : null,
        scheduledDate: new Date(scheduledDate),
        scheduledTime: new Date(scheduledTime),
        method: safeMethod,
        notes,
        status: BookingStatus.PENDING
      }
    });

    // 2. Update Quote Status to ACCEPTED (Move to History)
    if (quoteId) {
        try {
            await prisma.quote.update({
                where: { id: parseInt(quoteId) },
                data: { status: 'ACCEPTED' }
            });
        } catch (quoteErr) {
            console.error('Failed to update quote status:', quoteErr);
        }
    }

    // 3. Reserve the availability slot
    try {
        if (req.body.timeSlotId) {
             // Direct ID match (Robust)
             await prisma.timeSlot.update({
                 where: { id: parseInt(req.body.timeSlotId) },
                 data: { isBooked: true, bookingId: booking.id }
             });
        } else {
             // Fallback to legacy Date matching (Fragile due to Timezones)
             const sTime = new Date(scheduledTime);
             const dateParam = new Date(Date.UTC(sTime.getFullYear(), sTime.getMonth(), sTime.getDate()));
             const timeParam = new Date(2000, 0, 1, sTime.getHours(), sTime.getMinutes(), 0);
             await bookSlot(parseInt(shopId), dateParam, timeParam, booking.id);
        }
    } catch (slotError) {
        console.warn('Failed to reserve time slot:', slotError);
    }

    res.status(201).json(booking);
  } catch (error: any) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

/**
 * @desc    Get user's bookings
 * @route   GET /api/bookings
 * @access  Private
 */
export const getMyBookings = async (req: any, res: Response) => {
  try {
    console.log('[getMyBookings] REQ.USER:', JSON.stringify(req.user));
    
    const where: any = {};
    
    // If shop owner, see shop's bookings. If user, see their own.
    if (req.user.role === 'SHOP') {
      const shop = await prisma.shop.findUnique({ where: { userId: parseInt(req.user.id) } });
      if (shop) {
         where.shopId = shop.id;
      } else {
         // Fallback: If role is SHOP but no shop profile exists (or they are acting as a user), show their user bookings
         where.userId = parseInt(req.user.id);
      }
    } else {
      where.userId = parseInt(req.user.id);
    }

    console.log('[getMyBookings] Fetching bookings with where:', where);

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        shop: { select: { name: true, address: true, imageUrl: true, phone: true, userId: true } },
        vehicle: { select: { make: true, model: true, year: true, licensePlate: true } },
        service: { select: { name: true } },
        user: { select: { id: true, name: true, email: true, phone: true } },
        quote: { select: { totalEstimate: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`[getMyBookings] Found ${bookings.length} bookings`);
    // Debug log one to see structure
    if (bookings.length > 0) {
        console.log('[getMyBookings] First booking sample:', JSON.stringify(bookings[0], null, 2));
    }

    res.json(bookings);
  } catch (error: any) {
    const msg = `[${new Date().toISOString()}] getMyBookings Error: ${error.message}\nStack: ${error.stack}\nUser: ${JSON.stringify(req.user)}\n`;
    try { fs.appendFileSync('backend_error.log', msg); } catch(e) { console.error('Failed to write log', e); }
    console.error('getMyBookings Error:', error);
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
    const { status, notes } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { 
        shop: true,
        user: { select: { name: true, email: true } } 
      }
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Authorization: Shop Owner OR Booking Owner (Customer)
    const userId = parseInt(req.user.id); // Ensure number comparison
    
    const isShopOwner = booking.shop.userId === userId;
    const isBookingOwner = booking.userId === userId;

    console.log(`[UpdateBooking] ID Check: ReqUser=${userId} (type: ${typeof userId}), BookingUser=${booking.userId}, ShopUser=${booking.shop.userId}`);
    console.log(`[UpdateBooking] Auth Result: isShopOwner=${isShopOwner}, isBookingOwner=${isBookingOwner}`);

    if (!isShopOwner && !isBookingOwner) {
      console.warn(`[UpdateBooking] 403 Forbidden: User ${userId} tried to modify booking ${booking.id} owned by User ${booking.userId}`);
      return res.status(403).json({ 
        message: 'Not authorized to update this booking',
        debug: `User ID mismatch: Requesting as ${userId}, Booking belongs to ${booking.userId}`
      });
    }

    // Additional safety: Customers can ONLY update notes or set status to CANCELLED
    if (isBookingOwner && !isShopOwner) {
        if (status && status !== 'CANCELLED' && status !== booking.status) {
             return res.status(403).json({ message: 'Customers can only cancel bookings or update notes' });
        }
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: { 
        status: status as BookingStatus,
        notes: notes !== undefined ? notes : undefined // Update notes if provided
      }
    });

    // If booking is cancelled, release the time slot
    if (status === 'CANCELLED') {
      try {
        await releaseSlot(booking.id);
      } catch (releaseErr) {
        console.warn('Failed to release time slot:', releaseErr);
      }
    }

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
      
      // Notify Shop if Customer Rejected Proposal
      if (isBookingOwner && notes && notes.includes('[RESCHEDULE REJECTED]')) {
         const { notifyRescheduleRejected } = await import('./notification.controller');
         notifyRescheduleRejected(booking.shop.userId, booking.user?.name || 'Customer', booking.id);
      }
    } catch (notifyErr) {
      console.warn('Failed to send booking notification:', notifyErr);
    }

    res.json(updatedBooking);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Reschedule a booking (Customer Accepts Proposal)
 * @route   PUT /api/bookings/:id/reschedule
 * @access  Private (User/Shop)
 */
export const rescheduleBooking = async (req: any, res: Response) => {
  try {
    console.log(`[Reschedule] ===== RESCHEDULE REQUEST RECEIVED =====`);
    console.log(`[Reschedule] Booking ID: ${req.params.id}`);
    console.log(`[Reschedule] Request body:`, req.body);
    console.log(`[Reschedule] User ID: ${req.user?.id}, Role: ${req.user?.role}`);
    
    const { newDate, newTime } = req.body; // YYYY-MM-DD, HH:MM
    const bookingId = parseInt(req.params.id);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { shop: true }
    });

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // 1. Release Old Slot
    if (booking.status !== 'CANCELLED') {
         await prisma.timeSlot.updateMany({
           where: { bookingId: booking.id },
           data: { isBooked: false, bookingId: null }
        });
    }

    // 2. Find and Book New Slot
    // Clean time string (remove "(UTC)" or other suffixes) and parse "HH:MM"
    const cleanedTime = newTime.replace(/\s*\(UTC\)\s*/i, '').trim();
    const [h, m] = cleanedTime.split(':').map(Number);
    
    // Use UTC Midnight for Date matching
    const searchDate = new Date(newDate); // YYYY-MM-DD
    const dateParam = new Date(Date.UTC(searchDate.getFullYear(), searchDate.getMonth(), searchDate.getDate()));
    
    console.log(`[Reschedule] Looking for slot: shopId=${booking.shopId}, date=${dateParam.toISOString()}, hour=${h}, minute=${m}`);

    // Query ALL slots for this shop/date
    const allSlotsForDate = await prisma.timeSlot.findMany({
       where: {
          shopId: booking.shopId,
          date: dateParam
       }
    });
    
    console.log(`[Reschedule] Found ${allSlotsForDate.length} slots for this shop/date`);
    
    // Find the slot that matches the requested hour/minute
    // V2 Frontend sends strict UTC time (e.g. "09:00"), and DB stores strict UTC ("09:00")
    // So we perform a direct UTC-to-UTC match.
    
    let newSlot = allSlotsForDate.find(slot => {
       const slotTime = new Date(slot.startTime);
       const slotHour = slotTime.getUTCHours();
       const slotMinute = slotTime.getUTCMinutes();
       console.log(`  - Slot ID ${slot.id}: UTC hour=${slotHour}, minute=${slotMinute}, isBooked=${slot.isBooked}`);
       return slotHour === h && slotMinute === m && !slot.isBooked;
    });

    if (newSlot) {
       console.log(`[Reschedule] FOUND matching slot ID ${newSlot.id}`);
    }

    // Enforce slot-based scheduling: workshop must mark times as available FIRST
    if (!newSlot) {
       console.log(`[Reschedule] No matching slot found for ${newDate} @ ${newTime}`);
       return res.status(404).json({ 
         message: 'Proposed time slot is not available. Workshop must add this time to their availability calendar first.',
         details: {
           date: newDate,
           time: newTime,
           shopId: booking.shopId
         }
       });
    }

    if (newSlot.isBooked) {
        return res.status(409).json({ message: 'Target time slot is already taken!' });
    }

    // Book it
    const updatedSlot = await prisma.timeSlot.update({
        where: { id: newSlot.id },
        data: { isBooked: true, bookingId: booking.id }
    });
    console.log(`[Reschedule] Slot ${updatedSlot.id} booked: isBooked=${updatedSlot.isBooked}, bookingId=${updatedSlot.bookingId}`);

    // 3. Update Booking
    // Clean up the Proposal Note (remove the [RESCHEDULE PROPOSED] block)
    // Clean up the Proposal Note (remove the [RESCHEDULE PROPOSED] block)
    const currentNotes = booking.notes || '';
    // 1. Remove the Proposal block
    let cleanedNotes = currentNotes.replace(/\[RESCHEDULE PROPOSED(?: V2)?\][\s\S]*?(?=\n\n|$)/, '').trim();
    
    // 2. Prepare confirmation string
    const confirmationNote = `\n\n[RESCHEDULED] Changed from ${new Date(booking.scheduledDate).toLocaleDateString()} to ${newDate} @ ${newTime}`;
    
    // 3. Avoid duplicates if user double-clicks
    if (!cleanedNotes.includes(confirmationNote.trim())) {
        cleanedNotes += confirmationNote;
    }

    const updated = await prisma.booking.update({
        where: { id: bookingId },
        data: {
            scheduledDate: dateParam, // Already parsed as proper UTC date at midnight
            scheduledTime: new Date(Date.UTC(2000, 0, 1, h, m, 0)), // Match TimeSlot storage format
            status: 'CONFIRMED',
            notes: cleanedNotes
        },
        include: { user: { select: { name: true } } }
    });

    // Notify Shop Owner
    try {
      const { notifyRescheduleAccepted } = await import('./notification.controller');
      notifyRescheduleAccepted(booking.shop.userId, updated.user?.name || 'Customer', newDate, newTime, booking.id);
    } catch (e) { console.warn('Failed to send reschedule notification', e); }

    res.json(updated);

  } catch (error: any) {
    console.error('Reschedule Error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Cancel a booking (Driver)
 * @route   PUT /api/bookings/:id/cancel
 * @access  Private (Driver)
 */
export const cancelBooking = async (req: any, res: Response) => {
  try {
    const bookingId = parseInt(req.params.id);
    const userId = req.user.id;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { 
        shop: { select: { userId: true, name: true } }, 
        vehicle: true 
      }
    });

    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.userId !== userId) return res.status(403).json({ message: 'Not authorized' });

    if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
        return res.status(400).json({ message: 'Booking cannot be cancelled' });
    }

    // Check cancellation policy (24 hours)
    const now = new Date();
    const scheduledTime = new Date(booking.scheduledTime);
    const diffHours = (scheduledTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    const isLateCancellation = diffHours < 24;

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' } 
    });

    // Release Slot
    try {
        await releaseSlot(bookingId);
    } catch (e) { console.warn('Failed to release slot:', e); }

    // Notify Shop Owner
    try {
        if (booking.shop.userId) {
             notifyBookingCancelled(
                 booking.shop.userId,
                 req.user.name || 'Customer',
                 bookingId,
                 isLateCancellation
             );
        }
    } catch (e) {
        console.warn('Failed to notify shop:', e);
    }

    res.json({ 
        booking: updatedBooking, 
        refundStatus: isLateCancellation ? 'NON_REFUNDABLE' : 'REFUNDED',
        message: isLateCancellation 
            ? 'Booking cancelled. Deposit is non-refundable due to late cancellation.' 
            : 'Booking cancelled successfully. Deposit will be refunded.' 
    });

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
