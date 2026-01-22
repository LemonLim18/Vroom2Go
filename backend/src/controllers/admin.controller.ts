import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * @desc    Get admin dashboard stats
 * @route   GET /api/admin/stats
 * @access  Private (Admin)
 */
export const getAdminStats = async (req: any, res: Response) => {
  try {
    const [
      totalUsers,
      totalShops,
      verifiedShops,
      pendingVerifications,
      totalBookings,
      completedBookings,
      openDisputes,
      revenueData
    ] = await Promise.all([
      prisma.user.count(),
      prisma.shop.count(),
      prisma.shop.count({ where: { verified: true } }),
      prisma.shop.count({ where: { verified: false } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'COMPLETED' } }),
      prisma.dispute.count({ where: { status: 'OPEN' } }),
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true }
      })
    ]);

    res.json({
      totalUsers,
      totalShops,
      verifiedShops,
      pendingVerifications,
      totalBookings,
      completedBookings,
      openDisputes,
      revenue: Number(revenueData._sum.amount) || 0
    });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get all users (admin)
 * @route   GET /api/admin/users
 * @access  Private (Admin)
 */
export const getAllUsers = async (req: any, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        avatarUrl: true,
        _count: {
          select: { bookings: true, vehicles: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get shops pending verification
 * @route   GET /api/admin/shops/pending
 * @access  Private (Admin)
 */
export const getPendingShops = async (req: any, res: Response) => {
  try {
    const shops = await prisma.shop.findMany({
      where: { verified: false },
      include: {
        user: {
          select: { name: true, email: true }
        },
        certifications: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(shops);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Verify/Reject a shop
 * @route   PUT /api/admin/shops/:id/verify
 * @access  Private (Admin)
 */
export const verifyShop = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { verified, reason } = req.body;

    const shop = await prisma.shop.update({
      where: { id: parseInt(id) },
      data: {
        verified,
        verifiedAt: verified ? new Date() : null
      }
    });

    // Create notification for shop owner
    await prisma.notification.create({
      data: {
        userId: shop.userId,
        type: 'SHOP_VERIFIED',
        title: verified ? 'Shop Verified!' : 'Verification Update',
        message: verified 
          ? 'Congratulations! Your shop has been verified and is now visible to drivers.'
          : `Your shop verification was not approved. Reason: ${reason || 'Please contact support.'}`,
        actionUrl: '/profile'
      }
    });

    res.json({ success: true, shop });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get all disputes
 * @route   GET /api/admin/disputes
 * @access  Private (Admin)
 */
export const getAllDisputes = async (req: any, res: Response) => {
  try {
    const disputes = await prisma.dispute.findMany({
      include: {
        booking: {
          include: {
            service: true,
            vehicle: true
          }
        },
        user: {
          select: { id: true, name: true, email: true }
        },
        shop: {
          select: { id: true, name: true }
        },
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(disputes);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Resolve a dispute
 * @route   PUT /api/admin/disputes/:id/resolve
 * @access  Private (Admin)
 */
export const resolveDispute = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { resolution, status } = req.body;
    const adminId = req.user.id;

    const dispute = await prisma.dispute.update({
      where: { id: parseInt(id) },
      data: {
        status: status || 'RESOLVED',
        resolution,
        resolvedById: adminId,
        resolvedAt: new Date()
      },
      include: {
        user: true,
        shop: true
      }
    });

    // Notify both parties
    await prisma.notification.createMany({
      data: [
        {
          userId: dispute.userId,
          type: 'DISPUTE_RESOLVED',
          title: 'Dispute Resolved',
          message: `Your dispute has been resolved. Resolution: ${resolution}`,
          actionUrl: `/bookings/${dispute.bookingId}`
        },
        {
          userId: dispute.shop.userId,
          type: 'DISPUTE_RESOLVED',
          title: 'Dispute Resolved',
          message: `A dispute on your shop has been resolved. Resolution: ${resolution}`,
          actionUrl: `/bookings/${dispute.bookingId}`
        }
      ]
    });

    res.json({ success: true, dispute });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get recent bookings for admin
 * @route   GET /api/admin/bookings/recent
 * @access  Private (Admin)
 */
export const getRecentBookings = async (req: any, res: Response) => {
  try {
    const bookings = await prisma.booking.findMany({
      take: 10,
      include: {
        service: true,
        shop: {
          select: { id: true, name: true }
        },
        user: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(bookings);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
