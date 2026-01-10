import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * @desc    Create a review for a completed booking
 * @route   POST /api/reviews
 * @access  Private (Driver only)
 */
export const createReview = async (req: any, res: Response) => {
  try {
    const { bookingId, shopId, rating, comment, images } = req.body;
    const userId = req.user.id;

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    if (!shopId) {
      return res.status(400).json({ message: 'Shop ID is required' });
    }

    // If bookingId provided, verify the booking belongs to user and is completed
    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: parseInt(bookingId) }
      });

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      if (booking.userId !== userId) {
        return res.status(403).json({ message: 'Not authorized to review this booking' });
      }

      if (booking.status !== 'COMPLETED') {
        return res.status(400).json({ message: 'Can only review completed bookings' });
      }

      // Check if already reviewed
      const existingReview = await prisma.review.findFirst({
        where: { bookingId: parseInt(bookingId), userId }
      });

      if (existingReview) {
        return res.status(400).json({ message: 'You have already reviewed this booking' });
      }
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        userId,
        shopId: parseInt(shopId),
        bookingId: bookingId ? parseInt(bookingId) : null,
        rating: parseInt(rating),
        comment: comment || null,
        images: images || [],
        isVerified: !!bookingId // Verified if linked to a booking
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } }
      }
    });

    // Update shop's rating and review count
    const shopReviews = await prisma.review.findMany({
      where: { shopId: parseInt(shopId) },
      select: { rating: true }
    });

    const totalRating = shopReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalRating / shopReviews.length;

    await prisma.shop.update({
      where: { id: parseInt(shopId) },
      data: {
        rating: avgRating,
        reviewCount: shopReviews.length
      }
    });

    res.status(201).json(review);
  } catch (error: any) {
    console.error('Create review error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get all reviews for a shop
 * @route   GET /api/reviews/shop/:shopId
 * @access  Public
 */
export const getShopReviews = async (req: Request, res: Response) => {
  try {
    const shopId = parseInt(req.params.shopId);

    const reviews = await prisma.review.findMany({
      where: { shopId },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        booking: { 
          select: { 
            id: true, 
            scheduledDate: true,
            service: { select: { name: true } },
            vehicle: { select: { make: true, model: true, year: true } }
          } 
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate rating breakdown
    const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      ratingBreakdown[r.rating as keyof typeof ratingBreakdown]++;
    });

    res.json({
      reviews,
      stats: {
        total: reviews.length,
        breakdown: ratingBreakdown
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Shop owner responds to a review
 * @route   PUT /api/reviews/:id/respond
 * @access  Private (Shop owner only)
 */
export const respondToReview = async (req: any, res: Response) => {
  try {
    const reviewId = parseInt(req.params.id);
    const { response } = req.body;

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { shop: true }
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Verify shop ownership
    if (review.shop.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to respond to this review' });
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        shopResponse: response,
        shopRespondedAt: new Date()
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } }
      }
    });

    res.json(updatedReview);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Check if user has reviewed a booking
 * @route   GET /api/reviews/check/:bookingId
 * @access  Private
 */
export const checkBookingReview = async (req: any, res: Response) => {
  try {
    const bookingId = parseInt(req.params.bookingId);
    const userId = req.user.id;

    const review = await prisma.review.findFirst({
      where: { bookingId, userId }
    });

    res.json({ hasReviewed: !!review, review });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
