import { io, Socket } from 'socket.io-client';
import { useChatStore } from '../stores/useChatStore';
import { useLocationStore } from '../stores/useLocationStore';
import { filterContactLocation } from './kalmanFilter';
import { ChatMessage, Contact } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private serverUrl: string = 'http://localhost:4000';
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private currentRtt: number = 0;
  private isSimulatedOffline: boolean = false;

  public initialize(serverUrl: string = 'http://localhost:4000') {
    this.serverUrl = serverUrl;
    if (this.socket) {
      this.socket.disconnect();
    }

    try {
      this.socket = io(this.serverUrl, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 5000,
      });

      this.socket.on('connect', () => {
        if (this.isSimulatedOffline) return;
        console.log(`[Socket] Connected to backend at ${this.serverUrl}`);
        useChatStore.getState().setSocketState('connected');

        // Register self presence
        this.socket?.emit('user:register', { userId: 'user_self' });

        // Trigger outbox queue drain upon connection restoration
        const { outboxService } = require('./outboxService');
        outboxService.drain();

        this.startLatencyMonitor();
      });

      this.socket.on('disconnect', (reason) => {
        console.log(`[Socket] Disconnected: ${reason}`);
        useChatStore.getState().setSocketState('disconnected');
        this.stopLatencyMonitor();
      });

      this.socket.on('connect_error', () => {
        useChatStore.getState().setSocketState('reconnecting');
      });

      // 1. Incoming Message Reception
      this.socket.on('message:receive', (message: ChatMessage) => {
        console.log(`[Socket] Received message from ${message.senderId}: ${message.text}`);
        useChatStore.getState().receiveMessage(message);

        // Send delivery receipt back to sender
        this.socket?.emit('message:receipt', {
          messageId: message.id,
          conversationId: message.conversationId,
          recipientId: 'user_self',
          status: 'delivered',
          timestamp: Date.now(),
        });
      });

      // 2. Receipt Updates (Delivered, Read)
      this.socket.on(
        'message:receipt_update',
        ({ conversationId, messageId, status }: { conversationId: string; messageId: string; status: 'delivered' | 'read' }) => {
          useChatStore.getState().updateMessageStatus(conversationId, messageId, status);
        }
      );

      // 3. Live Geospatial Telemetry Broadcast (Kalman Filtered)
      this.socket.on('location:broadcast', (update: any) => {
        if (update.userId === 'user_self') return; // ignore self echo

        // Pass raw coordinates through Kalman filter before rendering on map
        const smoothed = filterContactLocation(update.userId, {
          latitude: update.coords.latitude,
          longitude: update.coords.longitude,
          accuracy: update.coords.accuracy || 10,
          timestamp: update.coords.timestamp || Date.now(),
        });

        useLocationStore
          .getState()
          .updateContactLocation(update.userId, smoothed.latitude, smoothed.longitude);
      });

      // 4. Initial Location Snapshot for All Active Pins
      this.socket.on('location:snapshot', (activeLocations: any[]) => {
        activeLocations.forEach((item) => {
          if (item.userId !== 'user_self') {
            useLocationStore
              .getState()
              .updateContactLocation(item.userId, item.coords.latitude, item.coords.longitude);
          }
        });
      });

      // 5. Presence Updates
      this.socket.on('presence:update', ({ userId, status, lastSeen }: { userId: string; status: any; lastSeen?: string }) => {
        useChatStore.getState().updateContactPresence(userId, status, lastSeen);
      });

      // 6. Stop Location Broadcast
      this.socket.on('location:stop_broadcast', ({ userId }: { userId: string }) => {
        // mark contact as not sharing
        useLocationStore.getState().stopContactSharing(userId);
      });
    } catch (err) {
      console.warn('[Socket] Failed to connect to real-time server:', err);
      useChatStore.getState().setSocketState('disconnected');
    }
  }

  public isConnected(): boolean {
    if (this.isSimulatedOffline) return false;
    return !!this.socket && this.socket.connected;
  }

  public getLatency(): number {
    return this.currentRtt;
  }

  /**
   * Emits message with server acknowledgment callback
   */
  public emitMessageWithAck(payload: any): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.isConnected()) {
        return resolve(false);
      }

      const timer = setTimeout(() => {
        resolve(false);
      }, 4000);

      this.socket?.emit('message:send', payload, (ack: any) => {
        clearTimeout(timer);
        if (ack && ack.status === 'sent') {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }

  /**
   * Broadcast current user location update to server
   */
  public broadcastLocation(coords: { latitude: number; longitude: number; accuracy?: number; heading?: number; speed?: number }) {
    if (!this.isConnected()) return;

    this.socket?.emit('location:update', {
      userId: 'user_self',
      name: 'You',
      handle: '@you',
      coords: {
        ...coords,
        timestamp: Date.now(),
      },
      isSharing: true,
    });
  }

  /**
   * Notify server of stopped location sharing
   */
  public broadcastStopLocation() {
    if (!this.isConnected()) return;
    this.socket?.emit('location:stop', { userId: 'user_self' });
  }

  /**
   * Dev Diagnostics: Simulate offline mode / network chaos
   */
  public toggleSimulatedOffline(): boolean {
    this.isSimulatedOffline = !this.isSimulatedOffline;

    if (this.isSimulatedOffline) {
      if (this.socket) {
        this.socket.disconnect();
      }
      useChatStore.getState().setSocketState('disconnected');
    } else {
      if (this.socket) {
        this.socket.connect();
      }
      useChatStore.getState().setSocketState('reconnecting');
    }

    return this.isSimulatedOffline;
  }

  private startLatencyMonitor() {
    this.stopLatencyMonitor();
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        const start = Date.now();
        this.socket?.emit('ping:rtt', start, (clientTime: number) => {
          this.currentRtt = Date.now() - clientTime;
        });
      }
    }, 5000);
  }

  private stopLatencyMonitor() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    this.currentRtt = 0;
  }

  public disconnect() {
    this.stopLatencyMonitor();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
