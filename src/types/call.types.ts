export interface Call {
  id: number;
  user_id: number;
  incident_id: number | null;
  channel_name: string;
  status: 'active' | 'ended';
  started_at: string;
  ended_at: string | null;
}

export interface StartCallRequest {
  incident_id?: number | null;
}

export interface StartCallResponse {
  call: Call;
  channel_name: string;
  agora_app_id: string;
}

export interface EndCallRequest {
  call_id: number;
}

export interface EndCallResponse {
  message: string;
  call: Call;
}

export interface ActiveCallResponse {
  call: Call | null;
}

export interface CallState {
  isInCall: boolean;
  isConnecting: boolean;
  isWaitingForAnswer: boolean;  // User joined channel, waiting for admin to answer
  isMuted: boolean;
  callDuration: number;
}

// Admin-initiated call types
export interface AdminCaller {
  id: number;
  name: string;
  email: string;
}

export interface IncomingCallIncident {
  id: number;
  type: string;
  status: string;
  latitude: number;
  longitude: number;
  address: string;
  description?: string;
}

export interface IncomingCall {
  id: number;
  incident_id: number;
  channel_name: string;
  admin_caller: AdminCaller;
  incident: IncomingCallIncident;
  started_at: string;
}

export interface IncomingCallResponse {
  has_incoming_call: boolean;
  call: IncomingCall | null;
  agora_app_id?: string;
}

export interface AnswerCallRequest {
  call_id: number;
}

export interface AnswerCallResponse {
  call: Call;
  channel_name: string;
  agora_app_id: string;
  message: string;
}

export interface RejectCallRequest {
  call_id: number;
}

export interface RejectCallResponse {
  message: string;
}

export type IncomingCallState = 'idle' | 'ringing' | 'answering' | 'connected' | 'ended';
