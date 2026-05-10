// src/lib/types/index.ts
// CHANGE: Added profile_picture field to User interface

export type ActivityStatus = 
  | 'draft' 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'completed' 
  | 'cancelled';

export type ActivityType = 
  | 'workshop' 
  | 'training' 
  | 'meeting' 
  | 'volunteer' 
  | 'school_event';

export interface Activity {
  type: string;
  id: string;
  title: string;
  description: string;
  status: ActivityStatus;
  scheduled_date: string;
  actual_date?: string;
  volunteer_id: string;
  volunteer_name?: string;
  volunteer?: User;
  school_id: string;
  school_name?: string;
  school?: School;
  pilot_id: string;
  pilot_name?: string;
  pilot?: Pilot;
  activity_template_id?: string;
  activity_template_name?: string;
  number_of_participants?: number;
  engagement_level?: 'low' | 'medium' | 'high' | number | string;
  volunteer_notes?: string;
  student_quotes?: string;
  coordinator_feedback?: string;
  assigned_by?: string;
  assigned_by_name?: string;
  assignment_notes?: string;
  assigned_at?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  photos?: Photo[];
  surveys?: Survey[];
}

// ✅ UPDATED: added profile_picture
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'coordinator' | 'volunteer' | 'facilitator';
  pilot_id?: string;
  profile_picture?: string | null;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface School {
  [x: string]: any;
  id: string;
  name: string;
  province?: string;
  district?: string;
  address?: string;
  pilot_id?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  is_active?: boolean;
}

export interface SchoolContact {
  id: string;
  school_id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Pilot {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  status: 'active' | 'completed' | 'cancelled' | 'draft' | 'closed';
  created_at: string;
  updated_at: string;
  success?: boolean;
  message?: string;
}

export interface VolunteerDashboard {
  totalActivities: number;
  completedActivities: number;
  pendingSurveys: number;
  totalPhotos: number;
  recentActivities: Activity[];
  upcomingActivities: Activity[];
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'warning' | 'success' | 'ghost' | 'default';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  href?: string;
}

export interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export interface PhotoGalleryProps {
  photos: Photo[];
  onDeleteSuccess?: () => void;
  showFilters?: boolean;
  showSearch?: boolean;
}

export interface UploadDashboardProps {
  onUploadSuccess?: () => void;
}

export interface Survey {
  id: string;
  template: SurveyTemplate;
  activity?: Activity;
  volunteer?: User;
  responses?: SurveyResponse;
  status: 'pending' | 'overdue' | 'completed';
  due_date?: string;
  completed_at?: string;
  title?: string;
  description?: string;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  offset?: number;
}

export interface SurveyQuestion {
  id: string;
  type: 'agree_disagree_unsure' | 'scale_1_5' | 'scale_1_10' | 'text' | 'number';
  question: string;
  required: boolean;
  options?: string[];
  min?: number;
  max?: number;
  placeholder?: string;
}

export interface SurveyTemplate {
  id: string;
  name: string;
  description?: string;
  type: 'student' | 'volunteer' | 'activity' | 'general';
  version: string;
  questions: SurveyQuestion[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SurveyResponse {
  id: string;
  surveyTemplateId: string;
  activityId?: string;
  volunteerId?: string;
  studentId?: string;
  responses: Record<string, any>;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: string;
  reviewedAt?: string;
  reviewerId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Photo {
  id: string;
  url: string;
  thumbnailUrl?: string;
  activityId: string;
  volunteerId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  description?: string;
  tags: string[];
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
  reviewedAt?: string;
  reviewerId?: string;
  rejectionReason?: string;
  metadata?: {
    width?: number;
    height?: number;
    location?: { lat: number; lng: number };
    takenAt?: string;
  };
}

export interface ExportConfig {
  format: 'json' | 'csv' | 'excel' | 'pdf';
  filters?: Record<string, any>;
  fields?: string[];
  includeMeta?: boolean;
}

export interface ExportJob {
  id: string;
  type: 'activities' | 'users' | 'surveys' | 'photos' | 'reports';
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  fileSize?: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export interface SchoolStats {
  totalActivities: number;
  completedActivities: number;
  totalVolunteers: number;
  totalStudents: number;
  lastActivityDate?: string;
}

export interface PilotStats {
  totalSchools?: number;
  totalActivities?: number;
  totalVolunteers?: number;
  completionRate?: number;
  averageRating?: number;
  pilot?: string;
  users?: number;
  activities?: number;
  schools?: number;
  engagement?: number;
}

export interface ActivityFilters {
  status?: ActivityStatus[];
  pilotId?: string[];
  schoolId?: string[];
  volunteerId?: string[];
  dateRange?: { start: string; end: string };
  type?: ActivityType[];
  search?: string;
}

export interface AdminSurveyResponse {
  id: string;
  submitted_at: string;
  total_students?: number;
  activity_id?: string;
  submitted_by?: string;
  submitted_by_name?: string;
  submitted_by_email?: string;
  volunteer_id?: string;
  volunteer_name?: string;
  volunteer_email?: string;
  survey_template_id: string;
  template_name: string;
  survey_type: string;
  survey_period: string;
  pilot_id: string;
  pilot_name?: string;
}

export interface AdminSurveyStats {
  totalSubmissions: number;
  submissionsThisWeek: number;
  submissionsThisMonth: number;
  submissionsOverTime: Array<{ date: string; count: number }>;
  submissionsPerTemplate: Array<{ template_id: string; template_name: string; count: number }>;
  studentTotalStudentsSum?: number;
}

export interface AdminApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface OverviewStats {
  totalUsers: number;
  totalActivities: number;
  totalSurveys: number;
  totalPhotos: number;
  userGrowth: number;
  activityGrowth: number;
  surveyGrowth: number;
  avgEngagement: number;
}

export interface UserStats {
  byRole: Array<{ name: string; value: number }>;
  byStatus: Array<{ name: string; value: number }>;
  byPilot: Array<{ name: string; value: number }>;
  activeUsers: number;
  newUsers: number;
}

export interface ActivityStats {
  byStatus: Array<{ name: string; value: number }>;
  byMonth: Array<{ month: string; count: number }>;
  byPilot: Array<{ name: string; value: number }>;
  bySchoolType: Array<{ type: string; count: number }>;
  avgDuration: number;
  totalHours: number;
}

export interface SurveyStats {
  byType: Array<{ name: string; value: number }>;
  byStatus: Array<{ status: string; count: number }>;
  completionRate: number;
  avgRating: number;
  responseTrends: Array<{ month: string; count: number }>;
}

export interface ReportsApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
