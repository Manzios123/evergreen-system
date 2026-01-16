// src/components/surveys/read-only-survey.tsx
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import { api } from '@/lib/api/api';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

interface ReadOnlySurveyProps {
  assignmentId: string;
  questions: Array<{
    id: string;
    question_text: string;
    question_type: string;
  }>;
  surveyType: string;
}

export default function ReadOnlySurvey({ 
  assignmentId, 
  questions, 
  surveyType 
}: ReadOnlySurveyProps) {
  const [responses, setResponses] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadResponses = async () => {
    if (responses) return; // Already loaded
    
    setIsLoading(true);
    try {
      let responseData: any;
      if (surveyType === 'volunteer_personal') {
        responseData = await api.get(`/survey-responses/volunteer/assignment/${assignmentId}`);
      } else if (surveyType === 'student_survey') {
        responseData = await api.get(`/survey-responses/student/assignment/${assignmentId}`);
      }
      
      if (responseData) {
        setResponses(responseData.responses || {});
      }
    } catch (err: any) {
      setError('Failed to load responses');
      console.error('Error loading responses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderResponseValue = (value: any): string => {
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return String(value);
  };

  if (isLoading) {
    return <SkeletonLoader type="card" />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Your Responses</h3>
        {!responses && (
          <button
            onClick={loadResponses}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Load Responses
          </button>
        )}
      </div>

      {responses ? (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <div key={question.id} className="border-b pb-4 last:border-0">
              <h4 className="font-medium text-gray-900 mb-2">
                {index + 1}. {question.question_text}
              </h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">
                  {renderResponseValue(responses[question.id]) || 'No response provided'}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">
            Responses not loaded
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Click "Load Responses" to view your submitted answers
          </p>
        </Card>
      )}
    </div>
  );
}