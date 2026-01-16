// app/[locale]/volunteer/surveys/submissions/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import { useApiQuery } from '@/lib/hooks/use-api';
import { api } from '@/lib/api/api';
import { 
  DocumentTextIcon, 
  ChartBarIcon,
  ArrowLeftIcon,
  EyeIcon,
  CalendarIcon,
  ClipboardDocumentCheckIcon,
  DocumentDuplicateIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Submission {
  id: string;
  assignment_id: string;
  submitted_at: string;
  total_students: number;
  assignment?: {
    survey_name: string;
    survey_description: string;
    survey_type: string;
    survey_period: string;
    pilot_name: string;
    assignment_type: string;
  };
}

export default function MySubmissionsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'personal' | 'student'>('all');
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);

  // Fetch assignments to get completed ones
  const { data: assignments, isLoading: assignmentsLoading } = useApiQuery<any[]>(
    ['survey-assignments', 'volunteer'],
    () => api.get<any[]>('/survey-assignments/volunteer')
  );

  // Fetch student responses separately
  const { data: studentResponses, isLoading: studentResponsesLoading } = useApiQuery<any[]>(
    ['survey-assignments', 'student-responses'],
    () => api.get<any[]>('/survey-assignments/student-responses')
  );

  useEffect(() => {
    if (assignments && studentResponses) {
      // Get completed assignments
      const completedAssignments = assignments.filter(a => 
        a.completed === 1 || a.completed === true || a.status === 'completed'
      ) || [];
      
      // Transform student responses to match Submission interface
      const transformedStudentResponses = (studentResponses || []).map(r => ({
        id: r.id,
        assignment_id: r.assignment_id,
        submitted_at: r.submitted_at,
        total_students: r.total_students || 0,
        assignment: {
          survey_name: r.survey_name,
          survey_description: r.survey_description,
          survey_type: 'student',
          survey_period: r.survey_period,
          pilot_name: '', // Will be populated from assignment data
          assignment_type: 'student_survey'
        }
      }));

      // Combine all submissions
      const combined = [
        ...completedAssignments.map(a => ({
          id: a.id,
          assignment_id: a.id,
          submitted_at: a.completed_at || a.updated_at,
          total_students: 0,
          assignment: {
            survey_name: a.survey_name,
            survey_description: a.survey_description,
            survey_type: a.survey_type,
            survey_period: a.survey_period,
            pilot_name: a.pilot_name,
            assignment_type: a.assignment_type
          }
        })),
        ...transformedStudentResponses
      ].sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

      setAllSubmissions(combined);
    }
  }, [assignments, studentResponses]);

  const isLoading = assignmentsLoading || studentResponsesLoading;

  // Filter submissions based on active tab
  const filteredSubmissions = allSubmissions.filter(submission => {
    if (activeTab === 'all') return true;
    if (activeTab === 'personal') return submission.assignment?.assignment_type === 'volunteer_personal';
    if (activeTab === 'student') return submission.assignment?.assignment_type === 'student_survey';
    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonLoader type="card" />
          <SkeletonLoader type="card" />
          <SkeletonLoader type="card" />
        </div>
        <SkeletonLoader type="card" />
      </div>
    );
  }

  const totalSubmissions = allSubmissions.length;
  const personalCount = allSubmissions.filter(s => s.assignment?.assignment_type === 'volunteer_personal').length;
  const studentCount = allSubmissions.filter(s => s.assignment?.assignment_type === 'student_survey').length;
  const totalStudentEntries = allSubmissions
    .filter(s => s.assignment?.assignment_type === 'student_survey')
    .reduce((total, s) => total + (s.total_students || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Link
            href="/volunteer/surveys/volunteer"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Surveys
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">My Survey Submissions</h1>
          <p className="mt-1 text-sm text-gray-500">
            View all surveys you have submitted
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => window.print()}
          >
            <ClipboardDocumentCheckIcon className="h-4 w-4 mr-2" />
            Print Summary
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
              <DocumentTextIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Submissions</p>
              <p className="text-2xl font-semibold text-gray-900">{totalSubmissions}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
              <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Personal Surveys</p>
              <p className="text-2xl font-semibold text-gray-900">{personalCount}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
              <ChartBarIcon className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Student Surveys</p>
              <p className="text-2xl font-semibold text-gray-900">{studentCount}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
              <DocumentDuplicateIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Student Entries</p>
              <p className="text-2xl font-semibold text-gray-900">{totalStudentEntries}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Submissions ({totalSubmissions})
          </button>
          <button
            onClick={() => setActiveTab('personal')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'personal'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Personal ({personalCount})
          </button>
          <button
            onClick={() => setActiveTab('student')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'student'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Student Activity ({studentCount})
          </button>
        </nav>
      </div>

      {/* Submissions List */}
      {filteredSubmissions.length > 0 ? (
        <div className="space-y-4">
          {filteredSubmissions.map((submission) => (
            <Card key={submission.id} className="hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        submission.assignment?.survey_period === 'pre_pilot' 
                          ? 'bg-green-100 text-green-800'
                          : submission.assignment?.survey_period === 'post_pilot'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {submission.assignment?.survey_period?.replace('_', ' ') || 'Survey'}
                      </span>
                      {submission.assignment?.assignment_type === 'student_survey' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          Student Activity
                        </span>
                      )}
                      {submission.assignment?.assignment_type === 'volunteer_personal' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          Personal
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-1">
                      {submission.assignment?.survey_name || 'Survey'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {submission.assignment?.survey_description || 'Submitted survey response'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 items-center text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    <span>
                      Submitted: {new Date(submission.submitted_at).toLocaleDateString()} at {new Date(submission.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  {submission.assignment?.pilot_name && (
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {submission.assignment.pilot_name}
                    </span>
                  )}

                  {submission.assignment?.assignment_type === 'student_survey' && submission.total_students > 0 && (
                    <div className="flex items-center">
                      <UsersIcon className="h-4 w-4 mr-1" />
                      <span>{submission.total_students} students</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    Response ID: {submission.id.slice(0, 8)}...
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/volunteer/surveys/assignment/${submission.assignment_id}/responses`}>
                      <Button variant="outline" size="sm">
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </Link>
                    {submission.assignment?.assignment_type === 'student_survey' && (
                      <Link href={`/volunteer/surveys/assignment/${submission.assignment_id}`}>
                        <Button variant="outline" size="sm">
                          <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
                          Submit Again
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<DocumentTextIcon className="h-12 w-12 text-gray-400" />}
          title="No submissions yet"
          description={
            activeTab === 'all'
              ? "You haven't submitted any surveys yet. Complete your assigned surveys to see them here."
              : activeTab === 'personal'
              ? "You haven't submitted any personal surveys yet."
              : "You haven't submitted any student activity surveys yet."
          }
          action={{
            label: 'View Surveys',
            onClick: () => router.push('/volunteer/surveys/volunteer'),
          }}
        />
      )}
    </div>
  );
}