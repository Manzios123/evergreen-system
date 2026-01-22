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

interface ResponseDetail {
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
  answers: Array<{
    question_id: string;
    question_text: string;
    question_type: string;
    answer: any;
  }>;
}

export default function SurveyResponseDetailPage() {
  const params = useParams();
  const responseId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ResponseDetail | null>(null);
  
  useEffect(() => {
    fetchResponse();
  }, [responseId]);
  
  const fetchResponse = async () => {
    setLoading(true);
    try {
      const response = await api.get<ResponseDetail>(`/admin/surveys/response/${responseId}`);
      setData(response);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch response details');
      console.error('Error fetching response:', err);
    } finally {
      setLoading(false);
    }
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
            <Link href="/admin/surveys" className="inline-flex items-center text-sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Survey Reports
            </Link>
          </div>
        </Alert>
      </div>
    );
  }
  
  const { response, answers } = data;
  
  const renderAnswer = (answer: any, questionType: string) => {
    if (typeof answer === 'string' || typeof answer === 'number') {
      return String(answer);
    }
    if (Array.isArray(answer)) {
      return answer.join(', ');
    }
    if (typeof answer === 'object' && answer !== null) {
      return JSON.stringify(answer);
    }
    return String(answer);
  };
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/surveys"
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
              {response.survey_type.toUpperCase()}
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
          
          {response.survey_type === 'student' ? (
            <>
              <div>
                <p className="text-sm font-medium text-gray-500">Volunteer</p>
                <p className="mt-1 text-sm text-gray-900">
                  {response.submitted_by_name || 'Unknown'}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Total Students</p>
                <p className="mt-1 text-sm text-gray-900">{response.total_students || 0}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Activity ID</p>
                <p className="mt-1 text-sm text-gray-900">
                  {response.activity_id ? response.activity_id.substring(0, 8) + '...' : 'N/A'}
                </p>
              </div>
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
          {answers.map((answer, index) => (
            <div key={answer.question_id} className="border-b pb-6 last:border-0">
              <div className="flex items-start mb-4">
                <span className="bg-gray-100 text-gray-800 text-sm font-medium px-2.5 py-0.5 rounded mr-3">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-2">
                    {answer.question_text}
                  </h4>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {answer.question_type.replace('_', ' ')}
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-900 whitespace-pre-wrap">
                  {renderAnswer(answer.answer, answer.question_type)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}