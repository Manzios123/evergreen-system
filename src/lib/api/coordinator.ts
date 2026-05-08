import { apiFetch } from '@/lib/utils/api';
import { Activity } from './types';

export interface CoordinatorActivity extends Activity {
  volunteer?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface PendingApproval {
  id: string;
  activity_id: string;
  action: 'submit' | 'approve' | 'request_edit' | 'reject';
  performed_by: string;
  performed_at: string;
  notes: string;
}

// Get coordinator dashboard data
export async function getCoordinatorDashboard(): Promise<{
  pending_approvals: number;
  total_volunteers: number;
  total_schools: number;
  total_activities: number;
  recent_activities: CoordinatorActivity[];
  pending_activities: CoordinatorActivity[];
}> {
  return apiFetch('/api/dashboard/coordinator');
}

// Get activities with coordinator filters
export async function getCoordinatorActivities(filters?: {
  status?: string;
  volunteer_id?: string;
  school_id?: string;
  start_date?: string;
  end_date?: string;
}): Promise<{ data: CoordinatorActivity[] }> {
  const queryParams = new URLSearchParams();
  if (filters?.status) queryParams.append('status', filters.status);
  if (filters?.volunteer_id) queryParams.append('volunteer_id', filters.volunteer_id);
  if (filters?.school_id) queryParams.append('school_id', filters.school_id);
  if (filters?.start_date) queryParams.append('start_date', filters.start_date);
  if (filters?.end_date) queryParams.append('end_date', filters.end_date);
  
  const queryString = queryParams.toString();
  const url = `/api/activities${queryString ? `?${queryString}` : ''}`;
  
  return apiFetch(url);
}

// Assign activity to a facilitator. The API payload still uses volunteer_id as the legacy field name.
export async function assignActivity(data: {
  activity_template_id: string;
  volunteer_id: string;
  school_id: string;
  scheduled_date: string;
  description?: string;
}): Promise<{ data: CoordinatorActivity }> {
  return apiFetch('/api/activities/assign', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Approve activity
export async function approveActivity(activityId: string, notes?: string): Promise<{ data: CoordinatorActivity }> {
  return apiFetch(`/api/approvals/${activityId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });
}

// Request edits for activity
export async function requestActivityEdits(activityId: string, editNotes: string): Promise<{ data: CoordinatorActivity }> {
  return apiFetch(`/api/approvals/${activityId}/request-edit`, {
    method: 'POST',
    body: JSON.stringify({ editNotes }),
  });
}

// Reject activity
export async function rejectActivity(activityId: string, rejectionReason: string): Promise<{ data: CoordinatorActivity }> {
  return apiFetch(`/api/approvals/${activityId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ rejectionReason }),
  });
}

// Get volunteers in coordinator's pilot
export async function getCoordinatorVolunteers(): Promise<any[]> {
  return apiFetch('/api/users?role=volunteer');
}

// Get schools in coordinator's pilot
export async function getCoordinatorSchools(): Promise<any[]> {
  return apiFetch('/api/schools');
}

// Submit student survey (aggregated)
export async function submitStudentSurvey(data: {
  pilot_id: string;
  survey_template_id: string;
  total_students: number;
  activity_id?: string;
  responses: Record<string, any>;
}): Promise<any> {
  return apiFetch('/api/survey-responses/student', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Get student survey templates
export async function getStudentSurveyTemplates(pilotId: string): Promise<any[]> {
  return apiFetch(`/api/survey-templates?pilot_id=${pilotId}&survey_period=mid_pilot`);
}

// Export data
export async function exportData(format: 'csv' | 'json', type: 'activities' | 'surveys', filters?: any): Promise<any> {
  const queryParams = new URLSearchParams();
  queryParams.append('format', format);
  queryParams.append('type', type);
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, String(value));
    });
  }
  
  return apiFetch(`/api/exports?${queryParams.toString()}`);
}
