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

  
}
