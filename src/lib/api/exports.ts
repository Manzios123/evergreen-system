import { api } from './api';
import { ExportConfig, ExportJob, ApiResponse, PaginationParams } from '@/lib/types';

// Helper function specifically for export downloads
const exportDownload = async <T>(
  endpoint: string,
  params?: Record<string, any>
): Promise<Blob | any> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Construct URL with query parameters
  let url = `${process.env.NEXT_PUBLIC_API_BASE_URL || ''}${endpoint}`;
  if (params) {
    const queryString = new URLSearchParams(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== null)
    ).toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'omit',
    });

    if (!response.ok) {
      let errorData: any;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        errorData = await response.json();
      } else {
        errorData = { message: await response.text() };
      }

      throw {
        status: response.status,
        message: errorData.error || errorData.message || 'An error occurred',
        errors: errorData.errors,
      };
    }

    // Always return as blob for exports
    return await response.blob();
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw {
        status: 503,
        message: 'Unable to connect to server. Please check your connection.',
      };
    }
    throw error;
  }
};

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
    // Use the specialized download function instead of api.get
    return exportDownload(`/exports/activities`, params);
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
    return exportDownload(`/exports/surveys`, params);
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
    return exportDownload(`/exports/users`, params);
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
    return exportDownload(`/exports/schools`, params);
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
    return exportDownload(`/exports/pilots`, params);
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
    return exportDownload(`/exports/activity-templates`, params);
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
    return exportDownload(`/exports/all`, params);
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

    return exportDownload(`/exports/activities`, params);
  },

  // Download export file - For compatibility with reports page
  downloadExport: (jobId: string) =>
    exportDownload(`/exports/jobs/${jobId}/download`),

  // Cancel export job - For compatibility (use regular api for JSON responses)
  cancelExport: (jobId: string) =>
    api.delete<ApiResponse<void>>(`/exports/jobs/${jobId}`),

  // List export jobs - For compatibility (use regular api for JSON responses)
  getExportJobs: (params?: PaginationParams & {
    type?: string;
    status?: string;
    userId?: string;
  }) =>
    api.get<ApiResponse<ExportJob[]>>('/exports/jobs', params),

  // Get export job status - For compatibility (use regular api for JSON responses)
  getExportStatus: (jobId: string) =>
    api.get<ApiResponse<ExportJob>>(`/exports/jobs/${jobId}`),
};
