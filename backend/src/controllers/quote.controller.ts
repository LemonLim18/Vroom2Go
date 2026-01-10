import { Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient() as any;

/**
 * @desc    Create a quote request
 * @route   POST /api/quotes/requests
 * @access  Private (Driver)
 */
export const createQuoteRequest = async (req: any, res: Response) => {
  try {
    const { vehicleId, description, symptoms, photos, broadcast, radius, targetShopIds } = req.body;

    // Verify vehicle ownership
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: parseInt(vehicleId) }
    });

    if (!vehicle || vehicle.userId !== req.user.id) {
      return res.status(403).json({ message: 'Invalid vehicle' });
    }

    const request = await prisma.quoteRequest.create({
      data: {
        userId: req.user.id,
        vehicleId: parseInt(vehicleId),
        description,
        symptoms: symptoms || [],
        photos: photos || [],
        broadcast: broadcast !== false,
        radius: parseInt(radius) || 10,
        targetShopIds: targetShopIds || [],
        status: 'OPEN'
      }
    });

    res.status(201).json(request);
  } catch (error: any) {
    console.error('Create quote request error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get driver's quote requests
 * @route   GET /api/quotes/requests/driver
 * @access  Private (Driver)
 */
export const getDriverRequests = async (req: any, res: Response) => {
  try {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    const userId = parseInt(req.user.id);
    if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }

    const requests = await prisma.quoteRequest.findMany({
      where: { userId: userId },
      include: {
        vehicle: true,
        quotes: {
          include: {
            shop: {
              select: { name: true, imageUrl: true, rating: true, verified: true }
            }
          }
        }
      },
      orderBy: { id: 'desc' }
    });

    res.json(requests);
  } catch (error: any) {
    console.error('Get driver requests error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get requests available for a shop
 * @route   GET /api/quotes/requests/shop
 * @access  Private (Shop)
 */
export const getShopRequests = async (req: any, res: Response) => {
  try {
    // Get shop ID for current user
    const shop = await prisma.shop.findUnique({
      where: { userId: req.user.id }
    });

    if (!shop) {
      return res.status(400).json({ message: 'Shop profile not found' });
    }

    // Find requests that are:
    // 1. OPEN
    // 2. AND (Broadcast = true OR includes this shop ID in targetShopIds)
    // Note: JSON filtering in Prisma with array contains is tricky depending on DB.
    // For MVP/MySQL: We might fetch OPEN requests and filter in memory if JSON search is limited,
    // or use specific raw query. For now, we'll fetch OPEN requests and filter.
    
    // Fetch recent open requests
    const openRequests = await prisma.quoteRequest.findMany({
      where: { 
        status: 'OPEN',
      },
      include: {
        vehicle: true,
        user: { select: { name: true } }
      },
      orderBy: { id: 'desc' },
      take: 50 // Limit for safety
    });

    console.log(`[DEBUG] getShopRequests: Shop ${shop.id} checking ${openRequests.length} OPEN requests.`);
    openRequests.forEach((r: any) => console.log(`- Request ${r.id}: Broadcast=${r.broadcast}, Targets=${JSON.stringify(r.targetShopIds)}`));

    // Filter logic
    const visibleRequests = openRequests.filter((req: any) => {
        // If broadcast is true, it's visible (can add radius logic here later)
        if (req.broadcast) return true;
        
        // Check if shop ID is in target list
        if (Array.isArray(req.targetShopIds)) {
            // @ts-ignore
            return req.targetShopIds.includes(shop.id) || req.targetShopIds.includes(String(shop.id));
        }
        return false;
    });

    res.json(visibleRequests);
  } catch (error: any) {
    console.error('Get shop requests error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Submit a quote (respond to request)
 * @route   POST /api/quotes/requests/:id/respond
 * @access  Private (Shop)
 */
export const createQuote = async (req: any, res: Response) => {
  try {
    const { 
        description, 
        partsEstimate, 
        laborEstimate, 
        totalEstimate, 
        validUntil 
    } = req.body;
    
    const requestId = parseInt(req.params.id);

    const shop = await prisma.shop.findUnique({
      where: { userId: req.user.id }
    });

    if (!shop) {
      return res.status(403).json({ message: 'Only shops can submit quotes' });
    }

    const request = await prisma.quoteRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const quote = await prisma.quote.create({
      data: {
        userId: request.userId,
        shopId: shop.id,
        vehicleId: request.vehicleId,
        quoteRequestId: request.id,
        description,
        partsEstimate: partsEstimate ? parseFloat(partsEstimate) : 0,
        laborEstimate: laborEstimate ? parseFloat(laborEstimate) : 0,
        totalEstimate: parseFloat(totalEstimate),
        validUntil: validUntil ? new Date(validUntil) : null,
        status: 'QUOTED'
      }
    });

    res.status(201).json(quote);
  } catch (error: any) {
    console.error('Create quote error:', error);
    res.status(500).json({ message: error.message });
  }
};
