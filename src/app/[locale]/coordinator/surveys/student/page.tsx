// app/[locale]/coordinator/surveys/student/page.tsx
'use client';

import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import DataTable from '@/components/ui/data-table';
import StatusBadge from '@/components/ui/status-badge';
import SearchFilter from '@/components/ui/search-filter';
import Tabs from '@/components/ui/tabs';
import EmptyState from '@/components/ui/empty-state';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import Alert from '@/components/ui/alert';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import { useApiQuery, useApiMutation } from '@/lib/hooks/use-api';
import { Survey, SurveyResponse, ActivityStatus, Activity, ApiResponse } from '@/lib/types';
import { api } from '@/lib/api';
import {
  DocumentTextIcon,
  ChartBarIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  ArrowDownTrayIcon as DownloadIcon,
} from '@heroicons/react/24/outline';
import { useState, useMemo } from 'react';
import Link from 'next/link';

// Create a custom type that extends Survey with coordinator-specific properties
interface CoordinatorSurvey {
  id: string;
  title?: string;
  description?: string;
  status: 'pending' | 'overdue' | 'completed';
  due_date?: string;
  completed_at?: string;
  createdAt?: string;
  updatedAt?: string;
  template: {
    id: string;
    name: string;
    description?: string;
    type: 'student' | 'volunteer' | 'activity' | 'general';
  };
  activity?: Activity & {
    school?: {
      name: string;
    };
  };
  responses?: any[];
  responseCount?: number;
}

// Helper function to map survey status to ActivityStatus for StatusBadge
const mapSurveyStatus = (status: string): ActivityStatus => {
  switch (status) {
    case 'pending':
    case 'overdue':
      return 'pending';
    case 'completed':
      return 'completed';
    default:
      return 'pending';
  }
};

