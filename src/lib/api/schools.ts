import { api } from './api';
import { School, SchoolStats, ApiResponse, PaginationParams } from '@/lib/types';

export const schoolsApi = {
  // Get all schools
  getSchools: (params?: PaginationParams & {
    pilotId?: string;
    isActive?: boolean;
    search?: string;
  }) =>
    api.get<ApiResponse<School[]>>('/schools', params),

  // Get single school
  getSchool: (id: string) =>
    api.get<ApiResponse<School>>(`/schools/${id}`),

  // Create school
  createSchool: (data: Omit<School, 'id' | 'createdAt' | 'updatedAt' | 'stats'>) =>
    api.post<ApiResponse<School>>('/schools', data),

  // Update school
  updateSchool: (id: string, data: Partial<School>) =>
    api.put<ApiResponse<School>>(`/schools/${id}`, data),

  // Delete school (soft delete)
  deleteSchool: (id: string) =>
    api.delete<ApiResponse<void>>(`/schools/${id}`),

  // Restore school
  restoreSchool: (id: string) =>
    api.post<ApiResponse<School>>(`/schools/${id}/restore`),

  // Get school statistics
  getSchoolStats: (id: string, dateRange?: { start: string; end: string }) =>
    api.get<ApiResponse<SchoolStats>>(`/schools/${id}/stats`, dateRange),

  // Get school activities
  getSchoolActivities: (id: string, params?: PaginationParams & { status?: string }) =>
    api.get<ApiResponse<any[]>>(`/schools/${id}/activities`, params),

  // Get school volunteers
  getSchoolVolunteers: (id: string, params?: PaginationParams) =>
    api.get<ApiResponse<any[]>>(`/schools/${id}/volunteers`, params),

  // Assign school to pilot
  assignToPilot: (schoolId: string, pilotId: string) =>
    api.post<ApiResponse<School>>(`/schools/${schoolId}/pilots/${pilotId}`),

  // Remove school from pilot
  removeFromPilot: (schoolId: string, pilotId: string) =>
    api.delete<ApiResponse<School>>(`/schools/${schoolId}/pilots/${pilotId}`),

  // Set school active status
  setSchoolStatus: (id: string, isActive: boolean) =>
    api.patch<ApiResponse<School>>(`/schools/${id}/status`, { isActive }),

  // Get school contacts
  getSchoolContacts: (id: string) =>
    api.get<ApiResponse<any[]>>(`/schools/${id}/contacts`),

  // Add contact to school
  addContact: (schoolId: string, contact: {
    name: string;
    email: string;
    phone?: string;
    role: string;
    isPrimary?: boolean;
  }) =>
    api.post<ApiResponse<any>>(`/schools/${schoolId}/contacts`, contact),

  // Update contact
  updateContact: (schoolId: string, contactId: string, data: Partial<any>) =>
    api.put<ApiResponse<any>>(`/schools/${schoolId}/contacts/${contactId}`, data),

  // Delete contact
  deleteContact: (schoolId: string, contactId: string) =>
    api.delete<ApiResponse<void>>(`/schools/${schoolId}/contacts/${contactId}`),
};