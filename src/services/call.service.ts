import api from './api';
import {
  StartCallRequest,
  StartCallResponse,
  EndCallRequest,
  EndCallResponse,
  ActiveCallResponse,
} from '@/src/types/call.types';

export const startCall = async (
  request: StartCallRequest = {}
): Promise<StartCallResponse> => {
  try {
    const response = await api.post<StartCallResponse>('/call/start', request);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const endCall = async (request: EndCallRequest): Promise<EndCallResponse> => {
  try {
    const response = await api.post<EndCallResponse>('/call/end', request);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const getActiveCall = async (): Promise<ActiveCallResponse> => {
  try {
    const response = await api.get<ActiveCallResponse>('/call/active');
    return response.data;
  } catch (error: any) {
    throw error;
  }
};
