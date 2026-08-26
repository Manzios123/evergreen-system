import { api } from './api';
import { Pilot, PilotStats, ApiResponse, PaginationParams } from '@/lib/types';

export const pilotsApi = {
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

  // Clone pilot. If the source pilot is 'closed' (marked complete), the
  // backend also MOVES its users and schools into the newly created pilot
  // so staff only need to enter genuinely new people/schools.
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