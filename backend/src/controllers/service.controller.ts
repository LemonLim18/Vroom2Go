import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * @desc    Get all master services
 * @route   GET /api/services
 * @access  Public
 */
export const getServices = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    const where: any = { isActive: true };

    if (category) {
      where.category = category;
    }

    const services = await prisma.service.findMany({
      where,
      include: {
        pricing: true
      },
      orderBy: {
        category: 'asc'
      }
    });

    res.json(services);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get single service by ID
 * @route   GET /api/services/:id
 * @access  Public
 */
export const getServiceById = async (req: Request, res: Response) => {
  try {
    const service = await prisma.service.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        pricing: true
      }
    });

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.json(service);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
