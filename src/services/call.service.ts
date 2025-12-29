import api from './api';
import {
  StartCallRequest,
  StartCallResponse,
  EndCallRequest,
  EndCallResponse,
  ActiveCallResponse,
  IncomingCallResponse,
  AnswerCallRequest,
  AnswerCallResponse,
  RejectCallRequest,
  RejectCallResponse,
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

// Admin-initiated call endpoints
export const pollIncomingCall = async (): Promise<IncomingCallResponse> => {
  try {
    const response = await api.get<IncomingCallResponse>('/call/incoming');
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const answerIncomingCall = async (
  request: AnswerCallRequest
): Promise<AnswerCallResponse> => {
  try {
    const response = await api.post<AnswerCallResponse>('/call/answer', request);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const rejectIncomingCall = async (
  request: RejectCallRequest
): Promise<RejectCallResponse> => {
  try {
    const response = await api.post<RejectCallResponse>('/call/reject', request);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};
