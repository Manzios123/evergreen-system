import { api } from './api';

export interface AnalyticsFilters {
  pilot_id?: string;
  template_id?: string;
  question_type?: string;
  school_id?: string;
  facilitator_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface AnalyticsResponse<T> {
  success: boolean;
  data: T;
  warnings?: Array<{ section: string; message: string }>;
}

export interface AnalyticsOption {
  id: string;
  name: string;
}

export interface AnalyticsOverview {
  filters: {
    pilots: AnalyticsOption[];
    schools: AnalyticsOption[];
    templates: AnalyticsOption[];
    facilitators: AnalyticsOption[];
    questionTypes: AnalyticsOption[];
  };
  kpis: {
    totalTemplates: number;
    totalAssignments: number;
    totalSubmissions: number;
    completionRate: number;
    pendingSubmissions: number;
    activeSchools: number;
  };
  submissionTrend: Array<{
    date: string;
    submissions: number;
    movingAverage: number;
  }>;
  completionBySchool: Array<{
    school_id: string | null;
    school_name: string;
    completed: number;
    pending: number;
    notStarted: number;
    completionRate: number;
  }>;
}

export interface TemplateAnalyticsRow {
  template_id: string;
  template_name: string;
  pilot_id: string | null;
  pilot_name: string;
  survey_type: string;
  survey_period: string;
  assignments_count: number;
  completed_count: number;
  pending_count: number;
  submissions_count: number;
  question_count: number;
  completion_percentage: number;
  last_activity_at: string | null;
}

export interface QuestionAnalyticsRow {
  question_id: string;
  template_id: string;
  template_name: string;
  question_text: string;
  question_type: string;
  normalized_type: string;
  is_required: boolean;
  options: string[];
  answered_count: number;
  skipped_count: number;
  total_responses: number;
  most_selected_option: string | null;
  distribution: Array<{
    option: string;
    count: number;
    percentage: number;
  }>;
  numeric: {
    total: number;
    average: number | null;
    min: number | null;
    max: number | null;
  };
  recent_responses: Array<{
    value: string;
    submitted_at: string | null;
  }>;
  date_buckets: Array<{
    period: string;
    count: number;
  }>;
  location_data: string[];
}

export interface DataQualityAlert {
  id: string;
  label: string;
  severity: 'ok' | 'low' | 'medium' | 'high';
  count: number;
  description: string;
}

export const analyticsApi = {
  overview: (filters: AnalyticsFilters) =>
    api.get<AnalyticsResponse<AnalyticsOverview>>('/admin/analytics/overview', filters),

  templates: (filters: AnalyticsFilters) =>
    api.get<AnalyticsResponse<TemplateAnalyticsRow[]>>('/admin/analytics/templates', filters),

  templateDetail: (templateId: string, filters: AnalyticsFilters) =>
    api.get<AnalyticsResponse<TemplateAnalyticsRow[]>>(`/admin/analytics/templates/${templateId}`, filters),

  questions: (filters: AnalyticsFilters) =>
    api.get<AnalyticsResponse<QuestionAnalyticsRow[]>>('/admin/analytics/questions', filters),

  dataQuality: (filters: AnalyticsFilters) =>
    api.get<AnalyticsResponse<DataQualityAlert[]>>('/admin/analytics/data-quality', filters),
};
