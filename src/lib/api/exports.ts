
import { api } from './api';
import { ExportConfig, ExportJob, ApiResponse, PaginationParams } from '@/lib/types';

export const exportsApi = {
  // Immediate export endpoints
  
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

  // Export reports - Keep for compatibility but implement with existing backend
  exportReports: (
    reportType: 'monthly' | 'quarterly' | 'annual' | 'pilot',
    filters?: Record<string, any>
  ) => {
    // Map report types to existing export endpoints
    const params: any = {
      format: 'csv', // Default to CSV for reports
      ...filters
    };
    
    // For pilot-specific reports, add pilot_id
    if (reportType === 'pilot' && filters?.pilotId) {
      params.pilot_id = filters.pilotId;
    }
    
    // For time-based reports, ensure date range is set
    if (['monthly', 'quarterly', 'annual'].includes(reportType)) {
      if (!params.start_date || !params.end_date) {
        // Calculate date range based on report type
        const now = new Date();
        let startDate = new Date();
        
        switch (reportType) {
          case 'monthly':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'quarterly':
            startDate.setMonth(now.getMonth() - 3);
            break;
          case 'annual':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        }
        
        params.start_date = startDate.toISOString().split('T')[0];
        params.end_date = now.toISOString().split('T')[0];
      }
    }
    
    return api.get<any>(`/exports/activities`, params);
  },

  // Download export file - For compatibility with reports page
  downloadExport: (jobId: string) =>
    api.get<Blob>(`/exports/jobs/${jobId}/download`, undefined, {
      responseType: 'blob',
    }),

  // Cancel export job - For compatibility
  cancelExport: (jobId: string) =>
    api.delete<ApiResponse<void>>(`/exports/jobs/${jobId}`),

  // List export jobs - For compatibility
  getExportJobs: (params?: PaginationParams & {
    type?: string;
    status?: string;
    userId?: string;
  }) =>
    api.get<ApiResponse<ExportJob[]>>('/exports/jobs', params),

  // Get export job status - For compatibility
  getExportStatus: (jobId: string) =>
    api.get<ApiResponse<ExportJob>>(`/exports/jobs/${jobId}`),
}