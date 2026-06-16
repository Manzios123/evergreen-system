// components/activities/activity-form.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Input from '@/components/ui/form/input';
import Textarea from '@/components/ui/form/textarea';
import Select from '@/components/ui/form/select';
import Alert from '@/components/ui/alert';
import { useApiQuery, useApiMutation } from '@/lib/hooks/use-api';
import { api } from '@/lib/api';
import { Activity, School } from '@/lib/types';
import { CalendarIcon, MapPinIcon } from '@heroicons/react/24/outline';

const optionalParticipantCount = z.preprocess(
  (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const numberValue = Number(value);
    return Number.isNaN(numberValue) ? value : numberValue;
  },
  z.number().int().min(0, 'Must be a non-negative whole number').nullable()
);

const activitySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  school_id: z.string().min(1, 'School is required'),
  scheduled_date: z.string().min(1, 'Date is required'),
  duration: z.number().min(0.5, 'Duration must be at least 0.5 hours'),
  number_of_participants: z.number().min(1, 'Number of students is required'),
  number_of_boys: optionalParticipantCount,
  number_of_girls: optionalParticipantCount,
  objectives: z.string().optional(),
  materials: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.number_of_boys !== null && data.number_of_girls !== null) {
    const splitTotal = data.number_of_boys + data.number_of_girls;
    if (splitTotal !== data.number_of_participants) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['number_of_girls'],
        message: 'Boys plus girls must equal total participants',
      });
    }
  }
});

type ActivityFormValues = z.input<typeof activitySchema>;
type ActivityFormData = z.output<typeof activitySchema>;

interface ActivityFormProps {
  activity?: Activity;
  onSubmitSuccess?: () => void;
}

export function ActivityForm({ activity, onSubmitSuccess }: ActivityFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: schools, isLoading: schoolsLoading } = useApiQuery<School[]>(
    ['schools'],
    () => api.get('/schools')
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ActivityFormValues, unknown, ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: activity ? {
      title: activity.title,
      description: activity.description,
      school_id: activity.school_id,
      scheduled_date: activity.scheduled_date?.split('T')[0],
      duration: 2,
      number_of_participants: activity.number_of_participants || 0,
      number_of_boys: activity.number_of_boys ?? null,
      number_of_girls: activity.number_of_girls ?? null,
      objectives: activity.volunteer_notes || '',
      materials: activity.assignment_notes || '',
    } : undefined,
  });

  const createMutation = useApiMutation(
    (data: ActivityFormData) => api.post('/activities', data)
  );

  const updateMutation = useApiMutation(
    (data: ActivityFormData) => api.put(`/activities/${activity!.id}`, data)
  );

  const onSubmit = async (data: ActivityFormData) => {
    setIsSubmitting(true);
    try {
      if (activity) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
      if (onSubmitSuccess) onSubmitSuccess();
    } catch (error) {
      console.error('Failed to save activity:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const mutation = activity ? updateMutation : createMutation;
  const participantTotal = Number(watch('number_of_participants') || 0);
  const boysCount = watch('number_of_boys');
  const girlsCount = watch('number_of_girls');
  const boysValue = typeof boysCount === 'number' ? boysCount : null;
  const girlsValue = typeof girlsCount === 'number' ? girlsCount : null;
  const splitTotal = (boysValue ?? 0) + (girlsValue ?? 0);
  const hasFullSplit = boysValue !== null && girlsValue !== null;

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {activity ? 'Edit Activity' : 'Create New Activity'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Fill in the details of your volunteering activity
            </p>
          </div>

          {mutation.error && (
            <Alert type="error">
              Failed to save activity: {mutation.error.message}
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-6">
            <Input
              label="Activity Title"
              {...register('title')}
              placeholder="e.g., Science Workshop for 5th Grade"
              error={errors.title?.message}
              required
            />

            <Textarea
              label="Description"
              {...register('description')}
              placeholder="Describe what you did during the activity..."
              rows={4}
              error={errors.description?.message}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Date"
                type="date"
                {...register('scheduled_date')}
                error={errors.scheduled_date?.message}
                leftIcon={<CalendarIcon className="h-5 w-5 text-gray-400" />}
                required
              />

              <Input
                label="Duration (hours)"
                type="number"
                step="0.5"
                min="0.5"
                {...register('duration', { valueAsNumber: true })}
                placeholder="e.g., 2.5"
                error={errors.duration?.message}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Number of Students"
                type="number"
                min="1"
                {...register('number_of_participants', { valueAsNumber: true })}
                placeholder="e.g., 25"
                error={errors.number_of_participants?.message}
                required
              />

              <Input
                label="Number of boys"
                type="number"
                min="0"
                {...register('number_of_boys', {
                  setValueAs: (value) => value === '' ? null : Number(value),
                })}
                placeholder="Leave blank if not recorded"
                error={errors.number_of_boys?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Number of girls"
                type="number"
                min="0"
                {...register('number_of_girls', {
                  setValueAs: (value) => value === '' ? null : Number(value),
                })}
                placeholder="Leave blank if not recorded"
                error={errors.number_of_girls?.message}
              />

              <Select
                label="School"
                {...register('school_id')}
                options={
                  schoolsLoading 
                    ? [] 
                    : (schools || [])
                        .filter((school): school is School & { id: string } => !!school.id)
                        .map((school) => ({
                          value: school.id,
                          label: school.name,
                        })) || []
                }
                error={errors.school_id?.message}
                required
                disabled={schoolsLoading}
              />
            </div>

            {hasFullSplit && (
              <p className={`text-sm ${splitTotal === participantTotal ? 'text-green-700' : 'text-red-700'}`}>
                Boys + girls: {splitTotal}
              </p>
            )}

            <Textarea
              label="Learning Objectives"
              {...register('objectives')}
              placeholder="What were the key learning objectives?"
              rows={3}
              error={errors.objectives?.message}
              helpText="Optional: List the main learning goals"
            />

            <Textarea
              label="Materials Used"
              {...register('materials')}
              placeholder="What materials or resources did you use?"
              rows={3}
              error={errors.materials?.message}
              helpText="Optional: List equipment, books, or other materials"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              loading={isSubmitting}
            >
              {activity ? 'Save Changes' : 'Create Activity'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
