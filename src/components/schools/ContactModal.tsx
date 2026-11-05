'use client';

import { useEffect, useRef, useState } from 'react';
import { schoolsApi } from '@/lib/api/schools';
import { SchoolContact } from '@/lib/types';
import Button from '@/components/ui/button';
import Modal from '@/components/ui/modal';
import {
  EnvelopeIcon,
  PhoneIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolId: string;
  contact?: SchoolContact | null;
  onSuccess: (contact: SchoolContact) => void | Promise<void>;
}

export default function ContactModal(props: ContactModalProps) {
  // Mount a fresh editor for each opening or selected contact, without resetting
  // unsaved input when the parent merely refreshes an equivalent contact object.
  return props.isOpen ? (
    <ContactEditor key={`${props.schoolId}:${props.contact?.id ?? 'new'}`} {...props} />
  ) : null;
}

function ContactEditor({
  isOpen,
  onClose,
  schoolId,
  contact,
  onSuccess,
}: ContactModalProps) {
  const isEditing = !!contact;
  
  const [formData, setFormData] = useState({
    name: contact?.name || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    role: contact?.role || 'Teacher',
    is_primary: contact?.is_primary || false,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedContact, setSavedContact] = useState<SchoolContact | null>(null);
  const savedContactRef = useRef<SchoolContact | null>(null);
  const submitLock = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const handleClose = () => {
    if (!submitLock.current) onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLock.current) return;
    
    if (!savedContactRef.current && (!formData.name.trim() || !formData.email.trim() || !formData.role.trim())) {
      setError('Name, email, and role are required');
      return;
    }

    submitLock.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      // Once saving is confirmed, retry only the refresh, never the mutation.
      if (!savedContactRef.current) {
        const response = isEditing && contact
          ? await schoolsApi.updateContact(contact.id, formData)
          : await schoolsApi.createContact(schoolId, formData);
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to save contact');
        }
        if (!mounted.current) return;
        savedContactRef.current = response.data;
        setSavedContact(response.data);
      }
      await onSuccess(savedContactRef.current);
      if (mounted.current) onClose();
    } catch (err: unknown) {
      if (mounted.current) {
        const message = err instanceof Error ? err.message : 'Please try again.';
        setError(savedContactRef.current
          ? `Contact saved, but the list could not be refreshed. Retry refresh or close. ${message}`
          : `Contact was not saved. ${message}`);
      }
    } finally {
      submitLock.current = false;
      if (mounted.current) setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Edit Contact' : 'Add Contact'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div role={savedContact ? 'status' : 'alert'} className="rounded-md bg-red-50 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <fieldset disabled={isSubmitting || !!savedContact} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Full Name *
          </label>
          <div className="mt-1 relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <UserIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="block w-full rounded-md border border-gray-300 pl-10 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
              placeholder="John Doe"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address *
          </label>
          <div className="mt-1 relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <EnvelopeIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="block w-full rounded-md border border-gray-300 pl-10 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
              placeholder="john@school.edu"
            />
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <div className="mt-1 relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <PhoneIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 pl-10 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
              placeholder="+27 12 345 6789"
            />
          </div>
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
            Role *
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
          >
            <option value="Principal">Principal</option>
            <option value="Teacher">Teacher</option>
            <option value="Administrator">Administrator</option>
            <option value="Coordinator">Coordinator</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_primary"
            name="is_primary"
            checked={formData.is_primary}
            onChange={handleChange}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label htmlFor="is_primary" className="ml-2 text-sm text-gray-700">
            Primary contact (main point of contact)
          </label>
        </div>

        </fieldset>
        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {savedContact ? 'Close' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
            >
              {savedContact ? 'Retry refresh' : (isEditing ? 'Update Contact' : 'Add Contact')}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
