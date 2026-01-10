// lib/api/approvals.ts
import { apiRequest } from './api';

export const approvalsApi = {
  approve: (activityId: string, notes?: string) => 
    apiRequest(`/api/approvals/${activityId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),
  
  requestEdit: (activityId: string, editNotes: string) =>
    apiRequest(`/api/approvals/${activityId}/request-edit`, {
      method: 'POST',
      body: JSON.stringify({ editNotes }),
    }),
  
  reject: (activityId: string, rejectionReason: string) =>
    apiRequest(`/api/approvals/${activityId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectionReason }),
    }),
};