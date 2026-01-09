import app from './app';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

import { initSocket } from './socket';

// Load env vars
dotenv.config();

const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
export const io = initSocket(server);

// Connect to database and start server

// Connect to database and start server
async function startServer() {
  try {
    // Check DB connection
    await prisma.$connect();
    console.log('✅ Connected to MySQL database');

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`👉 http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    process.exit(1);
  }
}

startServer();
