'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { schoolsApi } from '@/lib/api/schools';
import { School, SchoolContact, Pilot } from '@/lib/types';
import { pilotsApi } from '@/lib/api/pilots';
import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/alert';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import {
  Building,
  ArrowLeft,
  Save,
  X,
  School as SchoolIcon,
} from 'lucide-react';
import Link from 'next/link';

export default function EditSchoolPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [school, setSchool] = useState<School | null>(null);
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [contacts, setContacts] = useState<SchoolContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    pilot_id: '',
    province: '',
    district: '',
    address: '',
  });

  useEffect(() => {
    if (id) {
      loadSchoolData();
    }
    loadPilots();
  }, [id]);

  const loadSchoolData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const schoolResponse = await schoolsApi.getSchool(id);
      if (!schoolResponse.success || !schoolResponse.data) {
        throw new Error(schoolResponse.message || 'School not found');
      }
      
      const schoolData = schoolResponse.data;
      setSchool(schoolData);
      
      setFormData({
        name: schoolData.name || '',
        pilot_id: schoolData.pilot_id || '',
        province: schoolData.province || '',
        district: schoolData.district || '',
        address: schoolData.address || '',
      });

      const contactsResponse = await schoolsApi.getSchoolContacts(id);
      if (contactsResponse.success && contactsResponse.data) {
        setContacts(contactsResponse.data);
      }
    } catch (err: any) {
      console.error('Failed to load school data:', err);
      setError(err.message || 'Failed to load school data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPilots = async () => {
    try {
      const response = await pilotsApi.getPilots({ limit: 100 });
      if (response.success && response.data) {
        setPilots(response.data);
      }
    } catch (err) {
      console.error('Failed to load pilots:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!school) return;
    
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (!formData.name.trim()) {
        throw new Error('School name is required');
      }
      if (!formData.pilot_id) {
        throw new Error('Please select a pilot');
      }

      const response = await schoolsApi.updateSchool(school.id, formData);
      
      if (response.success) {
        setSuccess('School updated successfully!');
        await loadSchoolData();
        
        setTimeout(() => {
          router.push(`/coordinator/schools/${school.id}`);
        }, 1500);
      } else {
        throw new Error(response.message || 'Failed to update school');
      }
    } catch (err: any) {
      console.error('Failed to update school:', err);
      setError(err.message || 'Failed to update school');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error || !school) {
    return (
      <div className="space-y-4">
        <Link href="/coordinator/schools">
          <Button
            variant="outline"
            icon={<ArrowLeft className="h-4 w-4" />}
          >
            Back to Schools
          </Button>
        </Link>
        
        <Alert
          type="error"
          title={error || 'School not found'}
        >
          <div className="space-y-2">
            <p>The school you're trying to edit doesn't exist or you don't have permission to edit it.</p>
            <Button
              variant="outline"
              onClick={() => router.push('/coordinator/schools')}
            >
              Go Back to Schools List
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link href={`/coordinator/schools/${school.id}`}>
            <Button
              variant="ghost"
              icon={<ArrowLeft className="h-4 w-4" />}
              size="sm"
            >
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit School</h1>
            <p className="mt-1 text-sm text-gray-500">
              Update school information for {school.name}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Link href={`/coordinator/schools/${school.id}`}>
            <Button
              variant="outline"
              icon={<X className="h-4 w-4" />}
            >
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            form="edit-school-form"
            variant="default"
            icon={<Save className="h-4 w-4" />}
            loading={isSaving}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <Alert type="success" title={success}>
          <p>Redirecting back to school details...</p>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert type="error" title={error}>
          <p>Please check your input and try again.</p>
        </Alert>
      )}

      <Card>
        <div className="p-6">
          <form id="edit-school-form" onSubmit={handleSubmit} className="space-y-6">
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
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
                    placeholder="Enter school name"
                  />
                </div>
              </div>

              {/* Pilot Selection */}
              <div className="sm:col-span-2">
                <label htmlFor="pilot_id" className="block text-sm font-medium text-gray-700">
                  Pilot Program *
                </label>
                <div className="mt-1">
                  <select
                    id="pilot_id"
                    name="pilot_id"
                    value={formData.pilot_id}
                    onChange={handleChange}
                    required
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
                  >
                    <option value="">Select a pilot...</option>
                    {pilots.map((pilot) => (
                      <option key={pilot.id} value={pilot.id}>
                        {pilot.name}
                      </option>
                    ))}
                  </select>
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
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
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
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
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
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
                    placeholder="Full physical address"
                  />
                </div>
              </div>
            </div>

            {/* Status Display */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Current Status:</span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  school.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {school.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Note: Status can only be changed through the delete/restore actions on the school details page.
              </p>
            </div>
          </form>
        </div>
      </Card>

      {/* Contacts Preview */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">School Contacts</h2>
          
          {contacts.length === 0 ? (
            <div className="text-center py-4 text-sm text-gray-500 bg-gray-50 rounded-md">
              No contacts added yet. You can add contacts from the school details page.
            </div>
          ) : (
            <div className="space-y-3">
              {contacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                    <p className="text-xs text-gray-500">
                      {contact.role} • {contact.email}
                      {contact.phone && ` • ${contact.phone}`}
                    </p>
                  </div>
                  {contact.is_primary && (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-4">
            <Link href={`/coordinator/schools/${school.id}`}>
              <Button variant="outline" fullWidth>
                Manage Contacts on School Details Page
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Form Actions (Sticky) */}
      <div className="sticky bottom-6 bg-white border-t border-gray-200 p-4 rounded-lg shadow-lg">
        <div className="flex justify-end space-x-3">
          <Link href={`/coordinator/schools/${school.id}`}>
            <Button
              variant="outline"
              icon={<X className="h-4 w-4" />}
            >
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            form="edit-school-form"
            variant="default"
            icon={<Save className="h-4 w-4" />}
            loading={isSaving}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}