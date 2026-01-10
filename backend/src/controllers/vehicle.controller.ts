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
// Helper to get file URL
const getFileUrl = (req: any) => {
  if (!req.file) return null;
  return `${req.protocol}://${req.get('host')}/uploads/vehicles/${req.file.filename}`;
};

// Start of the car mapping for database
const mapCarType = (frontendType: string): any => {
    const map: Record<string, string> = {
        'Compact': 'COMPACT',
        'Sedan': 'SEDAN',
        'SUV': 'SUV',
        'Luxury': 'LUXURY',
        'Electric': 'EV'
    };
    return map[frontendType] || 'SEDAN'; // Default fallback
};

/**
 * @desc    Add a new vehicle
 * @route   POST /api/vehicles
 * @access  Private
 */
export const addVehicle = async (req: any, res: Response) => {
  try {
    const { vin, make, model, year, type, licensePlate, color, mileage, isPrimary, trim } = req.body;
    const imageUrl = getFileUrl(req);

    // If setting as primary, unset other primary vehicles for this user
    if (isPrimary === 'true' || isPrimary === true) {
      await prisma.vehicle.updateMany({
        where: { userId: req.user.id },
        data: { isPrimary: false }
      });
    }

    // Check if VIN exists for this user (simple duplicate check)
    // Note: Prisma might throw error if unique constraint exists, but VIN isn't globally unique in all schemas
    // Best practice: check first
    const existing = await prisma.vehicle.findFirst({
        where: { userId: req.user.id, vin }
    });
    if (existing) {
        return res.status(400).json({ message: 'Vehicle with this VIN already exists in your garage' });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        userId: req.user.id,
        vin,
        make,
        model,
        year: parseInt(year),
        type: mapCarType(type),
        licensePlate,
        color,
        trim,
        mileage: mileage ? parseInt(mileage) : null,
        isPrimary: isPrimary === 'true' || isPrimary === true,
        imageUrl: imageUrl || undefined
      }
    });

    res.status(201).json(vehicle);
  } catch (error: any) {
    console.error('Add vehicle error:', error);
    res.status(500).json({ 
        message: `Add vehicle failed: ${error.message}`,
        details: error.meta || error.code
    });
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

    const imageUrl = getFileUrl(req);
    const updateData = { ...req.body };
    
    // Handle numeric conversions
    if (updateData.year) updateData.year = parseInt(updateData.year);
    if (updateData.mileage) updateData.mileage = parseInt(updateData.mileage);
    if (imageUrl) updateData.imageUrl = imageUrl;
    
    // Verify type mapping if type is being updated
    if (updateData.type) {
        updateData.type = mapCarType(updateData.type);
    }

    // Remove file field from body if it exists (multer handles it)
    delete updateData.image; 

    const updatedVehicle = await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: updateData
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
