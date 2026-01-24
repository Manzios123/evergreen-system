// lib/api/dashboard.ts
import { apiRequest } from './api';

export interface VolunteerDashboard {
  user: {
    id: string;
    full_name: string;
    email: string;
    pilot: {
      pilot_id: string;
      pilot_name: string;
    };
  };
  statistics: {
    activities: {
      total_activities: number;
      draft_count: number;
      pending_count: number;
      in_edit_count: number;
      approved_count: number;
      rejected_count: number;
      upcoming_count: number;
      completed_count: number;
    };
    surveys: {
      completed: number;
      total: number;
      completion_rate: number;
    };
  };
  recentActivities: Array<{
    id: string;
    title: string;
    status: string;
    scheduled_date: string;
    actual_date?: string;
    school_name: string;
    pilot_name: string;
  }>;
  upcomingActivities: Array<{
    id: string;
    title: string;
    status: string;
    scheduled_date: string;
    school_name: string;
  }>;
  summary: {
    message: string;
    pendingApproval?: string;
    needsAttention?: string;
  };
}

export interface CoordinatorDashboard {
  pilot: {
    id: string;
    name: string;
    description: string;
    status: string;
    start_date: string;
    end_date: string;
  };
  statistics: {
    pendingApprovals: number;
    activityStatus: Record<string, number>;
    volunteers: {
      total_volunteers: number;
      active_volunteers: number;
      recent_volunteers: number;
    };
    surveys: {
      activitySurveys: {
        completed: number;
        total: number;
        completion_rate: number;
        recent_completion_rate: number;
      };
      studentSurveys: {
        total_surveys: number;
        total_students: number;
        last_submission: string;
      };
    };
  };
  recentPendingActivities: Array<{
    id: string;
    title: string;
    status: string;
    scheduled_date: string;
    created_at: string;
    volunteer_name: string;
    school_name: string;
  }>;
  alerts: Array<{
    type: 'warning' | 'info' | 'error';
    message: string;
  }>;
}

export interface AdminDashboard {
  user: {
    id: string;
    full_name: string;
    email: string;
    role: string;
  };
  systemStatistics: {
    total_pilots: number;
    active_pilots: number;
    total_users: number;
    total_activities: number;
    approved_activities: number;
    upcoming_activities: number;
    total_schools: number;
    activity_surveys: number;
    student_surveys: number;
    volunteer_surveys: number;
  };
  pilots: {
    summary: Array<{
      id: string;
      name: string;
      status: string;
      user_count: number;
      activity_count: number;
      approved_activities: number;
      school_count: number;
    }>;
    total: number;
    active: number;
  };
  users: {
    distribution: Array<{ role: string; user_count: number }>;
    total: number;
  };
  activities: {
    distribution: Array<{ status: string; count: number }>;
    total: number;
    approved: number;
    upcoming: number;
  };
  surveys: {
    activity: number;
    student: number;
    volunteer: number;
    total: number;
  };
  schools: {
    total: number;
  };
  recentActivity: Array<{
    type: string;
    entity_id: string;
    entity_name: string;
    user_name: string;
    timestamp: string;
  }>;
  summary: {
    systemHealth: string;
    message: string;
  };
}

export const dashboardApi = {
  getVolunteerDashboard: () => apiRequest<VolunteerDashboard>('/dashboard/volunteer'),
  getCoordinatorDashboard: () => apiRequest<CoordinatorDashboard>('/dashboard/coordinator'),
  getAdminDashboard: () => apiRequest<AdminDashboard>('/dashboard/admin'),
  
  // Get system statistics (extracted from admin dashboard)
  getSystemStats: () => 
    apiRequest<AdminDashboard>('/dashboard/admin')
      .then(dashboard => dashboard.systemStatistics),
};