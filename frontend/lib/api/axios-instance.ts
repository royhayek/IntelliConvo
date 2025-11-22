import Axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

/**
 * Backend error response structure
 */
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    correlationId?: string;
    stack?: string;
  };
  timestamp: string;
}

/**
 * Extract error message from backend response
 */
function getErrorMessage(error: AxiosError<ApiErrorResponse>): string {
  // Try to get the structured error message from backend
  if (error.response?.data?.error?.message) {
    return error.response.data.error.message;
  }

  // Fallback to generic messages based on status
  if (error.response?.status) {
    switch (error.response.status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This resource already exists.';
      case 422:
        return 'Validation failed. Please check your input.';
      case 500:
        return 'An unexpected error occurred. Please try again later.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }

  // Network or other errors
  if (error.message) {
    return error.message;
  }

  return 'An unexpected error occurred.';
}

export const AXIOS_INSTANCE = Axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
AXIOS_INSTANCE.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses and errors globally
AXIOS_INSTANCE.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle 401 - Token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await Axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return AXIOS_INSTANCE(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear all auth data and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        // Clear persisted zustand auth state to prevent infinite loop
        localStorage.removeItem('auth-storage');
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }

    // Don't show toast for cancelled requests or 401 (which redirects)
    const isCancelled = Axios.isCancel(error) || error.message === 'canceled';
    if (!isCancelled && error.response?.status !== 401) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
    }

    return Promise.reject(error);
  }
);

// Custom instance for Orval
export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  const source = Axios.CancelToken.source();
  const promise = AXIOS_INSTANCE({
    ...config,
    ...options,
    cancelToken: source.token,
  }).then(({ data }) => data);

  // @ts-ignore
  promise.cancel = () => {
    source.cancel('Query was cancelled');
  };

  return promise;
};

export default customInstance;

export type ErrorType<Error> = AxiosError<Error>;

export type BodyType<BodyData> = BodyData;
