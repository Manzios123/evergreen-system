// components/surveys/survey-form.tsx
'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';
import { api } from '@/lib/api/api';
import { useRouter } from 'next/navigation';

interface SurveyFormProps {
  survey: any;
  onComplete: () => void;
  assignmentId: string;
  surveyType: string;
}

export function SurveyForm({ survey, onComplete, assignmentId, surveyType }: SurveyFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // For student surveys, we need to track aggregated responses
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [responses, setResponses] = useState<Record<string, any>>({});

  // FIX: Handle different survey data structures
  const getQuestions = () => {
    // If survey has a template property
    if (survey?.template?.questions) {
      return survey.template.questions;
    }
    // If questions are at the root level
    else if (survey?.questions) {
      return survey.questions;
    }
    // If survey itself is the questions array (rare)
    else if (Array.isArray(survey)) {
      return survey;
    }
    // Default to empty array
    return [];
  };

  const questions = getQuestions();

  // Also handle is_required conversion
  const normalizedQuestions = questions.map((q: any) => ({
    ...q,
    // Convert 1/0 to boolean if needed
    is_required: q.is_required === 1 || q.is_required === true
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate responses
      const requiredQuestions = normalizedQuestions.filter((q: any) => q.is_required);
      const missingRequired = requiredQuestions.filter((q: any) => {
        const response = responses[q.id];
        return response === undefined || response === null || response === '';
      });
      
      if (missingRequired.length > 0) {
        setError(`Please answer all required questions: ${missingRequired.map((q: any, i: number) => i + 1).join(', ')}`);
        setIsSubmitting(false);
        return;
      }

      // Prepare submission data for student surveys
      let finalResponses = { ...responses };
      if (surveyType === 'student_survey' && totalStudents > 0) {
        finalResponses.total_students = totalStudents;
      }

      // Submit response using the new endpoint
      const payload = {
        assignment_id: assignmentId,
        responses: finalResponses
      };

      const result = await api.post('/survey-assignments/submit-response', payload);

      if (result) {
        onComplete();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit survey');
      console.error('Survey submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestionField = (question: any) => {
    const value = responses[question.id] || '';

    switch (question.question_type) {
      case 'agree_disagree_unsure':
        return (
          <div className="space-y-2">
            <label className="inline-flex items-center mr-4">
              <input
                type="radio"
                name={`question-${question.id}`}
                value="agree"
                checked={value === 'agree'}
                onChange={(e) => setResponses({...responses, [question.id]: e.target.value})}
                className="h-4 w-4 text-blue-600"
                disabled={isSubmitting}
              />
              <span className="ml-2">Agree (Ndabyemera)</span>
            </label>
            <label className="inline-flex items-center mr-4">
              <input
                type="radio"
                name={`question-${question.id}`}
                value="disagree"
                checked={value === 'disagree'}
                onChange={(e) => setResponses({...responses, [question.id]: e.target.value})}
                className="h-4 w-4 text-blue-600"
                disabled={isSubmitting}
              />
              <span className="ml-2">Disagree (Simbyemera)</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name={`question-${question.id}`}
                value="unsure"
                checked={value === 'unsure'}
                onChange={(e) => setResponses({...responses, [question.id]: e.target.value})}
                className="h-4 w-4 text-blue-600"
                disabled={isSubmitting}
              />
              <span className="ml-2">Unsure (Simbizi neza)</span>
            </label>
          </div>
        );

      case 'scale_1_10':
        return (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">1 (Extremely)</span>
            <div className="flex-1 flex justify-between px-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <label key={num} className="inline-flex flex-col items-center">
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={num}
                    checked={value === num}
                    onChange={(e) => setResponses({...responses, [question.id]: parseInt(e.target.value)})}
                    className="h-4 w-4 text-blue-600"
                    disabled={isSubmitting}
                  />
                  <span className="text-xs mt-1">{num}</span>
                </label>
              ))}
            </div>
            <span className="text-sm text-gray-500">10 (Not at all)</span>
          </div>
        );

      case 'text':
      default:
        return (
          <textarea
            value={value}
            onChange={(e) => setResponses({...responses, [question.id]: e.target.value})}
            className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your response..."
            disabled={isSubmitting}
          />
        );
    }
  };

  // FIX: Check if we have questions before rendering
  if (normalizedQuestions.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">No questions found for this survey.</p>
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="mt-4"
        >
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Student survey specific fields */}
      {surveyType === 'student_survey' && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Student Survey Information</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Number of Students
            </label>
            <input
              type="number"
              min="1"
              value={totalStudents}
              onChange={(e) => setTotalStudents(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={isSubmitting}
            />
          </div>
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> For each question below, enter the aggregated results from all students.
            For agree/disagree questions, enter counts (e.g., Agree: 15, Disagree: 5, Unsure: 5).
          </p>
        </div>
      )}

      {/* Survey questions */}
      {normalizedQuestions.map((question: any, index: number) => (
        <div key={question.id} className="border-t pt-6 first:border-t-0 first:pt-0">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {index + 1}. {question.question_text}
              {question.is_required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {renderQuestionField(question)}
          </div>
        </div>
      ))}

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/volunteer/surveys/volunteer')}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="default"
          disabled={isSubmitting}
          className="min-w-30"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Survey'}
        </Button>
      </div>
    </form>
  );
}