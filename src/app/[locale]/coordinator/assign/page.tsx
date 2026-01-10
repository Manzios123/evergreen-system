// app/[locale]/coordinator/assign/page.tsx
'use client';

import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/alert';
import Input from '@/components/ui/form/input';
import Textarea from '@/components/ui/form/textarea';
import Select from '@/components/ui/form/select';
import { useApiQuery, useApiMutation } from '@/lib/hooks/use-api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ArrowLeft,
  Calendar,
  Users,
  Building,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/api';
import { useState } from 'react';

const assignActivitySchema = z.object({
  activityTemplateId: z.string().min(1, 'Template is required'),
  schoolId: z.string().min(1, 'School is required'),
  volunteerId: z.string().min(1, 'Volunteer is required'),
  scheduledDate: z.string().min(1, 'Date is required'),
  description: z.string().optional(),
  assignmentNotes: z.string().optional(),
  numberOfParticipants: z.number().min(1, 'Number of participants is required'),
});

type AssignActivityFormData = z.infer<typeof assignActivitySchema>;

interface ActivityTemplate {
  id: string;
  name: string;
  description: string;
  duration?: number;
}

interface Volunteer {
  id: string;
  full_name: string;
  email: string;
}

interface School {
  id: string;
  name: string;
  address?: string;
}

export default function AssignActivityPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch data for dropdowns
  const { data: templates, isLoading: templatesLoading } = useApiQuery<ActivityTemplate[]>(
    ['activity-templates'],
    () => api.get<ActivityTemplate[]>('/activity-templates')
  );

  const { data: volunteers, isLoading: volunteersLoading } = useApiQuery<Volunteer[]>(
    ['volunteers'],
    () => api.get<Volunteer[]>('/users/volunteers')
  );

  const { data: schools, isLoading: schoolsLoading } = useApiQuery<School[]>(
    ['schools'],
    () => api.get<School[]>('/schools')
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<AssignActivityFormData>({
    resolver: zodResolver(assignActivitySchema),
    defaultValues: {
      numberOfParticipants: 25,
    },
  });

  const assignMutation = useApiMutation(
    (data: AssignActivityFormData) => api.post('/activities', data)
  );

  const onSubmit = async (data: AssignActivityFormData) => {
    try {
      await assignMutation.mutateAsync(data);
      router.push('/coordinator/activities');
      router.refresh();
    } catch (error) {
      console.error('Failed to assign activity:', error);
    }
  };

  // Get selected template details
  const selectedTemplateId = watch('activityTemplateId');
  const selectedTemplate = templates?.find(t => t.id === selectedTemplateId);

  // Create options with default placeholder option
  const templateOptions = [
    { value: '', label: 'Select a template...' },
    ...(templates?.map(template => ({
      value: template.id,
      label: template.name,
    })) || [])
  ];

  const schoolOptions = [
    { value: '', label: 'Select a school...' },
    ...(schools?.map(school => ({
      value: school.id,
      label: school.name,
    })) || [])
  ];

  const volunteerOptions = [
    { value: '', label: 'Select a volunteer...' },
    ...(volunteers?.map(volunteer => ({
      value: volunteer.id,
      label: volunteer.full_name,
    })) || [])
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/coordinator/activities"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Activities
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Assign New Activity</h1>
        <p className="mt-1 text-sm text-gray-500">
          Assign a volunteering activity to a volunteer
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Assignment Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Activity Details
                </h2>
                
                <div className="space-y-4">
                  <Select
                    label="Activity Template *"
                    {...register('activityTemplateId')}
                    options={templateOptions}
                    error={errors.activityTemplateId?.message}
                    required
                    disabled={templatesLoading}
                  />

                  {selectedTemplate && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Template Description
                      </h4>
                      <p className="text-sm text-gray-600">
                        {selectedTemplate.description}
                      </p>
                      {selectedTemplate.duration && (
                        <p className="text-sm text-gray-500 mt-1">
                          Estimated duration: {selectedTemplate.duration} hours
                        </p>
                      )}
                    </div>
                  )}

                  <Textarea
                    label="Description (Optional)"
                    {...register('description')}
                    placeholder="Add any additional details or context for this specific activity..."
                    rows={3}
                    error={errors.description?.message}
                    helpText="This will override the template description"
                  />
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Schedule & Location
                </h2>
                
                <div className="space-y-4">
                  <Input
                    label="Activity Date *"
                    type="date"
                    {...register('scheduledDate')}
                    error={errors.scheduledDate?.message}
                    leftIcon={<Calendar className="h-5 w-5 text-gray-400" />}
                    className="pl-10"
                    required
                  />

                  <Select
                    label="School *"
                    {...register('schoolId')}
                    options={schoolOptions}
                    error={errors.schoolId?.message}
                    required
                    disabled={schoolsLoading}
                  />

                  <Input
                    label="Number of Participants *"
                    type="number"
                    min="1"
                    {...register('numberOfParticipants', { valueAsNumber: true })}
                    placeholder="e.g., 25"
                    error={errors.numberOfParticipants?.message}
                    leftIcon={<Users className="h-5 w-5 text-gray-400" />}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Volunteer & Assignment Notes */}
          <div className="space-y-6">
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Assign to Volunteer
                </h2>
                
                <Select
                  label="Volunteer *"
                  {...register('volunteerId')}
                  options={volunteerOptions}
                  error={errors.volunteerId?.message}
                  required
                  disabled={volunteersLoading}
                />

                {volunteers && volunteers.length === 0 && (
                  <div className="mt-4">
                    <Alert
                      type="warning"
                      title="No volunteers available"
                    >
                      You need to add volunteers before assigning activities.
                    </Alert>
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Assignment Notes
                </h2>
                
                <Textarea
                  label="Notes for Volunteer"
                  {...register('assignmentNotes')}
                  placeholder="Add any specific instructions or expectations for the volunteer..."
                  rows={4}
                  error={errors.assignmentNotes?.message}
                  helpText="These notes will be visible to the volunteer"
                />
              </div>
            </Card>

            {/* Submit Card */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Review & Assign
                </h2>
                
                {assignMutation.error && (
                  <div className="mb-4">
                    <Alert
                      type="error"
                      title="Failed to assign activity"
                    >
                      {(assignMutation.error as any).message || 'An error occurred'}
                    </Alert>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Activity:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedTemplate?.name || 'Not selected'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">School:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {schools?.find(s => s.id === watch('schoolId'))?.name || 'Not selected'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Volunteer:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {volunteers?.find(v => v.id === watch('volunteerId'))?.full_name || 'Not selected'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Date:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {watch('scheduledDate') 
                        ? new Date(watch('scheduledDate')).toLocaleDateString()
                        : 'Not selected'
                      }
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <Button
                    type="submit"
                    variant="default"
                    className="w-full"
                    loading={isSubmitting || assignMutation.isPending}
                    disabled={
                      !watch('activityTemplateId') ||
                      !watch('schoolId') ||
                      !watch('volunteerId') ||
                      !watch('scheduledDate') ||
                      isSubmitting
                    }
                  >
                    Assign Activity
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}