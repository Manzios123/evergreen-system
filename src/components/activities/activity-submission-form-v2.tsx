// apps/evergreen-web/src/components/activities/activity-submission-form-v2.tsx - FIXED VERSION
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
  PhotoIcon,
  VideoCameraIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { SaveIcon, Quote } from 'lucide-react';
import { MediaUpload } from '@/components/activities/media-upload';
import type { MediaItem } from '@/components/activities/media-upload';

// Helper function to normalize engagement level
function normalizeEngagementLevel(level?: string | number): 'low' | 'medium' | 'high' {
  if (typeof level === 'number') {
    if (level <= 3) return 'low';
    if (level <= 7) return 'medium';
    return 'high';
  }
  if (level === 'low' || level === 'medium' || level === 'high') {
    return level;
  }
  return 'medium';
}

// Enhanced schema with student quotes - SIMPLIFIED to avoid type issues
const submissionSchema = z.object({
  actual_date: z.string().min(1, 'Actual date is required'),
  number_of_participants: z.union([
    z.string().min(1, 'Number of participants is required').transform((val) => Number(val)),
    z.number().min(1, 'Number of participants is required')
  ]).refine((val) => !isNaN(val) && val >= 1, {
    message: 'Number of participants must be at least 1'
  }).refine((val) => !isNaN(val) && val <= 500, {
    message: 'Maximum 500 participants allowed'
  }),
  engagement_level: z.enum(['low', 'medium', 'high']),
  volunteer_notes: z.string()
    .min(1, 'Please provide activity notes')
    .max(5000, 'Notes cannot exceed 5000 characters'),
  student_quotes: z.string()
    .max(2000, 'Student quotes cannot exceed 2000 characters')
    .optional(),
});

type SubmissionFormData = z.infer<typeof submissionSchema>;

interface ActivitySubmissionFormV2Props {
  activity: {
    id: string;
    title: string;
    description: string;
    status: string;
    scheduled_date: string;
    actual_date?: string;
    volunteer_notes?: string;
    student_quotes?: string;
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
    volunteer_id: string;
  };
  currentUserId?: string;
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
}

type FormStep = 'details' | 'notes' | 'media' | 'review';

