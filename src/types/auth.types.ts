export type UserRole = 'responder' | 'community';

export interface User {
  id: number;
  email: string;
  name: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  role: UserRole;
  // Responder-specific fields
  badge_number?: string;
  hospital_assigned?: string;
  // Community/medical fields
  blood_type?: string;
  allergies?: string;
  existing_conditions?: string;
  medications?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone_number: string;
  password: string;
  password_confirmation: string;
}

export interface VerificationCredentials {
  email: string;
  code: string;
}

export interface ResendVerificationCredentials {
  email: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  role: UserRole;
}

export interface SignupResponse {
  message: string;
  email: string;
  requires_verification: boolean;
}

export interface VerificationResponse {
  token: string;
  user: User;
  role: UserRole;
  message?: string;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  verifyEmail: (credentials: VerificationCredentials) => Promise<void>;
  resendVerificationCode: (credentials: ResendVerificationCredentials) => Promise<void>;
  logout: () => Promise<void>;
  restoreAuth: () => Promise<void>;
}
