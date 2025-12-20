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
