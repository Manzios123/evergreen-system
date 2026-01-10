// components/surveys/survey-form.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Input from '@/components/ui/form/input';
import Textarea from '@/components/ui/form/textarea';
import Select from '@/components/ui/form/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/proggress';
import Alert from '@/components/ui/alert';
import { useApiMutation } from '@/lib/hooks/use-api';
import { Survey, SurveyQuestion, SurveyTemplate } from '@/lib/types';
import { api } from '@/lib/api/api'; // This should be '@/lib/api/api' or '@/lib/api'

// Note: If @/lib/api doesn't exist, we need to check the correct import path
// Based on your project structure, it might be '@/lib/api/api'

interface SurveyFormProps {
  survey: Survey;
  onComplete?: () => void;
}

// Fixed: z.record() with proper key and value types
const surveySchema = z.object({
  responses: z.record(z.string(), z.any()),
});

type SurveyFormData = z.infer<typeof surveySchema>;

export function SurveyForm({ survey, onComplete }: SurveyFormProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<SurveyFormData>({
    resolver: zodResolver(surveySchema),
  });

  // Using api.post directly since there's no api.surveys namespace
  const submitMutation = useApiMutation(
    (data: SurveyFormData) => api.post(`/surveys/${survey.id}/responses`, data)
  );

  // Get questions from survey template
  const questions = survey.template?.questions || [];
  
  // Group questions by section (if available)
  const sections = questions.reduce((acc: Record<string, SurveyQuestion[]>, question: SurveyQuestion) => {
    // Note: SurveyQuestion type doesn't have 'section' field
    // We'll use 'General' as default or add section to SurveyQuestion type
    const section = 'section' in question ? (question as any).section || 'General' : 'General';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(question);
    return acc;
  }, {} as Record<string, SurveyQuestion[]>);

  const sectionKeys = Object.keys(sections);
  const progress = sectionKeys.length > 0 ? ((currentSection + 1) / sectionKeys.length) * 100 : 0;

  const handleNext = () => {
    if (currentSection < sectionKeys.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const onSubmit = async (data: SurveyFormData) => {
    setIsSubmitting(true);
    try {
      await submitMutation.mutateAsync(data);
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Failed to submit survey:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestions = sections[sectionKeys[currentSection]] || [];

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>
            Section {currentSection + 1} of {sectionKeys.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} />
      </div>

      {/* Current Section */}
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {sectionKeys[currentSection] || 'Survey Questions'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Please answer all questions in this section
            </p>
          </div>

          <div className="space-y-6">
            {currentQuestions.map((question: SurveyQuestion) => (
              <div key={question.id} className="space-y-3">
                <label className="block text-sm font-medium text-gray-900">
                  {question.question} {/* Changed from question.text to question.question */}
                  {question.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                
                {question.type === 'text' && (
                  <Input
                    {...register(`responses.${question.id}`)}
                    placeholder={question.placeholder || "Type your answer here..."}
                    error={errors.responses?.[question.id]?.message as string}
                  />
                )}

                {question.type === 'textarea' && (
                  <Textarea
                    {...register(`responses.${question.id}`)}
                    rows={4}
                    placeholder={question.placeholder || "Provide detailed feedback..."}
                    error={errors.responses?.[question.id]?.message as string}
                  />
                )}

                {question.type === 'select' && (
                  <Select
                    {...register(`responses.${question.id}`)}
                    options={question.options?.map((opt: string) => ({
                      value: opt,
                      label: opt,
                    })) || []}
                    error={errors.responses?.[question.id]?.message as string}
                  />
                )}

                {question.type === 'radio' && (
                  <div className="space-y-2">
                    {question.options?.map((option: string) => (
                      <label key={option} className="flex items-center">
                        <input
                          type="radio"
                          {...register(`responses.${question.id}`)}
                          value={option}
                          className="h-4 w-4 text-green-600 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-900">
                          {option}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === 'checkbox' && (
                  <div className="space-y-2">
                    {question.options?.map((option: string) => (
                      <div key={option} className="flex items-center">
                        <Checkbox
                          id={`${question.id}-${option}`}
                          checked={(watch(`responses.${question.id}`) as string[] || []).includes(option)}
                          onChange={(checked) => {
                            const current = (watch(`responses.${question.id}`) as string[] || []);
                            const newValue = checked
                              ? [...current, option]
                              : current.filter((v: string) => v !== option);
                            setValue(`responses.${question.id}`, newValue);
                          }}
                        />
                        <label
                          htmlFor={`${question.id}-${option}`}
                          className="ml-2 text-sm text-gray-900"
                        >
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                )}

                {/* Note: SurveyQuestion type doesn't have helpText in your types
                    If you need helpText, add it to the SurveyQuestion type */}
              </div>
            ))}
          </div>

          {submitMutation.error && (
            <Alert
              type="error"
              title="Submission failed"
              children={submitMutation.error.message}
            />
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <div>
              {currentSection > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                >
                  Previous
                </Button>
              )}
            </div>
            <div className="flex space-x-3">
              {currentSection < sectionKeys.length - 1 ? (
                <Button
                  type="button"
                  variant="default" // Changed from "primary" to "default"
                  onClick={handleNext}
                >
                  Next Section
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="default" // Changed from "primary" to "default"
                  loading={isSubmitting}
                >
                  Submit Survey
                </Button>
              )}
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}