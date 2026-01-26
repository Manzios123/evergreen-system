import { ApiError } from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// Helper function to safely serialize query parameters
function buildQuery(params?: Record<string, any>): string {
  if (!params) return '';

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;

    if (Array.isArray(value)) {
      value.forEach(v => {
        if (v !== undefined && v !== null) {
          searchParams.append(key, String(v));
        }
      });
      return;
    }

    searchParams.append(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
  params?: Record<string, any>
): Promise<T> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const queryString = new URLSearchParams(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== null)
    ).toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const headers: HeadersInit = {};
  
  if (options.body && !(options.body instanceof FormData)) {
    if (typeof options.body === 'string') {
      headers['Content-Type'] = 'application/json';
    }
  } else if (options.body instanceof FormData) {
  } else {
    headers['Content-Type'] = 'application/json';
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
      credentials: 'omit',
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    
    if (!response.ok) {
      let errorData: any;
      if (isJson) {
        errorData = await response.json();
      } else {
        errorData = { message: await response.text() };
      }
      
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
      }
      
      throw {
        status: response.status,
        message: errorData.error || errorData.message || 'An error occurred',
        errors: errorData.errors,
      } as ApiError;
    }

    if (response.status === 204) {
      return null as T;
    }

    if (contentType?.includes('application/octet-stream') || 
        contentType?.includes('text/csv')) {
      return await response.blob() as T;
    }

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

export const api = {
  get: <T>(endpoint: string, options?: { params?: Record<string, any> }): Promise<T> => {
    const query = buildQuery(options?.params);
    return apiRequest<T>(`${endpoint}${query}`, { method: 'GET' });
  },

  post: <T>(endpoint: string, data?: any, params?: Record<string, any>) => {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return apiRequest<T>(endpoint, {
      method: 'POST',
      body,
    }, params);
  },

  put: <T>(endpoint: string, data?: any, params?: Record<string, any>) => {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return apiRequest<T>(endpoint, {
      method: 'PUT',
      body,
    }, params);
  },

  patch: <T>(endpoint: string, data?: any, params?: Record<string, any>) => {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return apiRequest<T>(endpoint, {
      method: 'PATCH',
      body,
    }, params);
  },

  delete: <T>(endpoint: string, params?: Record<string, any>) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }, params),

  upload: <T>(endpoint: string, formData: FormData, params?: Record<string, any>) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: formData,
    }, params),
};

export const auth = {
  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  },
  
  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  },
  
  clearToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  },
  
  isAuthenticated: (): boolean => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('token');
    }
    return false;
  }
};