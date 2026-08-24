'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { schoolsApi } from '@/lib/api/schools';
import { pilotsApi } from '@/lib/api/pilots';
import { handleApiError } from '@/lib/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { Pilot } from '@/lib/api/types';

// School schema - ONLY include fields that exist in D1 schema
const schoolSchema = z.object({
  name: z.string().min(2, 'School name must be at least 2 characters'),
  pilot_id: z.string().min(1, 'Please select a pilot'),
  province: z.string().optional(),
  district: z.string().optional(),
  address: z.string().optional(),
});

// Contact schema for school contacts table
const contactSchema = z.object({
  name: z.string().min(1, 'Contact name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  role: z.string().min(1, 'Contact role is required'),
  is_primary: z.boolean().optional(),
});

type SchoolFormData = z.infer<typeof schoolSchema>;
type ContactFormData = z.infer<typeof contactSchema>;

export default function CreateSchoolForm() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [isLoadingPilots, setIsLoadingPilots] = useState(true);
  const [contacts, setContacts] = useState<ContactFormData[]>([
    { name: '', email: '', phone: '', role: 'Principal', is_primary: true }
  ]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SchoolFormData>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      name: '',
      pilot_id: '',
      province: '',
      district: '',
      address: '',
    },
  });

  // Fetch active pilots
  useEffect(() => {
    const fetchPilots = async () => {
      try {
        const pilotsResponse = await pilotsApi.getPilots({ 
          limit: 100
        });
        
        if (pilotsResponse.success && pilotsResponse.data) {
          setPilots(pilotsResponse.data);
        }
        setIsLoadingPilots(false);
      } catch (err) {
        console.error('Failed to fetch pilots:', err);
        setError('Failed to load pilots. Please try again.');
        setIsLoadingPilots(false);
      }
    };

    fetchPilots();
  }, []);

  // Add a new contact field
  const addContact = () => {
    setContacts([...contacts, { name: '', email: '', phone: '', role: 'Teacher', is_primary: false }]);
  };

  // Remove a contact field
  const removeContact = (index: number) => {
    const newContacts = [...contacts];
    newContacts.splice(index, 1);
    setContacts(newContacts);
    
    // If we removed a primary contact and there are other contacts, make the first one primary
    if (contacts[index].is_primary && newContacts.length > 0) {
      newContacts[0].is_primary = true;
    }
  };

  // Update a contact field
  const updateContact = (index: number, field: keyof ContactFormData, value: string | boolean) => {
    const newContacts = [...contacts];
    
    if (field === 'is_primary' && value === true) {
      // If setting this as primary, unset all others
      newContacts.forEach((contact, i) => {
        contact.is_primary = i === index;
      });
    } else {
      (newContacts[index] as any)[field] = value;
    }
    
    setContacts(newContacts);
  };

  const onSubmit = async (data: SchoolFormData) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('Creating school with data:', data);
      
      // Create the school (only schema fields)
      const response = await schoolsApi.createSchool(data);
      
      if (!response.success || !response.data || !response.data.id) {
        throw new Error(response.message || 'Failed to create school');
      }

      const schoolId = response.data.id;

      // Filter out empty contacts and add them
      const validContacts = contacts.filter(contact =>
        contact.name.trim() && contact.email.trim() && contact.role.trim()
      );

      let failedContactCount = 0;
      if (validContacts.length > 0) {
        // Create contacts in parallel. A failed contact shouldn't fail the whole
        // operation (the school itself was already created), but it must be
        // surfaced to the user instead of only logged - otherwise they have no
        // way to know a contact they filled in didn't actually get saved.
        const results = await Promise.all(
          validContacts.map(contact =>
            schoolsApi.createContact(schoolId, contact).catch((err: any) => {
              console.warn('Failed to add contact:', err);
              return null;
            })
          )
        );
        failedContactCount = results.filter((result) => result === null).length;
      }

      setSuccess(
        failedContactCount > 0
          ? `School created successfully! ${failedContactCount} of ${validContacts.length} contact(s) failed to save - add ${failedContactCount === 1 ? 'it' : 'them'} from the school's page. Redirecting...`
          : 'School created successfully! Redirecting...'
      );
      reset();
      setContacts([{ name: '', email: '', phone: '', role: 'Principal', is_primary: true }]);
      
      // Redirect after 1.5 seconds
      setTimeout(() => {
        router.push('/admin/schools');
        router.refresh();
      }, 1500);
      
    } catch (err: any) {
      console.error('Error creating school:', err);
      const errorMessage = handleApiError(err);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
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
                {success}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
        {/* School Name */}
        <div className="sm:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            School Name *
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="name"
              {...register('name')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              placeholder="E.g., St. Mary's Primary School"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
        </div>

        {/* Pilot Selection */}
        <div className="sm:col-span-2">
          <label htmlFor="pilot_id" className="block text-sm font-medium text-gray-700">
            Pilot Program *
          </label>
          <div className="mt-1">
            {isLoadingPilots ? (
              <div className="flex items-center text-sm text-gray-500">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading pilots...
              </div>
            ) : pilots.length === 0 ? (
              <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
                No pilots available. Create a pilot first.
                <button
                  type="button"
                  onClick={() => router.push('/admin/pilots/new')}
                  className="ml-2 text-green-600 hover:text-green-700 font-medium"
                >
                  Create Pilot
                </button>
              </div>
            ) : (
              <select
                id="pilot_id"
                {...register('pilot_id')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              >
                <option value="">Select a pilot...</option>
                {pilots.map((pilot) => (
                  <option key={pilot.id} value={pilot.id}>
                    {pilot.name} {pilot.description && `- ${pilot.description}`}
                  </option>
                ))}
              </select>
            )}
            {errors.pilot_id && (
              <p className="mt-1 text-sm text-red-600">{errors.pilot_id.message}</p>
            )}
          </div>
        </div>

        {/* Province */}
        <div>
          <label htmlFor="province" className="block text-sm font-medium text-gray-700">
            Province
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="province"
              {...register('province')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              placeholder="E.g., Gauteng"
            />
          </div>
        </div>

        {/* District */}
        <div>
          <label htmlFor="district" className="block text-sm font-medium text-gray-700">
            District
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="district"
              {...register('district')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              placeholder="E.g., Tshwane"
            />
          </div>
        </div>

        {/* Address */}
        <div className="sm:col-span-2">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Address
          </label>
          <div className="mt-1">
            <textarea
              id="address"
              {...register('address')}
              rows={3}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              placeholder="Full physical address"
            />
          </div>
        </div>
      </div>

      {/* Contacts Section */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium text-gray-900">School Contacts</h3>
          <button
            type="button"
            onClick={addContact}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <svg className="-ml-0.5 mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Contact
          </button>
        </div>

        <div className="space-y-4">
          {contacts.map((contact, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-md bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-sm font-medium text-gray-700">Contact {index + 1}</h4>
                {contacts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeContact(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                {/* Contact Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={contact.name}
                    onChange={(e) => updateContact(index, 'name', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                    placeholder="Full name"
                  />
                </div>

                {/* Contact Email */}
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={contact.email}
                    onChange={(e) => updateContact(index, 'email', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                    placeholder="email@school.edu"
                  />
                </div>

                {/* Contact Phone */}
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={contact.phone || ''}
                    onChange={(e) => updateContact(index, 'phone', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                    placeholder="+27 12 345 6789"
                  />
                </div>

                {/* Contact Role */}
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Role *
                  </label>
                  <select
                    value={contact.role}
                    onChange={(e) => updateContact(index, 'role', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  >
                    <option value="Principal">Principal</option>
                    <option value="Teacher">Teacher</option>
                    <option value="Administrator">Administrator</option>
                    <option value="Coordinator">Coordinator</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Primary Contact Checkbox */}
                <div className="sm:col-span-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`primary-${index}`}
                      checked={contact.is_primary || false}
                      onChange={(e) => updateContact(index, 'is_primary', e.target.checked)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`primary-${index}`} className="ml-2 text-xs text-gray-700">
                      Primary contact (main point of contact)
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {contacts.length === 0 && (
            <div className="text-center py-4 text-sm text-gray-500 bg-gray-50 rounded-md border border-dashed border-gray-300">
              No contacts added. Click "Add Contact" to add school contacts.
            </div>
          )}

          <p className="text-xs text-gray-500">
            At least one contact is recommended for communication purposes. Primary contact will be the main point of contact.
          </p>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.push('/admin/schools')}
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
            'Create School'
          )}
        </button>
      </div>
    </form>
  );
}