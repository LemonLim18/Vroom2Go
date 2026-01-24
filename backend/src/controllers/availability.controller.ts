import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /shops/:shopId/availability?date=YYYY-MM-DD
// Fetch all time slots for a shop on a specific date
export const getShopAvailability = async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;
    const { date } = req.query;

    console.log(`[Availability] Query: shopId=${shopId}, date=${date}`);

    if (!date || typeof date !== 'string') {
      return res.status(400).json({ message: 'Date query parameter is required (YYYY-MM-DD)' });
    }

    // Parse as UTC to match how slots are stored
    const [year, month, day] = date.split('-').map(Number);
    const targetDate = new Date(Date.UTC(year, month - 1, day));
    
    console.log(`[Availability] Parsed targetDate: ${targetDate.toISOString()}`);

    const slots = await prisma.timeSlot.findMany({
      where: {
        shopId: parseInt(shopId),
        date: targetDate,
      },
      orderBy: { startTime: 'asc' },
      include: {
        booking: {
          select: {
            id: true,
            user: { select: { name: true } },
            vehicle: { select: { make: true, model: true, year: true } },
            service: { select: { name: true } },
          },
        },
      },
    });

    console.log(`[Availability] Found ${slots.length} slots for shop ${shopId} on ${date}`);

    res.json(slots);
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ message: 'Failed to fetch availability' });
  }
};

// GET /shops/:shopId/availability/week?startDate=YYYY-MM-DD
// Fetch all time slots for a shop for an entire week
export const getShopWeeklyAvailability = async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;
    const { startDate } = req.query;

    // Parse as UTC to match how slots are stored
    let start: Date;
    if (startDate && typeof startDate === 'string') {
      const [year, month, day] = startDate.split('-').map(Number);
      start = new Date(Date.UTC(year, month - 1, day));
    } else {
      const now = new Date();
      start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    }
    
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);

    const slots = await prisma.timeSlot.findMany({
      where: {
        shopId: parseInt(shopId),
        date: {
          gte: start,
          lt: end,
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      include: {
        booking: {
          select: {
            id: true,
            status: true, // Include status for frontend coloring
            user: { select: { name: true } },
            vehicle: { select: { make: true, model: true } },
          },
        },
      },
    });

    res.json(slots);
  } catch (error) {
    console.error('Error fetching weekly availability:', error);
    res.status(500).json({ message: 'Failed to fetch weekly availability' });
  }
};

// POST /shops/availability
// Shop creates or updates time slots
export const createTimeSlots = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // Find the shop owned by this user
    const shop = await prisma.shop.findUnique({ where: { userId } });
    if (!shop) return res.status(404).json({ message: 'Shop profile not found' });

    const { slots } = req.body; // Array of { date, startTime, endTime }

    if (!Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ message: 'Slots array is required' });
    }

    const createdSlots = await Promise.all(
      slots.map(async (slot: { date: string; startTime: string; endTime: string }) => {
        // Parse date as UTC to avoid timezone issues with MySQL DATE type
        const [year, month, day] = slot.date.split('-').map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));
        
        // Parse time strings like "09:00" into Date objects for db.Time
        const [startHour, startMin] = slot.startTime.split(':').map(Number);
        const [endHour, endMin] = slot.endTime.split(':').map(Number);

        // Use Date.UTC for time components to prevent timezone shifts on the server
        // We us a fixed dummy date (2000-01-01) for the TIME columns to be consistent
        const startTime = new Date(Date.UTC(2000, 0, 1, startHour, startMin, 0));
        const endTime = new Date(Date.UTC(2000, 0, 1, endHour, endMin, 0));

        return prisma.timeSlot.upsert({
          where: {
            shopId_date_startTime: {
              shopId: shop.id,
              date,
              startTime,
            },
          },
          update: { endTime },
          create: {
            shopId: shop.id,
            date,
            startTime,
            endTime,
          },
        });
      })
    );

    res.status(201).json({ message: 'Slots created', slots: createdSlots });
  } catch (error: any) {
    console.error('Error creating time slots:', error);
    console.error('Error details:', error?.code, error?.meta);
    res.status(500).json({ message: 'Failed to create slots', error: error?.message });
  }
};

// DELETE /shops/availability/:slotId
// Shop removes a time slot (only if not booked)
export const deleteTimeSlot = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { slotId } = req.params;

    const slot = await prisma.timeSlot.findUnique({
      where: { id: parseInt(slotId) },
      include: { shop: true },
    });

    if (!slot) return res.status(404).json({ message: 'Slot not found' });
    if (slot.shop.userId !== userId) return res.status(403).json({ message: 'Not your shop' });
    if (slot.isBooked) return res.status(400).json({ message: 'Cannot delete a booked slot' });

    await prisma.timeSlot.delete({ where: { id: parseInt(slotId) } });

    res.json({ message: 'Slot deleted' });
  } catch (error) {
    console.error('Error deleting time slot:', error);
    res.status(500).json({ message: 'Failed to delete slot' });
  }
};

// Helper: Book a slot (called from booking controller)
export const bookSlot = async (shopId: number, date: Date, startTime: Date, bookingId: number) => {
  // Find the matching slot
  const slot = await prisma.timeSlot.findUnique({
    where: {
      shopId_date_startTime: {
        shopId,
        date,
        startTime,
      },
    },
  });

  if (!slot) {
    throw new Error('Time slot not found');
  }

  if (slot.isBooked) {
    throw new Error('This slot is already booked');
  }

  // Mark slot as booked
  await prisma.timeSlot.update({
    where: { id: slot.id },
    data: {
      isBooked: true,
      bookingId,
    },
  });

  return slot;
};

// Helper: Release a slot (called when booking is cancelled)
export const releaseSlot = async (bookingId: number) => {
  const slot = await prisma.timeSlot.findFirst({
    where: { bookingId },
  });

  if (slot) {
    await prisma.timeSlot.update({
      where: { id: slot.id },
      data: {
        isBooked: false,
        bookingId: null,
      },
    });
  }
};
