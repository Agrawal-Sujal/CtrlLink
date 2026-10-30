import axios, { AxiosError } from 'axios';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  GoogleTokenRequest,
  ResetPasswordRequest,
  ProfileResponse,
  ProfileUpdateRequest,
  UploadPictureResponse,
  ApiErrorResponse,
} from '../types/auth';
import {
  ShortenRequest,
  ShortenResponse,
  UrlStatsResponse,
  PageResponse,
  UpdateMetadataRequest,
  ResolvePasswordResponse,
} from '../types/url';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ctrllink_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unified error formatting
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse | string>;
    if (axiosError.response?.data) {
      if (typeof axiosError.response.data === 'string') {
        return axiosError.response.data;
      }
      if (axiosError.response.data.message) {
        return axiosError.response.data.message;
      }
    }
    if (axiosError.message === 'Network Error') {
      return 'Unable to connect to CtrlLink server. Please ensure the backend is running.';
    }
    return axiosError.message || 'An unexpected error occurred.';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred.';
};

export const authApi = {
  register: async (payload: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/api/v1/auth/register', payload);
    return response.data;
  },

  login: async (payload: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/api/v1/auth/login', payload);
    return response.data;
  },

  googleLogin: async (payload: GoogleTokenRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/api/v1/auth/google', payload);
    return response.data;
  },

  forgotPassword: async (email: string): Promise<string> => {
    const response = await apiClient.post<string>('/api/v1/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (payload: ResetPasswordRequest): Promise<string> => {
    const response = await apiClient.post<string>('/api/v1/auth/reset-password', payload);
    return response.data;
  },

  resendVerification: async (email: string): Promise<void> => {
    await apiClient.post('/api/v1/auth/resend-verification', { email });
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/api/v1/auth/logout');
    } catch (e) {
      console.warn('Backend logout warning:', e);
    }
  },
};

export const profileApi = {
  getProfile: async (): Promise<ProfileResponse> => {
    const response = await apiClient.get<ProfileResponse>('/api/v1/profile/me');
    return response.data;
  },

  updateSettings: async (payload: ProfileUpdateRequest): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/api/v1/profile/settings', payload);
    return response.data;
  },

  uploadPicture: async (file: File): Promise<UploadPictureResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<UploadPictureResponse>('/api/v1/profile/picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export const urlApi = {
  shorten: async (payload: ShortenRequest): Promise<ShortenResponse> => {
    const response = await apiClient.post<ShortenResponse>('/api/v1/url/shorten', payload);
    return response.data;
  },

  getMyLinks: async (
    search?: string,
    page = 0,
    size = 100
  ): Promise<PageResponse<UrlStatsResponse>> => {
    const params: Record<string, string | number> = { page, size };
    if (search && search.trim()) {
      params.search = search.trim();
    }
    const response = await apiClient.get<PageResponse<UrlStatsResponse>>('/api/v1/url/my-links', {
      params,
    });
    return response.data;
  },

  getStats: async (
    shortId: string,
    range: 'all' | '7d' | '24h' = 'all'
  ): Promise<UrlStatsResponse> => {
    const response = await apiClient.get<UrlStatsResponse>(`/api/v1/url/stats/${shortId}`, {
      params: { range },
    });
    return response.data;
  },

  updateMetadata: async (shortId: string, payload: UpdateMetadataRequest): Promise<void> => {
    await apiClient.patch(`/api/v1/url/${shortId}/metadata`, payload);
  },

  updateTags: async (shortId: string, tags: string[]): Promise<void> => {
    await apiClient.patch(`/api/v1/url/${shortId}/tags`, { tags });
  },

  deleteUrl: async (shortId: string): Promise<void> => {
    await apiClient.delete(`/api/v1/url/${shortId}`);
  },

  bulkDelete: async (shortIds: string[]): Promise<void> => {
    await apiClient.post('/api/v1/url/bulk-delete', shortIds);
  },

  revealPassword: async (shortId: string): Promise<{ password: string }> => {
    const response = await apiClient.get<{ password: string }>(`/api/v1/url/${shortId}/reveal-password`);
    return response.data;
  },

  resolvePassword: async (
    shortId: string,
    password: string
  ): Promise<ResolvePasswordResponse> => {
    const response = await apiClient.post<ResolvePasswordResponse>(`/api/v1/url/resolve/${shortId}`, {
      password,
    });
    return response.data;
  },
};
