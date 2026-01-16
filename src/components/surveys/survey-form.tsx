// components/surveys/survey-form.tsx
'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/alert'; // Added Alert import
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
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // For student surveys, we need to track aggregated responses
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [responses, setResponses] = useState<Record<string, any>>({});

  // Debug log to check survey structure
  useEffect(() => {
    console.log('SurveyForm received survey:', survey);
    console.log('Survey questions:', survey?.template?.questions);
    
    // Initialize responses state with empty values for all questions
    const questions = getQuestions();
    if (questions.length > 0 && !isInitialized) {
      const initialResponses: Record<string, any> = {};
      questions.forEach((question: any) => {
        initialResponses[question.id] = '';
      });
      setResponses(initialResponses);
      setIsInitialized(true);
    }
  }, [survey, isInitialized]);

  // Get questions from the survey object
  const getQuestions = () => {
    if (!survey) return [];
    
    // Check different possible structures
    if (survey.template?.questions) {
      return survey.template.questions;
    } else if (survey.questions) {
      return survey.questions;
    } else if (Array.isArray(survey)) {
      return survey;
    }
    return [];
  };

  const questions = getQuestions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Additional validation for student surveys
      if (surveyType === 'student') {
        if (totalStudents <= 0) {
          setError('Please enter a valid number of students (at least 1).');
          setIsSubmitting(false);
          return;
        }
      }

      // Validate responses
      const requiredQuestions = questions.filter((q: any) => q.is_required);
      const missingRequired = requiredQuestions.filter((q: any) => {
        const response = responses[q.id];
        return response === undefined || response === null || response === '' || (Array.isArray(response) && response.length === 0);
      });
      
      if (missingRequired.length > 0) {
        setError(`Please answer all required questions: ${missingRequired.map((q: any, index: number) => questions.indexOf(q) + 1).join(', ')}`);
        setIsSubmitting(false);
        return;
      }

      // Prepare submission data for student surveys
      let finalResponses = { ...responses };
      if (surveyType === 'student' && totalStudents > 0) {
        finalResponses.total_students = totalStudents;
      }

      // Submit response using the new endpoint
      const payload = {
        assignment_id: assignmentId,
        responses: finalResponses
      };

      console.log('Submitting survey:', payload);

      const result = await api.post('/survey-assignments/submit-response', payload);

      if (result) {
        console.log('Survey submitted successfully:', result);
        onComplete();
      }
    } catch (err: any) {
      console.error('Survey submission error:', err);
      setError(err.message || 'Failed to submit survey. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestionField = (question: any, index: number) => {
    const value = responses[question.id] || '';

    switch (question.question_type) {
      case 'agree_disagree_unsure':
        return (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value="agree"
                  checked={value === 'agree'}
                  onChange={(e) => setResponses({...responses, [question.id]: e.target.value})}
                  className="h-4 w-4 text-blue-600"
                  disabled={isSubmitting}
                  required={question.is_required}
                />
                <span className="ml-2">Agree (Ndabyemera)</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value="disagree"
                  checked={value === 'disagree'}
                  onChange={(e) => setResponses({...responses, [question.id]: e.target.value})}
                  className="h-4 w-4 text-blue-600"
                  disabled={isSubmitting}
                  required={question.is_required}
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
                  required={question.is_required}
                />
                <span className="ml-2">Unsure (Simbizi neza)</span>
              </label>
            </div>
          </div>
        );

      case 'scale_1_10':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
              <span>1 (Extremely)</span>
              <span>10 (Not at all)</span>
            </div>
            <div className="flex justify-between px-4">
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
                    required={question.is_required}
                  />
                  <span className="text-xs mt-1">{num}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'text':
      default:
        return (
          <div>
            <textarea
              value={value}
              onChange={(e) => setResponses({...responses, [question.id]: e.target.value})}
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your response here..."
              disabled={isSubmitting}
              required={question.is_required}
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-1">
              Please provide a detailed response.
            </p>
          </div>
        );
    }
  };

  // Check if we have questions
  if (!questions || questions.length === 0) {
    return (
      <div className="text-center p-8">
        <Alert
          type="warning"
          title="No questions available"
        >
          <p>This survey doesn't have any questions configured.</p>
        </Alert>
        <Button
          onClick={() => router.push('/volunteer/surveys/volunteer')}
          variant="outline"
          className="mt-4"
        >
          Back to Surveys
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <Alert
          type="error"
          title="Submission Error"
        >
          {error}
        </Alert>
      )}

      {/* Student survey specific fields */}
      {surveyType === 'student' && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Student Survey Information</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Number of Students
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={totalStudents}
              onChange={(e) => setTotalStudents(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required={surveyType === 'student'}
              disabled={isSubmitting}
            />
          </div>
          <div className="text-sm text-blue-700 bg-blue-100 p-3 rounded">
            <p className="font-medium mb-1">Instructions:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>For each question below, enter the aggregated results from all students.</li>
              <li>For agree/disagree questions, enter the counts for each option.</li>
              <li>For text questions, summarize the common responses from students.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Survey questions */}
      {questions.map((question: any, index: number) => (
        <div key={question.id || index} className="border border-gray-200 rounded-lg p-6">
          <div className="mb-4">
            <div className="flex items-start mb-2">
              <span className="bg-gray-100 text-gray-800 text-sm font-medium px-2.5 py-0.5 rounded mr-2">
                {index + 1}
              </span>
              <label className="block text-base font-medium text-gray-900">
                {question.question_text}
                {question.is_required && <span className="text-red-500 ml-1">*</span>}
              </label>
            </div>
            {question.is_required && (
              <p className="text-sm text-gray-500 mb-3">This question is required</p>
            )}
            {renderQuestionField(question, index)}
          </div>
        </div>
      ))}

      <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t">
        <div className="mb-4 sm:mb-0">
          <p className="text-sm text-gray-500">
            {questions.filter((q: any) => q.is_required).length} required questions
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/volunteer/surveys/volunteer')}
            disabled={isSubmitting}
            className="px-6"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="default"
            disabled={isSubmitting}
            className="px-8 min-w-32"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                Submitting...
              </>
            ) : (
              'Submit Survey'
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}