// lib/api/activities.ts - UPDATED VERSION
import { apiRequest } from './api';
import { Activity, ActivityStatus } from '@/lib/types'; // ADDED: Import types

export interface ActivityFilters {
  status?: string;
  pilot_id?: string;
  school_id?: string;
  volunteer_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface CreateActivityData {
  title: string;
  description: string;
  scheduled_date: string;
  school_id: string;
  pilot_id: string;
  volunteer_id: string;
  activity_template_id?: string;
  number_of_participants?: number;
  volunteer_notes?: string;
  engagement_level?: 'low' | 'medium' | 'high'; // ADDED: for frontend form
  student_quotes?: string; // ADDED: for beautified form
}

export interface UpdateActivityData {
  title?: string;
  description?: string;
  scheduled_date?: string;
  actual_date?: string;
  status?: ActivityStatus;
  number_of_participants?: number;
  engagement_level?: 'low' | 'medium' | 'high' | number | string; // UPDATED: unified type
  volunteer_notes?: string;
  student_quotes?: string;
  coordinator_feedback?: string;
  assignment_notes?: string;
}

export const activitiesApi = {
  // List activities with filters
  list: (filters?: ActivityFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value.toString());
        }
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<{ 
      success: boolean; 
      data: Activity[]; 
      count: number;
      message: string;
    }>(`/activities${query}`);
  },

  // Get single activity
  get: (id: string) => apiRequest<{ 
    success: boolean; 
    data: Activity; 
    message: string;
  }>(`/activities/${id}`),

  // Create a new activity (volunteer creates their own activity)
  create: (data: CreateActivityData) => apiRequest<{ 
    success: boolean; 
    data: Activity; 
    message: string;
  }>('/activities', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Assign activity (coordinator/admin assigning to volunteer)
  assign: (data: {
    activity_template_id: string;
    school_id: string;
    volunteer_id: string;
    scheduled_date: string;
    description?: string;
    assignment_notes?: string;
  }) => apiRequest<{ 
    success: boolean; 
    data: Activity; 
    message: string;
  }>('/activities/assign', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Update activity
  update: (id: string, data: UpdateActivityData) => apiRequest<{ 
    success: boolean; 
    data: Activity; 
    message: string;
  }>(`/activities/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Delete activity (soft delete)
  delete: (id: string) => apiRequest<{ 
    success: boolean; 
    message: string;
  }>(`/activities/${id}`, { 
    method: 'DELETE' 
  }),

  // Submit for approval (volunteer)
  submit: (id: string) => apiRequest<{ 
    success: boolean; 
    data: Activity; 
    message: string;
  }>(`/activities/${id}/submit`, { 
    method: 'POST' 
  }),
};