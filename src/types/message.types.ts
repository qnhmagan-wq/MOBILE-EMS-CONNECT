/**
 * Message Types for Incident Communication
 * Pattern: Following incident.types.ts
 */

/**
 * User role in message context
 */
export type MessageUserRole = 'responder' | 'community';

/**
 * Message sender information
 */
export interface MessageSender {
  id: number;
  name: string;
  role: string | null;
  user_role: string | null;
}

/**
 * Message model
 */
export interface Message {
  id: number;
  incident_id: number;
  sender_id: number;
  sender: MessageSender;
  message: string | null;
  image_url: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

/**
 * Send message request (multipart/form-data)
 */
export interface SendMessageRequest {
  incident_id: number;
  message?: string;
  image?: {
    uri: string;
    name: string;
    type: string;
  };
}

/**
 * Send message response
 */
export interface SendMessageResponse {
  message: string;
  data: Message;
}

/**
 * Get messages response (paginated)
 */
export interface GetMessagesResponse {
  messages: Message[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

/**
 * Unread count response
 */
export interface UnreadCountResponse {
  unread_count: number;
}

/**
 * Mark as read response
 */
export interface MarkAsReadResponse {
  message: string;
}
