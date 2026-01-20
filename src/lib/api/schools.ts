// lib/api/schools.ts - FIXED VERSION
import { api } from './api';
import { School, SchoolStats, ApiResponse, PaginationParams } from '@/lib/types';

// Helper function to normalize school data
function normalizeSchoolData(school: any): any {
  if (!school) return school;
  
  // Extract pilot_id from various possible field names
  const pilotId = 
    school.pilot_id || 
    school.pilotId || 
    (school.pilot && school.pilot.id) ||
    null;
  
  // Normalize all field names to a consistent shape
  return {
    ...school,
    id: school.id || school.ID || '',
    name: school.name || school.school_name || '',
    pilot_id: pilotId,
    pilotId: pilotId, // Add alias for compatibility
    address: school.address || '',
    city: school.city || '',
    state: school.state || school.province || '',
    district: school.district || '',
    created_at: school.created_at || school.createdAt || '',
    updated_at: school.updated_at || school.updatedAt || '',
    pilot_name: school.pilot_name || (school.pilot && school.pilot.name) || '',
  };
}

// Helper function to get pilot ID from any school object
export function getSchoolPilotId(school: any): string | null {
  return school.pilot_id || school.pilotId || (school.pilot && school.pilot.id) || null;
}

// Helper function to normalize responses
function normalizeResponse<T>(response: any): ApiResponse<T> {
  console.log('🔄 Normalizing response:', response);
  
  // If response is null or undefined
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
    // Normalize schools data if present
    if (Array.isArray(response.data)) {
      response.data = response.data.map(normalizeSchoolData);
    } else if (response.data && typeof response.data === 'object') {
      response.data = normalizeSchoolData(response.data);
    }
    return response as ApiResponse<T>;
  }
  
  // If it's an array (direct response)
  if (Array.isArray(response)) {
    return {
      success: true,
      data: response.map(normalizeSchoolData) as T,
      count: response.length,
      message: 'Success'
    };
  }
  
  // If it's an object (single item)
  if (typeof response === 'object') {
    return {
      success: true,
      data: normalizeSchoolData(response) as T,
      count: 1,
      message: 'Success'
    };
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
  // Get all schools
  getSchools: (params?: PaginationParams & {
    pilotId?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<ApiResponse<School[]>> => {
    // Transform parameters for backend
    const backendParams: Record<string, any> = {};
    
    if (params) {
      // Copy all params
      if (params.page !== undefined) backendParams.page = params.page;
      if (params.limit !== undefined) backendParams.limit = params.limit;
      if (params.sortBy !== undefined) backendParams.sortBy = params.sortBy;
      if (params.sortOrder !== undefined) backendParams.sortOrder = params.sortOrder;
      if (params.offset !== undefined) backendParams.offset = params.offset;
      
      // Transform pilotId to pilot_id for backend
      if (params.pilotId) {
        backendParams.pilot_id = params.pilotId;
      }
      
      // Transform isActive to is_active for backend if needed
      if (params.isActive !== undefined) {
        backendParams.is_active = params.isActive;
      }
      
      if (params.search) {
        backendParams.search = params.search;
      }
    }
    
    console.log('📡 Schools API called with params:', backendParams);
    
    return api.get<any>('/schools', backendParams)
      .then(response => {
        console.log('📡 Schools API raw response:', response);
        return normalizeResponse<School[]>(response);
      })
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
    console.log(`📡 Getting school ${id}`);
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

  // Create school
  createSchool: (data: Omit<School, 'id' | 'createdAt' | 'updatedAt' | 'stats'>): Promise<ApiResponse<School>> => {
    console.log('📡 Creating school:', data);
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

  // Update school
  updateSchool: (id: string, data: Partial<School>): Promise<ApiResponse<School>> => {
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
    console.log(`📡 Deleting school ${id}`);
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

  // Restore school
  restoreSchool: (id: string): Promise<ApiResponse<School>> => {
    console.log(`📡 Restoring school ${id}`);
    return api.post<any>(`/schools/${id}/restore`)
      .then(response => normalizeResponse<School>(response))
      .catch(error => {
        console.error(`📡 Error restoring school ${id}:`, error);
        return {
          success: false,
          data: null as unknown as School,
          message: error.message || 'Failed to restore school'
        };
      });
  },

  // Get school statistics
  getSchoolStats: (id: string, dateRange?: { start: string; end: string }): Promise<ApiResponse<SchoolStats>> => {
    console.log(`📡 Getting stats for school ${id}`);
    return api.get<any>(`/schools/${id}/stats`, dateRange)
      .then(response => normalizeResponse<SchoolStats>(response))
      .catch(error => {
        console.error(`📡 Error getting school stats ${id}:`, error);
        return {
          success: false,
          data: null as unknown as SchoolStats,
          message: error.message || 'Failed to fetch school stats'
        };
      });
  },

  // Get school activities
  getSchoolActivities: (
    id: string, 
    params?: PaginationParams & { status?: string }
  ): Promise<ApiResponse<any[]>> => {
    console.log(`📡 Getting activities for school ${id}`);
    return api.get<any>(`/schools/${id}/activities`, params)
      .then(response => normalizeResponse<any[]>(response))
      .catch(error => {
        console.error(`📡 Error getting school activities ${id}:`, error);
        return {
          success: false,
          data: [],
          message: error.message || 'Failed to fetch school activities'
        };
      });
  },

  // Get school volunteers
  getSchoolVolunteers: (id: string, params?: PaginationParams): Promise<ApiResponse<any[]>> => {
    console.log(`📡 Getting volunteers for school ${id}`);
    return api.get<any>(`/schools/${id}/volunteers`, params)
      .then(response => normalizeResponse<any[]>(response))
      .catch(error => {
        console.error(`📡 Error getting school volunteers ${id}:`, error);
        return {
          success: false,
          data: [],
          message: error.message || 'Failed to fetch school volunteers'
        };
      });
  },

  // Assign school to pilot
  assignToPilot: (schoolId: string, pilotId: string): Promise<ApiResponse<School>> => {
    console.log(`📡 Assigning school ${schoolId} to pilot ${pilotId}`);
    return api.post<any>(`/schools/${schoolId}/pilots/${pilotId}`)
      .then(response => normalizeResponse<School>(response))
      .catch(error => {
        console.error(`📡 Error assigning school to pilot:`, error);
        return {
          success: false,
          data: null as unknown as School,
          message: error.message || 'Failed to assign school to pilot'
        };
      });
  },

  // Remove school from pilot
  removeFromPilot: (schoolId: string, pilotId: string): Promise<ApiResponse<School>> => {
    console.log(`📡 Removing school ${schoolId} from pilot ${pilotId}`);
    return api.delete<any>(`/schools/${schoolId}/pilots/${pilotId}`)
      .then(response => normalizeResponse<School>(response))
      .catch(error => {
        console.error(`📡 Error removing school from pilot:`, error);
        return {
          success: false,
          data: null as unknown as School,
          message: error.message || 'Failed to remove school from pilot'
        };
      });
  },

  // Set school active status
  setSchoolStatus: (id: string, isActive: boolean): Promise<ApiResponse<School>> => {
    console.log(`📡 Setting school ${id} status to ${isActive}`);
    return api.patch<any>(`/schools/${id}/status`, { isActive })
      .then(response => normalizeResponse<School>(response))
      .catch(error => {
        console.error(`📡 Error setting school status:`, error);
        return {
          success: false,
          data: null as unknown as School,
          message: error.message || 'Failed to set school status'
        };
      });
  },

  // Get school contacts
  getSchoolContacts: (id: string): Promise<ApiResponse<any[]>> => {
    console.log(`📡 Getting contacts for school ${id}`);
    return api.get<any>(`/schools/${id}/contacts`)
      .then(response => normalizeResponse<any[]>(response))
      .catch(error => {
        console.error(`📡 Error getting school contacts:`, error);
        return {
          success: false,
          data: [],
          message: error.message || 'Failed to fetch school contacts'
        };
      });
  },

  // Add contact to school
  addContact: (
    schoolId: string, 
    contact: {
      name: string;
      email: string;
      phone?: string;
      role: string;
      isPrimary?: boolean;
    }
  ): Promise<ApiResponse<any>> => {
    console.log(`📡 Adding contact to school ${schoolId}:`, contact);
    return api.post<any>(`/schools/${schoolId}/contacts`, contact)
      .then(response => normalizeResponse<any>(response))
      .catch(error => {
        console.error(`📡 Error adding contact to school:`, error);
        return {
          success: false,
          data: null,
          message: error.message || 'Failed to add contact'
        };
      });
  },

  // Update contact
  updateContact: (
    schoolId: string, 
    contactId: string, 
    data: Partial<any>
  ): Promise<ApiResponse<any>> => {
    console.log(`📡 Updating contact ${contactId} for school ${schoolId}:`, data);
    return api.put<any>(`/schools/${schoolId}/contacts/${contactId}`, data)
      .then(response => normalizeResponse<any>(response))
      .catch(error => {
        console.error(`📡 Error updating contact:`, error);
        return {
          success: false,
          data: null,
          message: error.message || 'Failed to update contact'
        };
      });
  },

  // Delete contact
  deleteContact: (schoolId: string, contactId: string): Promise<ApiResponse<void>> => {
    console.log(`📡 Deleting contact ${contactId} from school ${schoolId}`);
    return api.delete<any>(`/schools/${schoolId}/contacts/${contactId}`)
      .then(response => ({
        success: true,
        data: undefined as void,
        message: 'Contact deleted successfully'
      }))
      .catch(error => {
        console.error(`📡 Error deleting contact:`, error);
        return {
          success: false,
          data: undefined as void,
          message: error.message || 'Failed to delete contact'
        };
      });
  },

  // Search schools
  searchSchools: (query: string, params?: PaginationParams): Promise<ApiResponse<School[]>> => {
    console.log(`📡 Searching schools for: ${query}`);
    const searchParams = {
      ...params,
      search: query
    };
    return api.get<any>('/schools/search', searchParams)
      .then(response => normalizeResponse<School[]>(response))
      .catch(error => {
        console.error(`📡 Error searching schools:`, error);
        return {
          success: false,
          data: [],
          message: error.message || 'Failed to search schools'
        };
      });
  },

  // Get schools by pilot (convenience method)
  getSchoolsByPilot: (pilotId: string, params?: PaginationParams): Promise<ApiResponse<School[]>> => {
    console.log(`📡 Getting schools for pilot ${pilotId}`);
    return schoolsApi.getSchools({
      ...params,
      pilotId: pilotId
    });
  },

  // Get schools for current user (based on assigned pilots)
  getMySchools: (params?: PaginationParams): Promise<ApiResponse<School[]>> => {
    console.log('📡 Getting schools for current user');
    return api.get<any>('/schools/my-schools', params)
      .then(response => normalizeResponse<School[]>(response))
      .catch(error => {
        console.error(`📡 Error getting user's schools:`, error);
        return {
          success: false,
          data: [],
          message: error.message || 'Failed to fetch user schools'
        };
      });
  },

  // Bulk assign schools to pilot
  bulkAssignToPilot: (schoolIds: string[], pilotId: string): Promise<ApiResponse<any>> => {
    console.log(`📡 Bulk assigning ${schoolIds.length} schools to pilot ${pilotId}`);
    return api.post<any>('/schools/bulk/assign-to-pilot', {
      school_ids: schoolIds,
      pilot_id: pilotId
    })
      .then(response => normalizeResponse<any>(response))
      .catch(error => {
        console.error(`📡 Error bulk assigning schools:`, error);
        return {
          success: false,
          data: null,
          message: error.message || 'Failed to bulk assign schools'
        };
      });
  },

  // Export schools data
  exportSchools: (format: 'csv' | 'json' | 'excel', filters?: any): Promise<Blob> => {
    console.log(`📡 Exporting schools in ${format} format`);
    const params = {
      format,
      ...filters
    };
    return api.get<Blob>('/schools/export', params, { responseType: 'blob' } as any);
  }
};