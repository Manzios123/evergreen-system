export type ActivityStatus = 
  | 'draft'
  | 'pending'
  | 'in_edit'
  | 'approved'
  | 'rejected';

export type EngagementLevel = 'low' | 'medium' | 'high';

export interface Activity {
  id: string;
  title: string;
  description: string;
  status: ActivityStatus;
  pilot_id: string;
  school_id: string;
  volunteer_id: string;
  scheduled_date: string;
  actual_date?: string;
  volunteer_notes?: string;
  coordinator_feedback?: string;
  rejection_reason?: string;
  number_of_participants?: number;
  number_of_boys?: number | null;
  number_of_girls?: number | null;
  engagement_level?: EngagementLevel;
  created_at: string;
  updated_at: string;
  
  // Relations
  school?: {
    id: string;
    name: string;
    province?: string;
    district?: string;
  };
  
  pilot?: {
    id: string;
    name: string;
  };
}

export interface ActivityTemplate {
  id: string;
  name: string;
  description: string;
  pilot_id: string;
  created_at: string;
}

export interface SurveyQuestion {
  id: string;
  question_text: string;
  question_type: 'agree_disagree_unsure' | 'scale_1_5' | 'scale_1_10' | 'text' | 'number';
  order_index: number;
  is_required: boolean;
}

export interface SurveyTemplate {
  id: string;
  name: string;
  pilot_id: string;
  survey_period: 'pre_activity' | 'post_activity' | 'mid_pilot' | 'end_pilot';
  questions: SurveyQuestion[];
  created_at: string;
}

export interface Photo {
  id: string;
  file_name: string;
  caption?: string;
  url: string;
  activity_id: string;
  uploaded_by: string;
  created_at: string;
}
