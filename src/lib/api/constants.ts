// lib/api/constants.ts

// Activity statuses
export const ACTIVITY_STATUSES = {
    draft: { label: 'Draft', color: 'gray' },
    pending: { label: 'Pending Review', color: 'yellow' },
    in_edit: { label: 'Edits Requested', color: 'purple' },
    approved: { label: 'Approved', color: 'green' },
    rejected: { label: 'Rejected', color: 'red' },
    completed: { label: 'Completed', color: 'blue' },
    cancelled: { label: 'Cancelled', color: 'gray' },
  } as const;
  
  // Pilot statuses
  export const PILOT_STATUSES = {
    draft: { label: 'Draft', color: 'gray' },
    active: { label: 'Active', color: 'green' },
    closed: { label: 'Closed', color: 'red' },
  } as const;
  
  // Survey types
  export const SURVEY_TYPES = {
    student: { label: 'Student Survey', color: 'blue' },
    volunteer: { label: 'Volunteer Survey', color: 'green' },
    activity_monitoring: { label: 'Activity Monitoring', color: 'purple' },
  } as const;
  
  // Survey periods
  export const SURVEY_PERIODS = {
    pre_activity: { label: 'Pre Survey', color: 'blue' },
    post_activity: { label: 'Post Survey', color: 'green' },
    mid_pilot: { label: 'Post Survey', color: 'yellow' },
    end_pilot: { label: 'Post Survey', color: 'purple' },
  } as const;
  
  // User roles
  export const USER_ROLES = {
    admin: { label: 'Administrator', color: 'red' },
    coordinator: { label: 'Coordinator', color: 'blue' },
    volunteer: { label: 'Volunteer', color: 'green' },
    facilitator: { label: 'Facilitator', color: 'emerald' },
  } as const;
  
  // Export formats
  export const EXPORT_FORMATS = [
    { value: 'json', label: 'JSON' },
    { value: 'csv', label: 'CSV' },
  ];
  
  // Pagination defaults
  export const DEFAULT_PAGE_SIZE = 20;
  export const DEFAULT_PAGE = 1;
