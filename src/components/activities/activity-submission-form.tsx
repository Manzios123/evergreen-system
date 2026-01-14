// components/activities/activity-submission-form.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Input from '@/components/ui/form/input';
import Textarea from '@/components/ui/form/textarea';
import Select from '@/components/ui/form/select';
import Alert from '@/components/ui/alert';
import { useApiMutation } from '@/lib/hooks/use-api';
import { activitiesApi, UpdateActivityData } from '@/lib/api/activities';
import { 
  CalendarIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  PhotoIcon // Added PhotoIcon
} from '@heroicons/react/24/outline';
import { SaveIcon } from 'lucide-react';
import { PhotoUpload } from '@/components/activities/photo-upload'; // Added PhotoUpload import

// Helper function to map numeric values to string values for database
const mapEngagementLevel = (value: string | number | undefined): string => {
  if (typeof value === 'number') {
    switch(value) {
      case 1: return 'low';
      case 2: return 'medium';
      case 3: return 'high';
      default: return 'medium';
    }
  }
  
  if (typeof value === 'string') {
    // If it's already one of the allowed values, return it
    if (['low', 'medium', 'high'].includes(value)) {
      return value;
    }
    // If it's a numeric string, map it
    if (['1', '2', '3'].includes(value)) {
      switch(value) {
        case '1': return 'low';
        case '2': return 'medium';
        case '3': return 'high';
      }
    }
  }
  
  return 'medium'; // default
};

// Helper to reverse map for display
const reverseMapEngagementLevel = (value: string | number | undefined): string => {
  const mapped = mapEngagementLevel(value);
  // For the form, we need to use the database values (low, medium, high)
  return mapped;
};

// Simplified schema without invalid_type_error
const submissionSchema = z.object({
  actual_date: z.string().min(1, 'Actual date is required'),
  number_of_participants: z.coerce.number().min(1, 'Number of participants is required'),
  engagement_level: z.enum(['low', 'medium', 'high'], {
    
  }),
  volunteer_notes: z.string().min(1, 'Please provide activity notes'),
});

// Define the form data type explicitly to match schema
type SubmissionFormData = {
  actual_date: string;
  number_of_participants: number;
  engagement_level: 'low' | 'medium' | 'high';
  volunteer_notes: string;
};

// Add this interface near the top:
interface Photo {
  id: string;
  url: string;
  thumbnailUrl: string;
  filename: string;
  caption?: string;
  uploadedAt: string;
  size: number;
  displayOrder: number;
}

interface ActivitySubmissionFormProps {
  activity: {
    id: string;
    title: string;
    description: string;
    status: string;
    scheduled_date: string;
    actual_date?: string;
    volunteer_notes?: string;
    number_of_participants?: number;
    engagement_level?: string | number;
    school_name?: string;
    pilot_name?: string;
    assigned_by_name?: string;
    assigned_at?: string;
    assignment_notes?: string;
    coordinator_feedback?: string;
    created_at: string;
    updated_at: string;
    volunteer_id: string; // Add this to check ownership
  };
  currentUserId?: string; // Add current user ID to check permissions
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
}

