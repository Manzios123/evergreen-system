import { api } from './api';
import { ExportConfig, ExportJob, ApiResponse, PaginationParams } from '@/lib/types';

export const exportsApi = {
  // Create export job
  createExport: (type: string, config: ExportConfig) =>
    api.post<ApiResponse<ExportJob>>(`/exports/${type}`, config),

  // Get export job status
  getExportStatus: (jobId: string) =>
    api.get<ApiResponse<ExportJob>>(`/exports/jobs/${jobId}`),

  // List export jobs
  getExportJobs: (params?: PaginationParams & {
    type?: string;
    status?: string;
    userId?: string;
  }) =>
    api.get<ApiResponse<ExportJob[]>>('/exports/jobs', params),

  // Download export
  downloadExport: (jobId: string) =>
    api.get<Blob>(`/exports/jobs/${jobId}/download`, undefined, {
      responseType: 'blob',
    }),

  // Cancel export job
  cancelExport: (jobId: string) =>
    api.delete<ApiResponse<void>>(`/exports/jobs/${jobId}`),

  // Predefined exports
  exportActivities: (filters?: Record<string, any>, format: 'json' | 'csv' | 'excel' = 'excel') =>
    api.post<ApiResponse<ExportJob>>('/exports/activities', { filters, format }),

  exportUsers: (filters?: Record<string, any>, format: 'json' | 'csv' | 'excel' = 'excel') =>
    api.post<ApiResponse<ExportJob>>('/exports/users', { filters, format }),

  exportSurveys: (templateId?: string, filters?: Record<string, any>, format: 'json' | 'csv' | 'excel' = 'excel') =>
    api.post<ApiResponse<ExportJob>>('/exports/surveys', { templateId, filters, format }),

  exportPhotos: (activityId?: string, filters?: Record<string, any>, format: 'json' | 'csv' = 'json') =>
    api.post<ApiResponse<ExportJob>>('/exports/photos', { activityId, filters, format }),

  exportReports: (reportType: 'monthly' | 'quarterly' | 'annual' | 'pilot', filters?: Record<string, any>) =>
    api.post<ApiResponse<ExportJob>>('/exports/reports', { reportType, filters, format: 'pdf' }),

  // Get available export types
  getExportTypes: () =>
    api.get<ApiResponse<Array<{
      type: string;
      name: string;
      description: string;
      formats: string[];
      availableFilters: string[];
    }>>>('/exports/types'),

  // Get export template (for CSV/Excel)
  getExportTemplate: (type: string) =>
    api.get<Blob>(`/exports/templates/${type}`, undefined, {
      responseType: 'blob',
    }),
};