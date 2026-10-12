import { dbService, OutboxItem } from './db/database';
import { socketService } from './socketService';
import { ChatMessage } from '../types';

class OutboxService {
  private isProcessing = false;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private subscribers: Set<(pendingCount: number) => void> = new Set();

  public subscribe(cb: (pendingCount: number) => void): () => void {
    this.subscribers.add(cb);
    this.notifySubscribers();
    return () => this.subscribers.delete(cb);
  }

  private async notifySubscribers() {
    const items = await dbService.getPendingOutbox();
    this.subscribers.forEach((cb) => cb(items.length));
  }

  /**
   * Enqueue a new outgoing chat message into durable storage and start queue drain.
   */
  public async enqueue(
    message: ChatMessage,
    recipientId: string,
    onOptimisticRender: () => void
  ): Promise<void> {
    // 1. Optimistic UI callback
    onOptimisticRender();

    // 2. Persist message to SQLite
    await dbService.saveMessage(message);

    // 3. Persist outbox queue item
    const outboxItem: OutboxItem = {
      id: `outbox_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      messageId: message.id,
      conversationId: message.conversationId,
      payload: JSON.stringify({
        clientMessageId: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        recipientId,
        text: message.text,
        timestamp: message.timestamp,
        locationAttachment: message.locationAttachment,
      }),
      retryCount: 0,
      nextRetryAt: Date.now(),
      status: 'queued',
    };

    await dbService.enqueueOutbox(outboxItem);
    await this.notifySubscribers();

    // 4. Attempt immediate transmission
    this.drain();
  }

  /**
   * Drains the pending outbox queue with exponential backoff and jitter.
   */
  public async drain(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const items = await dbService.getPendingOutbox();
      const now = Date.now();

      for (const item of items) {
        if (item.nextRetryAt > now) {
          continue;
        }

        const isSocketReady = socketService.isConnected();
        if (!isSocketReady) {
          // Socket disconnected: wait and schedule retry
          this.scheduleNextDrain(3000);
          break;
        }

        try {
          const payload = JSON.parse(item.payload);

          // Emit over socket with server acknowledgment
          const ackReceived = await socketService.emitMessageWithAck(payload);

          if (ackReceived) {
            // Success! Remove from outbox and update message in DB
            await dbService.removeOutbox(item.messageId);
            await dbService.updateMessageStatus(item.messageId, 'sent');
            console.log(`[Outbox] Message ${item.messageId} acknowledged and sent.`);
          } else {
            throw new Error('Server acknowledgment timeout');
          }
        } catch (err) {
          const nextRetryCount = item.retryCount + 1;
          // Exponential backoff with jitter: 2^retryCount * 1000 + random jitter (max 30s)
          const backoffDelay = Math.min(1000 * Math.pow(2, nextRetryCount) + Math.random() * 500, 30000);
          const nextRetryAt = Date.now() + backoffDelay;

          console.warn(`[Outbox] Send failed for ${item.messageId}, scheduling retry #${nextRetryCount} in ${Math.round(backoffDelay)}ms`);
          await dbService.updateOutboxRetry(item.messageId, nextRetryCount, nextRetryAt);
        }
      }
    } finally {
      this.isProcessing = false;
      await this.notifySubscribers();
    }
  }

  public scheduleNextDrain(delayMs: number = 2000): void {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => {
      this.drain();
    }, delayMs);
  }
}

export const outboxService = new OutboxService();
