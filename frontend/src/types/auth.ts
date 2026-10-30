export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GoogleTokenRequest {
  idToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  name: string;
  profilePictureUrl?: string;
  emailVerified?: boolean;
}

export interface User {
  name: string;
  email: string;
  token: string;
  profilePictureUrl?: string;
  emailVerified?: boolean;
}

export interface ProfileResponse {
  name: string;
  email: string;
  emailVerified: boolean;
  profilePictureUrl: string | null;
}

export interface ProfileUpdateRequest {
  name: string;
}

export interface UploadPictureResponse {
  profilePictureUrl: string;
  message?: string;
}

export interface ApiErrorResponse {
  timestamp?: string;
  status?: number;
  message: string;
}
