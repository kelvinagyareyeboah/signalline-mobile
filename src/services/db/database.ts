import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage, Conversation } from '../../types';

let SQLite: any = null;
if (Platform.OS !== 'web') {
  try {
    SQLite = require('expo-sqlite');
  } catch (err) {
    console.warn('[DB] Native SQLite module unavailable, falling back to storage adapter', err);
  }
}

export interface OutboxItem {
  id: string;
  messageId: string;
  conversationId: string;
  payload: string; // JSON string of message
  retryCount: number;
  nextRetryAt: number;
  status: 'queued' | 'sending' | 'failed';
}

class DatabaseService {
  private db: any = null;
  private isInitialized = false;

  public async init(): Promise<void> {
    if (this.isInitialized) return;

    if (SQLite && Platform.OS !== 'web') {
      try {
        this.db = await SQLite.openDatabaseAsync('signalline.db');
        await this.db.execAsync(`
          PRAGMA journal_mode = WAL;
          PRAGMA foreign_keys = ON;

          CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY NOT NULL,
            contact_id TEXT NOT NULL,
            last_message_text TEXT NOT NULL,
            last_message_time INTEGER NOT NULL,
            unread_count INTEGER DEFAULT 0
          );

          CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY NOT NULL,
            conversation_id TEXT NOT NULL,
            sender_id TEXT NOT NULL,
            text TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            status TEXT NOT NULL,
            location_attachment TEXT,
            FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
          );

          CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, timestamp);

          CREATE TABLE IF NOT EXISTS outbox (
            id TEXT PRIMARY KEY NOT NULL,
            message_id TEXT NOT NULL,
            conversation_id TEXT NOT NULL,
            payload TEXT NOT NULL,
            retry_count INTEGER DEFAULT 0,
            next_retry_at INTEGER NOT NULL,
            status TEXT NOT NULL
          );
        `);
        console.log('[DB] Native SQLite database initialized with WAL mode.');
      } catch (e) {
        console.error('[DB] Failed to initialize native SQLite:', e);
      }
    } else {
      console.log('[DB] Web runtime detected: using persistent WebStorage adapter.');
    }

    this.isInitialized = true;
  }

  // ----------------- CONVERSATIONS -----------------

  public async getConversations(): Promise<Conversation[]> {
    await this.init();

    if (this.db) {
      const rows = await this.db.getAllAsync(
        'SELECT id, contact_id as contactId, last_message_text as lastMessageText, last_message_time as lastMessageTime, unread_count as unreadCount FROM conversations ORDER BY last_message_time DESC;'
      );
      return rows as Conversation[];
    }

    // Web Storage Fallback
    const stored = await AsyncStorage.getItem('db_conversations');
    return stored ? JSON.parse(stored) : [];
  }

