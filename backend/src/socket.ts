import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

let io: Server;

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  io.use((socket: any, next) => {
    if (socket.handshake.query && socket.handshake.query.token) {
      jwt.verify(socket.handshake.query.token, process.env.JWT_SECRET as string, (err: any, decoded: any) => {
        if (err) return next(new Error('Authentication error'));
        socket.user = decoded;
        next();
      });
    } else {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket: any) => {
    console.log(`User connected: ${socket.user.id}`);
    const userId = socket.user.id;

    // Join user's personal room for notifications
    socket.join(`user_${userId}`);

    // Update user status to online
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { isOnline: true }
        });
        
        // Broadcast status change to everyone (or friends only in a stricter app)
        // ideally efficient approach: io.emit('user_status_change', { userId, isOnline: true });
        // But for scalability we might want to emit only to relevant conversations?
        // For now, global emit is easiest for "last seen" everywhere
        socket.broadcast.emit('user_status_change', { userId, isOnline: true });
    } catch (e) {
        console.error("Failed to update online status", e);
    }

    socket.on('join_room', (roomId: string) => {
      socket.join(roomId);
      console.log(`User ${userId} joined room ${roomId}`);
    });
    
    // Typing indicators
    socket.on('typing', (data: { conversationId: number, isTyping: boolean }) => {
        socket.to(`conversation_${data.conversationId}`).emit('typing', {
            userId,
            conversationId: data.conversationId,
            isTyping: data.isTyping
        });
    });

    socket.on('disconnect', async () => {
      console.log('Client disconnected:', userId);
      // Update user status to offline
      try {
          await prisma.user.update({
              where: { id: userId },
              data: { isOnline: false, lastActive: new Date() }
          });
          socket.broadcast.emit('user_status_change', { userId, isOnline: false, lastActive: new Date() });
      } catch (e) {
          console.error("Failed to update offline status", e);
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
