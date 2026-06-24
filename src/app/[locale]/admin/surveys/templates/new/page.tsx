// app/[locale]/admin/surveys/templates/new/page.tsx
'use client';

import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/alert';
import { useApiQuery } from '@/lib/hooks/use-api';
import { api } from '@/lib/api/api';
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

interface Pilot {
  id: string;
  name: string;
}

interface Question {
  id?: string;
  question_text: string;
  question_type: string;
  order_index: number;
  is_required: boolean;
  component_id?: string | null;
}

interface TemplateResponse {
  id: string;
  [key: string]: any;
}

const QUESTION_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'media', label: 'Media Upload' },
  { value: 'agree_disagree_unsure', label: 'Agree / Disagree / Unsure' },
  { value: 'scale_1_5', label: 'Scale (1-5)' },
  { value: 'scale_1_10', label: 'Scale (1-10)' },
];

function normalizeArray<T>(response: unknown): T[] {
  if (Array.isArray(response)) return response as T[];
  if (response && typeof response === 'object') {
    const data = response as { data?: unknown; results?: unknown; pilots?: unknown; items?: unknown };
    if (Array.isArray(data.data)) return data.data as T[];
    if (Array.isArray(data.results)) return data.results as T[];
    if (Array.isArray(data.pilots)) return data.pilots as T[];
    if (Array.isArray(data.items)) return data.items as T[];
  }
  return [];
}

export default function CreateSurveyTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const [formData, setFormData] = useState({
    pilot_id: '',
    name: '',
    survey_type: 'volunteer',
    survey_period: 'pre_activity',
    version: 1,
    change_reason: 'Initial version',
    questions: [] as Question[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch pilots
  const { data: pilotsResponse } = useApiQuery<unknown>(['pilots'], () => api.get<unknown>('/pilots'));
  const pilots = normalizeArray<Pilot>(pilotsResponse);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question_text: '',
          question_type: 'text',
          order_index: prev.questions.length,
          is_required: true
        }
      ]
    }));
  };

  const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
    const updated = [...formData.questions];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, questions: updated }));
  };

  const handleRemoveQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate
      if (!formData.pilot_id) throw new Error('Please select a pilot');
      if (!formData.name.trim()) throw new Error('Template name is required');
      if (formData.questions.length === 0) throw new Error('At least one question is required');

      // Validate each question
      for (const q of formData.questions) {
        if (!q.question_text.trim()) throw new Error('All questions must have text');
      }

      const payload = {
        ...formData,
        version: 1
      };

      const response = await api.post<TemplateResponse>('/survey-templates', payload);
      
      alert('Template created successfully!');
      router.push(`/${locale}/admin/surveys/templates/${response.id}`);
      
    } catch (err: any) {
      setError(err.message || 'Failed to create template');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/${locale}/admin/surveys/templates`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Templates
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Survey Template</h1>
            <p className="mt-1 text-sm text-gray-500">
              Create a new survey template for volunteers or coordinators
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pilot *
                  </label>
                  <select
                    name="pilot_id"
                    value={formData.pilot_id}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select a pilot</option>
                    {pilots.map(pilot => (
                      <option key={pilot.id} value={pilot.id}>
                        {pilot.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Survey Type *
                  </label>
                  <select
                    name="survey_type"
                    value={formData.survey_type}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    required
                  >
                    <option value="volunteer">Volunteer</option>
                    <option value="student">Student</option>
                    <option value="activity_monitoring">Activity Monitoring</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Survey Period *
                  </label>
                  <select
                    name="survey_period"
                    value={formData.survey_period}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    required
                  >
                    <option value="pre_activity">Pre Activity</option>
                    <option value="post_activity">Post Activity</option>
                    <option value="mid_pilot">Mid Pilot</option>
                    <option value="end_pilot">End Pilot</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Change Reason
                  </label>
                  <input
                    type="text"
                    name="change_reason"
                    value={formData.change_reason}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional, but recommended for tracking template versions
                  </p>
                </div>
              </div>
            </div>

            {/* Questions */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Questions</h2>
                <Button type="button" variant="outline" size="sm" onClick={handleAddQuestion}>
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Question
                </Button>
              </div>

              {formData.questions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8 border-2 border-dashed rounded-lg">
                  No questions added yet. Click "Add Question" to create your first question.
                </p>
              ) : (
                <div className="space-y-4">
                  {formData.questions.map((question, index) => (
                    <Card key={index} className="border">
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-sm font-medium text-gray-700">Question {index + 1}</h3>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveQuestion(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Question Text *
                            </label>
                            <input
                              type="text"
                              value={question.question_text}
                              onChange={(e) => handleQuestionChange(index, 'question_text', e.target.value)}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Question Type
                            </label>
                            <select
                              value={question.question_type}
                              onChange={(e) => handleQuestionChange(index, 'question_type', e.target.value)}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            >
                              {QUESTION_TYPES.map(type => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Required
                            </label>
                            <div className="flex items-center h-10">
                              <input
                                type="checkbox"
                                checked={question.is_required}
                                onChange={(e) => handleQuestionChange(index, 'is_required', e.target.checked)}
                                className="h-4 w-4 text-blue-600 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700">Yes, this question is required</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <Alert type="error" title="Error">
                {error}
              </Alert>
            )}

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Link href={`/${locale}/admin/surveys/templates`}>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Template'}
              </Button>
            </div>
          </div>
        </Card>
      </form>

      {/* Help */}
      <Alert type="info" title="Creating a Survey Template">
        <div className="space-y-2 mt-2">
          <p><strong>Survey Type:</strong> Choose who will fill out this survey (volunteer, student, or activity monitoring).</p>
          <p><strong>Survey Period:</strong> Indicates when the survey is administered (pre-activity, post-activity, mid-pilot, end-pilot).</p>
          <p><strong>Questions:</strong> Add at least one question. You can choose different question types.</p>
          <p><strong>Versioning:</strong> When you update a template later, the version will increment automatically.</p>
        </div>
      </Alert>
    </div>
  );
}
