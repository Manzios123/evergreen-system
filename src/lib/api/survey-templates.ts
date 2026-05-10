// lib/api/survey-templates.ts
import { apiRequest } from './api';

export interface SurveyQuestion {
  id: string;
  component_id?: string;
  question_text: string;
  question_type: 'agree_disagree_unsure' | 'scale_1_5' | 'scale_1_10' | 'text' | 'number';
  order_index: number;
  is_required: boolean;
  created_at: string;
}

export interface SurveyTemplate {
  id: string;
  pilot_id: string;
  pilot_name?: string;
  name: string;
  survey_type: 'student' | 'volunteer' | 'activity_monitoring';
  survey_period: 'pre_activity' | 'post_activity' | 'mid_pilot' | 'end_pilot';
  version: number;
  change_reason?: string;
  created_by?: string;
  creator_name?: string;
  created_at: string;
  questions: SurveyQuestion[];
  question_count?: number;
}

export const surveyTemplatesApi = {
  list: (pilotId?: string, surveyType?: string) => {
    const params = new URLSearchParams();
    if (pilotId) params.append('pilot_id', pilotId);
    if (surveyType) params.append('type', surveyType);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<SurveyTemplate[]>(`/api/survey-templates${query}`);
  },
  
  get: (id: string) => apiRequest<SurveyTemplate>(`/api/survey-templates/${id}`),
  
  getForAnswer: (id: string) => apiRequest<SurveyTemplate>(`/api/survey-templates/answer/${id}`),
  
  getByType: (type: 'student' | 'volunteer' | 'activity_monitoring') => 
    apiRequest<SurveyTemplate[]>(`/api/survey-templates/type/${type}`),
  
  create: (data: {
    pilot_id: string;
    name: string;
    survey_type: 'student' | 'volunteer' | 'activity_monitoring';
    survey_period: 'pre_activity' | 'post_activity' | 'mid_pilot' | 'end_pilot';
    version?: number;
    change_reason?: string;
    questions?: Omit<SurveyQuestion, 'id' | 'created_at'>[];
  }) => apiRequest<SurveyTemplate>('/api/survey-templates', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};
