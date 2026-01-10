// lib/api/error-handler.ts
export class ApiError extends Error {
    constructor(
      message: string,
      public status?: number,
      public code?: string
    ) {
      super(message);
      this.name = 'ApiError';
    }
  }
  
  export function handleApiError(error: any): never {
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { status, data } = error.response;
      const message = data?.error || data?.message || `HTTP ${status}`;
      throw new ApiError(message, status);
    } else if (error.request) {
      // The request was made but no response was received
      throw new ApiError('No response received from server');
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new ApiError(error.message || 'An unknown error occurred');
    }
  }
  
  export function isUnauthorizedError(error: any): boolean {
    return error instanceof ApiError && error.status === 401;
  }
  
  export function isForbiddenError(error: any): boolean {
    return error instanceof ApiError && error.status === 403;
  }
  
  export function isNotFoundError(error: any): boolean {
    return error instanceof ApiError && error.status === 404;
  }
  
  export function getErrorMessage(error: any): string {
    if (error instanceof ApiError) {
      return error.message;
    }
    
    if (error.message) {
      return error.message;
    }
    
    return 'An unexpected error occurred';
  }