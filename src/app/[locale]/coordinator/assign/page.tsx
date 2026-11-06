// app/[locale]/coordinator/assign/page.tsx
'use client';

import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/alert';
import Input from '@/components/ui/form/input';
import Textarea from '@/components/ui/form/textarea';
import Select from '@/components/ui/form/select';
import { useApiQuery, useApiMutation } from '@/lib/hooks/use-api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ArrowLeft,
  Calendar,
  Users,
  Building,
  FileText,
  Check,
  X,
  Loader,
  CheckSquare,
  Square,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api/api';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useQueryClient } from '@tanstack/react-query';

// Helper function to normalize API responses to arrays
function toArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];

  // Handle common API response shapes
  const v = value as any;
  if (Array.isArray(v?.data)) return v.data;
  if (Array.isArray(v?.items)) return v.items;
  if (Array.isArray(v?.results)) return v.results;
  if (Array.isArray(v?.users)) return v.users;
  if (Array.isArray(v?.schools)) return v.schools;

  return [];
}

// Simplified schema without coerce - we'll handle number conversion manually
const assignActivitySchema = z.object({
  activity_template_id: z.string().min(1, 'Template is required'),
  school_id: z.string().min(1, 'School is required'),
  scheduled_date: z.string().min(1, 'Date is required'),
  description: z.string().optional(),
  assignment_notes: z.string().optional(),
});

type AssignActivityFormData = {
  activity_template_id: string;
  school_id: string;
  scheduled_date: string;
  description?: string;
  assignment_notes?: string;
  number_of_participants?: number;
  volunteer_id?: string;
  volunteer_ids?: string[];
};

interface ActivityTemplate {
  id: string;
  name: string;
  purpose?: string;
  duration_minutes?: number;
  materials_needed?: string;
  facilitator_notes?: string;
}

interface Volunteer {
  id: string;
  email: string;
  full_name: string;
  role: string;
  pilot_ids: string[];
  pilot_names: string[];
  school_ids: string[];
  school_names: string[];
}

interface School {
  id: string;
  name: string;
  address?: string;
  province?: string;
  district?: string;
  pilot_id: string;
}

interface BatchAssignmentResult {
  success: boolean;
  volunteerId: string;
  volunteerName: string;
  message?: string;
  error?: string;
}

// Custom Checkbox component
interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

function Checkbox({ label, checked, onChange, className = '' }: CheckboxProps) {
  return (
    <label className={`flex items-center cursor-pointer ${className}`}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div className={`w-5 h-5 border rounded flex items-center justify-center ${checked ? 'bg-green-600 border-green-600' : 'border-gray-400'}`}>
          {checked && <Check className="h-3 w-3 text-white" />}
        </div>
      </div>
      <span className="ml-2 text-sm text-gray-700">{label}</span>
    </label>
  );
}

