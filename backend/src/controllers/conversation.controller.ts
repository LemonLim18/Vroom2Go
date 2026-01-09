import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getIO } from '../socket';

const prisma = new PrismaClient();

/**
 * @desc    Get or create conversation with a shop
 * @route   GET /api/conversations/:shopId
 */
export const getConversation = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const shopId = parseInt(req.params.shopId);

    // TODO: Separate logic if logged in user is the SHOP owner to view their conversations with users
    // For now assuming User -> Shop flow

    let conversation = await prisma.conversation.findUnique({
      where: {
        userId_shopId: {
          userId,
          shopId
        }
      },
      include: {
        messages: {
           orderBy: { createdAt: 'asc' }
        },
        shop: {
            select: { id: true, name: true, imageUrl: true }
        }
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId,
          shopId
        },
        include: {
          messages: true,
          shop: {
              select: { id: true, name: true, imageUrl: true }
          }
        }
      });
    }

    res.json(conversation);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Send a message
 * @route   POST /api/conversations/:shopId
 */
export const sendMessage = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const shopId = parseInt(req.params.shopId);
    const { text } = req.body;

    let conversation = await prisma.conversation.findUnique({
      where: {
        userId_shopId: {
          userId,
          shopId
        }
      }
    });

    if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
    }

    const newMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userId,
        message: text,
        isRead: false
      }
    });

    // Real-time broadcast
    // Room ID format: conversation_{id}
    const io = getIO();
    const roomId = `conversation_${conversation.id}`;
    
    io.to(roomId).emit('receive_message', {
        id: newMessage.id,
        sender: 'user', // or 'shop' depending on logic
        text: newMessage.message,
        time: newMessage.createdAt
    });

    res.json(newMessage);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
