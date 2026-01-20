'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { usersApi } from '@/lib/api/users';
import { pilotsApi } from '@/lib/api/pilots';
import { schoolsApi, getSchoolPilotId } from '@/lib/api/schools';
import { handleApiError } from '@/lib/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { Pilot, School } from '@/lib/types';

const userSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role: z.enum(['admin', 'coordinator', 'volunteer']),
  pilot_ids: z.array(z.string()).optional(),
  school_ids: z.array(z.string()).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof userSchema>;

export default function CreateUserForm() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoadingPilots, setIsLoadingPilots] = useState(true);
  const [isLoadingSchools, setIsLoadingSchools] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: 'volunteer',
      pilot_ids: [],
      school_ids: [],
    },
  });

  const selectedRole = watch('role');
  const selectedPilotIds = watch('pilot_ids') || [];
  const selectedSchoolIds = watch('school_ids') || [];

  // Fetch pilots and schools
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching pilots and schools...');
        
        // Fetch pilots
        const pilotsResponse = await pilotsApi.getPilots({ 
          isActive: true,
          limit: 100
        });
        
        console.log('Pilots response:', pilotsResponse);
        
        if (pilotsResponse.success && pilotsResponse.data) {
          console.log(`Setting ${pilotsResponse.data.length} pilots`);
          setPilots(pilotsResponse.data);
        } else {
          console.warn('Pilots API error:', pilotsResponse.message);
          setPilots([]);
        }
        
        setIsLoadingPilots(false);

        // Fetch schools
        const schoolsResponse = await schoolsApi.getSchools({
          isActive: true,
          limit: 100
        });
        
        console.log('Schools response:', schoolsResponse);
        
        if (schoolsResponse.success && schoolsResponse.data) {
          console.log(`Setting ${schoolsResponse.data.length} schools`);
          setSchools(schoolsResponse.data);
          
          // Log school distribution by pilot
          const pilotCounts: Record<string, number> = {};
          schoolsResponse.data.forEach(school => {
            const pilotId = getSchoolPilotId(school) || 'no-pilot';
            pilotCounts[pilotId] = (pilotCounts[pilotId] || 0) + 1;
          });
          console.log('Schools by pilot:', pilotCounts);
        } else {
          console.warn('Schools API error:', schoolsResponse.message);
          setSchools([]);
        }
        
        setIsLoadingSchools(false);
        
        console.log('Data fetch complete');
        
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load pilots and schools. Please try again.');
        setIsLoadingPilots(false);
        setIsLoadingSchools(false);
      }
    };

    fetchData();
  }, []);

  // Filter schools based on selected pilots and ensure they have an ID
  const filteredSchools = useMemo(() => {
    console.log('Filtering schools...');
    console.log('Selected pilot IDs:', selectedPilotIds);
    console.log('Total schools available:', schools.length);
    
    // If no pilots selected, show no schools
    if (selectedPilotIds.length === 0) {
      console.log('No pilots selected, showing no schools');
      return [];
    }
    
    // Filter schools that belong to ANY selected pilot AND have an ID
    const filtered = schools.filter((school): school is School & { id: string } => {
      const schoolPilotId = getSchoolPilotId(school);
      const hasId = !!school.id;
      const matches = schoolPilotId && selectedPilotIds.includes(schoolPilotId.toString());
      
      if (hasId && matches) {
        console.log(`School ${school.id} matches pilot ${schoolPilotId}`);
      }
      
      return hasId && !!matches;
    });
    
    console.log(`Filtered schools count: ${filtered.length}`);
    console.log('Filtered schools:', filtered.map(s => ({ id: s.id, name: s.name, pilotId: getSchoolPilotId(s) })));
    
    return filtered;
  }, [schools, selectedPilotIds]);

  // Get pilot names for display
  const getSelectedPilotNames = () => {
    return selectedPilotIds.map(pilotId => {
      const pilot = pilots.find(p => p.id.toString() === pilotId.toString());
      return pilot ? pilot.name : `Pilot ID: ${pilotId}`;
    }).join(', ');
  };

  // Get school pilot name for display
  const getSchoolPilotName = (school: School) => {
    const pilotId = getSchoolPilotId(school);
    const pilot = pilots.find(p => p.id.toString() === pilotId?.toString());
    return pilot ? pilot.name : 'No Pilot';
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const userData = {
        email: data.email,
        full_name: data.full_name,
        password: data.password,
        role: data.role,
        pilot_ids: data.pilot_ids && data.pilot_ids.length > 0 ? data.pilot_ids : undefined,
        school_ids: data.role === 'volunteer' && data.school_ids && data.school_ids.length > 0 ? data.school_ids : undefined,
      };

      console.log('Creating user with data:', userData);

      const response = await usersApi.create(userData);
      console.log('Create user response:', response);
      
      if (response) {
        setSuccess('User created successfully!');
        reset();
        
        setTimeout(() => {
          router.push('/admin/users');
        }, 2000);
      } else {
        setError('Failed to create user');
      }
      
    } catch (err: any) {
      console.error('Error creating user:', err);
      const errorMessage = handleApiError(err);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle pilot checkbox change
  const handlePilotChange = (pilotId: string, isChecked: boolean) => {
    const currentPilotIds = watch('pilot_ids') || [];
    let newPilotIds: string[];
    
    if (isChecked) {
      newPilotIds = [...currentPilotIds, pilotId];
    } else {
      newPilotIds = currentPilotIds.filter(id => id !== pilotId);
      // Also remove schools from deselected pilot
      const schoolsToRemove = schools.filter(school => {
        const schoolPilotId = getSchoolPilotId(school);
        return schoolPilotId?.toString() === pilotId && school.id;
      }).map(s => s.id!);
      const currentSchoolIds = watch('school_ids') || [];
      const newSchoolIds = currentSchoolIds.filter(id => !schoolsToRemove.includes(id));
      setValue('school_ids', newSchoolIds);
    }
    
    setValue('pilot_ids', newPilotIds);
    console.log('Updated pilot IDs:', newPilotIds);
  };

  // Handle school checkbox change
  const handleSchoolChange = (schoolId: string, isChecked: boolean) => {
    const currentSchoolIds = watch('school_ids') || [];
    let newSchoolIds: string[];
    
    if (isChecked) {
      newSchoolIds = [...currentSchoolIds, schoolId];
    } else {
      newSchoolIds = currentSchoolIds.filter(id => id !== schoolId);
    }
    
    setValue('school_ids', newSchoolIds);
  };

  // Calculate pilot schools count
  const getPilotSchoolsCount = (pilotId: string) => {
    return schools.filter(school => {
      const schoolPilotId = getSchoolPilotId(school);
      return schoolPilotId?.toString() === pilotId.toString();
    }).length;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Error and Success messages */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <div className="mt-2 text-sm text-green-700">
                {success} Redirecting to users list...
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address *
          </label>
          <div className="mt-1">
            <input
              type="email"
              id="email"
              {...register('email')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-base px-4 py-3 h-12"
              placeholder="user@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
            Full Name *
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="full_name"
              {...register('full_name')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-base px-4 py-3 h-12"
              placeholder="John Doe"
            />
            {errors.full_name && (
              <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
            )}
          </div>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password *
          </label>
          <div className="mt-1">
            <input
              type="password"
              id="password"
              {...register('password')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-base px-4 py-3 h-12"
              placeholder="At least 8 characters"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm Password *
          </label>
          <div className="mt-1">
            <input
              type="password"
              id="confirmPassword"
              {...register('confirmPassword')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-base px-4 py-3 h-12"
              placeholder="Re-enter password"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        {/* Role */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
            Role *
          </label>
          <div className="mt-1">
            <select
              id="role"
              {...register('role')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-base px-4 py-3 h-12"
            >
              <option value="volunteer">Volunteer</option>
              <option value="coordinator">Coordinator</option>
              {currentUser?.role === 'admin' && <option value="admin">Admin</option>}
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Pilots Section */}
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Pilot Assignments</h3>
        <div className="space-y-3">
          {isLoadingPilots ? (
            <div className="text-sm text-gray-500 flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading pilots...
            </div>
          ) : pilots.length === 0 ? (
            <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
              No active pilots available. Create pilots first.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pilots
                .filter(pilot => pilot.status === 'active')
                .map((pilot) => {
                  const isChecked = selectedPilotIds.includes(pilot.id.toString());
                  const pilotSchoolsCount = getPilotSchoolsCount(pilot.id.toString());
                  
                  return (
                    <div key={pilot.id} className="flex items-start p-3 border border-gray-200 rounded-md hover:bg-gray-50">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          id={`pilot-${pilot.id}`}
                          checked={isChecked}
                          onChange={(e) => handlePilotChange(pilot.id.toString(), e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                      </div>
                      <label
                        htmlFor={`pilot-${pilot.id}`}
                        className="ml-3 flex-1 cursor-pointer"
                      >
                        <div className="font-medium text-gray-900 flex justify-between">
                          <span>{pilot.name}</span>
                          <span className="text-xs font-normal text-gray-500">
                            {pilotSchoolsCount} school{pilotSchoolsCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {pilot.description && (
                          <p className="text-sm text-gray-500 mt-1">{pilot.description}</p>
                        )}
                        <div className="text-xs text-gray-400 mt-2">
                          {pilot.start_date && (
                            <span>
                              {new Date(pilot.start_date).toLocaleDateString()} - 
                              {pilot.end_date ? new Date(pilot.end_date).toLocaleDateString() : 'Present'}
                            </span>
                          )}
                        </div>
                      </label>
                    </div>
                  );
                })}
            </div>
          )}
          <p className="text-xs text-gray-500">
            {selectedRole === 'coordinator' 
              ? 'Coordinators must be assigned to at least one pilot.' 
              : 'Pilot assignment is optional for volunteers and admins.'}
          </p>
        </div>
      </div>

      {/* Schools Section (Only for volunteers) */}
      {selectedRole === 'volunteer' && (
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">School Assignments</h3>
          <div className="space-y-3">
            {isLoadingSchools ? (
              <div className="text-sm text-gray-500 flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading schools...
              </div>
            ) : filteredSchools.length === 0 ? (
              <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
                {selectedPilotIds.length === 0 
                  ? 'Select pilots above to see available schools'
                  : <div>
                      <p>No schools available for the selected {selectedPilotIds.length} pilot(s).</p>
                      <p className="mt-1 text-xs">
                        Selected pilots: {getSelectedPilotNames()}
                      </p>
                      <p className="mt-1 text-xs">
                        Note: Only schools assigned to the selected pilots will appear here.
                      </p>
                    </div>}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-2">
                {filteredSchools.map((school) => {
                  const isChecked = watch('school_ids')?.includes(school.id) || false;
                  return (
                    <div key={school.id} className="flex items-start p-3 border border-gray-200 rounded-md hover:bg-gray-50">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          id={`school-${school.id}`}
                          checked={isChecked}
                          onChange={(e) => handleSchoolChange(school.id, e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                      </div>
                      <label
                        htmlFor={`school-${school.id}`}
                        className="ml-3 flex-1 cursor-pointer"
                      >
                        <div className="font-medium text-gray-900">{school.name}</div>
                        <div className="text-sm text-gray-500 mt-1 space-y-1">
                          {school.address && <p>📍 {school.address}</p>}
                          {school.city && <p>🏙️ {school.city}</p>}
                          {school.state && <p>📍 {school.state}</p>}
                          <p className="font-medium text-green-600 mt-2">📋 Pilot: {getSchoolPilotName(school)}</p>
                        </div>
                      </label>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-gray-500">
              School assignments are optional but help organize volunteers and activities.
            </p>
          </div>
        </div>
      )}

      {/* Role-specific guidance */}
      <div className={`p-4 rounded-md ${selectedRole === 'volunteer' ? 'bg-blue-50' : selectedRole === 'coordinator' ? 'bg-yellow-50' : 'bg-purple-50'}`}>
        <div className="flex">
          <div className="shrink-0">
            {selectedRole === 'volunteer' && (
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            )}
            {selectedRole === 'coordinator' && (
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
            {selectedRole === 'admin' && (
              <svg className="h-5 w-5 text-purple-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0z" />
                <path d="M4 12a1 1 0 011-1h1a1 1 0 010 2H5a1 1 0 01-1-1zm10 0a1 1 0 011-1h1a1 1 0 010 2h-1a1 1 0 01-1-1z" />
              </svg>
            )}
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium">
              {selectedRole === 'volunteer' && <span className="text-blue-800">Volunteer Information</span>}
              {selectedRole === 'coordinator' && <span className="text-yellow-800">Coordinator Information</span>}
              {selectedRole === 'admin' && <span className="text-purple-800">Admin Information</span>}
            </h3>
            <div className="mt-2 text-sm">
              {selectedRole === 'volunteer' && (
                <p className="text-blue-700">
                  Volunteers participate in activities at assigned schools. School assignment helps track which schools the volunteer works with.
                </p>
              )}
              {selectedRole === 'coordinator' && (
                <p className="text-yellow-700">
                  Coordinators manage volunteers and activities within their assigned pilots. Pilot assignment is required for coordinators.
                </p>
              )}
              {selectedRole === 'admin' && (
                <p className="text-purple-700">
                  Admins have full system access and can manage all aspects of the platform. Pilot assignment is optional.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.push('/admin/users')}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </>
          ) : (
            'Create User'
          )}
        </button>
      </div>
    </form>
  );
}