// lib/api/users.ts
import { apiRequest } from './api';

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

export const usersApi = {
  getMe: () => apiRequest<{ user: User }>('/api/users/me'),
  
  list: (filters?: { role?: string; pilot_id?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value.toString());
        }
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<{ users: User[]; total: number }>(`/api/users${query}`);
  },
  
  get: (id: string) => apiRequest<{ user: User }>(`/api/users/${id}`),
  
  create: (data: CreateUserData) => apiRequest<User>('/api/users', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  update: (id: string, data: UpdateUserData) => apiRequest<User>(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  delete: (id: string) => apiRequest(`/api/users/${id}`, { method: 'DELETE' }),
  
  changePassword: (data: { current_password: string; new_password: string }) => 
    apiRequest('/api/users/me/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  changeEmail: (data: { new_email: string; password: string }) => 
    apiRequest('/api/users/me/change-email', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};