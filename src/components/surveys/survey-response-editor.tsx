// components/surveys/survey-response-editor.tsx
// Shared "view my submitted answers, and edit them if something's wrong or
// incomplete" block, used by the volunteer/facilitator, coordinator, and admin
// versions of the survey assignment pages - all three roles can submit a
// personal survey (see prompt/system-audit.md, Eleventh pass) and all three
// need the same ability to review and correct their own answers afterward.
'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/alert';
import { api } from '@/lib/api/api';
import { CheckCircleIcon, PencilIcon } from '@heroicons/react/24/outline';

export interface SurveyResponseQuestion {
  id: string;
  question_text: string;
  question_type: string;
  options?: string | null;
}

export interface SurveyResponseData {
  id: string;
  submitted_at: string;
  responses: Record<string, any>;
}

interface SurveyResponseEditorProps {
  questions: SurveyResponseQuestion[];
  response: SurveyResponseData;
  canEdit: boolean;
  surveyType: 'volunteer' | 'student';
  onSaved?: () => void | Promise<void>;
}

const AGREE_DISAGREE_OPTIONS = ['Agree', 'Disagree', 'Unsure'];

function parseOptions(raw?: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((option) => String(option)) : [];
  } catch {
    return [];
  }
}

function renderResponseValue(value: any): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object' && value !== null) return JSON.stringify(value);
  return String(value ?? '');
}

export default function SurveyResponseEditor({
  questions,
  response,
  canEdit,
  surveyType,
  onSaved,
}: SurveyResponseEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedResponses, setEditedResponses] = useState<Record<string, any>>(response.responses || {});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setEditedResponses(response.responses || {});
  }, [response]);

  const handleStartEdit = () => {
    setEditedResponses(response.responses || {});
    setSaveError(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedResponses(response.responses || {});
    setSaveError(null);
    setIsEditing(false);
  };

  const handleFieldChange = (questionId: string, value: any) => {
    setEditedResponses((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const endpoint = surveyType === 'volunteer'
        ? `/survey-responses/volunteer/${response.id}`
        : `/survey-responses/student/${response.id}`;
      await api.put(endpoint, { responses: editedResponses });
      setIsEditing(false);
      if (onSaved) await onSaved();
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderEditField = (question: SurveyResponseQuestion) => {
    const value = editedResponses[question.id];
    const options = parseOptions(question.options);

    if (question.question_type === 'media') {
      return (
        <p className="text-sm text-gray-500 italic">
          Media answers can&apos;t be changed here yet - contact your coordinator if this needs updating.
        </p>
      );
    }

    if (question.question_type === 'agree_disagree_unsure') {
      return (
        <select
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => handleFieldChange(question.id, e.target.value)}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
        >
          <option value="">Select a response...</option>
          {AGREE_DISAGREE_OPTIONS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      );
    }

    if (['single_choice', 'radio', 'select', 'yes_no', 'choice'].includes(question.question_type) && options.length > 0) {
      return (
        <select
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => handleFieldChange(question.id, e.target.value)}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
        >
          <option value="">Select a response...</option>
          {options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      );
    }

    if (['multiple_choice', 'checkbox', 'multi_select'].includes(question.question_type) && options.length > 0) {
      const selected: string[] = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-2">
          {options.map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...selected, option]
                    : selected.filter((item) => item !== option);
                  handleFieldChange(question.id, next);
                }}
                className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              {option}
            </label>
          ))}
        </div>
      );
    }

    if (['number', 'scale_1_5', 'scale_1_10', 'rating', 'scale'].includes(question.question_type)) {
      return (
        <input
          type="number"
          value={typeof value === 'number' || typeof value === 'string' ? value : ''}
          onChange={(e) => handleFieldChange(question.id, e.target.value)}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
        />
      );
    }

    return (
      <textarea
        value={typeof value === 'string' ? value : (value ? String(value) : '')}
        onChange={(e) => handleFieldChange(question.id, e.target.value)}
        rows={3}
        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
      />
    );
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center text-green-600">
          <CheckCircleIcon className="h-5 w-5 mr-2" />
          <span className="font-medium">
            Submitted on {new Date(response.submitted_at).toLocaleDateString()}
          </span>
        </div>
        {canEdit && !isEditing && (
          <Button variant="outline" size="sm" onClick={handleStartEdit}>
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit Responses
          </Button>
        )}
      </div>

      {saveError && (
        <Alert type="error" title="Couldn't save changes">
          {saveError}
        </Alert>
      )}

      {response.responses && Object.keys(response.responses).length > 0 ? (
        <div className="space-y-6">
          {questions.map((question) => {
            const questionResponse = response.responses[question.id];
            return (
              <div key={question.id} className="border-b pb-6 last:border-0">
                <h3 className="font-medium text-gray-900 mb-2">{question.question_text}</h3>
                {isEditing ? (
                  renderEditField(question)
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4">
                    {Array.isArray(questionResponse) ? (
                      <ul className="list-disc pl-5 space-y-1">
                        {questionResponse.map((item: string, index: number) => (
                          <li key={index} className="text-gray-700">{renderResponseValue(item)}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-700">
                        {renderResponseValue(questionResponse) || 'No response provided'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No responses recorded for this survey.</p>
      )}

      {isEditing && (
        <div className="mt-6 pt-6 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={isSaving}>
            Save Changes
          </Button>
        </div>
      )}
    </Card>
  );
}
