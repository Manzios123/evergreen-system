import { apiFetch } from '@/lib/utils/api';
import { Activity } from './types';

// Export the shared Activity type
export type { Activity };

export interface ActivitySubmission {
  volunteer_notes: string;
  number_of_participants: number;
  engagement_level: 'low' | 'medium' | 'high';
  actual_date: string;
}

// Get volunteer's activities with optional filters
export async function getVolunteerActivities(filters?: {
  status?: string;
  start_date?: string;
  end_date?: string;
}): Promise<{ data: Activity[] }> {
  const queryParams = new URLSearchParams();
  if (filters?.status) queryParams.append('status', filters.status);
  if (filters?.start_date) queryParams.append('start_date', filters.start_date);
  if (filters?.end_date) queryParams.append('end_date', filters.end_date);
  
  const queryString = queryParams.toString();
  const url = `/api/activities${queryString ? `?${queryString}` : ''}`;
  
  return apiFetch(url);
}

// Get single activity details
export async function getActivity(id: string): Promise<{ data: Activity }> {
  return apiFetch(`/api/activities/${id}`);
}

// Update activity (volunteer can update draft/pending activities)
export async function updateActivity(id: string, data: Partial<ActivitySubmission>): Promise<{ data: Activity }> {
  return apiFetch(`/api/activities/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Submit activity for approval
export async function submitActivityForApproval(id: string): Promise<{ data: Activity }> {
  return apiFetch(`/api/activities/${id}/submit`, {
    method: 'POST',
  });
}

// Get activity photos
export async function getActivityPhotos(activityId: string): Promise<any[]> {
  return apiFetch(`/api/activities/${activityId}/photos`);
}

// Get upload URL for photo
export async function getPhotoUploadUrl(activityId: string): Promise<{ uploadUrl: string; fileUrl: string }> {
  return apiFetch(`/api/activities/${activityId}/photos/upload-url`);
}

// Register uploaded photo
export async function registerPhoto(activityId: string, fileName: string, caption?: string): Promise<any> {
  return apiFetch(`/api/activities/${activityId}/photos`, {
    method: 'POST',
    body: JSON.stringify({ fileName, caption }),
  });
}

// Delete photo
export async function deletePhoto(photoId: string): Promise<void> {
  return apiFetch(`/api/photos/${photoId}`, {
    method: 'DELETE',
  });
}

// Get volunteer dashboard stats
export async function getVolunteerDashboard(): Promise<{
  total_activities: number;
  pending_approval: number;
  approved: number;
  draft: number;
  recent_activities: Activity[];
  upcoming_activity: Activity | null;
}> {
  return apiFetch('/api/dashboard/volunteer');
}

// Get survey templates for activity
export async function getActivitySurveyTemplates(activityId: string): Promise<any[]> {
  return apiFetch(`/api/survey-templates?pilot_id=${activityId}&survey_period=post_activity`);
}

// Submit activity survey
export async function submitActivitySurvey(activityId: string, data: any): Promise<any> {
  return apiFetch(`/api/survey-responses/activity/${activityId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Get volunteer's submitted surveys
export async function getVolunteerSurveys(): Promise<any[]> {
  return apiFetch('/api/survey-responses/volunteer');
}