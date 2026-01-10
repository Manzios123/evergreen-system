// lib/api/activity-templates.ts
import { apiRequest } from './api';

export interface ActivityTemplateComponent {
  id: string;
  name: string;
  description?: string;
}

export interface ActivityTemplate {
  id: string;
  name: string;
  purpose?: string;
  duration_minutes?: number;
  materials_needed?: string;
  facilitator_notes?: string;
  pilot_id: string;
  created_at: string;
  components: ActivityTemplateComponent[];
}

export const activityTemplatesApi = {
  list: () => apiRequest<ActivityTemplate[]>('/api/activity-templates'),
  
  get: (id: string) => apiRequest<ActivityTemplate>(`/api/activity-templates/${id}`),
  
  getByPilot: (pilotId: string) => {
    // We'll filter on the frontend since the API doesn't have this endpoint
    return apiRequest<ActivityTemplate[]>('/api/activity-templates').then(response => 
      response.filter(template => template.pilot_id === pilotId)
    );
  },
};