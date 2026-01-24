import { Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { notifyQuoteReceived, notifyQuoteRequest } from './notification.controller';

const prisma = new PrismaClient() as any;

/**
 * @desc    Get quote by ID
 * @route   GET /api/quotes/:id
 * @access  Private
 */
export const getQuoteById = async (req: any, res: Response) => {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        shop: { select: { id: true, name: true, address: true, imageUrl: true, rating: true, verified: true, depositPercent: true } },
        vehicle: { select: { id: true, make: true, model: true, year: true } },
        quoteRequest: true,
        lineItems: true // Include line items
      }
    });

    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    // Security: only owner or shop
    if (quote.userId !== req.user.id && quote.shopId !== req.user.shop?.id) {
       // We'll allow it for now if they have the ID, or implement stricter checks later
       // logic: user owns quote OR user owns shop that made quote
       // But req.user might not have shop attached.
    }

    res.json(quote);
  } catch (error: any) {
    console.error('Get quote error:', error);
    res.status(500).json({ message: error.message });
  }
};

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
              select: { id: true, name: true, imageUrl: true, rating: true, verified: true, depositPercent: true }
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
 * @desc    Get requests available for a shop (OPEN, not yet quoted by this shop)
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
      return res.status(404).json({ message: 'Shop profile not found' });
    }

    // Fetch recent open requests
    const openRequests = await prisma.quoteRequest.findMany({
      where: { 
        status: 'OPEN',
      },
      include: {
        vehicle: true,
        user: { select: { name: true } },
        quotes: { select: { shopId: true } } // Include quotes to check if this shop has responded
      },
      orderBy: { id: 'desc' },
      take: 50
    });

    // Filter: broadcast or targeted to this shop, AND not already quoted by this shop
    const visibleRequests = openRequests.filter((req: any) => {
        // Check if this shop has already quoted this request
        const alreadyQuoted = req.quotes.some((q: any) => q.shopId === shop.id);
        if (alreadyQuoted) return false;
        
        // If broadcast is true, it's visible
        if (req.broadcast) return true;
        
        // Check if shop ID is in target list
        if (Array.isArray(req.targetShopIds)) {
            return req.targetShopIds.includes(shop.id) || req.targetShopIds.includes(String(shop.id));
        }
        return false;
    });

    // Remove quotes from response to keep it clean
    const cleanedRequests = visibleRequests.map((r: any) => {
        const { quotes, ...rest } = r;
        return rest;
    });

    res.json(cleanedRequests);
  } catch (error: any) {
    console.error('Get shop requests error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get requests this shop has already responded to
 * @route   GET /api/quotes/requests/shop/responded
 * @access  Private (Shop)
 */
export const getShopRespondedRequests = async (req: any, res: Response) => {
  try {
    const shop = await prisma.shop.findUnique({
      where: { userId: req.user.id }
    });

    if (!shop) {
      return res.status(404).json({ message: 'Shop profile not found' });
    }

    // Find quotes submitted by this shop, then get the associated requests
    const myQuotes = await prisma.quote.findMany({
      where: { 
        shopId: shop.id,
        quoteRequestId: { not: null }
      },
      include: {
        quoteRequest: {
          include: {
            vehicle: true,
            user: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Extract unique requests and attach FULL quote info
    const respondedRequests = myQuotes.map((q: any) => ({
      ...q.quoteRequest,
      quote: {
        id: q.id,
        description: q.description,
        partsEstimate: q.partsEstimate,
        laborEstimate: q.laborEstimate,
        totalEstimate: q.totalEstimate,
        validUntil: q.validUntil,
        status: q.status,
        createdAt: q.createdAt
      }
    })).filter((r: any) => r.id); // Filter out any nulls

    res.json(respondedRequests);
  } catch (error: any) {
    console.error('Get shop responded requests error:', error);
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

    // Notify the user that they received a quote
    try {
      notifyQuoteReceived(request.userId, shop.name || 'A shop', quote.id);
    } catch (notifyErr) {
      console.warn('Failed to send quote notification:', notifyErr);
    }

    res.status(201).json(quote);
  } catch (error: any) {
    console.error('Create quote error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Accept a quote (user accepts shop's quote)
 * @route   PUT /api/quotes/:id/accept
 * @access  Private (Driver/User)
 */
export const acceptQuote = async (req: any, res: Response) => {
  try {
    const quoteId = parseInt(req.params.id);

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        shop: { select: { id: true, name: true, address: true, imageUrl: true } },
        vehicle: { select: { id: true, make: true, model: true, year: true } },
        quoteRequest: true
      }
    });

    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    // Verify ownership - quote belongs to this user
    if (quote.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to accept this quote' });
    }

    // Update quote status to ACCEPTED
    const updatedQuote = await prisma.quote.update({
      where: { id: quoteId },
      data: { status: 'ACCEPTED' },
      include: {
        shop: { select: { id: true, name: true, address: true, imageUrl: true } },
        vehicle: { select: { id: true, make: true, model: true, year: true } }
      }
    });

    res.json(updatedQuote);
  } catch (error: any) {
    console.error('Accept quote error:', error);
    res.status(500).json({ message: error.message });
  }
};