export default function AssignActivityPage() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const actor=user?.id;
  const mounted=useRef(true);
  const busy=useRef(false);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;}},[]);
  useEffect(()=>()=>{if(actor){queryClient.removeQueries({queryKey:['assignment-options',actor]});queryClient.removeQueries({queryKey:['assignment-facilitators',actor]});}},[actor,queryClient]);
  const params = useParams();
  const locale = params.locale as string;
  
  const [selectedVolunteers, setSelectedVolunteers] = useState<string[]>([]);
  const [assignToAll, setAssignToAll] = useState(false);
  const [assignmentError,setAssignmentError]=useState('');
  const [batchResults, setBatchResults] = useState<BatchAssignmentResult[]>([]);
  const [isBatchAssigning, setIsBatchAssigning] = useState(false);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [numberOfParticipants, setNumberOfParticipants] = useState<number>(25);
  const [numberOfBoys, setNumberOfBoys] = useState<number | null>(null);
  const [numberOfGirls, setNumberOfGirls] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    trigger,
  } = useForm<AssignActivityFormData>({
    resolver: zodResolver(assignActivitySchema),
    defaultValues: {
      number_of_participants: 25,
    },
  });

  // Watch form values for pilot-scoped facilitator lookup and scheduling.
  const schoolId = watch('school_id');
  const scheduledDate = watch('scheduled_date');
  
  const options = useApiQuery<{success:boolean;data:{state:'ready'|'setup_required'|'no_active';pilot:{id:string;name:string;start_date:string;end_date:string}|null;schools:School[];templates:ActivityTemplate[]}}>(
    ['assignment-options',actor],()=>api.get('/activities/assignment-options'),
    {enabled:Boolean(actor),placeholderData:undefined,staleTime:0,refetchOnMount:'always'}
  );
  const pilot=options.data?.data.pilot;
  const templatesLoading=options.isLoading||options.isFetching;
  const schoolsLoading=templatesLoading;
  const templatesArr=options.data?.data.templates||[];
  const schoolsArr=options.data?.data.schools||[];
  const {data:usersResponse,isLoading:usersLoading,isFetching:usersFetching,error:usersError}=useApiQuery<unknown>(
    ['assignment-facilitators',actor,pilot?.id,schoolId],
    ()=>api.get('/users',{role:'facilitator',school_id:schoolId,pilot_id:pilot?.id}),
    {enabled:Boolean(actor&&pilot&&schoolId),placeholderData:undefined,staleTime:0,refetchOnMount:'always'}
  );
  const volunteersLoading=Boolean(schoolId)&&(usersLoading||usersFetching);
  useEffect(()=>{
    setValue('school_id','');setValue('activity_template_id','');setValue('scheduled_date','');
    setValue('volunteer_id','');setValue('volunteer_ids',[]);setSelectedVolunteers([]);setAssignToAll(false);setBatchResults([]);
  },[actor,pilot?.id,setValue]);

  // Normalize volunteers response - extract users array from response
  const volunteersArr = useMemo(() => {
    if (Array.isArray(usersResponse)) return usersResponse as Volunteer[];

    // Handle nested structure like { users: [...], total: number }
    const response = usersResponse as any;
    if (response && Array.isArray(response.users)) {
      return response.users as Volunteer[];
    }

    return toArray<Volunteer>(usersResponse);
  }, [usersResponse]);

  // The backend already scopes this list by selected school -> pilot -> user_pilots.
  const filteredVolunteers = useMemo(() => {
    if (!schoolId || volunteersLoading || usersError) return [];
    return volunteersArr || [];
  }, [volunteersArr, schoolId, volunteersLoading, usersError]);

  // Update selected facilitators when school changes
  useEffect(() => {
    {
      setSelectedVolunteers([]);
      setAssignToAll(false);
      setValue('volunteer_ids', []);
      setValue('volunteer_id', '');
    }
  }, [schoolId, setValue]);

  // Handle assign to all toggle
  const handleAssignToAllToggle = (checked: boolean) => {
    if(busy.current)return;
    setAssignToAll(checked);
    if (checked && filteredVolunteers.length > 0) {
      const allVolunteerIds = filteredVolunteers.map(v => v.id);
      setSelectedVolunteers(allVolunteerIds);
      setValue('volunteer_ids', allVolunteerIds);
      setValue('volunteer_id', '');
    } else {
      setSelectedVolunteers([]);
      setValue('volunteer_ids', []);
    }
  };

  // Handle individual facilitator selection
  const handleVolunteerToggle = (volunteerId: string) => {
    if(busy.current)return;
    let newSelectedVolunteers;
    
    if (selectedVolunteers.includes(volunteerId)) {
      newSelectedVolunteers = selectedVolunteers.filter(id => id !== volunteerId);
    } else {
      newSelectedVolunteers = [...selectedVolunteers, volunteerId];
    }
    
    setSelectedVolunteers(newSelectedVolunteers);
    setValue('volunteer_ids', newSelectedVolunteers);
    setAssignToAll(newSelectedVolunteers.length === filteredVolunteers.length);
    
    // Clear single volunteer selection when using multiple
    setValue('volunteer_id', '');
  };

  // Single assignment mutation
  const singleAssignMutation = useApiMutation(
    (data: AssignActivityFormData) => api.post('/activities/assign', {...data,pilot_id:pilot?.id})
  );

  // Batch assignment function
  const batchAssignActivities = async (formData: AssignActivityFormData) => {
    if (!selectedVolunteers.length) return;
    
    setIsBatchAssigning(true);
    setBatchResults([]);
    const results: BatchAssignmentResult[] = [];
    const batchToken=localStorage.getItem('token');
    
    for (let i = 0; i < selectedVolunteers.length; i++) {
      if(!mounted.current||localStorage.getItem('token')!==batchToken)break;
      const volunteerId = selectedVolunteers[i];
      const volunteer = volunteersArr.find(v => v.id === volunteerId);
      
      setCurrentBatchIndex(i);
      
      try {
        const payload = {
          ...formData,
          pilot_id:pilot?.id,
          volunteer_id: volunteerId,
          volunteer_ids: undefined, // Remove array for single assignment; legacy API field name
          number_of_participants: numberOfParticipants,
          number_of_boys: numberOfBoys,
          number_of_girls: numberOfGirls,
        };
        
        await api.post('/activities/assign', payload);
        
        results.push({
          success: true,
          volunteerId,
          volunteerName: volunteer?.full_name || 'Unknown',
          message: 'Assigned successfully'
        });
      } catch (error: any) {
        results.push({
          success: false,
          volunteerId,
          volunteerName: volunteer?.full_name || 'Unknown',
          error: error.message || 'Failed to assign'
        });
      }
      
      // Small delay to prevent overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if(!mounted.current)return;
    setBatchResults(results);
    setIsBatchAssigning(false);
    setCurrentBatchIndex(0);
    
    // Check if all were successful
    const allSuccess = results.every(r => r.success);
    const someSuccess = results.some(r => r.success);
    
    if (allSuccess) {
      // Redirect if all successful
      setTimeout(() => {
        if(mounted.current){router.push(`/${locale}/coordinator/activities`);router.refresh();}
      }, 2000);
    } else if (someSuccess) {
      // Show results summary
      // User can choose to retry failed ones
    }
  };

  const onSubmit = async (data: AssignActivityFormData) => {
    if(busy.current||!pilot||options.isFetching||usersError||volunteersLoading)return;
    const requested=selectedVolunteers.length?selectedVolunteers:[data.volunteer_id];
    if(!requested.every(id=>filteredVolunteers.some(person=>person.id===id))){alert('Facilitator eligibility changed. Reload the list.');return;}

    // Validate at least one facilitator is selected
    if (!selectedVolunteers.length && !data.volunteer_id) {
      alert('Please select at least one facilitator');
      return;
    }

    if (numberOfBoys !== null && numberOfGirls !== null && numberOfBoys + numberOfGirls !== numberOfParticipants) {
      alert('Boys plus girls must equal total participants');
      return;
    }
    
    // Prepare form data with number of participants
    const formData = {
      ...data,
      number_of_participants: numberOfParticipants,
      number_of_boys: numberOfBoys,
      number_of_girls: numberOfGirls,
    };
    
    setAssignmentError('');
    busy.current=true;
    try {
    // Single facilitator assignment through the legacy volunteer_id field
    if (data.volunteer_id && !selectedVolunteers.length) {
      try {
        await singleAssignMutation.mutateAsync(formData);
        if(!mounted.current)return;
        router.push(`/${locale}/coordinator/activities`);
        router.refresh();
      } catch (error) {
        setAssignmentError(error instanceof Error?error.message:'Assignment could not be confirmed. Check existing activities before retrying.');
      }
    } 
    // Batch assignment
    else if (selectedVolunteers.length > 0) {
      await batchAssignActivities(formData);
    }
    } finally {busy.current=false;}
  };

  // Get selected template details
  const selectedTemplateId = watch('activity_template_id');
  const selectedTemplate = templatesArr.find(t => t.id === selectedTemplateId);
  const hasFullSplit = numberOfBoys !== null && numberOfGirls !== null;
  const splitTotal = (numberOfBoys ?? 0) + (numberOfGirls ?? 0);

  // Create options with default placeholder option
  const templateOptions = [
    { value: '', label: 'Select a template...' },
    ...(templatesArr.map(template => ({
      value: template.id,
      label: template.name,
    })) || [])
  ];

  const schoolOptions = [
    { value: '', label: 'Select a school...' },
    ...(schoolsArr.map(school => ({
      value: school.id,
      label: school.name,
    })) || [])
  ];

  const isLoading = templatesLoading || volunteersLoading || schoolsLoading;

  if(options.isLoading||options.isFetching)return <p role="status" className="p-4">Loading active pilot assignment optionsâ€¦</p>;
  if(options.error)return <Alert type="error" title="Assignment unavailable"><p>{options.error.message}</p><Button variant="outline" className="mt-3" onClick={()=>void options.refetch()}>Reload options</Button></Alert>;
  if(!pilot||options.data?.data.state!=='ready')return <Alert type="warning" title="Assignment setup required"><p>{pilot?`${pilot.name} needs schools and activity templates before assignments can be created.`:'No active pilot is configured. Closed-pilot history remains available.'}</p><Button variant="outline" className="mt-3" onClick={()=>void options.refetch()}>Reload options</Button></Alert>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/${locale}/coordinator/activities`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Activities
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Assign New Activity</h1>
        <p className="mt-1 text-sm text-gray-500">
          Assign a reporting activity to one or multiple facilitators
        </p>
      </div>

      <Card className="p-4"><p className="font-medium">Active pilot: {pilot.name}</p><p className="mt-1 text-sm text-muted-foreground">{pilot.start_date} â€“ {pilot.end_date}</p></Card>
      {assignmentError && <Alert type="error" title="Assignment not confirmed">{assignmentError}</Alert>}
      {usersError && <Alert type="error" title="Facilitators unavailable">{usersError.message}</Alert>}
      {/* Debug Info - Remove in production */}
      <div className="hidden">
        <p>Facilitators count: {volunteersArr.length}</p>
        <p>School ID: {schoolId}</p>
        <p>Filtered Facilitators count: {filteredVolunteers.length}</p>
        <pre>{JSON.stringify(volunteersArr.slice(0, 2), null, 2)}</pre>
      </div>

      {/* Batch Assignment Results */}
      {batchResults.length > 0 && (
        <Card className="border-l-4 border-blue-500">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Assignment Results ({batchResults.filter(r => r.success).length}/{batchResults.length} successful)
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {batchResults.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    result.success ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  <div className="flex items-center">
                    {result.success ? (
                      <Check className="h-5 w-5 text-green-600 mr-3" />
                    ) : (
                      <X className="h-5 w-5 text-red-600 mr-3" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{result.volunteerName}</p>
                      <p className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                        {result.success ? result.message : result.error}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    result.success 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {result.success ? 'Success' : 'Failed'}
                  </span>
                </div>
              ))}
            </div>
            
            {batchResults.some(r => !r.success) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-3">
                  Some assignments failed. You can retry the failed ones or assign individually.
                </p>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const failedVolunteers = batchResults
                        .filter(r => !r.success)
                        .map(r => r.volunteerId);
                      setSelectedVolunteers(failedVolunteers);
                      setBatchResults([]);
                    }}
                  >
                    Retry Failed Only
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setBatchResults([]);
                      router.push(`/${locale}/coordinator/activities`);
                    }}
                  >
                    View Activities
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Assignment Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Activity Details
                </h2>
                
                <div className="space-y-4">
                  <Select
                    label="Activity Template *"
                    {...register('activity_template_id')}
                    options={templateOptions}
                    error={errors.activity_template_id?.message}
                    required
                    disabled={isLoading||isBatchAssigning||isSubmitting}
                  />

                  {selectedTemplate && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Template Details
                      </h4>
                      {selectedTemplate.purpose && (
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Purpose:</span> {selectedTemplate.purpose}
                        </p>
                      )}
                      {selectedTemplate.duration_minutes && (
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Duration:</span> {selectedTemplate.duration_minutes} minutes
                        </p>
                      )}
                      {selectedTemplate.materials_needed && (
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Materials:</span> {selectedTemplate.materials_needed}
                        </p>
                      )}
                      {selectedTemplate.facilitator_notes && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Notes:</span> {selectedTemplate.facilitator_notes}
                        </p>
                      )}
                    </div>
                  )}

                  <Textarea
                    label="Description (Optional)"
                    {...register('description')}
                    placeholder="Add any additional details or context for this specific activity..."
                    rows={3}
                    error={errors.description?.message}
                    helpText="This will override the template description"
                  />
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Schedule & Location
                </h2>
                
                <div className="space-y-4">
                  <Input
                    label="Activity Date *"
                    type="date"
                    {...register('scheduled_date')}
                    min={pilot.start_date}
                    max={pilot.end_date}
                    error={errors.scheduled_date?.message}
                    leftIcon={<Calendar className="h-5 w-5 text-gray-400" />}
                    className="pl-10"
                    helpText="Multiple reports can be assigned for the same day when needed."
                    required
                  />

                  <Select
                    label="School *"
                    {...register('school_id')}
                    options={schoolOptions}
                    error={errors.school_id?.message}
                    required
                    disabled={isLoading||isBatchAssigning||isSubmitting}
                    onChange={(e) => {
                      setValue('school_id', e.target.value);
                      trigger('school_id');
                    }}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Participants *
                    </label>
                    <div className="space-y-4">
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Users className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          min="1"
                          value={numberOfParticipants}
                          onChange={(e) => setNumberOfParticipants(parseInt(e.target.value) || 25)}
                          className="block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-green-500 sm:text-sm"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Number of boys"
                          type="number"
                          min="0"
                          value={numberOfBoys ?? ''}
                          onChange={(e) => setNumberOfBoys(e.target.value === '' ? null : Number(e.target.value))}
                          placeholder="Leave blank if not recorded"
                        />
                        <Input
                          label="Number of girls"
                          type="number"
                          min="0"
                          value={numberOfGirls ?? ''}
                          onChange={(e) => setNumberOfGirls(e.target.value === '' ? null : Number(e.target.value))}
                          placeholder="Leave blank if not recorded"
                        />
                      </div>
                      {hasFullSplit && (
                        <p className={`text-sm ${splitTotal === numberOfParticipants ? 'text-green-700' : 'text-red-700'}`}>
                          Boys + girls: {splitTotal}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Facilitators & Assignment Notes */}
          <div className="space-y-6">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Assign to Facilitators
                  </h2>
                  {schoolId && filteredVolunteers.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {selectedVolunteers.length} of {filteredVolunteers.length} selected
                      </span>
                      <Checkbox
                        label="All"
                        checked={assignToAll}
                        onChange={handleAssignToAllToggle}
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>
                
                {!schoolId ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <Building className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">Select a school to see available facilitators</p>
                  </div>
                ) : filteredVolunteers.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">
                      {volunteersLoading
                        ? 'Loading facilitators...'
                        : "No facilitators found for this school's pilot."}
                    </p>
                    {!volunteersLoading && (
                      <p className="text-sm text-gray-500 mt-2">
                        Confirm the user has the facilitator role and is linked to the correct pilot.
                      </p>
                    )}
                    <Button
                      variant="link"
                      className="mt-2"
                      onClick={() => router.push(`/${locale}/coordinator/volunteers`)}
                    >
                      Manage Facilitators
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredVolunteers.map((volunteer) => (
                      <div
                        key={volunteer.id}
                        className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedVolunteers.includes(volunteer.id)
                            ? 'bg-blue-50 border border-blue-200'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => handleVolunteerToggle(volunteer.id)}
                      >
                        <div className="flex items-center justify-center h-5 w-5 mr-3">
                          {selectedVolunteers.includes(volunteer.id) ? (
                            <div className="h-4 w-4 rounded-sm bg-blue-600 flex items-center justify-center">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          ) : (
                            <div className="h-4 w-4 rounded-sm border border-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{volunteer.full_name}</p>
                          <p className="text-xs text-gray-500 truncate">{volunteer.email}</p>
                          {volunteer.school_names && volunteer.school_names.length > 0 && (
                            <p className="text-xs text-gray-400 mt-1">
                              Schools: {volunteer.school_names.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Hidden inputs for form validation */}
                <input type="hidden" {...register('volunteer_id')} />
                <input type="hidden" {...register('volunteer_ids')} />
                <input type="hidden" {...register('number_of_participants')} />
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Assignment Notes
                </h2>
                
                <Textarea
                  label="Notes for Facilitator"
                  {...register('assignment_notes')}
                  placeholder="Add any specific instructions or expectations for the facilitator..."
                  rows={4}
                  error={errors.assignment_notes?.message}
                  helpText="These notes will be visible to the facilitator"
                />
              </div>
            </Card>

            {/* Submit Card */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Review & Assign
                </h2>
                
                {(singleAssignMutation.error || (batchResults.length > 0 && batchResults.some(r => !r.success))) && (
                  <div className="mb-4">
                    <Alert
                      type="error"
                      title="Some assignments failed"
                    >
                      Check the results above for details
                    </Alert>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Activity:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedTemplate?.name || 'Not selected'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">School:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {schoolsArr.find(s => s.id === schoolId)?.name || 'Not selected'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Facilitators:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedVolunteers.length > 0 
                        ? `${selectedVolunteers.length} selected` 
                        : 'Not selected'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Date:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {scheduledDate 
                        ? new Date(scheduledDate).toLocaleDateString()
                        : 'Not selected'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Participants:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {numberOfParticipants}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Boys:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {numberOfBoys ?? 'Not recorded'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Girls:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {numberOfGirls ?? 'Not recorded'}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  {isBatchAssigning ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Assigning {currentBatchIndex + 1} of {selectedVolunteers.length}...
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {Math.round(((currentBatchIndex + 1) / selectedVolunteers.length) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${((currentBatchIndex + 1) / selectedVolunteers.length) * 100}%` }}
                        />
                      </div>
                      <div className="text-center">
                        <Loader className="h-6 w-6 animate-spin text-blue-600 mx-auto" />
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="submit"
                      variant="default"
                      className="w-full"
                      loading={isSubmitting || singleAssignMutation.isPending}
                      disabled={
                        !watch('activity_template_id') ||
                        !watch('school_id') ||
                        !watch('scheduled_date') ||
                        (!selectedVolunteers.length && !watch('volunteer_id')) ||
                        isSubmitting ||
                        isBatchAssigning || volunteersLoading || Boolean(usersError)
                      }
                    >
                      {selectedVolunteers.length > 1 
                        ? `Assign to ${selectedVolunteers.length} Facilitators`
                        : 'Assign Activity'}
                    </Button>
                  )}
                  
                  {selectedVolunteers.length > 1 && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      This will create {selectedVolunteers.length} separate activities
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
