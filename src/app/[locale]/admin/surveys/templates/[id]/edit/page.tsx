'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useApiQuery, useApiMutation } from '@/lib/hooks/use-api';
import { api } from '@/lib/api/api';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/alert';
import EmptyState from '@/components/ui/empty-state';
import { PlusIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

interface SurveyQuestion {
  id?: string;
  component_id?: string | null;
  question_text: string;
  question_type: string;
  order_index: number;
  is_required: boolean;
  options?: string[];
}

interface SurveyTemplate {
  id: string;
  pilot_id: string;
  name: string;
  description?: string;
  survey_type: 'student' | 'volunteer' | 'activity_monitoring';
  survey_period: 'pre_activity' | 'post_activity' | 'mid_pilot' | 'end_pilot';
  version: number;
  change_reason: string;
  created_by: string;
  created_at: string;
  pilot_name: string;
  creator_name: string;
  questions: SurveyQuestion[];
}

// Helper function to format date
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString();
  } catch (error) {
    return 'Invalid date';
  }
};

const QUESTION_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'agree_disagree_unsure', label: 'Agree / Disagree / Unsure' },
  { value: 'scale_1_5', label: 'Scale (1-5)' },
  { value: 'scale_1_10', label: 'Scale (1-10)' },
];

const SURVEY_TYPES = [
  { value: 'student', label: 'Student' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'activity_monitoring', label: 'Activity Monitoring' },
];

const SURVEY_PERIODS = [
  { value: 'pre_activity', label: 'Pre-Activity' },
  { value: 'post_activity', label: 'Post-Activity' },
  { value: 'mid_pilot', label: 'Mid-Pilot' },
  { value: 'end_pilot', label: 'End of Pilot' },
];

