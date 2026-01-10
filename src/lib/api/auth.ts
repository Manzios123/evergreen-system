// lib/api/auth.ts
import { apiRequest } from './api';

export async function login(email: string, password: string) {
  const res = await apiRequest<{ token: string; user: any }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (res.token) {
    localStorage.setItem('token', res.token);
  }

  return res;
}

export function logout() {
  localStorage.removeItem('token');
}

export function isLoggedIn() {
  return !!localStorage.getItem('token');
}

export async function getCurrentUser() {
  return apiRequest<{ user: any }>('/api/users/me');
}

export async function changePassword(currentPassword: string, newPassword: string) {
  return apiRequest('/api/users/me/change-password', {
    method: 'POST',
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
}

export async function changeEmail(newEmail: string, password: string) {
  return apiRequest('/api/users/me/change-email', {
    method: 'POST',
    body: JSON.stringify({ new_email: newEmail, password }),
  });
}