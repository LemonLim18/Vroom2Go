import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getIO } from '../socket';

const prisma = new PrismaClient();

/**
 * @desc    Get or create conversation with a user
 * @route   GET /api/conversations/user/:userId
 */
export const getOrCreateConversation = async (req: any, res: Response) => {
  try {
    const myId = req.user.id;
    const targetUserId = parseInt(req.params.userId);

    if (myId === targetUserId) {
        return res.status(400).json({ message: "Cannot message yourself" });
    }

    // Check if conversation exists (order generic)
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { user1Id: myId, user2Id: targetUserId },
          { user1Id: targetUserId, user2Id: myId }
        ]
      },
      include: {
        messages: {
           orderBy: { createdAt: 'asc' }
        },
        user1: {
            select: { id: true, name: true, avatarUrl: true, role: true }
        },
        user2: {
            select: { id: true, name: true, avatarUrl: true, role: true }
        },
        shop: { // If linked to a shop context
            select: { id: true, name: true, imageUrl: true, userId: true }
        }
      }
    });

    if (!conversation) {
        // Create new conversation
        // we enforce user1Id < user2Id convention or just create as is?
        // the generic unique constrain @@unique([user1Id, user2Id]) checks exact pair
        // if we defined it as we did in schema (generic), we rely on check above.
        // Prisma doesn't strictly enforce sorting in unique constraint, so we must be careful.
        // Actually, our schema has @@unique([user1Id, user2Id]), so exact match.
        // To genericize, we should probably sort IDs or just check both combinations as we did in `findFirst`.
        // To be safe and consistent with unique constraint, let's just create with myId as user1 or sorted.
        // BUT unique constraint [user1Id, user2Id] means (1, 2) is different from (2, 1) if we insert that way?
        // NO, typically handled by sorting before insert.
        
        const [u1, u2] = [myId, targetUserId].sort((a, b) => a - b);
        
        // Check if either user is a shop owner to link the shop
        const shop = await prisma.shop.findFirst({
            where: {
                OR: [{ userId: u1 }, { userId: u2 }]
            }
        });

        conversation = await prisma.conversation.create({
            data: {
                user1: { connect: { id: u1 } },
                user2: { connect: { id: u2 } },
                shop: shop ? { connect: { id: shop.id } } : undefined
            },
            include: {
                messages: true,
                user1: { select: { id: true, name: true, avatarUrl: true, role: true } },
                user2: { select: { id: true, name: true, avatarUrl: true, role: true } },
                shop: { select: { id: true, name: true, imageUrl: true, userId: true } }
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
 * @desc    List all conversations for the current user
 * @route   GET /api/conversations
 */
export const listConversations = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;

        const conversations = await prisma.conversation.findMany({
            where: {
                OR: [
                    { user1Id: userId },
                    { user2Id: userId }
                ]
            },
            include: {
                user1: {
                    select: { id: true, name: true, avatarUrl: true, role: true }
                },
                user2: {
                    select: { id: true, name: true, avatarUrl: true, role: true }
                },
                shop: {
                    select: { id: true, name: true, imageUrl: true, userId: true }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { lastMessageAt: 'desc' }
        });

        res.json(conversations);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get a specific conversation by ID
 * @route   GET /api/conversations/:id
 */
export const getConversationById = async (req: any, res: Response) => {
    try {
        const conversationId = parseInt(req.params.id);
        const userId = req.user.id;

        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' }
                },
                user1: { select: { id: true, name: true, avatarUrl: true, role: true } },
                user2: { select: { id: true, name: true, avatarUrl: true, role: true } },
                shop: { select: { id: true, name: true, imageUrl: true } },
                booking: { 
                    include: { 
                        vehicle: true, 
                        service: true 
                    } 
                }
            }
        });

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        // Verify access
        const isParticipant = (conversation.user1Id === userId || conversation.user2Id === userId);

        if (!isParticipant) {
             return res.status(403).json({ message: 'Not authorized to view this conversation' });
        }

        res.json(conversation);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Send a message to a conversation
 * @route   POST /api/conversations/:id/messages
 */
export const sendMessage = async (req: any, res: Response) => {
    try {
        const conversationId = parseInt(req.params.id);
        const { text, attachmentUrl } = req.body;
        const senderId = req.user.id;

        // Verify existence and access
        const conversation = await prisma.conversation.findUnique({
             where: { id: conversationId }
        });

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        if (conversation.user1Id !== senderId && conversation.user2Id !== senderId) {
             return res.status(403).json({ message: 'Not authorized' });
        }
        
        const newMessage = await prisma.message.create({
            data: {
                conversationId,
                senderId,
                message: text,
                attachmentUrl,
                isRead: false
            }
        });

        // Update conversation lastMessageAt
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { lastMessageAt: new Date() }
        });

        const io = getIO();
        const roomId = `conversation_${conversationId}`;
        
        io.to(roomId).emit('receive_message', {
            id: newMessage.id,
            conversationId: conversationId,
            senderId: senderId,
            text: newMessage.message,
            attachmentUrl: newMessage.attachmentUrl,
            time: newMessage.createdAt,
            isRead: false
        });

        res.json(newMessage);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// Deprecated or alias helper: Send to user ID directly (finds conversation first)
export const sendMessageToUser = async (req: any, res: Response) => {
     // Re-use logic...
     // Implementation depends on frontend usage. Ideally frontend gets conversation ID first.
     // But for "Message Shop" button, we might just have target User ID.
     
     try {
        const myId = req.user.id;
        const targetUserId = parseInt(req.params.userId);
        const { text, attachmentUrl } = req.body;

        if (myId === targetUserId) return res.status(400).json({message: "Cannot message self"});

         const [u1, u2] = [myId, targetUserId].sort((a, b) => a - b);
         
         // Upsert logic for conversation
         // findFirst based on users
         let conversation = await prisma.conversation.findFirst({
            where: {
                user1Id: u1,
                user2Id: u2
            }
         });

         if (!conversation) {
             const shop = await prisma.shop.findFirst({
                 where: { OR: [{ userId: u1 }, { userId: u2 }] }
             });

             conversation = await prisma.conversation.create({
                 data: { 
                     user1: { connect: { id: u1 } },
                     user2: { connect: { id: u2 } },
                     shop: shop ? { connect: { id: shop.id } } : undefined
                 }
             });
         }

          const newMessage = await prisma.message.create({
            data: {
                conversationId: conversation.id,
                senderId: myId,
                message: text,
                attachmentUrl,
                isRead: false
            }
        });

        await prisma.conversation.update({
             where: { id: conversation.id },
             data: { lastMessageAt: new Date() }
        });

        const io = getIO();
        const roomId = `conversation_${conversation.id}`;
        io.to(roomId).emit('receive_message', {
            id: newMessage.id,
            conversationId: conversation.id,
            senderId: myId,
            text: newMessage.message,
             attachmentUrl: newMessage.attachmentUrl,
            time: newMessage.createdAt
        });

        res.json(newMessage);

     } catch (error: any) {
         console.error(error);
         res.status(500).json({ message: error.message });
     }
}