export default function EditSurveyTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const locale = (params?.locale as string) || 'en';
  
  const [formData, setFormData] = useState<Partial<SurveyTemplate>>({
    name: '',
    description: '',
    survey_type: 'student',
    survey_period: 'pre_activity',
    change_reason: '',
  });
  
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    searchParams.get('success') === 'true' ? 'Template updated successfully!' : null
  );

  // Fetch template data
  const {
    data: template,
    isLoading,
    isError,
    refetch,
  } = useApiQuery<SurveyTemplate>(
    ['survey-template', id],
    () => api.get(`/survey-templates/${id}`)
  );

  // Update mutation
  const updateMutation = useApiMutation(
    (data: Partial<SurveyTemplate>) => api.put(`/survey-templates/${id}`, data),
    {
      onSuccess: () => {
        router.push(`/${locale}/admin/surveys/templates/${id}?success=true`);
      },
      onError: (error) => {
        setErrors({ submit: error.message });
        setIsSubmitting(false);
      },
    }
  );

  // Initialize form with template data
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || '',
        survey_type: template.survey_type,
        survey_period: template.survey_period,
        change_reason: '',
      });
      const templateQuestions = Array.isArray(template.questions) ? template.questions : [];
      setQuestions(templateQuestions.map(q => ({
        ...q,
        order_index: q.order_index || 0,
      })));
    }
  }, [template]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const updatedQuestions = [...questions];
    if (field === 'is_required') {
      updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    } else if (field === 'question_type') {
      updatedQuestions[index] = {
        ...updatedQuestions[index],
        [field]: value,
        options: []
      };
    } else {
      updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    }
    setQuestions(updatedQuestions);
  };

  const handleAddQuestion = () => {
    const newQuestion: SurveyQuestion = {
      question_text: '',
      question_type: 'text',
      order_index: questions.length,
      is_required: true,
      options: [],
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleRemoveQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    const reorderedQuestions = updatedQuestions.map((q, i) => ({
      ...q,
      order_index: i,
    }));
    setQuestions(reorderedQuestions);
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === questions.length - 1)
    ) {
      return;
    }

    const updatedQuestions = [...questions];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    [updatedQuestions[index], updatedQuestions[newIndex]] = [
      updatedQuestions[newIndex],
      updatedQuestions[index],
    ];
    
    const reorderedQuestions = updatedQuestions.map((q, i) => ({
      ...q,
      order_index: i,
    }));
    
    setQuestions(reorderedQuestions);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.change_reason?.trim()) {
      newErrors.change_reason = 'Change reason is required';
    }

    questions.forEach((question, index) => {
      if (!question.question_text.trim()) {
        newErrors[`question_${index}_text`] = 'Question text is required';
      }

      const validQuestionTypes = QUESTION_TYPES.map(type => type.value);
      if (!validQuestionTypes.includes(question.question_type)) {
        newErrors[`question_${index}_type`] = 'Choose a supported question type';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    const submissionData: Partial<SurveyTemplate> = {
      ...formData,
      questions: questions.map((q, index) => ({
        ...q,
        order_index: index,
      })),
    };

    updateMutation.mutate(submissionData);
  };

  const handleCancel = () => {
    router.push(`/${locale}/admin/surveys/templates/${id}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="h-6 w-full bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse mb-6"></div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (isError || !template) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          title="Template not found"
          description="The survey template you're looking for doesn't exist or you don't have permission to edit it."
          action={{
            label: 'Back to Templates',
            onClick: () => router.push(`/${locale}/admin/surveys/templates`),
          }}
        />
        <div className="mt-4 text-center">
          <Button variant="outline" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Template: {template.name}</h1>
          <p className="text-gray-600 mt-1">
            Version {template.version} • Pilot: {template.pilot_name}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            loading={isSubmitting || updateMutation.isPending}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {successMessage && (
        <Alert type="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {errors.submit && (
        <Alert type="error">
          {errors.submit}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template Details Form */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Template Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    placeholder="Describe the purpose of this survey template..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Survey Type *
                    </label>
                    <select
                      value={formData.survey_type || 'student'}
                      onChange={(e) => handleInputChange('survey_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      {SURVEY_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Survey Period *
                    </label>
                    <select
                      value={formData.survey_period || 'pre_activity'}
                      onChange={(e) => handleInputChange('survey_period', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      {SURVEY_PERIODS.map(period => (
                        <option key={period.value} value={period.value}>
                          {period.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Change Reason *
                  </label>
                  <textarea
                    value={formData.change_reason || ''}
                    onChange={(e) => handleInputChange('change_reason', e.target.value)}
                    rows={2}
                    placeholder="Explain what changes you made and why..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  {errors.change_reason && (
                    <p className="mt-1 text-sm text-red-600">{errors.change_reason}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    Required for tracking template version history. This will create version {template.version + 1}.
                  </p>
                </div>
              </div>

              {/* Questions Section */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Questions ({questions.length})
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddQuestion}
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </div>

                {questions.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500">No questions added yet.</p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4"
                      onClick={handleAddQuestion}
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Your First Question
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {questions.map((question, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg">
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                                {index + 1}
                              </span>
                              <span className="text-sm font-medium text-gray-700">Question {index + 1}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="p-1 text-gray-400 hover:text-gray-500"
                                onClick={() => handleMoveQuestion(index, 'up')}
                                disabled={index === 0}
                              >
                                <ArrowUpIcon className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className="p-1 text-gray-400 hover:text-gray-500"
                                onClick={() => handleMoveQuestion(index, 'down')}
                                disabled={index === questions.length - 1}
                              >
                                <ArrowDownIcon className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className="p-1 text-red-400 hover:text-red-500"
                                onClick={() => handleRemoveQuestion(index)}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Question Text *
                              </label>
                              <input
                                type="text"
                                value={question.question_text}
                                onChange={(e) =>
                                  handleQuestionChange(index, 'question_text', e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                              />
                              {errors[`question_${index}_text`] && (
                                <p className="mt-1 text-sm text-red-600">{errors[`question_${index}_text`]}</p>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Question Type
                                </label>
                                <select
                                  value={question.question_type}
                                  onChange={(e) =>
                                    handleQuestionChange(index, 'question_type', e.target.value)
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                >
                                  {QUESTION_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>
                                      {type.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              
                              <div className="flex items-end">
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={question.is_required}
                                    onChange={(e) =>
                                      handleQuestionChange(index, 'is_required', e.target.checked)
                                    }
                                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Required</span>
                                </label>
                              </div>
                            </div>

                            {/* Component ID */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Component ID (Optional)
                              </label>
                              <input
                                type="text"
                                value={question.component_id || ''}
                                onChange={(e) =>
                                  handleQuestionChange(index, 'component_id', e.target.value)
                                }
                                placeholder="Used for integration with other systems"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                              />
                            </div>

                            {errors[`question_${index}_type`] && (
                              <p className="text-sm text-red-600">
                                {errors[`question_${index}_type`]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar with Actions & Info */}
          <div className="h-fit">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Editing Information</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Version</label>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      v{template.version}
                    </span>
                    <span className="text-sm text-gray-600">→</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      v{template.version + 1}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pilot</label>
                  <p className="text-sm text-gray-900">{template.pilot_name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Creator</label>
                  <p className="text-sm text-gray-900">{template.creator_name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                  <p className="text-sm text-gray-600">{formatDate(template.created_at)}</p>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Actions</h4>
                <div className="space-y-2">
                  <Button
                    type="submit"
                    loading={isSubmitting || updateMutation.isPending}
                    fullWidth
                  >
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Tips</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Keep change reasons descriptive for audit trails</li>
                  <li>• Use consistent question formats</li>
                  <li>• Test required questions thoroughly</li>
                  <li>• Consider survey flow when ordering questions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
