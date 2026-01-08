import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * @desc    Get user's vehicles
 * @route   GET /api/vehicles
 * @access  Private
 */
export const getMyVehicles = async (req: any, res: Response) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { userId: req.user.id },
      orderBy: { isPrimary: 'desc' }
    });
    res.json(vehicles);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Add a new vehicle
 * @route   POST /api/vehicles
 * @access  Private
 */
export const addVehicle = async (req: any, res: Response) => {
  try {
    const { vin, make, model, year, type, licensePlate, color, mileage, isPrimary } = req.body;

    // If setting as primary, unset other primary vehicles for this user
    if (isPrimary) {
      await prisma.vehicle.updateMany({
        where: { userId: req.user.id },
        data: { isPrimary: false }
      });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        userId: req.user.id,
        vin,
        make,
        model,
        year: parseInt(year),
        type,
        licensePlate,
        color,
        mileage: mileage ? parseInt(mileage) : null,
        isPrimary: isPrimary || false
      }
    });

    res.status(201).json(vehicle);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get vehicle by ID
 * @route   GET /api/vehicles/:id
 * @access  Private
 */
export const getVehicleById = async (req: any, res: Response) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    if (vehicle.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this vehicle' });
    }

    res.json(vehicle);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update vehicle
 * @route   PUT /api/vehicles/:id
 * @access  Private
 */
export const updateVehicle = async (req: any, res: Response) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    if (vehicle.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this vehicle' });
    }

    const updatedVehicle = await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: req.body
    });

    res.json(updatedVehicle);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Delete vehicle
 * @route   DELETE /api/vehicles/:id
 * @access  Private
 */
export const deleteVehicle = async (req: any, res: Response) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    if (vehicle.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this vehicle' });
    }

    await prisma.vehicle.delete({
      where: { id: vehicle.id }
    });

    res.json({ message: 'Vehicle removed' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
