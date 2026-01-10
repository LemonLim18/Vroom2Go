import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * @desc    Get all shops with optional filters
 * @route   GET /api/shops
 * @access  Public
 */
export const getShops = async (req: Request, res: Response) => {
  try {
    const { search, verified, minRating } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: String(search) } },
        { address: { contains: String(search) } }
      ];
    }

    if (verified === 'true') {
      where.verified = true;
    }

    if (minRating) {
      where.rating = { gte: parseFloat(String(minRating)) };
    }

    const shops = await prisma.shop.findMany({
      where,
      include: {
        hours: true,
        _count: {
          select: { reviews: true }
        }
      },
      orderBy: {
        rating: 'desc'
      }
    });

    res.json(shops);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get single shop by ID
 * @route   GET /api/shops/:id
 * @access  Public
 */
export const getShopById = async (req: Request, res: Response) => {
  try {
    const shop = await prisma.shop.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        hours: true,
        certifications: true,
        services: {
          include: {
            service: true
          }
        },
        reviews: {
          include: {
            user: {
              select: { name: true, avatarUrl: true }
            }
          },
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { reviews: true }
        }
      }
    });

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    res.json(shop);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update shop profile
 * @route   PUT /api/shops/profile
 * @access  Private (Shop Owner)
 */
export const updateShopProfile = async (req: any, res: Response) => {
  try {
    // A user can only update their own shop
    const shop = await prisma.shop.findUnique({
      where: { userId: req.user.id }
    });

    if (!shop) {
      return res.status(404).json({ message: 'Shop profile not found' });
    }

    const updatedShop = await prisma.shop.update({
      where: { id: shop.id },
      data: req.body
    });

    res.json(updatedShop);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get current user's shop profile
 * @route   GET /api/shops/profile
 * @access  Private (Shop Owner)
 */
export const getMyShop = async (req: any, res: Response) => {
  try {
    const shop = await prisma.shop.findUnique({
      where: { userId: req.user.id },
      include: {
        hours: true,
        certifications: true,
        services: {
          include: {
            service: true
          }
        },
        _count: {
          select: { reviews: true }
        }
      }
    });

    if (!shop) {
      return res.status(404).json({ message: 'Shop profile not found' });
    }

    res.json(shop);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get shop analytics/metrics for dashboard
 * @route   GET /api/shops/analytics
 * @access  Private (Shop Owner)
 */
export const getShopAnalytics = async (req: any, res: Response) => {
  try {
    const shop = await prisma.shop.findUnique({
      where: { userId: req.user.id }
    });

    if (!shop) {
      return res.status(404).json({ message: 'Shop profile not found' });
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Weekly Revenue: Sum of completed payments for this shop's bookings
    const payments = await prisma.payment.findMany({
      where: {
        booking: { shopId: shop.id },
        status: 'COMPLETED',
        createdAt: { gte: sevenDaysAgo }
      },
      select: { amount: true }
    });
    const weeklyRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    // New Bookings: Count of bookings created in last 7 days
    const newBookingsCount = await prisma.booking.count({
      where: {
        shopId: shop.id,
        createdAt: { gte: sevenDaysAgo }
      }
    });

    // Pending Bookings count
    const pendingBookingsCount = await prisma.booking.count({
      where: {
        shopId: shop.id,
        status: 'PENDING'
      }
    });

    // Avg Response Time (simplified for MVP: just use a placeholder or skip if no data)
    // Full implementation would track response timestamps separately
    let avgResponseMinutes = 18; // Placeholder default, can be enhanced later

    res.json({
      weeklyRevenue,
      newBookings: newBookingsCount,
      pendingBookings: pendingBookingsCount,
      avgResponseMinutes,
      rating: Number(shop.rating),
      reviewCount: shop.reviewCount
    });
  } catch (error: any) {
    console.error('Get shop analytics error:', error);
    res.status(500).json({ message: error.message });
  }
};