export function ActivitySubmissionFormV2({ 
  activity, 
  currentUserId,
  onSubmitSuccess, 
  onCancel 
}: ActivitySubmissionFormV2Props) {
  const [currentStep, setCurrentStep] = useState<FormStep>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionType, setSubmissionType] = useState<'save' | 'submit'>('save');
  const [isOwner, setIsOwner] = useState(true);
  const [uploadedMedia, setUploadedMedia] = useState<MediaItem[]>([]);
  const [formProgress, setFormProgress] = useState(0);

  const steps = [
    { id: 'details' as FormStep, title: 'Activity Details', description: 'Basic information', icon: CalendarIcon },
    { id: 'notes' as FormStep, title: 'Notes & Quotes', description: 'Observations and student feedback', icon: Quote },
    { id: 'media' as FormStep, title: 'Media', description: 'Photos and videos', icon: PhotoIcon },
    { id: 'review' as FormStep, title: 'Review & Submit', description: 'Final review', icon: CheckCircleIcon },
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const totalSteps = steps.length;

  useEffect(() => {
    if (currentUserId && activity.volunteer_id) {
      setIsOwner(currentUserId === activity.volunteer_id);
    }
  }, [currentUserId, activity.volunteer_id]);

  useEffect(() => {
    // Calculate progress
    const progress = ((currentStepIndex + 1) / totalSteps) * 100;
    setFormProgress(progress);
  }, [currentStepIndex, totalSteps]);

  // Custom resolver to handle the type mismatch
  const customResolver = async (data: any, context: any, options: any) => {
    try {
      // Parse the data with our schema
      const result = submissionSchema.safeParse(data);
      
      if (!result.success) {
        // Use 'issues' property (not 'errors') for ZodError
        return {
          values: {},
          errors: result.error.issues.reduce((acc: any, error) => {
            const path = error.path.join('.');
            if (!acc[path]) {
              acc[path] = {
                type: error.code,
                message: error.message,
              };
            }
            return acc;
          }, {} as any),
        };
      }
      
      return {
        values: result.data,
        errors: {},
      };
    } catch (error) {
      console.error('Validation error:', error);
      return {
        values: {},
        errors: {},
      };
    }
  };

  const { 
    register, 
    handleSubmit, 
    formState: { errors, isValid }, 
    watch, 
    reset,
    trigger,
    setValue,
    getValues 
  } = useForm<SubmissionFormData>({
    resolver: customResolver as any, // Use custom resolver to bypass type issues
    mode: 'onChange',
    defaultValues: {
      actual_date: activity.actual_date || activity.scheduled_date || new Date().toISOString().split('T')[0],
      number_of_participants: activity.number_of_participants || 1,
      engagement_level: normalizeEngagementLevel(activity.engagement_level),
      volunteer_notes: activity.volunteer_notes || '',
      student_quotes: activity.student_quotes || '',
    },
  });

  // Custom submit handler with proper typing
  const handleFormSubmit: SubmitHandler<SubmissionFormData> = async (data) => {
    if (!isOwner && submissionType === 'save') {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Ensure number_of_participants is a number
      const processedData = {
        ...data,
        number_of_participants: typeof data.number_of_participants === 'string' 
          ? parseInt(data.number_of_participants, 10) 
          : data.number_of_participants,
      };
      
      if (submissionType === 'save') {
        await saveDraftMutation.mutateAsync(processedData);
      } else {
        await submitForApprovalMutation.mutateAsync(processedData);
      }
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveDraftMutation = useApiMutation(
    (data: SubmissionFormData) => {
      const updateData: UpdateActivityData & { student_quotes?: string } = {
        actual_date: data.actual_date,
        number_of_participants: typeof data.number_of_participants === 'string' 
          ? parseInt(data.number_of_participants, 10) 
          : data.number_of_participants,
        engagement_level: data.engagement_level,
        volunteer_notes: data.volunteer_notes,
        student_quotes: data.student_quotes,
        status: 'draft',
      };
      
      return activitiesApi.update(activity.id, updateData);
    },
    {
      mutationKey: ['save-activity-draft', activity.id],
      invalidateQueries: [['activity', activity.id]],
      onSuccess: (data) => {
        if (data.data) {
          // Reset form with updated values
          setValue('actual_date', data.data.actual_date || activity.scheduled_date);
          setValue('number_of_participants', data.data.number_of_participants || 1);
          setValue('engagement_level', normalizeEngagementLevel(data.data.engagement_level));
          setValue('volunteer_notes', data.data.volunteer_notes || '');
          setValue('student_quotes', data.data.student_quotes || '');
        }
      },
    }
  );

  const submitForApprovalMutation = useApiMutation(
    (data: SubmissionFormData) => {
      const updateData: UpdateActivityData & { student_quotes?: string } = {
        actual_date: data.actual_date,
        number_of_participants: typeof data.number_of_participants === 'string' 
          ? parseInt(data.number_of_participants, 10) 
          : data.number_of_participants,
        engagement_level: data.engagement_level,
        volunteer_notes: data.volunteer_notes,
        student_quotes: data.student_quotes,
      };
      
      return activitiesApi.update(activity.id, updateData)
        .then(() => activitiesApi.submit(activity.id))
        .catch(() => activitiesApi.submit(activity.id));
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

  const engagementOptions = [
    { value: 'low', label: 'Low (1-3)', description: 'Minimal student participation' },
    { value: 'medium', label: 'Medium (4-7)', description: 'Moderate engagement' },
    { value: 'high', label: 'High (8-10)', description: 'Excellent participation' },
  ];

  const goToNextStep = async () => {
    // Validate current step before proceeding
    let fieldsToValidate: (keyof SubmissionFormData)[] = [];
    
    switch (currentStep) {
      case 'details':
        fieldsToValidate = ['actual_date', 'number_of_participants', 'engagement_level'];
        break;
      case 'notes':
        fieldsToValidate = ['volunteer_notes'];
        break;
    }
    
    if (fieldsToValidate.length > 0) {
      const isValid = await trigger(fieldsToValidate);
      if (!isValid) return;
    }
    
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < totalSteps) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const goToPreviousStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const engagementValue = watch('engagement_level');
  const isSubmittingForm = isSubmitting || saveDraftMutation.isPending || submitForApprovalMutation.isPending;

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="overflow-hidden">
        {/* Progress Header */}
        <div className="border-b">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Complete Activity Report</h2>
                <p className="text-sm text-gray-500">
                  Step {currentStepIndex + 1} of {totalSteps}: {steps[currentStepIndex].title}
                </p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  activity.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                  activity.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {activity.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="p-6">
            {/* Step Content */}
            {currentStep === 'details' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">When did the activity take place?</h3>
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
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">How many students participated?</h3>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserGroupIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      type="number"
                      min="1"
                      max="500"
                      {...register('number_of_participants', {
                        setValueAs: (value) => value === '' ? 0 : Number(value),
                      })}
                      placeholder="e.g., 25"
                      error={errors.number_of_participants?.message}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall student engagement?</h3>
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
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 'notes' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Notes & Observations</h3>
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
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2 text-purple-500" />
                    Student Quotes & Feedback
                  </h3>
                  <div className="relative">
                    <div className="absolute top-3 left-3">
                      <Quote className="h-5 w-5 text-purple-400" />
                    </div>
                    <Textarea
                      {...register('student_quotes')}
                      placeholder="Example: 'I learned that teamwork helps us solve problems faster!' - Student name, Grade 5"
                      rows={4}
                      error={errors.student_quotes?.message}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 'media' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Photos & Videos</h3>
                  <MediaUpload
                    activityId={activity.id}
                    maxItems={4}
                    maxImages={3}
                    maxVideos={1}
                    maxSizeMB={50}
                    allowedTypes={['photo', 'video']}
                    onMediaChange={setUploadedMedia}
                    compressionLevel="medium"
                    disabled={false}
                  />
                </div>
              </div>
            )}

            {currentStep === 'review' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Review Your Submission</h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Activity Title</p>
                        <p className="text-sm font-semibold">{activity.title}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Actual Date</p>
                        <p className="text-sm">
                          {watch('actual_date') ? new Date(watch('actual_date')).toLocaleDateString() : 'Not set'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Participants</p>
                        <p className="text-sm">{watch('number_of_participants') || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Engagement Level</p>
                        <p className="text-sm capitalize">{watch('engagement_level') || 'Not set'}</p>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <p className="text-sm font-medium text-gray-500 mb-2">Activity Notes</p>
                      <div className="bg-white p-3 rounded border text-sm">
                        {watch('volunteer_notes') || 'No notes provided'}
                      </div>
                    </div>

                    {watch('student_quotes') && (
                      <div className="border-t pt-4">
                        <p className="text-sm font-medium text-gray-500 mb-2">Student Quotes</p>
                        <div className="bg-purple-50 p-3 rounded border border-purple-200 text-sm">
                          {watch('student_quotes')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
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
                </div>
              </div>
            )}

            {/* Error/Success Alerts */}
            <div className="mt-6">
              {(saveDraftMutation.error || submitForApprovalMutation.error) && (
                <div className="mb-4">
                  <Alert type="error">
                    {submissionType === 'save' 
                      ? 'Failed to save draft. Please try again.'
                      : 'Failed to submit for approval. Please try again.'
                    }
                  </Alert>
                </div>
              )}

              {saveDraftMutation.isSuccess && submissionType === 'save' && (
                <div className="mb-4">
                  <Alert type="success">
                    Draft saved successfully! You can continue editing or submit for approval.
                  </Alert>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t px-6 py-4 bg-gray-50">
            <div className="flex justify-between items-center">
              <div>
                {currentStep !== 'details' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goToPreviousStep}
                    disabled={isSubmittingForm}
                    className="flex items-center"
                  >
                    <ArrowLeftIcon className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                )}
              </div>

              <div className="flex space-x-3">
                {onCancel && currentStep === 'details' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmittingForm}
                  >
                    Cancel
                  </Button>
                )}

                {currentStep !== 'review' ? (
                  <Button
                    type="button"
                    variant="default"
                    onClick={goToNextStep}
                    disabled={isSubmittingForm}
                    className="flex items-center"
                  >
                    Continue
                    <ArrowRightIcon className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant={submissionType === 'submit' ? 'default' : 'secondary'}
                    loading={isSubmittingForm}
                    disabled={!isValid || (submissionType === 'save' && !isOwner)}
                    className="min-w-32"
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
                )}
              </div>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