  public async saveConversation(conv: Conversation): Promise<void> {
    await this.init();

    if (this.db) {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO conversations (id, contact_id, last_message_text, last_message_time, unread_count)
         VALUES (?, ?, ?, ?, ?);`,
        [conv.id, conv.contactId, conv.lastMessageText, conv.lastMessageTime, conv.unreadCount]
      );
      return;
    }

    const convs = await this.getConversations();
    const idx = convs.findIndex((c) => c.id === conv.id);
    if (idx >= 0) {
      convs[idx] = conv;
    } else {
      convs.unshift(conv);
    }
    await AsyncStorage.setItem('db_conversations', JSON.stringify(convs));
  }

  // ----------------- MESSAGES -----------------

  public async getMessages(conversationId: string): Promise<ChatMessage[]> {
    await this.init();

    if (this.db) {
      const rows = await this.db.getAllAsync(
        'SELECT id, conversation_id as conversationId, sender_id as senderId, text, timestamp, status, location_attachment as locationAttachment FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC;',
        [conversationId]
      );
      return rows.map((r: any) => ({
        ...r,
        locationAttachment: r.locationAttachment ? JSON.parse(r.locationAttachment) : undefined,
      })) as ChatMessage[];
    }

    const stored = await AsyncStorage.getItem(`db_msgs_${conversationId}`);
    return stored ? JSON.parse(stored) : [];
  }

  public async saveMessage(msg: ChatMessage): Promise<void> {
    await this.init();

    if (this.db) {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO messages (id, conversation_id, sender_id, text, timestamp, status, location_attachment)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [
          msg.id,
          msg.conversationId,
          msg.senderId,
          msg.text,
          msg.timestamp,
          msg.status,
          msg.locationAttachment ? JSON.stringify(msg.locationAttachment) : null,
        ]
      );
      return;
    }

    const msgs = await this.getMessages(msg.conversationId);
    const idx = msgs.findIndex((m) => m.id === msg.id);
    if (idx >= 0) {
      msgs[idx] = msg;
    } else {
      msgs.push(msg);
    }
    await AsyncStorage.setItem(`db_msgs_${msg.conversationId}`, JSON.stringify(msgs));
  }

  public async updateMessageStatus(messageId: string, status: ChatMessage['status']): Promise<void> {
    await this.init();

    if (this.db) {
      await this.db.runAsync('UPDATE messages SET status = ? WHERE id = ?;', [status, messageId]);
      return;
    }

    // For web fallback, we update across stored conversations
    const convs = await this.getConversations();
    for (const c of convs) {
      const msgs = await this.getMessages(c.id);
      const msg = msgs.find((m) => m.id === messageId);
      if (msg) {
        msg.status = status;
        await AsyncStorage.setItem(`db_msgs_${c.id}`, JSON.stringify(msgs));
        break;
      }
    }
  }

  // ----------------- OUTBOX -----------------

  public async getPendingOutbox(): Promise<OutboxItem[]> {
    await this.init();

    if (this.db) {
      const rows = await this.db.getAllAsync(
        'SELECT id, message_id as messageId, conversation_id as conversationId, payload, retry_count as retryCount, next_retry_at as nextRetryAt, status FROM outbox WHERE status != "failed" ORDER BY next_retry_at ASC;'
      );
      return rows as OutboxItem[];
    }

    const stored = await AsyncStorage.getItem('db_outbox');
    return stored ? JSON.parse(stored) : [];
  }

  public async enqueueOutbox(item: OutboxItem): Promise<void> {
    await this.init();

    if (this.db) {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO outbox (id, message_id, conversation_id, payload, retry_count, next_retry_at, status)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [item.id, item.messageId, item.conversationId, item.payload, item.retryCount, item.nextRetryAt, item.status]
      );
      return;
    }

    const items = await this.getPendingOutbox();
    const idx = items.findIndex((i) => i.messageId === item.messageId);
    if (idx >= 0) {
      items[idx] = item;
    } else {
      items.push(item);
    }
    await AsyncStorage.setItem('db_outbox', JSON.stringify(items));
  }

  public async removeOutbox(messageId: string): Promise<void> {
    await this.init();

    if (this.db) {
      await this.db.runAsync('DELETE FROM outbox WHERE message_id = ?;', [messageId]);
      return;
    }

    const items = await this.getPendingOutbox();
    const filtered = items.filter((i) => i.messageId !== messageId);
    await AsyncStorage.setItem('db_outbox', JSON.stringify(filtered));
  }

  public async updateOutboxRetry(messageId: string, retryCount: number, nextRetryAt: number): Promise<void> {
    await this.init();

    if (this.db) {
      await this.db.runAsync(
        'UPDATE outbox SET retry_count = ?, next_retry_at = ?, status = ? WHERE message_id = ?;',
        [retryCount, nextRetryAt, retryCount > 5 ? 'failed' : 'queued', messageId]
      );
      return;
    }

    const items = await this.getPendingOutbox();
    const item = items.find((i) => i.messageId === messageId);
    if (item) {
      item.retryCount = retryCount;
      item.nextRetryAt = nextRetryAt;
      item.status = retryCount > 5 ? 'failed' : 'queued';
      await AsyncStorage.setItem('db_outbox', JSON.stringify(items));
    }
  }

  // ----------------- SEEDING -----------------

  public async seedInitialDataIfEmpty(
    initialConversations: Conversation[],
    initialMessages: Record<string, ChatMessage[]>
  ): Promise<void> {
    const existing = await this.getConversations();
    if (existing.length > 0) return; // already seeded

    for (const conv of initialConversations) {
      await this.saveConversation(conv);
    }

    for (const [convId, msgs] of Object.entries(initialMessages)) {
      for (const msg of msgs) {
        await this.saveMessage(msg);
      }
    }

    console.log('[DB] Seeded initial conversations and messages into durable storage.');
  }
}

export const dbService = new DatabaseService();
