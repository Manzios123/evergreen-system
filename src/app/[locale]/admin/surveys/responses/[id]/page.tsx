'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import Alert from '@/components/ui/alert';
import { api } from '@/lib/api/api';
import { ArrowLeftIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface ResponseAnswer {
  question_id: string;
  question_text: string;
  question_type: string;
  answer: any;
  media_file_name?: string;
  media_type?: string;
  media_file_size?: number;
  media_url?: string;
}

interface ResponseDetailData {
  response: {
    id: string;
    submitted_at: string;
    template_name: string;
    survey_type: string;
    survey_period: string;
    pilot_name: string;
    submitted_by_name?: string;
    volunteer_name?: string;
    total_students?: number;
    activity_id?: string;
    response_type: 'student' | 'volunteer';
  };
  answers: ResponseAnswer[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export default function SurveyResponseDetailPage() {
  const params = useParams();
  const responseId = params.id as string;
  const locale = (params?.locale as string) || 'en';
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ResponseDetailData | null>(null);
  
  useEffect(() => {
    if (responseId) {
      fetchResponse();
    }
  }, [responseId]);
  
  const fetchResponse = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ApiResponse<ResponseDetailData>>(`/admin/surveys/response/${responseId}`);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch response details');
      }
      
      if (!response.data) {
        throw new Error('No data returned from server');
      }
      
      setData(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch response details');
      console.error('Error fetching response:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const renderAnswer = (responseAnswer: ResponseAnswer) => {
    const answer = responseAnswer.answer;
    const questionType = responseAnswer.question_type;
    if (questionType === 'media') {
      const fileName = responseAnswer.media_file_name || answer?.file_name || 'Uploaded media';
      const mediaUrl = responseAnswer.media_url || answer?.media_url;

      if (!mediaUrl) return fileName;

      return (
        <a
          href={mediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-700 underline hover:text-blue-900"
        >
          {fileName}
        </a>
      );
    }

    if (answer === null || answer === undefined) {
      return 'No answer provided';
    }
    
    if (typeof answer === 'string' || typeof answer === 'number') {
      return String(answer);
    }
    
    if (Array.isArray(answer)) {
      return answer.length > 0 ? answer.join(', ') : 'No selection';
    }
    
    if (typeof answer === 'object') {
      // Handle object answers (like from JSON fields)
      try {
        if (questionType === 'agree_disagree_unsure') {
          const options: Record<string, string> = {
            'agree': 'Agree (Ndabyemera)',
            'disagree': 'Disagree (Simbyemera)',
            'unsure': 'Unsure (Simbizi neza)'
          };
          return options[answer] || String(answer);
        }
        return JSON.stringify(answer, null, 2);
      } catch (e) {
        return String(answer);
      }
    }
    
    return String(answer);
  };
  
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <SkeletonLoader type="card" />
      </div>
    );
  }
  
  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert type="error" title="Error">
          {error || 'Response not found'}
          <div className="mt-4">
            <Link href={`/${locale}/admin/surveys`} className="inline-flex items-center text-sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Survey Reports
            </Link>
          </div>
        </Alert>
      </div>
    );
  }
  
  const { response, answers } = data;
  const responseAnswers = Array.isArray(answers) ? answers : [];
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/${locale}/admin/surveys`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Survey Reports
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <DocumentTextIcon className="h-8 w-8 text-gray-400" />
              <h1 className="text-2xl font-bold text-gray-900">
                {response.template_name}
              </h1>
            </div>
            <p className="mt-2 text-gray-600">
              Survey response submitted on {new Date(response.submitted_at).toLocaleString()}
            </p>
          </div>
          
          <div className="flex gap-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              response.survey_type === 'student' 
                ? 'bg-blue-100 text-blue-800'
                : 'bg-purple-100 text-purple-800'
            }`}>
              {response.response_type.toUpperCase()}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {response.survey_period.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>
      
      {/* Response Info */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Pilot</p>
            <p className="mt-1 text-sm text-gray-900">{response.pilot_name}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Submitted</p>
            <p className="mt-1 text-sm text-gray-900">
              {new Date(response.submitted_at).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(response.submitted_at).toLocaleTimeString()}
            </p>
          </div>
          
          {response.response_type === 'student' ? (
            <>
              <div>
                <p className="text-sm font-medium text-gray-500">Volunteer</p>
                <p className="mt-1 text-sm text-gray-900">
                  {response.submitted_by_name || 'Unknown'}
                </p>
              </div>
              
              {response.total_students !== undefined && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Students</p>
                  <p className="mt-1 text-sm text-gray-900">{response.total_students}</p>
                </div>
              )}
              
              {response.activity_id && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Activity ID</p>
                  <p className="mt-1 text-sm text-gray-900 font-mono">
                    {response.activity_id}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div>
              <p className="text-sm font-medium text-gray-500">Volunteer</p>
              <p className="mt-1 text-sm text-gray-900">
                {response.volunteer_name || 'Unknown'}
              </p>
            </div>
          )}
        </div>
      </Card>
      
      {/* Answers */}
      <Card className="p-6">
        <h3 className="font-medium text-gray-900 mb-6">Survey Responses</h3>
        
        <div className="space-y-6">
          {responseAnswers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No answers found for this response
            </div>
          ) : (
            responseAnswers.map((answer, index) => (
              <div key={answer.question_id || index} className="border-b pb-6 last:border-0">
                <div className="flex items-start mb-4">
                  <span className="bg-gray-100 text-gray-800 text-sm font-medium px-2.5 py-0.5 rounded mr-3">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-2">
                      {answer.question_text || `Question ${index + 1}`}
                    </h4>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {answer.question_type?.replace('_', ' ') || 'text'}
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-gray-900 whitespace-pre-wrap">
                    {renderAnswer(answer)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
      
      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => window.history.back()}
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Go Back
        </Button>
        
        <Link href={`/${locale}/admin/surveys`}>
          <Button variant="default">
            View All Responses
          </Button>
        </Link>
      </div>
    </div>
  );
}
