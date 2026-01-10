// app/[locale]/coordinator/volunteers/[id]/page.tsx
'use client';

import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import DataTable from '@/components/ui/data-table';
import StatusBadge from '@/components/ui/status-badge';
import { Tabs } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/proggress';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import Alert from '@/components/ui/alert';
import EmptyState from '@/components/ui/empty-state';
import { useApiQuery } from '@/lib/hooks/use-api';
import { User, Activity, Survey, Photo } from '@/lib/types';
import { api } from '@/lib/api/api';
import {
  ArrowLeftIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
  DocumentTextIcon,
  PhotoIcon as PhotoIconOutline,
  ChartBarIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { format } from 'date-fns';

interface VolunteerProfilePageProps {
  params: {
    id: string;
  };
}

export default function VolunteerProfilePage({ params }: VolunteerProfilePageProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'surveys' | 'photos'>('overview');

  // Fetch volunteer details
  const { 
    data: volunteer, 
    isLoading: volunteerLoading, 
    error: volunteerError 
  } = useApiQuery<User>(
    ['volunteer', params.id],
    () => api.get(`/users/${params.id}`)
  );

  // Fetch volunteer activities
  const { 
    data: activities, 
    isLoading: activitiesLoading 
  } = useApiQuery<Activity[]>(
    ['volunteer-activities', params.id],
    () => api.get('/activities', { volunteerId: params.id })
  );

  // Fetch volunteer surveys
  const { 
    data: surveys, 
    isLoading: surveysLoading 
  } = useApiQuery<Survey[]>(
    ['volunteer-surveys', params.id],
    () => api.get('/surveys', { volunteerId: params.id })
  );

  // Fetch volunteer photos
  const { 
    data: photos, 
    isLoading: photosLoading 
  } = useApiQuery<Photo[]>(
    ['volunteer-photos', params.id],
    () => api.get('/photos', { volunteerId: params.id })
  );

  // Calculate statistics
  const stats = useMemo(() => {
    if (!activities || !surveys || !photos) return null;

    const totalActivities = activities.length;
    const completedActivities = activities.filter(a => a.status === 'completed').length;
    const pendingActivities = activities.filter(a => a.status === 'pending').length;
    const totalSurveys = surveys.length;
    const completedSurveys = surveys.filter(s => s.status === 'completed').length;
    const totalPhotos = photos.length;
    const approvedPhotos = photos.filter(p => p.status === 'approved').length;
    
    // Calculate total hours (assuming 2 hours per activity as a default)
    const totalHours = activities.length * 2;
    const engagementRate = totalActivities > 0 
      ? Math.round((completedActivities / totalActivities) * 100)
      : 0;

    return {
      totalActivities,
      completedActivities,
      pendingActivities,
      totalSurveys,
      completedSurveys,
      totalPhotos,
      approvedPhotos,
      totalHours,
      engagementRate,
    };
  }, [activities, surveys, photos]);

  // Activity columns for table
  const activityColumns = [
    {
      key: 'activity',
      header: 'Activity',
      sortable: true,
      render: (activity: Activity) => (
        <div className="flex items-start space-x-3">
          <div className="shrink-0">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-900 truncate">{activity.title}</p>
            <div className="flex flex-wrap gap-2 mt-1">
              <div className="flex items-center text-sm text-gray-500">
                <AcademicCapIcon className="h-3 w-3 mr-1" />
                {activity.school?.name || 'No school'}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <ClockIcon className="h-3 w-3 mr-1" />
                2 hours {/* Default duration */}
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (activity: Activity) => (
        <div className="text-sm text-gray-900">
          {format(new Date(activity.scheduled_date), 'MMM d, yyyy')}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (activity: Activity) => <StatusBadge status={activity.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (activity: Activity) => (
        <Link href={`/coordinator/activities/${activity.id}`}>
          <Button size="sm" variant="outline">
            View
          </Button>
        </Link>
      ),
    },
  ];

  // Survey columns for table
  const surveyColumns = [
    {
      key: 'survey',
      header: 'Survey',
      render: (survey: Survey) => (
        <div className="flex items-start space-x-3">
          <div className="shrink-0">
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <DocumentTextIcon className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-900 truncate">{survey.title || survey.template?.name}</p>
            <p className="text-sm text-gray-500 mt-1">
              {survey.template?.type === 'activity' ? 'Activity Survey' : 'Volunteer Feedback'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'activity',
      header: 'Activity',
      render: (survey: Survey) => (
        <div className="text-sm text-gray-900">
          {survey.activity?.title || 'General Survey'}
        </div>
      ),
    },
    {
      key: 'completed',
      header: 'Completed',
      render: (survey: Survey) => (
        <div className="text-sm text-gray-900">
          {survey.completed_at 
            ? format(new Date(survey.completed_at), 'MMM d, yyyy')
            : 'Not completed'
          }
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (survey: Survey) => <StatusBadge status={survey.status === 'completed' ? 'completed' : 'pending'} />,
    },
  ];

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <ChartBarIcon className="h-5 w-5" />,
      content: (
        <div className="space-y-6">
          {/* Stats Grid */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Hours</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      {stats.totalHours}
                    </p>
                  </div>
                  <ClockIcon className="h-8 w-8 text-gray-300" />
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Activities</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {stats.completedActivities}/{stats.totalActivities}
                    </p>
                  </div>
                  <CalendarIcon className="h-8 w-8 text-gray-300" />
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Surveys</p>
                    <p className="text-2xl font-bold text-purple-600 mt-1">
                      {stats.completedSurveys}/{stats.totalSurveys}
                    </p>
                  </div>
                  <DocumentTextIcon className="h-8 w-8 text-gray-300" />
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Engagement</p>
                    <p className="text-2xl font-bold text-orange-600 mt-1">
                      {stats.engagementRate}%
                    </p>
                  </div>
                  <ChartBarIcon className="h-8 w-8 text-gray-300" />
                </div>
                <Progress value={stats.engagementRate} className="mt-2" />
              </Card>
            </div>
          )}

          {/* Recent Activities */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
              <Link href={`/coordinator/volunteers/${params.id}/activities`}>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            {activities && activities.length > 0 ? (
              <Card>
                <DataTable
                  data={activities.slice(0, 5)}
                  columns={activityColumns}
                  onRowClick={(activity) => window.location.href = `/coordinator/activities/${activity.id}`}
                />
              </Card>
            ) : (
              <EmptyState
                icon={<CalendarIcon className="h-12 w-12 text-gray-400" />}
                title="No activities yet"
                description="This volunteer hasn't completed any activities yet."
                action={{
                  label: 'Assign Activity',
                  onClick: () => window.location.href = `/coordinator/assign?volunteer=${params.id}`,
                }}
              />
            )}
          </div>

          {/* Recent Surveys */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Surveys</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('surveys')}
              >
                View All
              </Button>
            </div>
            {surveys && surveys.length > 0 ? (
              <Card>
                <DataTable
                  data={surveys.slice(0, 5)}
                  columns={surveyColumns}
                />
              </Card>
            ) : (
              <EmptyState
                icon={<DocumentTextIcon className="h-12 w-12 text-gray-400" />}
                title="No surveys yet"
                description="This volunteer hasn't completed any surveys yet."
              />
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'activities',
      label: 'Activities',
      icon: <CalendarIcon className="h-5 w-5" />,
      count: activities?.length || 0,
      content: (
        <div className="space-y-4">
          {activities && activities.length > 0 ? (
            <Card>
              <DataTable
                data={activities}
                columns={activityColumns}
                onRowClick={(activity) => window.location.href = `/coordinator/activities/${activity.id}`}
              />
            </Card>
          ) : (
            <EmptyState
              icon={<CalendarIcon className="h-12 w-12 text-gray-400" />}
              title="No activities found"
              description="This volunteer hasn't completed any activities yet."
              action={{
                label: 'Assign First Activity',
                onClick: () => window.location.href = `/coordinator/assign?volunteer=${params.id}`,
              }}
            />
          )}
        </div>
      ),
    },
    {
      id: 'surveys',
      label: 'Surveys',
      icon: <DocumentTextIcon className="h-5 w-5" />,
      count: surveys?.length || 0,
      content: (
        <div className="space-y-4">
          {surveys && surveys.length > 0 ? (
            <Card>
              <DataTable
                data={surveys}
                columns={surveyColumns}
              />
            </Card>
          ) : (
            <EmptyState
              icon={<DocumentTextIcon className="h-12 w-12 text-gray-400" />}
              title="No surveys found"
              description="This volunteer hasn't completed any surveys yet."
            />
          )}
        </div>
      ),
    },
    {
      id: 'photos',
      label: 'Photos',
      icon: <PhotoIconOutline className="h-5 w-5" />,
      count: photos?.length || 0,
      content: (
        <div className="space-y-4">
          {photos && photos.length > 0 ? (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => (
                  <Card key={photo.id} className="overflow-hidden">
                    <div className="aspect-square relative">
                      <img
                        src={photo.thumbnailUrl || photo.url}
                        alt={photo.description || 'Volunteer photo'}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-opacity" />
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between">
                        <StatusBadge 
                          status={photo.status === 'approved' ? 'approved' : 
                                  photo.status === 'rejected' ? 'rejected' : 'pending'} 
                          size="sm" 
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(photo.url, '_blank')}
                        >
                          View
                        </Button>
                      </div>
                      {photo.description && (
                        <p className="text-sm text-gray-500 mt-2 truncate">
                          {photo.description}
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<PhotoIconOutline className="h-12 w-12 text-gray-400" />}
              title="No photos found"
              description="This volunteer hasn't uploaded any photos yet."
            />
          )}
        </div>
      ),
    },
  ];

  const isLoading = volunteerLoading || activitiesLoading || surveysLoading || photosLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader type="dashboard" />
      </div>
    );
  }

  if (volunteerError || !volunteer) {
    return (
      <Alert
        title="Volunteer not found"
        type="error"
      >
        The requested volunteer could not be loaded.
        <div className="mt-4">
          <Link href="/coordinator/volunteers">
            <Button variant="outline">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Volunteers
            </Button>
          </Link>
        </div>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
        <div className="flex-1">
          <Link
            href="/coordinator/volunteers"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Volunteers
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-6">
            <div className="shrink-0 mb-4 sm:mb-0">
              <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 text-3xl font-bold">
                  {volunteer.full_name?.charAt(0) || 'V'}
                </span>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{volunteer.full_name}</h1>
                  <div className="flex items-center mt-2 space-x-4">
                    <div className="flex items-center">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-gray-600">{volunteer.email}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 sm:mt-0 flex space-x-3">
                  <Link href={`/coordinator/volunteers/${volunteer.id}/edit`}>
                    <Button variant="outline" icon={<PencilIcon className="h-4 w-4" />}>
                      Edit
                    </Button>
                  </Link>
                  <Link href={`/coordinator/assign?volunteer=${volunteer.id}`}>
                    <Button variant="default">
                      Assign Activity
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Joined</p>
                    <p className="text-sm text-gray-900">
                      {volunteer.created_at 
                        ? format(new Date(volunteer.created_at), 'MMM d, yyyy')
                        : 'Unknown'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Role</p>
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      {volunteer.role}
                    </span>
                  </div>
                </div>
                
                {volunteer.pilot_id && (
                  <div className="flex items-center">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Pilot ID</p>
                      <p className="text-sm text-gray-900">{volunteer.pilot_id}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as typeof activeTab)}
        variant="underline"
      />
    </div>
  );
}