import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '@/stores/authStore';
import type { ApiError } from '@/types';

/** Base URL from Vite environment variables */
const BASE_URL = (import.meta as any).env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

/** Singleton axios instance */
export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// =========================================
// REQUEST INTERCEPTOR — Inject JWT
// =========================================

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.set('Authorization', `Bearer ${accessToken}`);
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// =========================================
// RESPONSE INTERCEPTOR — Handle 401 & Refresh
// =========================================

/** Track whether a token refresh is in flight */
let isRefreshing = false;
/** Queue of requests waiting for the new token */
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else if (token) resolve(token);
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle 401 — attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      const { refreshToken, setTokens, logout } = useAuthStore.getState();

      if (!refreshToken) {
        logout();
        return Promise.reject(normalizeError(error));
      }

      if (isRefreshing) {
        // Queue this request while refresh is in-flight
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              (originalRequest.headers as Record<string, string>)[
                'Authorization'
              ] = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post<{
          data: { access_token: string; refresh_token: string };
        }>(`${BASE_URL}/auth/refresh`, { refresh_token: refreshToken });

        const { access_token, refresh_token } = response.data.data;
        setTokens(access_token, refresh_token);
        processQueue(null, access_token);

        if (originalRequest.headers) {
          (originalRequest.headers as Record<string, string>)[
            'Authorization'
          ] = `Bearer ${access_token}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        logout();
        return Promise.reject(normalizeError(error));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(normalizeError(error));
  },
);

// =========================================
// ERROR NORMALIZER
// =========================================

/**
 * Converts an AxiosError into a consistent error object.
 * Preserves the backend's structured error payload when available.
 */
export function normalizeError(error: AxiosError<ApiError>): Error & {
  statusCode?: number;
  code?: string;
  details?: Record<string, string[]>;
} {
  const serverError = error.response?.data?.error;
  const normalized = new Error(
    serverError?.message ?? error.message ?? 'An unexpected error occurred',
  ) as Error & { statusCode?: number; code?: string; details?: Record<string, string[]> };

  normalized.statusCode = error.response?.status;
  normalized.code = serverError?.code ?? error.code;
  normalized.details = serverError?.details;

  return normalized;
}

export default apiClient;
