// lib/api/types.ts - COMPLETE VERSION
export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

export interface ApiResponse<T> {
  data?: T;
  success: boolean;
  message?: string;
  error?: string;
}

// Shared activity type used by both volunteer and coordinator
export interface Activity {
  id: string;
  pilot_id: string;
  volunteer_id: string;
  school_id: string;
  activity_template_id: string;
  assigned_by: string;
  assigned_at: string;
  title: string;
  description: string;
  scheduled_date: string;
  actual_date: string | null;
  status: 'draft' | 'pending' | 'in_edit' | 'approved' | 'rejected';
  volunteer_notes: string | null;
  student_quotes?: string | null; // Added for beautified form
  number_of_participants: number | null;
  engagement_level: 'low' | 'medium' | 'high' | null;
  coordinator_feedback: string | null;
  created_at: string;
  updated_at: string;
  school?: {
    id: string;
    name: string;
    province: string;
    district: string;
  };
  pilot?: {
    id: string;
    name: string;
  };
  activity_template?: {
    id: string;
    name: string;
  };
  volunteer_name?: string;
  school_name?: string;
  pilot_name?: string;
  activity_template_name?: string;
  assigned_by_name?: string;
  assignment_notes?: string;
}

// Media interface
export interface MediaItem {
  id: string;
  url: string;
  thumbnailUrl: string;
  filename: string;
  caption?: string;
  uploadedAt: string;
  size: number;
  displayOrder: number;
  isNew?: boolean;
  file?: File;
  mediaType: 'photo' | 'video' | 'document';
  duration?: number;
  width?: number;
  height?: number;
  compressionProfile?: 'low' | 'medium' | 'high';
  volunteerName?: string;
}

// Activity template
export interface ActivityTemplate {
  id: string;
  name: string;
  purpose?: string;
  duration_minutes?: number;
  materials_needed?: string;
  facilitator_notes?: string;
  pilot_id: string;
  created_at: string;
  components: ActivityTemplateComponent[];
}

export interface ActivityTemplateComponent {
  id: string;
  name: string;
  description?: string;
}

// User interface
export interface User {
  id: string;
  email: string;
  full_name: string;
  roles: string[];
  created_at: string;
  updated_at: string;
}

// School interface
export interface School {
  id: string;
  name: string;
  province: string;
  district: string;
  created_at: string;
  updated_at: string;
}

// Pilot interface
export interface Pilot {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}