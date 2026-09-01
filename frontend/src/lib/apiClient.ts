import axios, { AxiosError } from 'axios';
import { getStoredToken, clearStoredToken } from '../utils/storage';

/**
 * Centralized Axios client for the Nexus API.
 *
 * Responsibilities:
 *  - attach the bearer token to every request
 *  - clear the session and hand control back to the app on a 401
 *  - normalize backend errors (SRS 8.6 envelope) into plain Error messages
 */

const rawApiUrl = (import.meta.env.VITE_API_URL || 'https://nexus-cloud-ide.onrender.com/api').trim().replace(/\/$/, '');
export const API_BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// ─── Unauthorized handler ────────────────────────────────────────────────────
// Registered by the app at startup. Kept as a callback rather than importing the
// Redux store here, which would create a circular import (store → slices →
// services → apiClient → store).
type UnauthorizedHandler = () => void;

let onUnauthorized: UnauthorizedHandler | null = null;

export const setUnauthorizedHandler = (handler: UnauthorizedHandler | null): void => {
  onUnauthorized = handler;
};

// ─── Request: attach bearer token ────────────────────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response: normalize errors, handle expired sessions ─────────────────────
interface ApiErrorBody {
  success: false;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const status = error.response?.status;
    const url = error.config?.url ?? '';

    // A 401 from login/register means "those credentials are wrong", not "your
    // session expired" — let the form surface it instead of logging out.
    const isCredentialAttempt =
      url.includes('/auth/login') || url.includes('/auth/register');

    if (status === 401 && !isCredentialAttempt) {
      clearStoredToken();
      onUnauthorized?.();
    }

    return Promise.reject(toApiError(error));
  }
);

/** Turn an Axios failure into an Error carrying the backend's user-facing message. */
const toApiError = (error: AxiosError<ApiErrorBody>): Error => {
  const data = error.response?.data;

  if (data?.message) {
    return new Error(data.message);
  }

  if (error.response?.status === 404) {
    const failedUrl = error.config?.url || 'unknown endpoint';
    return new Error(`Endpoint not found (404): [${error.config?.method?.toUpperCase() || 'GET'}] ${failedUrl}`);
  }

  if (error.code === 'ERR_NETWORK') {
    return new Error(
      'Unable to reach the Nexus API. Please check that the backend is running and CORS is allowed.'
    );
  }

  return new Error(error.message || 'An unexpected error occurred.');
};

/** Standard success envelope returned by every Nexus endpoint (SRS 8.6). */
export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

/**
 * Safely read a user-facing message off an unknown caught value.
 * The response interceptor already normalizes failures to Error, so this is
 * mostly a type-narrowing convenience for `catch (error: unknown)` blocks.
 */
export const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) return error.message;
  return 'An unexpected error occurred.';
};
