import { create } from 'zustand';
import { Conversation, ChatMessage, Contact, SocketState } from '../types';
import { dbService } from '../services/db/database';
import { outboxService } from '../services/outboxService';
import { socketService } from '../services/socketService';

interface ChatState {
  conversations: Conversation[];
  contacts: Contact[];
  messages: Record<string, ChatMessage[]>; // conversationId -> messages
  socketState: SocketState;
  typingMap: Record<string, boolean>; // conversationId -> isTyping
  activeConversationId: string | null;
  pendingOutboxCount: number;
  isStorageInitialized: boolean;

  initStore: () => Promise<void>;
  setSocketState: (status: SocketState) => void;
  setActiveConversation: (id: string | null) => void;
  loadMessagesForConversation: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, text: string, locationAttachment?: ChatMessage['locationAttachment']) => void;
  receiveMessage: (message: ChatMessage) => void;
  updateMessageStatus: (conversationId: string, messageId: string, status: ChatMessage['status']) => void;
  updateContactPresence: (contactId: string, status: Contact['status'], lastSeen?: string) => void;
  setTyping: (conversationId: string, isTyping: boolean) => void;
  markConversationAsRead: (conversationId: string) => void;
  toggleSimulatedDisconnect: () => void;
}

const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'contact_sarah',
    name: 'Sarah Chen',
    handle: '@sarah.c',
    status: 'online',
    sharingLocation: true,
    lastSeen: 'Just now',
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      timestamp: Date.now(),
    },
  },
  {
    id: 'contact_marcus',
    name: 'Marcus Vance',
    handle: '@marcus.v',
    status: 'online',
    sharingLocation: true,
    lastSeen: '5m ago',
    location: {
      latitude: 37.7833,
      longitude: -122.4167,
      timestamp: Date.now(),
    },
  },
  {
    id: 'contact_elena',
    name: 'Elena Rostova',
    handle: '@elena.r',
    status: 'away',
    sharingLocation: true,
    lastSeen: '18m ago',
    location: {
      latitude: 37.769,
      longitude: -122.446,
      timestamp: Date.now(),
    },
  },
  {
    id: 'contact_david',
    name: 'David Miller',
    handle: '@david.m',
    status: 'offline',
    sharingLocation: false,
    lastSeen: '2h ago',
  },
];

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_sarah',
    contactId: 'contact_sarah',
    lastMessageText: "I've arrived at the coffee shop! Live location updated.",
    lastMessageTime: Date.now() - 1000 * 60 * 2,
    unreadCount: 1,
  },
  {
    id: 'conv_marcus',
    contactId: 'contact_marcus',
    lastMessageText: 'Are we still meeting at 3 PM for the project sync?',
    lastMessageTime: Date.now() - 1000 * 60 * 15,
    unreadCount: 0,
  },
  {
    id: 'conv_elena',
    contactId: 'contact_elena',
    lastMessageText: 'Shared my route with you. Let me know when you leave!',
    lastMessageTime: Date.now() - 1000 * 60 * 60 * 2,
    unreadCount: 0,
  },
  {
    id: 'conv_david',
    contactId: 'contact_david',
    lastMessageText: 'Thanks, catch you later!',
    lastMessageTime: Date.now() - 1000 * 60 * 60 * 24,
    unreadCount: 0,
  },
];

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  conv_sarah: [
    {
      id: 'm1',
      conversationId: 'conv_sarah',
      senderId: 'user_self',
      text: 'Hey Sarah! Are you on your way?',
      timestamp: Date.now() - 1000 * 60 * 10,
      status: 'read',
    },
    {
      id: 'm2',
      conversationId: 'conv_sarah',
      senderId: 'contact_sarah',
      text: 'Yes! Sharing my live location now so you can track my ETA.',
      timestamp: Date.now() - 1000 * 60 * 5,
      status: 'read',
      locationAttachment: {
        latitude: 37.7749,
        longitude: -122.4194,
        label: 'Blue Bottle Coffee',
      },
    },
    {
      id: 'm3',
      conversationId: 'conv_sarah',
      senderId: 'contact_sarah',
      text: "I've arrived at the coffee shop! Live location updated.",
      timestamp: Date.now() - 1000 * 60 * 2,
      status: 'read',
    },
  ],
  conv_marcus: [
    {
      id: 'm4',
      conversationId: 'conv_marcus',
      senderId: 'contact_marcus',
      text: 'Are we still meeting at 3 PM for the project sync?',
      timestamp: Date.now() - 1000 * 60 * 15,
      status: 'read',
    },
  ],
  conv_elena: [
    {
      id: 'm5',
      conversationId: 'conv_elena',
      senderId: 'contact_elena',
      text: 'Shared my route with you. Let me know when you leave!',
      timestamp: Date.now() - 1000 * 60 * 60 * 2,
      status: 'read',
    },
  ],
  conv_david: [
    {
      id: 'm6',
      conversationId: 'conv_david',
      senderId: 'contact_david',
      text: 'Thanks, catch you later!',
      timestamp: Date.now() - 1000 * 60 * 60 * 24,
      status: 'read',
    },
  ],
};

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: INITIAL_CONVERSATIONS,
  contacts: INITIAL_CONTACTS,
  messages: INITIAL_MESSAGES,
  socketState: 'connected',
  typingMap: {},
  activeConversationId: null,
  pendingOutboxCount: 0,
  isStorageInitialized: false,

  initStore: async () => {
    try {
      // 1. Initialize SQLite Database & seed defaults if empty
      await dbService.seedInitialDataIfEmpty(INITIAL_CONVERSATIONS, INITIAL_MESSAGES);

      // 2. Load persisted conversations
      const persistedConvs = await dbService.getConversations();
      if (persistedConvs && persistedConvs.length > 0) {
        set({ conversations: persistedConvs });
      }

      // 3. Preload all messages into memory
      const loadedMessages: Record<string, ChatMessage[]> = {};
      const convs = get().conversations;
      for (const conv of convs) {
        const msgs = await dbService.getMessages(conv.id);
        if (msgs && msgs.length > 0) {
          loadedMessages[conv.id] = msgs;
        }
      }

      if (Object.keys(loadedMessages).length > 0) {
        set({ messages: { ...INITIAL_MESSAGES, ...loadedMessages } });
      }

      // 4. Subscribe to Outbox Queue changes
      outboxService.subscribe((count) => {
        set({ pendingOutboxCount: count });
      });

      // 5. Connect Socket service to backend
      socketService.initialize('http://localhost:4000');

      set({ isStorageInitialized: true });
      console.log('[Store] SQLite store & outbox subscriber fully initialized.');
    } catch (err) {
      console.warn('[Store] Error during database initialization:', err);
    }
  },

  setSocketState: (status) => set({ socketState: status }),

  setActiveConversation: (id) => {
    set({ activeConversationId: id });
    if (id) {
      get().markConversationAsRead(id);
      get().loadMessagesForConversation(id);
    }
  },

  loadMessagesForConversation: async (conversationId: string) => {
    try {
      const persisted = await dbService.getMessages(conversationId);
      if (persisted && persisted.length > 0) {
        set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: persisted,
          },
        }));
      }
    } catch (e) {
      console.warn('[Store] Could not load messages from DB:', e);
    }
  },

  sendMessage: async (conversationId, text, locationAttachment) => {
    const newMessageId = `msg_${Date.now()}`;
    const newMsg: ChatMessage = {
      id: newMessageId,
      conversationId,
      senderId: 'user_self',
      text,
      timestamp: Date.now(),
      status: 'sent',
      locationAttachment,
    };

    const conv = get().conversations.find((c) => c.id === conversationId);
    const recipientId = conv ? conv.contactId : 'contact_sarah';

    // 1. Queue into Outbox with Optimistic UI callback
    await outboxService.enqueue(newMsg, recipientId, () => {
      set((state) => {
        const existingMsgs = state.messages[conversationId] || [];
        const updatedMsgs = [...existingMsgs, newMsg];

        const updatedConvs = state.conversations.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                lastMessageText: text || (locationAttachment ? '📍 Shared location' : ''),
                lastMessageTime: Date.now(),
              }
            : c
        );

        // Update DB conversation summary asynchronously
        const targetConv = updatedConvs.find((c) => c.id === conversationId);
        if (targetConv) {
          dbService.saveConversation(targetConv);
        }

        return {
          messages: { ...state.messages, [conversationId]: updatedMsgs },
          conversations: updatedConvs,
        };
      });
    });

    // 2. Fallback local echo response if server is disconnected
    if (!socketService.isConnected() && conv) {
      setTimeout(() => {
        get().setTyping(conversationId, true);
      }, 1500);

      setTimeout(() => {
        get().setTyping(conversationId, false);
        const replyMsg: ChatMessage = {
          id: `reply_${Date.now()}`,
          conversationId,
          senderId: conv.contactId,
          text: getRandomReply(text),
          timestamp: Date.now(),
          status: 'read',
        };
        get().receiveMessage(replyMsg);
      }, 3500);
    }
  },

  receiveMessage: async (message) => {
    const { conversationId, text } = message;
    const isActive = get().activeConversationId === conversationId;

    // Persist to SQLite
    await dbService.saveMessage(message);

    set((state) => {
      const existingMsgs = state.messages[conversationId] || [];
      // Deduplicate by ID
      if (existingMsgs.some((m) => m.id === message.id)) {
        return state;
      }
      const updatedMsgs = [...existingMsgs, message];

      const updatedConvs = state.conversations.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              lastMessageText: text,
              lastMessageTime: Date.now(),
              unreadCount: isActive ? 0 : (c.unreadCount || 0) + 1,
            }
          : c
      );

      const targetConv = updatedConvs.find((c) => c.id === conversationId);
      if (targetConv) {
        dbService.saveConversation(targetConv);
      }

      return {
        messages: { ...state.messages, [conversationId]: updatedMsgs },
        conversations: updatedConvs,
      };
    });
  },

  updateMessageStatus: async (conversationId, messageId, status) => {
    // Persist status change to SQLite
    await dbService.updateMessageStatus(messageId, status);

    set((state) => {
      const convMsgs = state.messages[conversationId];
      if (!convMsgs) return state;

      const updated = convMsgs.map((m) => (m.id === messageId ? { ...m, status } : m));

      return {
        messages: { ...state.messages, [conversationId]: updated },
      };
    });
  },

  updateContactPresence: (contactId, status, lastSeen) => {
    set((state) => ({
      contacts: state.contacts.map((c) =>
        c.id === contactId
          ? { ...c, status, lastSeen: lastSeen || c.lastSeen }
          : c
      ),
    }));
  },

  setTyping: (conversationId, isTyping) => {
    set((state) => ({
      typingMap: { ...state.typingMap, [conversationId]: isTyping },
    }));
  },

  markConversationAsRead: async (conversationId) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      ),
    }));

    const conv = get().conversations.find((c) => c.id === conversationId);
    if (conv) {
      await dbService.saveConversation({ ...conv, unreadCount: 0 });
    }
  },

  toggleSimulatedDisconnect: () => {
    const isOffline = socketService.toggleSimulatedOffline();
    if (isOffline) {
      set({ socketState: 'disconnected' });
    } else {
      set({ socketState: 'connected' });
      outboxService.drain();
    }
  },
}));

function getRandomReply(userText: string): string {
  const t = userText.toLowerCase();
  if (t.includes('location') || t.includes('where')) {
    return 'Got your location! Mine is updating in real time on the Live tab.';
  }
  if (t.includes('hi') || t.includes('hey') || t.includes('hello')) {
    return 'Hey there! Connected to SignalLine real-time feed.';
  }
  if (t.includes('meet') || t.includes('time')) {
    return 'Sounds good! See you soon. I will share my live route when I start driving.';
  }
  return 'Received on real-time channel! Everything looks super smooth.';
}
