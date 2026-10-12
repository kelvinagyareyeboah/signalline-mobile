export interface Coordinates {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface UserLocationUpdate {
  userId: string;
  name: string;
  handle: string;
  coords: Coordinates;
  isSharing: boolean;
}

export interface ServerChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  text: string;
  timestamp: number;
  status: 'sent' | 'delivered' | 'read';
  locationAttachment?: {
    latitude: number;
    longitude: number;
    label?: string;
  };
}

export interface MessageAck {
  clientMessageId: string;
  serverMessageId: string;
  timestamp: number;
  status: 'sent';
}

export interface DeliveryReceipt {
  messageId: string;
  conversationId: string;
  recipientId: string;
  status: 'delivered' | 'read';
  timestamp: number;
}
