import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * @desc    Get all diagnostic packages
 * @route   GET /api/diagnostic-packages
 * @access  Public
 */
export const getDiagnosticPackages = async (req: Request, res: Response) => {
  try {
    const packages = await prisma.diagnosticPackage.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    });

    res.json(packages);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get single diagnostic package by ID
 * @route   GET /api/diagnostic-packages/:id
 * @access  Public
 */
export const getDiagnosticPackageById = async (req: Request, res: Response) => {
  try {
    const pkg = await prisma.diagnosticPackage.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!pkg) {
      return res.status(404).json({ message: 'Package not found' });
    }

    res.json(pkg);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
