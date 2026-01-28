// lib/api/approvals.ts
import { apiRequest } from './api';

export const approvalsApi = {
  // Activity approvals
  approveActivity: (activityId: string, notes?: string) => 
    apiRequest(`/api/approvals/${activityId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),
  
  requestEditActivity: (activityId: string, editNotes: string) =>
    apiRequest(`/api/approvals/${activityId}/request-edit`, {
      method: 'POST',
      body: JSON.stringify({ editNotes }),
    }),
  
  rejectActivity: (activityId: string, rejectionReason: string) =>
    apiRequest(`/api/approvals/${activityId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectionReason }),
    }),

  // Media approvals (replaces photo approvals)
  getPendingMedia: (status = 'pending') =>
    apiRequest(`/api/approvals/media?status=${status}`, {
      method: 'GET',
    }),
  
  approveMedia: (mediaId: string) => 
    apiRequest(`/api/approvals/media/${mediaId}/approve`, {
      method: 'POST',
    }),
  
  rejectMedia: (mediaId: string, feedback: string) =>
    apiRequest(`/api/approvals/media/${mediaId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    }),

  // Pending counts
  getPendingCounts: () =>
    apiRequest(`/api/approvals/pending-counts`, {
      method: 'GET',
    }),
};