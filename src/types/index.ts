export type OnlineStatus = 'online' | 'offline' | 'away';

export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'read';

export interface UserProfile {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  status: OnlineStatus;
  lastSeen?: string;
  sharingLocation: boolean;
  location?: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    timestamp: number;
  };
}

export interface Contact extends UserProfile {
  phone?: string;
  unreadCount?: number;
}

export interface LocationAttachment {
  latitude: number;
  longitude: number;
  label?: string;
  sharedUntil?: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: number;
  status: MessageStatus;
  locationAttachment?: LocationAttachment;
}

export interface Conversation {
  id: string;
  contactId: string;
  lastMessageText: string;
  lastMessageTime: number;
  unreadCount: number;
}

export type LocationDuration = 15 | 60 | 0; // 0 = Until turned off

export type LocationAccuracySetting = 'balanced' | 'high';

export interface LocationShareState {
  isSharing: boolean;
  durationMinutes: LocationDuration;
  expiresAt: number | null; // timestamp or null if indefinite
  accuracy: LocationAccuracySetting;
  myLocation: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp: number;
  } | null;
}

export interface NotificationSettings {
  newMessages: boolean;
  locationRequests: boolean;
  presenceUpdates: boolean;
  systemPermissionGranted: boolean;
}

export type SocketState = 'connected' | 'reconnecting' | 'disconnected';
