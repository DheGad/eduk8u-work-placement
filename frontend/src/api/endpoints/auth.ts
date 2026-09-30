import apiClient from '@/api/client';
import type { ApiResponse, User } from '@/types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

/**
 * Authenticate with email and password. Returns user and JWT tokens.
 */
export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await apiClient.post<ApiResponse<LoginResponse>>(
    '/auth/login',
    payload,
  );
  return data.data;
}

/**
 * Logout and invalidate the server-side session.
 */
export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post('/auth/logout', { refresh_token: refreshToken });
}

/**
 * Fetch the currently authenticated user's profile.
 */
export async function getMe(): Promise<User> {
  const { data } = await apiClient.get<ApiResponse<User>>('/auth/me');
  return data.data;
}

/**
 * Request a password reset email for the given address.
 */
export async function forgotPassword(email: string): Promise<{ message: string }> {
  const { data } = await apiClient.post<ApiResponse<{ message: string }>>(
    '/auth/forgot-password',
    { email },
  );
  return data.data;
}

/**
 * Reset the user's password using the token received by email.
 */
export async function resetPassword(payload: {
  token: string;
  password: string;
  password_confirmation: string;
}): Promise<{ message: string }> {
  const { data } = await apiClient.post<ApiResponse<{ message: string }>>(
    '/auth/reset-password',
    payload,
  );
  return data.data;
}

/**
 * Change password for the currently authenticated user.
 */
export async function changePassword(payload: {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}): Promise<void> {
  await apiClient.post('/auth/change-password', payload);
}
