import { Request, Response } from 'express';
import { PrismaClient, NotificationType } from '@prisma/client';
import { getIO } from '../socket';

const prisma = new PrismaClient();

/**
 * @desc    Get all notifications for current user
 * @route   GET /api/notifications
 * @access  Private
 */
export const getMyNotifications = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { unreadOnly } = req.query;

    const where: any = { userId };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to 50 most recent
    });

    // Also get unread count
    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false }
    });

    res.json({
      notifications: notifications.map(n => ({
        id: String(n.id),
        type: n.type.toLowerCase(),
        title: n.title,
        message: n.message,
        actionUrl: n.actionUrl,
        read: n.isRead,
        createdAt: n.createdAt.toISOString()
      })),
      unreadCount
    });
  } catch (error: any) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
export const markAsRead = async (req: any, res: Response) => {
  try {
    const notificationId = parseInt(req.params.id);
    const userId = req.user.id;

    // Verify ownership
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
export const markAllAsRead = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
export const deleteNotification = async (req: any, res: Response) => {
  try {
    const notificationId = parseInt(req.params.id);
    const userId = req.user.id;

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await prisma.notification.delete({
      where: { id: notificationId }
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ============ HELPER FUNCTIONS FOR OTHER CONTROLLERS ============

/**
 * Create a notification and emit via Socket.io
 * @param userId - Target user ID
 * @param type - NotificationType enum value
 * @param title - Notification title
 * @param message - Optional message body
 * @param actionUrl - Optional URL to navigate to
 */
export const createNotification = async (
  userId: number,
  type: NotificationType,
  title: string,
  message?: string,
  actionUrl?: string
) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        actionUrl
      }
    });

    // Emit real-time notification via Socket.io
    try {
      const io = getIO();
      io.to(`user_${userId}`).emit('new_notification', {
        id: String(notification.id),
        type: type.toLowerCase(),
        title,
        message,
        actionUrl,
        read: false,
        createdAt: notification.createdAt.toISOString()
      });
    } catch (socketError) {
      console.warn('Socket emit failed (user may not be connected):', socketError);
    }

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
};

// Pre-defined notification creators for common events
export const notifyQuoteReceived = (userId: number, shopName: string, quoteId: number) => {
  return createNotification(
    userId,
    NotificationType.QUOTE,
    'New Quote Received',
    `${shopName} has sent you a quote for your service request.`,
    `/quotes/${quoteId}`
  );
};

export const notifyBookingConfirmed = (userId: number, shopName: string, bookingId: number) => {
  return createNotification(
    userId,
    NotificationType.BOOKING,
    'Booking Confirmed',
    `Your appointment with ${shopName} has been confirmed.`,
    `/bookings/${bookingId}`
  );
};

export const notifyBookingStatusChange = (userId: number, status: string, bookingId: number) => {
  return createNotification(
    userId,
    NotificationType.BOOKING,
    'Booking Status Updated',
    `Your booking status has been updated to: ${status}`,
    `/bookings/${bookingId}`
  );
};

export const notifyNewMessage = (userId: number, senderName: string, conversationId: number) => {
  return createNotification(
    userId,
    NotificationType.MESSAGE,
    'New Message',
    `You have a new message from ${senderName}`,
    `/messages?conversation=${conversationId}`
  );
};

export const notifyNewReview = (shopUserId: number, rating: number) => {
  return createNotification(
    shopUserId,
    NotificationType.REVIEW,
    'New Review',
    `A customer has left you a ${rating}-star review.`,
    '/dashboard?tab=reviews'
  );
};

export const notifyPaymentReceived = (shopUserId: number, amount: number) => {
  return createNotification(
    shopUserId,
    NotificationType.PAYMENT,
    'Payment Received',
    `You received a payment of $${amount.toFixed(2)}`,
    '/dashboard?tab=analytics'
  );
};

export const notifyInvoiceReady = (userId: number, bookingId: number) => {
  return createNotification(
    userId,
    NotificationType.BOOKING,
    'Invoice Ready',
    'Your final invoice is ready for review.',
    `/invoice/${bookingId}`
  );
};

export const notifyQuoteRequest = (shopUserId: number, requestId: number) => {
  return createNotification(
    shopUserId,
    NotificationType.QUOTE,
    'New Quote Request',
    'A customer is requesting a quote for their vehicle.',
    `/dashboard?tab=quotes`
  );
};

export const notifyBookingCreated = (userId: number, customerName: string, bookingId: number, vehicleInfo: string) => {
  return createNotification(
    userId,
    NotificationType.BOOKING,
    'New Booking Request',
    `New booking from ${customerName} for ${vehicleInfo}`,
    `/dashboard?tab=bookings`
  );
};

export const notifyBookingCancelled = (userId: number, customerName: string, bookingId: number, isLate: boolean) => {
  return createNotification(
    userId,
    NotificationType.BOOKING,
    'Booking Cancelled',
    `${customerName} has cancelled booking #${bookingId}. ${isLate ? 'Late cancellation (Deposit kept).' : 'Deposit fully refunded.'}`,
    `/bookings/${bookingId}`
  );
};

export const notifyRescheduleAccepted = (shopUserId: number, customerName: string, newDate: string, newTime: string, bookingId: number) => {
  return createNotification(
    shopUserId,
    NotificationType.BOOKING,
    'Reschedule Confirmed',
    `${customerName} accepted your reschedule proposal. New time: ${newDate} @ ${newTime}`,
    `/dashboard?tab=calendar`
  );
};

export const notifyRescheduleRejected = (shopUserId: number, customerName: string, bookingId: number) => {
  return createNotification(
    shopUserId,
    NotificationType.BOOKING,
    'Reschedule Proposal Declined',
    `${customerName} declined your reschedule proposal. Please check the booking notes.`,
    `/bookings/${bookingId}`
  );
};
