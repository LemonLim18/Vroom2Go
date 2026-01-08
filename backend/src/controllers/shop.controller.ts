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
