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

    const shopsRaw = await prisma.shop.findMany({
      where,
      include: {
        hours: true,
        services: {
          include: {
            service: true
          }
        },
        reviews: {
          select: { rating: true }
        },
        _count: {
          select: { reviews: true }
        }
      },
      orderBy: {
        rating: 'desc'
      }
    });

    // Calculate real dynamic rating if the column might be stale
    const shops = shopsRaw.map(shop => {
      const reviewCount = shop._count.reviews;
      const avgRating = reviewCount > 0 
        ? shop.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount 
        : 0;
      
      return {
        ...shop,
        rating: avgRating || Number(shop.rating), // Fallback to column if no reviews yet (for seeded ones maybe)
        reviewCount: reviewCount
      };
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
    const shopRaw = await prisma.shop.findUnique({
      where: { userId: req.user.id },
      include: {
        hours: true,
        certifications: true,
        services: {
          include: {
            service: true
          }
        },
        reviews: {
          select: { rating: true }
        },
        _count: {
          select: { reviews: true }
        }
      }
    });

    if (!shopRaw) {
      return res.status(404).json({ message: 'Shop profile not found' });
    }

    // Calculate real dynamic rating from reviews
    const reviewCount = shopRaw._count.reviews;
    const avgRating = reviewCount > 0 
      ? shopRaw.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount 
      : 0;

    const shop = {
      ...shopRaw,
      rating: avgRating || Number(shopRaw.rating),
      reviewCount: reviewCount
    };

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

    // Completed Bookings count
    const completedBookingsCount = await prisma.booking.count({
      where: {
        shopId: shop.id,
        status: 'COMPLETED'
      }
    });

    // Avg Response Time (simplified for MVP: just use a placeholder or skip if no data)
    // Full implementation would track response timestamps separately
    let avgResponseMinutes = 18; // Placeholder default, can be enhanced later

    // --- Charts Data Aggregation ---

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // 1. Monthly Revenue & Bookings (Last 6 Months)
    const monthlyStatsRaw = await prisma.$queryRaw`
      SELECT 
        DATE_FORMAT(b.created_at, '%Y-%m') as monthKey,
        COUNT(b.id) as bookings,
        COALESCE(SUM(p.amount), 0) as revenue
      FROM bookings b
      LEFT JOIN payments p ON b.id = p.booking_id AND p.status = 'COMPLETED'
      WHERE b.shop_id = ${shop.id} 
        AND b.created_at >= ${sixMonthsAgo}
      GROUP BY monthKey
      ORDER BY monthKey ASC
    `;

    // format for frontend: { name: 'Jan', revenue: 5000, bookings: 120 }
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartsData = (monthlyStatsRaw as any[]).map((stat: any) => {
      const [year, month] = stat.monthKey.split('-');
      return {
        name: monthNames[parseInt(month) - 1],
        revenue: Number(stat.revenue),
        bookings: Number(stat.bookings)
      };
    });

    // 2. Service Category Breakdown
    const serviceStatsRaw = await prisma.$queryRaw`
      SELECT 
        s.category as name,
        COUNT(b.id) as value
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      WHERE b.shop_id = ${shop.id}
      GROUP BY s.category
    `;
    
    // format for frontend: { name: 'Maintenance', value: 45 }
    const serviceBreakdown = (serviceStatsRaw as any[]).map((stat: any) => ({
      name: stat.name,
      value: Number(stat.value)
    }));
    
    // Fill in missing categories with 0 if needed, or just return what we have

    res.json({
      weeklyRevenue,
      newBookings: newBookingsCount,
      pendingBookings: pendingBookingsCount,
      completedBookings: completedBookingsCount,
      avgResponseMinutes,
      rating: Number(shop.rating),
      reviewCount: shop.reviewCount,
      charts: {
        revenue: chartsData,
        monthly: chartsData, 
        services: serviceBreakdown
      }
    });
  } catch (error: any) {
    console.error('Get shop analytics error:', error);
    res.status(500).json({ message: error.message });
  }
};
