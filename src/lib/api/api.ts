import { ApiError, ApiResponse } from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

// Extended API request with additional options
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
  params?: Record<string, any>
): Promise<T> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  // Construct URL with query parameters
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const queryString = new URLSearchParams(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== null)
    ).toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      // FIXED: Changed from 'include' to 'omit'
      credentials: 'omit',
    });

    // Handle non-JSON responses (like file downloads)
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    
    if (!response.ok) {
      let errorData: any;
      if (isJson) {
        errorData = await response.json();
      } else {
        errorData = { message: await response.text() };
      }
      
      // Handle 401 Unauthorized - token expired or invalid
      if (response.status === 401) {
        // Clear invalid token
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          // Optional: Redirect to login page
          // window.location.href = '/login';
        }
      }
      
      throw {
        status: response.status,
        message: errorData.message || 'An error occurred',
        errors: errorData.errors,
      } as ApiError;
    }

    // Handle empty responses
    if (response.status === 204) {
      return null as T;
    }

    // Handle file downloads
    if (contentType?.includes('application/octet-stream') || 
        contentType?.includes('text/csv')) {
      return await response.blob() as T;
    }

    // Handle JSON responses
    if (isJson) {
      const data = await response.json();
      return data as T;
    }

    return await response.text() as T;
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw {
        status: 503,
        message: 'Unable to connect to server. Please check your connection.',
      } as ApiError;
    }
    throw error;
  }
};

// Helper methods for common HTTP verbs
export const api = {
  get: <T>(endpoint: string, params?: Record<string, any>, p0?: { responseType: string; }) =>
    apiRequest<T>(endpoint, { method: 'GET' }, params),

  post: <T>(endpoint: string, data?: any, params?: Record<string, any>) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }, params),

  put: <T>(endpoint: string, data?: any, params?: Record<string, any>) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, params),

  patch: <T>(endpoint: string, data?: any, params?: Record<string, any>) =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, params),

  delete: <T>(endpoint: string, params?: Record<string, any>) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }, params),

  // For file uploads
  upload: <T>(endpoint: string, formData: FormData) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      headers: {}, // Let browser set Content-Type with boundary
      body: formData,
    }),
};

// ADD THIS: Token management helper functions
export const auth = {
  // Save token after login
  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  },
  
  // Get current token
  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  },
  
  // Remove token (logout)
  clearToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  },
  
  // Check if user is logged in
  isAuthenticated: (): boolean => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('token');
    }
    return false;
  }
};