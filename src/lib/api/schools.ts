// lib/api/schools.ts - UPDATED VERSION
import { api } from './api';
import { School, SchoolContact, ApiResponse, PaginationParams } from '@/lib/types';

// Helper function to normalize responses
function normalizeResponse<T>(response: any): ApiResponse<T> {
  console.log('🔄 Normalizing response:', response);
  
  if (!response) {
    return {
      success: false,
      data: [] as unknown as T,
      message: 'No response received',
      count: 0
    };
  }
  
  // If it's already in ApiResponse format
  if (typeof response === 'object' && 'success' in response && 'data' in response) {
    return response as ApiResponse<T>;
  }
  
  // Fallback
  return {
    success: false,
    data: [] as unknown as T,
    message: 'Invalid response format',
    count: 0
  };
}

export const schoolsApi = {
  // Get all schools - UPDATED to use correct params
  getSchools: (params?: PaginationParams & {
    pilotId?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<ApiResponse<School[]>> => {
    const backendParams: Record<string, any> = {};
    
    if (params) {
      if (params.page !== undefined) backendParams.page = params.page;
      if (params.limit !== undefined) backendParams.limit = params.limit;
      if (params.sortBy !== undefined) backendParams.sortBy = params.sortBy;
      if (params.sortOrder !== undefined) backendParams.sortOrder = params.sortOrder;
      
      // Transform to backend param names
      if (params.pilotId) backendParams.pilot_id = params.pilotId;
      if (params.isActive !== undefined) backendParams.is_active = params.isActive;
      if (params.search) backendParams.search = params.search;
    }
    
    console.log('📡 Schools API called with params:', backendParams);
    
    return api.get<any>('/schools', backendParams)
      .then(response => normalizeResponse<School[]>(response))
      .catch(error => {
        console.error('📡 Schools API error:', error);
        return {
          success: false,
          data: [],
          message: error.message || 'Failed to fetch schools',
          count: 0
        };
      });
  },

  // Get single school
  getSchool: (id: string): Promise<ApiResponse<School>> => {
    return api.get<any>(`/schools/${id}`)
      .then(response => normalizeResponse<School>(response))
      .catch(error => {
        console.error(`📡 Error getting school ${id}:`, error);
        return {
          success: false,
          data: null as unknown as School,
          message: error.message || 'Failed to fetch school'
        };
      });
  },

  // Create school - UPDATED to only send schema fields
  createSchool: (data: {
    name: string;
    province?: string;
    district?: string;
    address?: string;
    pilot_id: string;
  }): Promise<ApiResponse<School>> => {
    console.log('📡 Creating school with schema-compliant data:', data);
    return api.post<any>('/schools', data)
      .then(response => normalizeResponse<School>(response))
      .catch(error => {
        console.error('📡 Error creating school:', error);
        return {
          success: false,
          data: null as unknown as School,
          message: error.message || 'Failed to create school'
        };
      });
  },

  // Update school - UPDATED to only send schema fields
  updateSchool: (id: string, data: {
    name: string;
    province?: string;
    district?: string;
    address?: string;
    pilot_id: string;
  }): Promise<ApiResponse<School>> => {
    console.log(`📡 Updating school ${id}:`, data);
    return api.put<any>(`/schools/${id}`, data)
      .then(response => normalizeResponse<School>(response))
      .catch(error => {
        console.error(`📡 Error updating school ${id}:`, error);
        return {
          success: false,
          data: null as unknown as School,
          message: error.message || 'Failed to update school'
        };
      });
  },

  // Delete school (soft delete)
  deleteSchool: (id: string): Promise<ApiResponse<void>> => {
    return api.delete<any>(`/schools/${id}`)
      .then(response => ({
        success: true,
        data: undefined as void,
        message: 'School deleted successfully'
      }))
      .catch(error => {
        console.error(`📡 Error deleting school ${id}:`, error);
        return {
          success: false,
          data: undefined as void,
          message: error.message || 'Failed to delete school'
        };
      });
  },

  // === CONTACT MANAGEMENT ===
  
  // Get school contacts
  getSchoolContacts: (schoolId: string): Promise<ApiResponse<SchoolContact[]>> => {
    return api.get<any>(`/schools/${schoolId}/contacts`)
      .then(response => normalizeResponse<SchoolContact[]>(response))
      .catch(error => {
        console.error(`📡 Error getting contacts for school ${schoolId}:`, error);
        return {
          success: false,
          data: [],
          message: error.message || 'Failed to fetch contacts'
        };
      });
  },

  // Create contact
  createContact: (
    schoolId: string,
    data: {
      name: string;
      email: string;
      phone?: string;
      role: string;
      is_primary?: boolean;
    }
  ): Promise<ApiResponse<SchoolContact>> => {
    return api.post<any>(`/schools/${schoolId}/contacts`, data)
      .then(response => normalizeResponse<SchoolContact>(response))
      .catch(error => {
        console.error(`📡 Error creating contact for school ${schoolId}:`, error);
        return {
          success: false,
          data: null as unknown as SchoolContact,
          message: error.message || 'Failed to create contact'
        };
      });
  },

  // Update contact
  updateContact: (
    contactId: string,
    data: Partial<{
      name: string;
      email: string;
      phone?: string;
      role: string;
      is_primary?: boolean;
    }>
  ): Promise<ApiResponse<SchoolContact>> => {
    return api.put<any>(`/contacts/${contactId}`, data)
      .then(response => normalizeResponse<SchoolContact>(response))
      .catch(error => {
        console.error(`📡 Error updating contact ${contactId}:`, error);
        return {
          success: false,
          data: null as unknown as SchoolContact,
          message: error.message || 'Failed to update contact'
        };
      });
  },

  // Delete contact
  deleteContact: (contactId: string): Promise<ApiResponse<void>> => {
    return api.delete<any>(`/contacts/${contactId}`)
      .then(response => ({
        success: true,
        data: undefined as void,
        message: 'Contact deleted successfully'
      }))
      .catch(error => {
        console.error(`📡 Error deleting contact ${contactId}:`, error);
        return {
          success: false,
          data: undefined as void,
          message: error.message || 'Failed to delete contact'
        };
      });
  },

  // Convenience method to get primary contact
  getPrimaryContact: async (schoolId: string): Promise<SchoolContact | null> => {
    try {
      const response = await schoolsApi.getSchoolContacts(schoolId);
      if (response.success && response.data) {
        return response.data.find(contact => contact.is_primary) || response.data[0] || null;
      }
      return null;
    } catch (error) {
      console.error(`📡 Error getting primary contact for school ${schoolId}:`, error);
      return null;
    }
  }
};