import { api } from './api';
import { 
  SurveyTemplate, 
  SurveyResponse, 
  ApiResponse,
  PaginationParams 
} from '@/lib/types';

// Survey Templates
export const surveysApi = {
  // Get all survey templates
  getTemplates: (params?: PaginationParams & { type?: string, isActive?: boolean }) =>
    api.get<ApiResponse<SurveyTemplate[]>>('/surveys/templates', params),

  // Get single template
  getTemplate: (id: string) =>
    api.get<ApiResponse<SurveyTemplate>>(`/surveys/templates/${id}`),

  // Create template
  createTemplate: (data: Omit<SurveyTemplate, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post<ApiResponse<SurveyTemplate>>('/surveys/templates', data),

  // Update template
  updateTemplate: (id: string, data: Partial<SurveyTemplate>) =>
    api.put<ApiResponse<SurveyTemplate>>(`/surveys/templates/${id}`, data),

  // Delete template
  deleteTemplate: (id: string) =>
    api.delete<ApiResponse<void>>(`/surveys/templates/${id}`),

  // Clone template
  cloneTemplate: (id: string, name: string) =>
    api.post<ApiResponse<SurveyTemplate>>(`/surveys/templates/${id}/clone`, { name }),

  // Set template active status
  setTemplateStatus: (id: string, isActive: boolean) =>
    api.patch<ApiResponse<SurveyTemplate>>(`/surveys/templates/${id}/status`, { isActive }),

  // Survey Responses
  getResponses: (params?: PaginationParams & {
    templateId?: string;
    activityId?: string;
    volunteerId?: string;
    studentId?: string;
    status?: string;
  }) =>
    api.get<ApiResponse<SurveyResponse[]>>('/surveys/responses', params),

  getResponse: (id: string) =>
    api.get<ApiResponse<SurveyResponse>>(`/surveys/responses/${id}`),

  // Submit response
  submitResponse: (data: {
    templateId: string;
    activityId?: string;
    volunteerId?: string;
    studentId?: string;
    responses: Record<string, any>;
  }) =>
    api.post<ApiResponse<SurveyResponse>>('/surveys/responses', data),

  // Update response (for drafts)
  updateResponse: (id: string, data: Partial<SurveyResponse>) =>
    api.put<ApiResponse<SurveyResponse>>(`/surveys/responses/${id}`, data),

  // Submit draft response
  submitDraftResponse: (id: string) =>
    api.post<ApiResponse<SurveyResponse>>(`/surveys/responses/${id}/submit`),

  // Review response (coordinator/admin)
  reviewResponse: (id: string, action: 'approve' | 'reject', notes?: string) =>
    api.post<ApiResponse<SurveyResponse>>(`/surveys/responses/${id}/review`, { action, notes }),

  // Get response statistics
  getResponseStats: (templateId: string, filters?: {
    activityId?: string;
    schoolId?: string;
    pilotId?: string;
    dateRange?: { start: string; end: string };
  }) =>
    api.get<ApiResponse<any>>(`/surveys/templates/${templateId}/stats`, filters),

  // Get volunteer completion status
  getVolunteerCompletion: (volunteerId: string) =>
    api.get<ApiResponse<{
      completed: SurveyResponse[];
      pending: Array<{ templateId: string; activityId?: string }>;
      completionRate: number;
    }>>(`/surveys/volunteers/${volunteerId}/completion`),
};