// lib/api/survey-responses.ts
import { apiRequest } from './api';

export interface SurveyAnswer {
  question_id: string;
  answer: any;
}

export interface ActivitySurveyResponse {
  id: string;
  activity_id: string;
  survey_template_id: string;
  submitted_by: string;
  submitted_by_name?: string;
  total_students: number;
  created_at: string;
  responses: Record<string, any>;
}

export interface StudentSurveyResponse {
  id: string;
  pilot_id: string;
  pilot_name?: string;
  survey_template_id: string;
  submitted_by: string;
  submitted_by_name?: string;
  total_students: number;
  activity_id?: string;
  activity_title?: string;
  submitted_at: string;
  responses: Record<string, any>;
}

export interface VolunteerSurveyResponse {
  id: string;
  volunteer_id: string;
  volunteer_name?: string;
  pilot_id: string;
  pilot_name?: string;
  survey_template_id: string;
  submitted_at: string;
  responses: Record<string, any>;
}

export const surveyResponsesApi = {
  // Activity survey
  submitActivitySurvey: (activityId: string, data: {
    survey_template_id: string;
    total_students: number;
    responses: Record<string, any>;
  }) => apiRequest(`/api/survey-responses/activity/${activityId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  getActivitySurvey: (activityId: string) => 
    apiRequest<{ surveyResponse: ActivitySurveyResponse }>(`/api/survey-responses/activity/${activityId}`),
  
  // Student survey
  submitStudentSurvey: (data: {
    pilot_id: string;
    survey_template_id: string;
    responses: Record<string, any>;
    total_students: number;
    activity_id?: string;
  }) => apiRequest('/api/survey-responses/student', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  getStudentSurvey: (responseId: string) => 
    apiRequest<{ surveyResponse: StudentSurveyResponse }>(`/api/survey-responses/student/${responseId}`),
  
  // Volunteer survey
  submitVolunteerSurvey: (data: {
    pilot_id: string;
    survey_template_id: string;
    responses: Record<string, any>;
  }) => apiRequest('/api/survey-responses/volunteer', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  getVolunteerSurvey: (responseId: string) => 
    apiRequest<{ surveyResponse: VolunteerSurveyResponse }>(`/api/survey-responses/volunteer/${responseId}`),
};