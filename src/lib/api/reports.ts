import { api } from './api';
import { ApiResponse } from '@/lib/types';

export interface OverviewReportData {
  total_schools: number;
  total_volunteers: number;
  total_student_submissions: number;
  total_volunteer_submissions: number;
  submissions_last_7_days: number;
  activities_total: number;
  activities_by_status: Array<{ status: string; count: number }>;
  media_total: number;
  media_by_type: Array<{ media_type: string; count: number }>;
}

export interface SchoolSubmissionData {
  school_id: string;
  school_name: string;
  student_submissions: number;
  volunteer_submissions: number;
  total_students_sum: number;
}

export interface DailySubmissionsData {
  daily_student_submissions: Array<{ date: string; count: number }>;
  daily_volunteer_submissions: Array<{ date: string; count: number }>;
}

export interface AssignmentFlowData {
  assignment_status: Array<{ status: string; count: number }>;
  overdue_count: number;
}

export const reportsApi = {
  // Enhanced overview metrics with school and media data
  getOverview: (params?: { dateRange?: string; pilotId?: string }) =>
    api.get<ApiResponse<OverviewReportData>>('/admin/reports/overview', params),

  // Submissions per school
  getSchoolSubmissions: (params?: { dateRange?: string; pilotId?: string }) =>
    api.get<ApiResponse<SchoolSubmissionData[]>>('/admin/reports/school-submissions', params),

  // Time series daily submissions
  getDailySubmissions: (params?: { dateRange?: string; pilotId?: string }) =>
    api.get<ApiResponse<DailySubmissionsData>>('/admin/reports/daily-submissions', params),

  // Assignment flow statistics
  getAssignmentFlow: (params?: { pilotId?: string }) =>
    api.get<ApiResponse<AssignmentFlowData>>('/admin/reports/assignment-flow', params),

  // Legacy endpoints (keep for backward compatibility)
  getUserStats: (params?: { dateRange?: string; pilotId?: string }) =>
    api.get<ApiResponse<any>>('/admin/reports/users-stats', params),

  getActivityStats: (params?: { dateRange?: string; pilotId?: string }) =>
    api.get<ApiResponse<any>>('/admin/reports/activity-stats', params),

  getSurveyStats: (params?: { dateRange?: string; pilotId?: string }) =>
    api.get<ApiResponse<any>>('/admin/reports/survey-stats', params),
};