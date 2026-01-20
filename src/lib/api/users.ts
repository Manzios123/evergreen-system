// lib/api/users.ts - FIXED VERSION
import { api } from './api';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  role: string;
  pilot_names?: string[];
  pilot_ids?: string[];
  school_names?: string[];
  school_ids?: string[];
}

export interface CreateUserData {
  email: string;
  full_name: string;
  password: string;
  role: 'admin' | 'coordinator' | 'volunteer';
  pilot_ids?: string[];
  school_ids?: string[];
}

export interface UpdateUserData {
  email?: string;
  full_name?: string;
  password?: string;
  current_password?: string;
  role?: string;
  pilot_ids?: string[];
  school_ids?: string[];
}

// Response wrapper type
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

// Normalize user response
function normalizeUserResponse<T>(response: any): ApiResponse<T> {
  if (!response) {
    return {
      success: false,
      data: null as unknown as T,
      message: 'No response received'
    };
  }
  
  if (typeof response === 'object' && 'success' in response) {
    return response as ApiResponse<T>;
  }
  
  // If response is a user object
  if (typeof response === 'object' && ('id' in response || 'user' in response)) {
    const userData = 'user' in response ? response.user : response;
    return {
      success: true,
      data: userData as T,
      message: 'Success'
    };
  }
  
  return {
    success: true,
    data: response as T,
    message: 'Success'
  };
}

export const usersApi = {
  getMe: () => api.get<ApiResponse<{ user: User }>>('/users/me')
    .then(response => normalizeUserResponse<{ user: User }>(response)),
  
  list: (filters?: { role?: string; pilot_id?: string; search?: string }) => {
    const params: Record<string, string> = {};
    if (filters) {
      if (filters.role) params.role = filters.role;
      if (filters.pilot_id) params.pilot_id = filters.pilot_id;
      if (filters.search) params.search = filters.search;
    }
    
    return api.get<ApiResponse<{ users: User[]; total: number }>>('/users', params)
      .then(response => normalizeUserResponse<{ users: User[]; total: number }>(response));
  },
  
  get: (id: string) => api.get<ApiResponse<{ user: User }>>(`/users/${id}`)
    .then(response => normalizeUserResponse<{ user: User }>(response)),
  
  create: (data: CreateUserData) => api.post<ApiResponse<User>>('/users', data)
    .then(response => {
      const normalized = normalizeUserResponse<User>(response);
      if (normalized.success && normalized.data) {
        return normalized.data;
      }
      throw new Error(normalized.message || 'Failed to create user');
    }),
  
  update: (id: string, data: UpdateUserData) => api.put<ApiResponse<User>>(`/users/${id}`, data)
    .then(response => normalizeUserResponse<User>(response)),
  
  delete: (id: string) => api.delete<ApiResponse<void>>(`/users/${id}`)
    .then(response => normalizeUserResponse<void>(response)),
  
  changePassword: (data: { current_password: string; new_password: string }) => 
    api.post<ApiResponse<void>>('/users/me/change-password', data)
      .then(response => normalizeUserResponse<void>(response)),
  
  changeEmail: (data: { new_email: string; password: string }) => 
    api.post<ApiResponse<void>>('/users/me/change-email', data)
      .then(response => normalizeUserResponse<void>(response)),
};