'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useApiQuery, useApiMutation } from '@/lib/hooks/use-api';
import { api } from '@/lib/api/api';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/alert';
import Input from '@/components/ui/input';
import Textarea from '@/components/ui/textarea';
import Select from '@/components/ui/select';
import Checkbox from '@/components/ui/checkbox';
import SkeletonLoader from '@/components/ui/skeleton-loader';
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

const QUESTION_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'scale', label: 'Scale (1-5)' },
  { value: 'date', label: 'Date' },
  { value: 'time', label: 'Time' },
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
        router.push(`/admin/surveys/templates/${id}?success=true`);
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
      setQuestions(template.questions.map(q => ({
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
        // Clear options if changing from multiple choice
        ...(value !== 'multiple_choice' && value !== 'checkbox' ? { options: [] } : {})
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
    // Update order indices
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
    
    // Swap questions
    [updatedQuestions[index], updatedQuestions[newIndex]] = [
      updatedQuestions[newIndex],
      updatedQuestions[index],
    ];
    
    // Update order indices
    const reorderedQuestions = updatedQuestions.map((q, i) => ({
      ...q,
      order_index: i,
    }));
    
    setQuestions(reorderedQuestions);
  };

  const handleAddOption = (questionIndex: number) => {
    const updatedQuestions = [...questions];
    if (!updatedQuestions[questionIndex].options) {
      updatedQuestions[questionIndex].options = [];
    }
    updatedQuestions[questionIndex].options!.push('');
    setQuestions(updatedQuestions);
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...questions];
    if (updatedQuestions[questionIndex].options) {
      updatedQuestions[questionIndex].options![optionIndex] = value;
      setQuestions(updatedQuestions);
    }
  };

  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...questions];
    if (updatedQuestions[questionIndex].options) {
      updatedQuestions[questionIndex].options = updatedQuestions[questionIndex].options!.filter(
        (_, i) => i !== optionIndex
      );
      setQuestions(updatedQuestions);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.change_reason?.trim()) {
      newErrors.change_reason = 'Change reason is required';
    }

    // Validate questions
    questions.forEach((question, index) => {
      if (!question.question_text.trim()) {
        newErrors[`question_${index}_text`] = 'Question text is required';
      }

      // Validate options for multiple choice
      if (
        (question.question_type === 'multiple_choice' || question.question_type === 'checkbox') &&
        (!question.options || question.options.length === 0)
      ) {
        newErrors[`question_${index}_options`] = 'At least one option is required';
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
    router.push(`/admin/surveys/templates/${id}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <SkeletonLoader className="h-8 w-48 mb-2" />
          <SkeletonLoader className="h-4 w-64" />
        </div>
        <Card className="p-6">
          <SkeletonLoader className="h-6 w-full mb-4" />
          <SkeletonLoader className="h-4 w-3/4 mb-4" />
          <SkeletonLoader className="h-4 w-1/2 mb-6" />
          <SkeletonLoader className="h-10 w-32" />
        </Card>
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
            onClick: () => router.push('/admin/surveys/templates'),
          }}
          secondaryAction={{
            label: 'Try Again',
            onClick: () => refetch(),
          }}
        />
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
        <Alert variant="success" className="mb-6" onDismiss={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {errors.submit && (
        <Alert variant="error" className="mb-6">
          {errors.submit}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template Details Form */}
          <Card className="lg:col-span-2">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Template Information</h2>
              
              <div className="space-y-4">
                <div>
                  <Input
                    label="Template Name *"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    error={errors.name}
                    required
                  />
                </div>
                
                <div>
                  <Textarea
                    label="Description"
                    value={formData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    placeholder="Describe the purpose of this survey template..."
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Survey Type *"
                    value={formData.survey_type || 'student'}
                    onChange={(e) => handleInputChange('survey_type', e.target.value)}
                    options={SURVEY_TYPES}
                  />
                  
                  <Select
                    label="Survey Period *"
                    value={formData.survey_period || 'pre_activity'}
                    onChange={(e) => handleInputChange('survey_period', e.target.value)}
                    options={SURVEY_PERIODS}
                  />
                </div>
                
                <div>
                  <Textarea
                    label="Change Reason *"
                    value={formData.change_reason || ''}
                    onChange={(e) => handleInputChange('change_reason', e.target.value)}
                    rows={2}
                    placeholder="Explain what changes you made and why..."
                    error={errors.change_reason}
                    required
                  />
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
                      <Card key={index} className="border border-gray-200">
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                                {index + 1}
                              </span>
                              <span className="text-sm font-medium text-gray-700">Question {index + 1}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMoveQuestion(index, 'up')}
                                disabled={index === 0}
                              >
                                <ArrowUpIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMoveQuestion(index, 'down')}
                                disabled={index === questions.length - 1}
                              >
                                <ArrowDownIcon className="h-4 w-4" />
                              </Button>
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
                          </div>

                          <div className="space-y-4">
                            <div>
                              <Input
                                label="Question Text *"
                                value={question.question_text}
                                onChange={(e) =>
                                  handleQuestionChange(index, 'question_text', e.target.value)
                                }
                                error={errors[`question_${index}_text`]}
                                required
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Select
                                label="Question Type"
                                value={question.question_type}
                                onChange={(e) =>
                                  handleQuestionChange(index, 'question_type', e.target.value)
                                }
                                options={QUESTION_TYPES}
                              />
                              
                              <div className="flex items-end">
                                <Checkbox
                                  label="Required"
                                  checked={question.is_required}
                                  onChange={(e) =>
                                    handleQuestionChange(index, 'is_required', e.target.checked)
                                  }
                                />
                              </div>
                            </div>

                            {/* Component ID */}
                            <div>
                              <Input
                                label="Component ID (Optional)"
                                value={question.component_id || ''}
                                onChange={(e) =>
                                  handleQuestionChange(index, 'component_id', e.target.value)
                                }
                                placeholder="Used for integration with other systems"
                              />
                            </div>

                            {/* Options for Multiple Choice */}
                            {(question.question_type === 'multiple_choice' || question.question_type === 'checkbox') && (
                              <div className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <label className="block text-sm font-medium text-gray-700">
                                    Options *
                                  </label>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAddOption(index)}
                                  >
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    Add Option
                                  </Button>
                                </div>
                                
                                {errors[`question_${index}_options`] && (
                                  <p className="text-sm text-red-600 mb-3">
                                    {errors[`question_${index}_options`]}
                                  </p>
                                )}

                                {(!question.options || question.options.length === 0) ? (
                                  <p className="text-sm text-gray-500 text-center py-4">
                                    No options added. Add at least one option.
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    {question.options!.map((option, optionIndex) => (
                                      <div key={optionIndex} className="flex items-center gap-2">
                                        <Input
                                          value={option}
                                          onChange={(e) =>
                                            handleOptionChange(index, optionIndex, e.target.value)
                                          }
                                          placeholder={`Option ${optionIndex + 1}`}
                                          className="flex-1"
                                        />
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleRemoveOption(index, optionIndex)}
                                          className="text-red-600 hover:text-red-700"
                                        >
                                          <TrashIcon className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Sidebar with Actions & Info */}
          <Card className="h-fit">
            <div className="p-6">
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
                  <p className="text-sm text-gray-600">{new Date(template.created_at).toLocaleDateString()}</p>
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
          </Card>
        </div>
      </form>
    </div>
  );
}