export default function StudentSurveysPage() {
  const [selectedTab, setSelectedTab] = useState<'pending' | 'completed' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSurvey, setSelectedSurvey] = useState<CoordinatorSurvey | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionFeedback, setRejectionFeedback] = useState('');

  // Fetch student surveys
  const {
    data: surveys = [],
    isLoading,
    error,
    refetch,
  } = useApiQuery<CoordinatorSurvey[]>(
    ['surveys', 'student', selectedTab],
    async () => {
      try {
        // Using the base api.get method with proper endpoint
        const response = await api.get<ApiResponse<CoordinatorSurvey[]>>('/surveys', {
          type: 'student',
          status: selectedTab === 'all' ? undefined : selectedTab,
        });
        
        // Type guard to check if response has data property
        if (response && typeof response === 'object' && 'data' in response) {
          return (response as ApiResponse<CoordinatorSurvey[]>).data || [];
        }
        
        // If response is already an array
        if (Array.isArray(response)) {
          return response;
        }
        
        return [];
      } catch (err) {
        console.error('Error fetching surveys:', err);
        return [];
      }
    },
    {
      enabled: true,
    }
  );

  // Fetch survey responses for stats
  const { data: surveyResponses = [] } = useApiQuery<SurveyResponse[]>(
    ['survey-responses', 'student'],
    async () => {
      try {
        const response = await api.get<ApiResponse<SurveyResponse[]>>('/survey-responses', {
          type: 'student',
        });
        
        // Type guard to check if response has data property
        if (response && typeof response === 'object' && 'data' in response) {
          return (response as ApiResponse<SurveyResponse[]>).data || [];
        }
        
        // If response is already an array
        if (Array.isArray(response)) {
          return response;
        }
        
        return [];
      } catch (err) {
        console.error('Error fetching survey responses:', err);
        return [];
      }
    }
  );

  const approveMutation = useApiMutation(
    async (surveyId: string) => {
      return await api.patch(`/surveys/${surveyId}`, { status: 'completed' });
    }
  );

  const rejectMutation = useApiMutation(
    async (data: { surveyId: string; feedback: string }) => {
      return await api.patch(`/surveys/${data.surveyId}`, {
        status: 'rejected',
        feedback: data.feedback,
      });
    }
  );

  const columns = [
    {
      key: 'survey',
      header: 'Survey',
      sortable: true,
      render: (survey: CoordinatorSurvey) => (
        <div className="flex items-start space-x-3">
          <div className="shrink-0">
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <DocumentTextIcon className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-900 truncate">
              {survey.title || survey.template?.name || survey.description || 'Untitled Survey'}
            </p>
            <div className="flex flex-wrap gap-2 mt-1">
              <div className="flex items-center text-sm text-gray-500">
                <BuildingOfficeIcon className="h-3 w-3 mr-1" />
                {survey.activity?.school?.name || 'No school'}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <UserGroupIcon className="h-3 w-3 mr-1" />
                {survey.responseCount || (Array.isArray(survey.responses) ? survey.responses.length : 0)} responses
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'activity',
      header: 'Activity',
      sortable: true,
      render: (survey: CoordinatorSurvey) => (
        <div className="text-sm text-gray-900">
          {survey.activity?.title || 'Not linked to activity'}
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (survey: CoordinatorSurvey) => {
        const date = survey.completed_at || survey.createdAt;
        return (
          <div className="flex items-center text-sm text-gray-900">
            <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
            {date ? new Date(date).toLocaleDateString() : 'N/A'}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (survey: CoordinatorSurvey) => (
        <StatusBadge status={mapSurveyStatus(survey.status)} />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (survey: CoordinatorSurvey) => (
        <div className="flex space-x-2">
          <Link href={`/coordinator/surveys/student/${survey.id}`}>
            <Button
              size="sm"
              variant="outline"
              icon={<EyeIcon className="h-4 w-4" />}
            >
              View
            </Button>
          </Link>

          {(survey.status === 'pending' || survey.status === 'overdue') && (
            <>
              <Button
                size="sm"
                variant="default"
                icon={<CheckIcon className="h-4 w-4" />}
                onClick={() => {
                  setSelectedSurvey(survey);
                  setShowApproveDialog(true);
                }}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                icon={<XMarkIcon className="h-4 w-4" />}
                onClick={() => {
                  setSelectedSurvey(survey);
                  setShowRejectDialog(true);
                }}
              >
                Reject
              </Button>
            </>
          )}

          {survey.status === 'completed' && (
            <Button
              size="sm"
              variant="outline"
              icon={<DownloadIcon className="h-4 w-4" />}
              onClick={async () => {
                try {
                  // Create export job for this survey
                  const response = await api.post<ApiResponse<{ downloadUrl: string }>>('/exports', {
                    type: 'surveys',
                    format: 'excel',
                    filters: { surveyId: survey.id },
                  });
                  
                  // Type guard for response
                  if (response && typeof response === 'object') {
                    const apiResponse = response as ApiResponse<{ downloadUrl: string }>;
                    if (apiResponse.data?.downloadUrl) {
                      // Trigger download
                      window.open(apiResponse.data.downloadUrl, '_blank');
                    }
                  }
                } catch (error) {
                  console.error('Failed to export:', error);
                }
              }}
            >
              Export
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Filter surveys based on search term and selected tab
  const filteredSurveys = useMemo(() => {
    let filtered = surveys;

    // Apply tab filter
    if (selectedTab === 'pending') {
      filtered = filtered.filter(s => s.status === 'pending' || s.status === 'overdue');
    } else if (selectedTab === 'completed') {
      filtered = filtered.filter(s => s.status === 'completed');
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(survey => {
        return (
          (survey.title?.toLowerCase().includes(term)) ||
          (survey.template?.name?.toLowerCase().includes(term)) ||
          (survey.description?.toLowerCase().includes(term)) ||
          (survey.activity?.title?.toLowerCase().includes(term)) ||
          (survey.activity?.school?.name?.toLowerCase().includes(term))
        );
      });
    }

    return filtered;
  }, [surveys, selectedTab, searchTerm]);

  const tabs = [
    {
      id: 'pending',
      label: 'Pending Review',
      count: surveys.filter(s => s.status === 'pending' || s.status === 'overdue').length,
      content: (
        <div className="space-y-4">
          {filteredSurveys.filter(s => s.status === 'pending' || s.status === 'overdue').length > 0 ? (
            <Card>
              <DataTable
                data={filteredSurveys.filter(s => s.status === 'pending' || s.status === 'overdue')}
                columns={columns}
                emptyMessage="No surveys pending review"
              />
            </Card>
          ) : (
            <EmptyState
              icon={<CheckIcon className="h-12 w-12 text-gray-400" />}
              title="No surveys pending review"
              description="All student surveys have been reviewed and processed."
            />
          )}
        </div>
      ),
    },
    {
      id: 'completed',
      label: 'Completed',
      count: surveys.filter(s => s.status === 'completed').length,
      content: (
        <div className="space-y-4">
          {filteredSurveys.filter(s => s.status === 'completed').length > 0 ? (
            <Card>
              <DataTable
                data={filteredSurveys.filter(s => s.status === 'completed')}
                columns={columns}
                emptyMessage="No completed surveys"
              />
            </Card>
          ) : (
            <EmptyState
              icon={<DocumentTextIcon className="h-12 w-12 text-gray-400" />}
              title="No completed surveys"
              description="Approved student surveys will appear here."
            />
          )}
        </div>
      ),
    },
    {
      id: 'all',
      label: 'All Surveys',
      count: surveys.length,
      content: (
        <div className="space-y-4">
          {filteredSurveys.length > 0 ? (
            <Card>
              <DataTable
                data={filteredSurveys}
                columns={columns}
                emptyMessage="No student surveys found"
              />
            </Card>
          ) : (
            <EmptyState
              icon={<DocumentTextIcon className="h-12 w-12 text-gray-400" />}
              title="No student surveys found"
              description="Student surveys will appear here once completed."
            />
          )}
        </div>
      ),
    },
  ];

  // Calculate statistics
  const stats = useMemo(() => {
    const totalSurveys = surveys.length;
    const pendingSurveysCount = surveys.filter(s => s.status === 'pending' || s.status === 'overdue').length;
    const completedSurveysCount = surveys.filter(s => s.status === 'completed').length;
    const totalResponses = surveyResponses.length;

    // Calculate average rating from survey responses
    let totalRating = 0;
    let ratingCount = 0;
    
    surveyResponses.forEach(response => {
      const responses = response.responses || {};
      Object.values(responses).forEach(value => {
        if (typeof value === 'number') {
          totalRating += value;
          ratingCount++;
        }
      });
    });
    
    const averageRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : '0.0';

    return {
      totalSurveys,
      pendingSurveys: pendingSurveysCount,
      completedSurveys: completedSurveysCount,
      totalResponses,
      averageRating,
    };
  }, [surveys, surveyResponses]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader type="card" />
        <SkeletonLoader type="card" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        title="Unable to load student surveys"
        onClose={() => refetch()}
      >
        There was an error loading student surveys. Please try again.
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Surveys</h1>
          <p className="mt-1 text-sm text-gray-500">
            Review and manage student survey responses
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <SearchFilter
            placeholder="Search surveys by title, school, or activity..."
            onSearch={setSearchTerm}
          />
          <Button
            variant="default"
            icon={<DownloadIcon className="h-5 w-5" />}
            onClick={async () => {
              try {
                // Create export job for all student surveys
                const response = await api.post<ApiResponse<{ downloadUrl: string }>>('/exports', {
                  type: 'surveys',
                  format: 'excel',
                  filters: { type: 'student' },
                });
                
                // Type guard for response
                if (response && typeof response === 'object') {
                  const apiResponse = response as ApiResponse<{ downloadUrl: string }>;
                  if (apiResponse.data?.downloadUrl) {
                    // Trigger download
                    window.open(apiResponse.data.downloadUrl, '_blank');
                  }
                }
              } catch (error) {
                console.error('Failed to export:', error);
              }
            }}
          >
            Export All
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Surveys</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalSurveys}
                </p>
              </div>
              <DocumentTextIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {stats.pendingSurveys}
                </p>
              </div>
              <StatusBadge status="pending" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Responses</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {stats.totalResponses}
                </p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg. Rating</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {stats.averageRating}
                </p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={selectedTab}
        onTabChange={(tabId) => setSelectedTab(tabId as 'pending' | 'completed' | 'all')}
        variant="pills"
      />

      {/* Approval Dialog */}
      {showApproveDialog && (
        <ConfirmationDialog
          open={showApproveDialog}
          onClose={() => {
            setShowApproveDialog(false);
            setSelectedSurvey(null);
          }}
          onConfirm={async () => {
            if (!selectedSurvey) return;
            try {
              await approveMutation.mutateAsync(selectedSurvey.id);
              refetch();
              setShowApproveDialog(false);
              setSelectedSurvey(null);
            } catch (error) {
              console.error('Failed to approve survey:', error);
            }
          }}
          title="Approve Student Survey"
          message={`Are you sure you want to approve "${selectedSurvey?.title || selectedSurvey?.template?.name}"? This will mark it as completed and available for reporting.`}
          confirmText="Approve Survey"
          type="warning"
          loading={approveMutation.isPending}
        />
      )}

      {/* Rejection Dialog */}
      {showRejectDialog && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowRejectDialog(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <XMarkIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Reject Student Survey
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Please provide feedback for rejecting "{selectedSurvey?.title || selectedSurvey?.template?.name}":
                    </p>
                    <textarea
                      className="mt-3 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      rows={3}
                      placeholder="Explain why this survey is being rejected..."
                      value={rejectionFeedback}
                      onChange={(e) => setRejectionFeedback(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (!selectedSurvey) return;
                    try {
                      await rejectMutation.mutateAsync({
                        surveyId: selectedSurvey.id,
                        feedback: rejectionFeedback || 'No feedback provided',
                      });
                      refetch();
                      setShowRejectDialog(false);
                      setSelectedSurvey(null);
                      setRejectionFeedback('');
                    } catch (error) {
                      console.error('Failed to reject survey:', error);
                    }
                  }}
                  loading={rejectMutation.isPending}
                  className="sm:ml-3 sm:w-auto"
                >
                  Reject Survey
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectDialog(false);
                    setSelectedSurvey(null);
                    setRejectionFeedback('');
                  }}
                  disabled={rejectMutation.isPending}
                  className="mt-3 sm:mt-0 sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}