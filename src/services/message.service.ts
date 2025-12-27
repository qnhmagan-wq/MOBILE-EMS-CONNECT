import api from './api';
import {
  Message,
  SendMessageRequest,
  SendMessageResponse,
  GetMessagesResponse,
  UnreadCountResponse,
  MarkAsReadResponse,
} from '@/src/types/message.types';

/**
 * Send a message (text and/or image)
 * POST /api/messages
 * Content-Type: multipart/form-data
 */
export const sendMessage = async (
  request: SendMessageRequest
): Promise<Message> => {
  try {
    const formData = new FormData();
    formData.append('incident_id', request.incident_id.toString());

    if (request.message) {
      formData.append('message', request.message);
    }

    if (request.image) {
      formData.append('image', {
        uri: request.image.uri,
        name: request.image.name,
        type: request.image.type,
      } as any);
    }

    const response = await api.post<SendMessageResponse>('/messages', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  } catch (error: any) {
    console.error('[Message Service] Send message error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get messages for an incident (paginated)
 * GET /api/messages?incident_id=X&page=Y
 */
export const getMessages = async (
  incidentId: number,
  page: number = 1
): Promise<GetMessagesResponse> => {
  try {
    const response = await api.get<GetMessagesResponse>('/messages', {
      params: {
        incident_id: incidentId,
        page,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('[Message Service] Get messages error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get unread message count for an incident
 * GET /api/messages/unread-count?incident_id=X
 */
export const getUnreadCount = async (
  incidentId?: number
): Promise<number> => {
  try {
    const response = await api.get<UnreadCountResponse>('/messages/unread-count', {
      params: incidentId ? { incident_id: incidentId } : {},
    });
    return response.data.unread_count;
  } catch (error: any) {
    console.error('[Message Service] Get unread count error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Mark a message as read
 * POST /api/messages/{id}/mark-read
 */
export const markAsRead = async (messageId: number): Promise<void> => {
  try {
    await api.post<MarkAsReadResponse>(`/messages/${messageId}/mark-read`);
  } catch (error: any) {
    console.error('[Message Service] Mark as read error:', error.response?.data || error.message);
    throw error;
  }
};
