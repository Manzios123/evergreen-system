import { api } from './api';
import { ApiResponse } from '@/lib/types';

export const reportsApi = {
  // Overview metrics
  getOverview: (params?: { dateRange?: string; pilotId?: string }) =>
    api.get<ApiResponse<any>>('/api/admin/reports/overview', params),

  // User statistics
  getUserStats: (params?: { dateRange?: string; pilotId?: string }) =>
    api.get<ApiResponse<any>>('/api/admin/reports/users-stats', params),

  // Activity statistics
  getActivityStats: (params?: { dateRange?: string; pilotId?: string }) =>
    api.get<ApiResponse<any>>('/api/admin/reports/activity-stats', params),

  // Survey statistics
  getSurveyStats: (params?: { dateRange?: string; pilotId?: string }) =>
    api.get<ApiResponse<any>>('/api/admin/reports/survey-stats', params),

  // Pilot performance stats
  getPilotStats: (params?: { dateRange?: string }) =>
    api.get<ApiResponse<any>>('/api/admin/reports/pilot-stats', params),
};