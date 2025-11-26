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
    details?: {
      resource?: string;
      identifier?: string;
      [key: string]: any;
    };
  };
  timestamp: string;
}

/**
 * Check if error indicates a deleted/not found user
 * This happens when a user is deleted but their token is still valid
 */
function isDeletedUserError(error: AxiosError<ApiErrorResponse>): boolean {
  return (
    error.response?.status === 404 &&
    error.response?.data?.error?.code === 'NOT_FOUND' &&
    error.response?.data?.error?.details?.resource === 'User'
  );
}

/**
 * Check if error indicates a site was not found
 * This happens when a site is deleted or user tries to access a non-existent site
 */
function isSiteNotFoundError(error: AxiosError<ApiErrorResponse>): boolean {
  return (
    error.response?.status === 404 &&
    error.response?.data?.error?.code === 'NOT_FOUND' &&
    error.response?.data?.error?.details?.resource === 'Site'
  );
}

/**
 * Handle site not found by redirecting to dashboard
 */
function handleSiteNotFound(): void {
  toast.error('This site is no longer available.');

  // Redirect to dashboard after a brief delay
  setTimeout(() => {
    window.location.href = '/dashboard';
  }, 500);
}

/**
 * Clear all authentication data and redirect to login
 */
function signOutUser(message: string = 'Your session has expired. Please log in again.'): void {
  // Clear all auth data
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('auth-storage');

  // Show notification
  toast.error(message);

  // Redirect to login
  setTimeout(() => {
    window.location.href = '/auth/login';
  }, 500);
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

    // Handle deleted/not found user - check this FIRST before token refresh
    // This happens when a user is deleted but their token is still valid
    if (isDeletedUserError(error)) {
      signOutUser('Your account is no longer available. Please log in again.');
      return Promise.reject(error);
    }

    // Handle site not found - redirect to dashboard
    // This happens when a site is deleted or user tries to access non-existent site
    if (isSiteNotFoundError(error)) {
      handleSiteNotFound();
      return Promise.reject(error);
    }

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
        // Refresh failed, sign out user with appropriate message
        signOutUser('Your session has expired. Please log in again.');
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 - Forbidden access
    if (error.response?.status === 403) {
      window.location.href = '/forbidden';
      return Promise.reject(error);
    }

    // Don't show toast for cancelled requests, 401 (which redirects), 403 (which redirects), deleted user, or site not found (custom messages)
    const isCancelled = Axios.isCancel(error) || error.message === 'canceled';
    const shouldShowToast =
      !isCancelled &&
      error.response?.status !== 401 &&
      error.response?.status !== 403 &&
      !isDeletedUserError(error) &&
      !isSiteNotFoundError(error);

    if (shouldShowToast) {
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
