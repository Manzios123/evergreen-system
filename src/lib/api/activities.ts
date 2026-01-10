// lib/api/activities.ts
import { apiRequest } from './api';

export interface Activity {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'pending' | 'in_edit' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  scheduled_date: string;
  actual_date?: string;
  volunteer_id: string;
  volunteer_name?: string;
  school_id: string;
  school_name?: string;
  pilot_id: string;
  pilot_name?: string;
  activity_template_id?: string;
  activity_template_name?: string;
  number_of_participants?: number;
  engagement_level?: number;
  volunteer_notes?: string;
  coordinator_feedback?: string;
  assigned_by?: string;
  assigned_by_name?: string;
  assignment_notes?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

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
}

export interface UpdateActivityData {
  title?: string;
  description?: string;
  scheduled_date?: string;
  actual_date?: string;
  status?: Activity['status'];
  number_of_participants?: number;
  engagement_level?: number;
  volunteer_notes?: string;
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
    return apiRequest<{ data: Activity[]; count: number }>(`/api/activities${query}`);
  },

  // Get single activity
  get: (id: string) => apiRequest<{ data: Activity }>(`/api/activities/${id}`),

  // Create a new activity (volunteer creates their own activity)
  create: (data: CreateActivityData) => apiRequest<{ data: Activity }>('/api/activities', {
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
  }) => apiRequest<{ data: Activity }>('/api/activities/assign', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Update activity
  update: (id: string, data: UpdateActivityData) => apiRequest<{ data: Activity }>(`/api/activities/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Delete activity (soft delete)
  delete: (id: string) => apiRequest<{ success: boolean }>(`/api/activities/${id}`, { 
    method: 'DELETE' 
  }),

  // Submit for approval (volunteer)
  submit: (id: string) => apiRequest<{ data: Activity }>(`/api/activities/${id}/submit`, { 
    method: 'POST' 
  }),
};