export function ActivitySubmissionForm({ 
  activity, 
  currentUserId,
  onSubmitSuccess, 
  onCancel 
}: ActivitySubmissionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionType, setSubmissionType] = useState<'save' | 'submit'>('save');
  const [isOwner, setIsOwner] = useState(true);
  
  // Add this state variable inside the component (after the existing states):
  const [uploadedPhotos, setUploadedPhotos] = useState<Photo[]>([]);

  // Check if current user is the owner of the activity
  useEffect(() => {
    if (currentUserId && activity.volunteer_id) {
      setIsOwner(currentUserId === activity.volunteer_id);
    }
  }, [currentUserId, activity.volunteer_id]);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset,
  } = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema) as any,
    mode: 'onChange', // Validate on change to enable/disable submit
    defaultValues: {
      actual_date: activity.actual_date || activity.scheduled_date || new Date().toISOString().split('T')[0],
      number_of_participants: activity.number_of_participants || 1,
      engagement_level: reverseMapEngagementLevel(activity.engagement_level) as 'low' | 'medium' | 'high',
      volunteer_notes: activity.volunteer_notes || '',
    },
  });

  // Save as draft mutation - user can only save their own activity
  const saveDraftMutation = useApiMutation(
    (data: SubmissionFormData) => {
      const updateData: UpdateActivityData = {
        actual_date: data.actual_date,
        number_of_participants: data.number_of_participants,
        engagement_level: data.engagement_level, // Now this is 'low' | 'medium' | 'high'
        volunteer_notes: data.volunteer_notes,
        // Keep status as draft when saving
        status: 'draft',
      };
      
      return activitiesApi.update(activity.id, updateData);
    },
    {
      mutationKey: ['save-activity-draft', activity.id],
      invalidateQueries: [['activity', activity.id]],
      onSuccess: (data) => {
        // Update form with saved values
        if (data.data) {
          reset({
            actual_date: data.data.actual_date || activity.scheduled_date,
            number_of_participants: data.data.number_of_participants || 1,
            engagement_level: reverseMapEngagementLevel(data.data.engagement_level) as 'low' | 'medium' | 'high',
            volunteer_notes: data.data.volunteer_notes || '',
          });
        }
      },
      onError: (error) => {
        // If permission error, suggest submission instead
        if (error.message.includes('permission')) {
          setSubmissionType('submit');
        }
      }
    }
  );

  // Submit for approval mutation - uses the proper submit endpoint
  const submitForApprovalMutation = useApiMutation(
    (data: SubmissionFormData) => {
      // First save the data
      const updateData: UpdateActivityData = {
        actual_date: data.actual_date,
        number_of_participants: data.number_of_participants,
        engagement_level: data.engagement_level, // Now this is 'low' | 'medium' | 'high'
        volunteer_notes: data.volunteer_notes,
      };
      
      // IMPORTANT: First update the activity with the data
      // This might fail if user doesn't have permission to update
      // In that case, we'll try to submit anyway with existing data
      return activitiesApi.update(activity.id, updateData)
        .then(() => {
          // Then submit for approval using the proper endpoint
          return activitiesApi.submit(activity.id);
        })
        .catch(() => {
          // If we can't update, still try to submit with existing data
          return activitiesApi.submit(activity.id);
        });
    },
    {
      mutationKey: ['submit-activity-approval', activity.id],
      invalidateQueries: [['activity', activity.id]],
      onSuccess: () => {
        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
      }
    }
  );

  const onSubmit: SubmitHandler<SubmissionFormData> = async (data) => {
    if (!isOwner && submissionType === 'save') {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (submissionType === 'save') {
        await saveDraftMutation.mutateAsync(data);
      } else {
        await submitForApprovalMutation.mutateAsync(data);
      }
    } catch (error) {
      // Error handling is done in mutation onError
    } finally {
      setIsSubmitting(false);
    }
  };

  const engagementOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];

  const engagementValue = watch('engagement_level');
  const isSubmittingForm = isSubmitting || saveDraftMutation.isPending || submitForApprovalMutation.isPending;

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="border-b pb-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Complete Activity Report
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Fill in the details of your completed activity
                </p>
              </div>
              <div className="text-sm">
                <span className={`px-2 py-1 rounded-full ${
                  activity.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                  activity.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {activity.status}
                </span>
              </div>
            </div>
          </div>

          {/* Error Alerts */}
          {(saveDraftMutation.error || submitForApprovalMutation.error) && (
            <Alert type="error">
              {submissionType === 'save' 
                ? 'Failed to save draft. Please try again.'
                : 'Failed to submit for approval. Please try again.'
              }
            </Alert>
          )}

          {/* Success Alert */}
          {saveDraftMutation.isSuccess && submissionType === 'save' && (
            <Alert type="success">
              Draft saved successfully! You can continue editing or submit for approval.
            </Alert>
          )}

          {/* Activity Summary */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Activity Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Title</p>
                <p className="text-sm font-medium">{activity.title}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Scheduled Date</p>
                <p className="text-sm font-medium">
                  {new Date(activity.scheduled_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">School</p>
                <p className="text-sm font-medium">
                  {activity.school_name || 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Pilot</p>
                <p className="text-sm font-medium">
                  {activity.pilot_name || 'Not specified'}
                </p>
              </div>
            </div>
          </div>

          {/* Completion Details */}
          <div className="space-y-6">
            <h3 className="text-md font-medium text-gray-900">
              Completion Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Actual Date
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    type="date"
                    {...register('actual_date')}
                    error={errors.actual_date?.message}
                    className="pl-10"
                    required
                    disabled={!isOwner && submissionType === 'save'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Participants
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserGroupIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    type="number"
                    min="1"
                    {...register('number_of_participants', {
                      valueAsNumber: true,
                      setValueAs: (value) => Number(value) || 1,
                    })}
                    placeholder="e.g., 25"
                    error={errors.number_of_participants?.message}
                    className="pl-10"
                    required
                    disabled={!isOwner && submissionType === 'save'}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Engagement Level
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ChartBarIcon className="h-5 w-5 text-gray-400" />
                </div>
                <Select
                  {...register('engagement_level')}
                  options={engagementOptions}
                  error={errors.engagement_level?.message}
                  className="pl-10"
                  required
                  disabled={!isOwner && submissionType === 'save'}
                />
              </div>
              {engagementValue && (
                <p className="mt-1 text-xs text-gray-500">
                  Selected: {engagementOptions.find(opt => opt.value === engagementValue)?.label}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Activity Notes & Observations
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                </div>
                <Textarea
                  {...register('volunteer_notes')}
                  placeholder="Describe what happened during the activity, observations, challenges, successes..."
                  rows={6}
                  error={errors.volunteer_notes?.message}
                  className="pl-10"
                  required
                  disabled={!isOwner && submissionType === 'save'}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Provide detailed notes about the activity for your coordinator
              </p>
            </div>

            {/* Add this to the form, right after the "Activity Notes & Observations" section: */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Activity Photos
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3">
                  <PhotoIcon className="h-5 w-5 text-gray-400" />
                </div>
                <div className="pl-10">
                  <PhotoUpload
                    activityId={activity.id}
                    maxPhotos={10}
                    maxSizeMB={5}
                    onPhotosChange={setUploadedPhotos}
                    disabled={!isOwner && submissionType === 'save'}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Upload photos to document your activity (optional, max 10 photos, 5MB each)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t">
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="submissionType"
                  value="save"
                  checked={submissionType === 'save'}
                  onChange={(e) => setSubmissionType('save')}
                  className="h-4 w-4 text-green-600"
                  disabled={!isOwner}
                />
                <span className={`ml-2 text-sm ${!isOwner ? 'text-gray-400' : 'text-gray-700'}`}>
                  Save as Draft
                  {!isOwner && <span className="ml-1 text-xs">(Not available)</span>}
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="submissionType"
                  value="submit"
                  checked={submissionType === 'submit'}
                  onChange={(e) => setSubmissionType('submit')}
                  className="h-4 w-4 text-green-600"
                />
                <span className="ml-2 text-sm text-gray-700">Submit for Approval</span>
              </label>
            </div>

            <div className="flex space-x-3">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmittingForm}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                variant={submissionType === 'submit' ? 'default' : 'secondary'}
                loading={isSubmittingForm}
                disabled={!isValid || (submissionType === 'save' && !isOwner)}
              >
                {submissionType === 'submit' ? (
                  <>
                    <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                    Submit for Approval
                  </>
                ) : (
                  <>
                    <SaveIcon className="h-4 w-4 mr-2" />
                    Save Draft
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Status Message */}
          {submissionType === 'submit' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Submitting will change the status to "Pending" and notify your coordinator for approval.
                {!isOwner && (
                  <span className="font-semibold">
                    {' '}You are submitting this activity on behalf of the assigned volunteer.
                  </span>
                )}
              </p>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}