import { api } from './api';
import { ExportConfig, ExportJob, ApiResponse, PaginationParams } from '@/lib/types';

export const exportsApi = {
  // Immediate export endpoints (no job tracking)
  
  // Export activities with filters
  exportActivities: (
    filters?: {
      pilot_id?: string;
      start_date?: string;
      end_date?: string;
      status?: string;
    },
    format: 'json' | 'csv' = 'json'
  ) => {
    const params = {
      ...filters,
      format,
    };
    return api.get<any>(`/exports/activities`, params);
  },

  // Export surveys with filters
  exportSurveys: (
    filters?: {
      pilot_id?: string;
      type?: string;
      start_date?: string;
      end_date?: string;
    },
    format: 'json' | 'csv' = 'json'
  ) => {
    const params = {
      ...filters,
      format,
    };
    return api.get<any>(`/exports/surveys`, params);
  },

  // Export users (admin only)
  exportUsers: (
    filters?: {
      role?: string;
    },
    format: 'json' | 'csv' = 'json'
  ) => {
    const params = {
      ...filters,
      format,
    };
    return api.get<any>(`/exports/users`, params);
  },

  // Export schools (coordinator/admin)
  exportSchools: (
    filters?: {
      pilot_id?: string;
    },
    format: 'json' | 'csv' = 'json'
  ) => {
    const params = {
      ...filters,
      format,
    };
    return api.get<any>(`/exports/schools`, params);
  },

  // Export pilots (admin only)
  exportPilots: (
    filters?: {
      status?: string;
    },
    format: 'json' | 'csv' = 'json'
  ) => {
    const params = {
      ...filters,
      format,
    };
    return api.get<any>(`/exports/pilots`, params);
  },

  // Export activity templates
  exportActivityTemplates: (
    filters?: {
      category?: string;
    },
    format: 'json' | 'csv' = 'json'
  ) => {
    const params = {
      ...filters,
      format,
    };
    return api.get<any>(`/exports/activity-templates`, params);
  },

  // Export all data (admin only)
  exportAll: (
    filters?: {
      pilot_id?: string;
      start_date?: string;
      end_date?: string;
    },
    format: 'json' | 'csv' = 'json'
  ) => {
    const params = {
      ...filters,
      format,
    };
    return api.get<any>(`/exports/all`, params);
  },
};