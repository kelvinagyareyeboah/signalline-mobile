import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { SpatialGrid } from './spatialGrid';
import {
  ServerChatMessage,
  MessageAck,
  DeliveryReceipt,
  UserLocationUpdate,
} from './types';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

const spatialGrid = new SpatialGrid();
// Track socketId -> userId and userId -> Set of socketIds for multi-device support
const userSockets: Map<string, Set<string>> = new Map();
const socketToUser: Map<string, string> = new Map();

// REST Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    activeUsers: userSockets.size,
    spatialEntries: spatialGrid.getAllActiveLocations().length,
    timestamp: Date.now(),
  });
});

io.on('connection', (socket: Socket) => {
  console.log(`[Socket] New connection established: ${socket.id}`);

  // 1. User Handshake / Register Presence
  socket.on('user:register', ({ userId }: { userId: string }) => {
    socketToUser.set(socket.id, userId);
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(socket.id);

    // Join personal user room for direct routing
    socket.join(`user:${userId}`);
    console.log(`[Socket] User registered: ${userId} on socket ${socket.id}`);

    // Send currently active sharing contacts to new connection
    const activeLocations = spatialGrid.getAllActiveLocations();
    socket.emit('location:snapshot', activeLocations);

    // Broadcast presence update
    socket.broadcast.emit('presence:update', {
      userId,
      status: 'online',
      timestamp: Date.now(),
    });
  });

  // 2. Resilient Messaging: Outbox Ingestion & Server Ack
  socket.on(
    'message:send',
    (
      payload: {
        clientMessageId: string;
        conversationId: string;
        senderId: string;
        recipientId: string;
        text: string;
        timestamp: number;
        locationAttachment?: any;
      },
      callback?: (ack: MessageAck) => void
    ) => {
      const serverTimestamp = Date.now();
      const serverMessageId = `srv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const message: ServerChatMessage = {
        id: serverMessageId,
        conversationId: payload.conversationId,
        senderId: payload.senderId,
        recipientId: payload.recipientId,
        text: payload.text,
        timestamp: serverTimestamp,
        status: 'sent',
        locationAttachment: payload.locationAttachment,
      };

      console.log(`[Message] Routed message from ${payload.senderId} -> ${payload.recipientId}: "${payload.text.substring(0, 20)}..."`);

      // 1. Immediately acknowledge sender (Outbox sync completion)
      if (typeof callback === 'function') {
        callback({
          clientMessageId: payload.clientMessageId,
          serverMessageId,
          timestamp: serverTimestamp,
          status: 'sent',
        });
      }

      // 2. Deliver to recipient if online
      io.to(`user:${payload.recipientId}`).emit('message:receive', message);
    }
  );

  // 3. Message Delivery & Read Receipts
  socket.on('message:receipt', (receipt: DeliveryReceipt) => {
    console.log(`[Receipt] ${receipt.status} for msg ${receipt.messageId} by ${receipt.recipientId}`);
    // Relay receipt to all devices of the conversation
    socket.broadcast.emit('message:receipt_update', receipt);
  });

  // 4. Typing Indicators
  socket.on(
    'typing:state',
    (data: { conversationId: string; senderId: string; isTyping: boolean }) => {
      socket.broadcast.emit('typing:state_update', data);
    }
  );

  // 5. Geospatial Telemetry Ingestion & Spatial Broadcast
  socket.on('location:update', (update: UserLocationUpdate) => {
    spatialGrid.updateLocation(update);

    // Broadcast updated coordinates to all subscribed clients
    io.emit('location:broadcast', update);
  });

  // 6. Stop Location Sharing
  socket.on('location:stop', ({ userId }: { userId: string }) => {
    spatialGrid.removeUser(userId);
    io.emit('location:stop_broadcast', { userId, timestamp: Date.now() });
  });

  // 7. Ping / Latency Echo (Diagnostics)
  socket.on('ping:rtt', (timestamp: number, callback: (clientTime: number) => void) => {
    if (typeof callback === 'function') {
      callback(timestamp);
    }
  });

  // Disconnection
  socket.on('disconnect', () => {
    const userId = socketToUser.get(socket.id);
    if (userId) {
      const userSocketSet = userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(socket.id);
        if (userSocketSet.size === 0) {
          userSockets.delete(userId);
          spatialGrid.removeUser(userId);
          // Broadcast presence offline
          socket.broadcast.emit('presence:update', {
            userId,
            status: 'offline',
            lastSeen: 'Just now',
            timestamp: Date.now(),
          });
        }
      }
      socketToUser.delete(socket.id);
    }
    console.log(`[Socket] Disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 SignalLine Real-Time Server running on port ${PORT}`);
  console.log(`📡 WebSocket Gateway ready for connections`);
  console.log(`🗺️  Spatial Grid & Outbox Ingestion Engine active`);
  console.log(`=======================================================`);
});
