// Base API
export { api, apiRequest } from './api';

// Resource-specific APIs
export { activitiesApi } from './activities';
export { approvalsApi } from './approvals';
export { dashboardApi } from './dashboard';
export { exportsApi } from './exports';
export { photosApi } from './photos';
export { pilotsApi } from './pilots';
export { schoolsApi } from './schools';
export { surveysApi } from './surveys';
export { usersApi } from './users';

// Helper function to handle API errors in components
export const handleApiError = (error: any): string => {
  if (error?.status === 401) {
    // Clear token and redirect to login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/en/login';
    }
    return 'Your session has expired. Please log in again.';
  }
  
  if (error?.status === 403) {
    return 'You do not have permission to perform this action.';
  }
  
  if (error?.status === 404) {
    return 'The requested resource was not found.';
  }
  
  if (error?.status === 422) {
    return error.errors 
      ? Object.values(error.errors).flat().join(', ')
      : error.message || 'Validation failed.';
  }
  
  if (error?.status >= 500) {
    return 'Server error. Please try again later.';
  }
  
  return error?.message || 'An unexpected error occurred.';
};

// Helper for React Query configuration
export const queryConfig = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount: number, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
};