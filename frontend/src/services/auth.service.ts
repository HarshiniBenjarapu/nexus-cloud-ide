import { apiClient, ApiSuccess } from '../lib/apiClient';
import { User } from '../types';

/** Module 1 — Authentication. */

export interface RegisterPayload {
  fullName: string;
  username: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

interface SessionData {
  token: string;
  user: User;
  defaultOrganization?: { id: string; name: string; slug: string };
}

export const registerUser = async (payload: RegisterPayload): Promise<SessionData> => {
  const { data } = await apiClient.post<ApiSuccess<SessionData>>('/auth/register', payload);
  return data.data;
};

export const loginUser = async (payload: LoginPayload): Promise<SessionData> => {
  const { data } = await apiClient.post<ApiSuccess<SessionData>>('/auth/login', payload);
  return data.data;
};

export const fetchCurrentUser = async (): Promise<User> => {
  const { data } = await apiClient.get<ApiSuccess<{ user: User }>>('/auth/me');
  return data.data.user;
};

export const logoutUser = async (): Promise<void> => {
  await apiClient.post('/auth/logout');
};

export const socialLogin = async (payload: {
  provider: 'github' | 'google';
  email: string;
  fullName?: string;
  avatar?: string;
}): Promise<SessionData> => {
  const { data } = await apiClient.post<ApiSuccess<SessionData>>('/auth/social', payload);
  return data.data;
};

export const verifyEmail = async (token: string): Promise<void> => {
  await apiClient.get(`/auth/verify-email?token=${token}`);
};

export const resetPassword = async (payload: { token: string; password: string }): Promise<void> => {
  await apiClient.post('/auth/reset-password', payload);
};
