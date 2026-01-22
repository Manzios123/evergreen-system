'use client';

import { useState } from 'react';
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
  onSuccess: () => void;
}

export default function ContactModal({
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.role.trim()) {
      setError('Name, email, and role are required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing && contact) {
        await schoolsApi.updateContact(contact.id, formData);
      } else {
        await schoolsApi.createContact(schoolId, formData);
      }
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to save contact:', err);
      setError(err.message || 'Failed to save contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Contact' : 'Add Contact'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

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

        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
            >
              {isEditing ? 'Update Contact' : 'Add Contact'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}