export interface CreateUserFormData {
    email: string;
    full_name: string;
    password: string;
    confirmPassword: string;
    role: 'admin' | 'coordinator' | 'volunteer' | 'facilitator';
    pilot_ids?: string[];
    school_ids?: string[];
  }
  
  export interface UserResponse {
    user: {
      id: string;
      email: string;
      full_name: string;
      role: string;
      pilot_names?: string[];
      pilot_ids?: string[];
      school_names?: string[];
      school_ids?: string[];
      created_at: string;
      updated_at: string;
    };
    message?: string;
  }
  
  export interface ApiError {
    status: number;
    message: string;
    errors?: Record<string, string[]>;
  }
