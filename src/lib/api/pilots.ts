import { api } from './api';
import { Pilot, PilotStats, ApiResponse, PaginationParams } from '@/lib/types';

export type PilotSummary = Pick<Pilot, 'id' | 'name' | 'status' | 'start_date' | 'end_date'>;
export interface AdminPilotContext {
  mode: 'current' | 'history';
  state: 'ready' | 'no_active' | 'selection_required';
  readOnly: true;
  pilot: PilotSummary | null;
  options: PilotSummary[];
  activePilotCount: number;
  allowedActions: { readOverview: boolean; mutate: false };
}
export interface PilotHistoryOverview {
  pilot: PilotSummary;
  mode: 'current' | 'history';
  readOnly: true;
  memberships: { people: number; activePeople: number; schools: number; archivedSchools: number };
  reports: { total: number; byStatus: { status: string; count: number }[] };
  templates: { activities: number; surveys: number };
  surveys: { assignments: number; completedAssignments: number; ownershipMismatches: number; studentResponses: number; volunteerResponses: number; activityResponses: number };
  registeredReportFiles: number;
}
export type PilotDataset = 'reports' | 'assignments' | 'surveys' | 'schools' | 'media';
export interface PilotRecord extends Record<string, unknown> {
  id: string;
  title: string | null;
  status: string;
  date: string | null;
  school_name: string | null;
  person_name: string | null;
  url?: string;
  media_type?: string;
}
export interface PilotRecords {
  pilot: PilotSummary;
  mode: 'current' | 'history';
  dataset: PilotDataset;
  readOnly: true;
  records?: PilotRecord[];
  record?: PilotRecord;
  pagination?: { page: number; pageSize: number; total: number };
  report?: Record<string, unknown>;
  answers?: { id: string; question_id: string; answer: string; question_text: string | null; question_type: string | null }[];
  contacts?: { name: string; email: string; phone: string | null; role: string; is_primary: number }[];
  attachments?: (PilotRecord & { file_name?: string; file_type?: string; answer_id?: string; question_id?: string })[];
}

export const pilotsApi = {
  getHistoryRecords: (id: string, dataset: PilotDataset, params: Record<string, string | number>, recordId?: string) =>
    api.get<ApiResponse<PilotRecords>>(`/pilots/${encodeURIComponent(id)}/history/${dataset}${recordId ? `/${encodeURIComponent(recordId)}` : ''}`, params),
  getAdminContext: (query: string) => api.get<ApiResponse<AdminPilotContext>>(`/pilots/context${query ? `?${query}` : ''}`),
  getHistoryOverview: (id: string, view: 'current' | 'history') =>
    api.get<ApiResponse<PilotHistoryOverview>>(`/pilots/${encodeURIComponent(id)}/history`, { view }),
  // Get all pilots
  getPilots: (params?: PaginationParams & { isActive?: boolean }) =>
    api.get<ApiResponse<Pilot[]>>('/pilots', params),

  // Get single pilot
  getPilot: (id: string) =>
    api.get<ApiResponse<Pilot>>(`/pilots/${id}`),

  // Create pilot
  createPilot: (data: Omit<Pilot, 'id' | 'createdAt' | 'updatedAt' | 'stats'>) =>
    api.post<ApiResponse<Pilot>>('/pilots', data),

  // Update pilot
  updatePilot: (id: string, data: Partial<Pilot>) =>
    api.put<ApiResponse<Pilot>>(`/pilots/${id}`, data),

  // Delete pilot (soft delete)
  deletePilot: (id: string) =>
    api.delete<ApiResponse<void>>(`/pilots/${id}`),

  // Duplicate basic configuration into a draft; memberships/history stay in the source.
  clonePilot: (id: string, name?: string) =>
    api.post<ApiResponse<Pilot> & { transferred: boolean; transferredUsers: number; transferredSchools: number; message: string }>(`/pilots/${id}/clone`, name ? { name } : {}),

  // Restore pilot
  restorePilot: (id: string) =>
    api.post<ApiResponse<Pilot>>(`/pilots/${id}/restore`),

  // Get pilot statistics
  getPilotStats: (id: string, dateRange?: { start: string; end: string }) =>
    api.get<ApiResponse<PilotStats>>(`/pilots/${id}/stats`, dateRange),

  // Get pilot schools
  getPilotSchools: (id: string, params?: PaginationParams) =>
    api.get<ApiResponse<any[]>>(`/pilots/${id}/schools`, params),

  // Get pilot volunteers
  getPilotVolunteers: (id: string, params?: PaginationParams) =>
    api.get<ApiResponse<any[]>>(`/pilots/${id}/volunteers`, params),

  // Get pilot activities
  getPilotActivities: (id: string, params?: PaginationParams & { status?: string }) =>
    api.get<ApiResponse<any[]>>(`/pilots/${id}/activities`, params),

  // Assign coordinator to pilot
  assignCoordinator: (pilotId: string, coordinatorId: string) =>
    api.post<ApiResponse<Pilot>>(`/pilots/${pilotId}/coordinators/${coordinatorId}`),

  // Remove coordinator from pilot
  removeCoordinator: (pilotId: string, coordinatorId: string) =>
    api.delete<ApiResponse<Pilot>>(`/pilots/${pilotId}/coordinators/${coordinatorId}`),

  // Set pilot active status
  setPilotStatus: (id: string, isActive: boolean) =>
    api.patch<ApiResponse<Pilot>>(`/pilots/${id}/status`, { isActive }),

  // Get pilot timeline (activity history)
  getPilotTimeline: (id: string, limit?: number) =>
    api.get<ApiResponse<any[]>>(`/pilots/${id}/timeline`, { limit }),
};
