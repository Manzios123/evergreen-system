import { api } from './api';

export interface AnalyticsFilters {
  pilot_id?: string;
  school_id?: string;
  status?: string;
  template_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface AnalyticsResponse<T> {
  success: boolean;
  data: T;
}

export interface AnalyticsOverview {
  totalActivities: number;
  submittedReports: number;
  activityStatuses: Array<{ status: string; count: number }>;
  surveyTemplates: number;
  surveyAssignments: number;
  surveyResponses: number;
  activeSchools: number;
  activePilots: number;
}

export interface ReportAnalytics {
  byStatus: Array<{ status: string; count: number }>;
  bySchool: Array<{ school_id: string | null; school_name: string; count: number }>;
  byPilot: Array<{ pilot_id: string | null; pilot_name: string; count: number }>;
  byFacilitator: Array<{ user_id: string | null; user_name: string; count: number }>;
  overTime: Array<{ date: string; count: number }>;
}

export interface SurveyAnalytics {
  assignmentStatus: Array<{ status: string; count: number }>;
  responsesByTemplate: Array<{ template_id: string; template_name: string; response_count: number }>;
  questionBreakdown: Array<{
    question_id: string;
    question_text: string;
    question_type: string;
    template_id: string;
    template_name: string;
    answer_value: string | null;
    count: number;
  }>;
}

export const analyticsApi = {
  overview: () =>
    api.get<AnalyticsResponse<AnalyticsOverview>>('/analytics/overview'),

  reports: (filters: AnalyticsFilters) =>
    api.get<AnalyticsResponse<ReportAnalytics>>('/analytics/reports', filters),

  surveys: (filters: AnalyticsFilters) =>
    api.get<AnalyticsResponse<SurveyAnalytics>>('/analytics/surveys', filters),
};
