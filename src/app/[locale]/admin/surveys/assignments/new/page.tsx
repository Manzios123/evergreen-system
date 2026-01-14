// app/[locale]/admin/surveys/assignments/new/page.tsx
'use client';

import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/alert';
import { useApiQuery } from '@/lib/hooks/use-api';
import { api } from '@/lib/api/api';
import {
  ArrowLeftIcon,
  UserIcon,
  AcademicCapIcon,
  CalendarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Pilot {
  id: string;
  name: string;
}

interface Volunteer {
  id: string;
  full_name: string;
  email: string;
}

interface SurveyTemplate {
  id: string;
  name: string;
  survey_type: string;
  survey_period: string;
  pilot_id: string;
}

export default function CreateAssignmentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    survey_type: 'volunteer', // volunteer or student
    pilot_id: '',
    volunteer_id: '',
    survey_template_id: '',
    due_date: '',
    assignment_type: 'pre_pilot', // pre_pilot or post_pilot
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data
  const { data: pilots } = useApiQuery<Pilot[]>(['pilots'], () => api.get<Pilot[]>('/pilots'));
  const { data: volunteers } = useApiQuery<Volunteer[]>(
    ['volunteers', formData.pilot_id],
    () => api.get<Volunteer[]>(`/pilots/${formData.pilot_id}/volunteers`),
    { enabled: !!formData.pilot_id && formData.survey_type === 'volunteer' }
  );
  const { data: templates } = useApiQuery<SurveyTemplate[]>(
    ['survey-templates', formData.pilot_id, formData.survey_type],
    () => api.get<SurveyTemplate[]>('/survey-templates', {
      params: {
        pilot_id: formData.pilot_id,
        survey_type: formData.survey_type,
        survey_period: formData.assignment_type
      }
    }),
    { enabled: !!formData.pilot_id }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Reset dependent fields
    if (name === 'survey_type' || name === 'pilot_id') {
      setFormData(prev => ({ ...prev, volunteer_id: '', survey_template_id: '' }));
    }
    if (name === 'assignment_type') {
      setFormData(prev => ({ ...prev, survey_template_id: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validation
      if (!formData.pilot_id) throw new Error('Please select a pilot');
      if (!formData.survey_template_id) throw new Error('Please select a survey template');
      if (!formData.due_date) throw new Error('Please set a due date');

      let endpoint = '';
      let payload: any = {};

      if (formData.survey_type === 'volunteer') {
        if (!formData.volunteer_id) throw new Error('Please select a volunteer');
        
        endpoint = formData.assignment_type === 'pre_pilot' 
          ? '/survey-assignments/auto-assign-pre'
          : '/survey-assignments/manual-assign-post';
        
        payload = {
          volunteer_id: formData.volunteer_id,
          pilot_id: formData.pilot_id,
          due_date_days: Math.ceil((new Date(formData.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        };
      } else {
        // Student survey
        endpoint = '/survey-assignments/assign-student';
        payload = {
          pilot_id: formData.pilot_id,
          survey_template_id: formData.survey_template_id,
          due_date_days: Math.ceil((new Date(formData.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        };
      }

      const response = await api.post(endpoint, payload);
      
      alert('Assignment created successfully!');
      router.push('/admin/surveys/assignments');
      
    } catch (err: any) {
      setError(err.message || 'Failed to create assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Step 1: Assignment Type</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${formData.survey_type === 'volunteer' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                onClick={() => setFormData(prev => ({ ...prev, survey_type: 'volunteer' }))}
              >
                <div className="flex items-center">
                  <div className={`rounded-full p-3 ${formData.survey_type === 'volunteer' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <UserIcon className={`h-6 w-6 ${formData.survey_type === 'volunteer' ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Volunteer Survey</h3>
                    <p className="text-sm text-gray-500">Assign to individual volunteers</p>
                  </div>
                </div>
              </div>

              <div 
                className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${formData.survey_type === 'student' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                onClick={() => setFormData(prev => ({ ...prev, survey_type: 'student' }))}
              >
                <div className="flex items-center">
                  <div className={`rounded-full p-3 ${formData.survey_type === 'student' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <AcademicCapIcon className={`h-6 w-6 ${formData.survey_type === 'student' ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Student Survey</h3>
                    <p className="text-sm text-gray-500">Assign to entire pilot (coordinator fills)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Survey Period</h3>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="assignment_type"
                    value="pre_pilot"
                    checked={formData.assignment_type === 'pre_pilot'}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Pre-Pilot Survey</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="assignment_type"
                    value="post_pilot"
                    checked={formData.assignment_type === 'post_pilot'}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Post-Pilot Survey</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t">
              <Button onClick={() => setStep(2)} disabled={!formData.survey_type}>
                Next: Select Pilot
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Step 2: Select Pilot & Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Pilot
                </label>
                <select
                  name="pilot_id"
                  value={formData.pilot_id}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select a pilot</option>
                  {pilots?.map(pilot => (
                    <option key={pilot.id} value={pilot.id}>
                      {pilot.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>

            {formData.pilot_id && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Survey Template
                </label>
                {templates && templates.length > 0 ? (
                  <select
                    name="survey_template_id"
                    value={formData.survey_template_id}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select a template</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} ({template.survey_period.replace('_', ' ')})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-gray-500">
                    No templates found for this pilot and survey type. Please create a survey template first.
                  </p>
                )}
              </div>
            )}

            {formData.survey_type === 'volunteer' && formData.pilot_id && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Volunteer
                </label>
                {volunteers && volunteers.length > 0 ? (
                  <select
                    name="volunteer_id"
                    value={formData.volunteer_id}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select a volunteer</option>
                    {volunteers.map(volunteer => (
                      <option key={volunteer.id} value={volunteer.id}>
                        {volunteer.full_name} ({volunteer.email})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-gray-500">
                    No volunteers found in this pilot.
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-between pt-6 border-t">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button 
                onClick={() => setStep(3)}
                disabled={!formData.pilot_id || !formData.due_date || !formData.survey_template_id || (formData.survey_type === 'volunteer' && !formData.volunteer_id)}
              >
                Next: Review & Create
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Step 3: Review & Create</h2>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-medium text-gray-900 mb-4">Assignment Summary</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Survey Type:</span>
                  <span className="font-medium capitalize">{formData.survey_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Survey Period:</span>
                  <span className="font-medium capitalize">{formData.assignment_type.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pilot:</span>
                  <span className="font-medium">{pilots?.find(p => p.id === formData.pilot_id)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Due Date:</span>
                  <span className="font-medium">{new Date(formData.due_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Survey Template:</span>
                  <span className="font-medium">{templates?.find(t => t.id === formData.survey_template_id)?.name}</span>
                </div>
                {formData.survey_type === 'volunteer' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Volunteer:</span>
                    <span className="font-medium">{volunteers?.find(v => v.id === formData.volunteer_id)?.full_name}</span>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <Alert type="error" title="Error">
                {error}
              </Alert>
            )}

            <div className="flex justify-between pt-6 border-t">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Assignment'}
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/surveys/assignments"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Assignments
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Survey Assignment</h1>
            <p className="mt-1 text-sm text-gray-500">
              Create a new survey assignment for volunteers or entire pilots
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= stepNumber ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {stepNumber}
                </div>
                <div className={`ml-2 text-sm font-medium ${step >= stepNumber ? 'text-blue-600' : 'text-gray-500'}`}>
                  {stepNumber === 1 && 'Type'}
                  {stepNumber === 2 && 'Details'}
                  {stepNumber === 3 && 'Review'}
                </div>
                {stepNumber < 3 && (
                  <div className={`h-0.5 w-8 mx-2 ${step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form */}
      <Card>
        <div className="p-6">
          {renderStep()}
        </div>
      </Card>

      {/* Help */}
      <Alert type="info" title="Need help?">
        <div className="space-y-2 mt-2">
          <p><strong>Volunteer Surveys:</strong> Assigned to individual volunteers. They fill out the survey themselves.</p>
          <p><strong>Student Surveys:</strong> Assigned to entire pilots. Coordinators fill out aggregated results.</p>
          <p><strong>Pre-Pilot Surveys:</strong> Usually assigned when volunteers join a pilot.</p>
          <p><strong>Post-Pilot Surveys:</strong> Assigned after volunteers complete a pilot.</p>
        </div>
      </Alert>
    </div>
  );
}