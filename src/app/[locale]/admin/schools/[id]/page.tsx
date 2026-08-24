'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { schoolsApi } from '@/lib/api/schools';
import { School, SchoolContact, Pilot } from '@/lib/types';
import { useAuth } from '@/components/providers/AuthProvider';
import { pilotsApi } from '@/lib/api/pilots';
import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/alert';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import ContactModal from '@/components/schools/ContactModal';
import {
  Building,
  MapPin,
  Users,
  Phone,
  Mail,
  Calendar,
  Edit,
  Trash2,
  ArrowLeft,
  Plus,
  CheckCircle,
  XCircle,
  School as SchoolIcon,
} from 'lucide-react';
import Link from 'next/link';

export default function SchoolDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const { user } = useAuth();
  const [school, setSchool] = useState<School | null>(null);
  const [pilot, setPilot] = useState<Pilot | null>(null);
  const [contacts, setContacts] = useState<SchoolContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState<SchoolContact | null>(null);

  useEffect(() => {
    if (id) {
      loadSchoolData();
    }
  }, [id]);

  const loadSchoolData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const schoolResponse = await schoolsApi.getSchool(id);
      if (!schoolResponse.success || !schoolResponse.data) {
        throw new Error(schoolResponse.message || 'School not found');
      }
      setSchool(schoolResponse.data);

      if (schoolResponse.data.pilot_id) {
        const pilotResponse = await pilotsApi.getPilot(schoolResponse.data.pilot_id);
        if (pilotResponse.success && pilotResponse.data) {
          setPilot(pilotResponse.data);
        }
      }

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

  const handleDelete = async () => {
    if (!school) return;
    
    setIsDeleting(true);
    try {
      const response = await schoolsApi.deleteSchool(school.id);
      if (response.success) {
        router.push('/admin/schools');
        router.refresh();
      } else {
        setError(response.message || 'Failed to delete school');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete school');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const refreshContacts = async () => {
    const contactsResponse = await schoolsApi.getSchoolContacts(id);
    if (contactsResponse.success && contactsResponse.data) {
      setContacts(contactsResponse.data);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      const response = await schoolsApi.deleteContact(contactId);
      if (response.success) {
        await refreshContacts();
      }
    } catch (err: any) {
      console.error('Failed to delete contact:', err);
    }
  };

  const handleAddContact = () => {
    setEditingContact(null);
    setShowContactModal(true);
  };

  const handleEditContact = (contact: SchoolContact) => {
    setEditingContact(contact);
    setShowContactModal(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error || !school) {
    return (
      <div className="space-y-4">
        <Link href="/admin/schools">
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
            <p>The school you're looking for doesn't exist or you don't have permission to view it.</p>
            <Button
              variant="outline"
              onClick={() => router.push('/admin/schools')}
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
          <Link href="/admin/schools">
            <Button
              variant="ghost"
              icon={<ArrowLeft className="h-4 w-4" />}
              size="sm"
            >
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{school.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              School Details
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Link href={`/admin/schools/${school.id}/edit`}>
            <Button
              variant="outline"
              icon={<Edit className="h-4 w-4" />}
            >
              Edit School
            </Button>
          </Link>
          <Button
            variant="destructive"
            icon={<Trash2 className="h-4 w-4" />}
            onClick={() => setShowDeleteDialog(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <div className="flex items-center mt-1">
                {school.is_active ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-lg font-semibold text-green-700">Active</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-lg font-semibold text-gray-500">Inactive</span>
                  </>
                )}
              </div>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <SchoolIcon className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pilot Program</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {pilot?.name || 'No Pilot Assigned'}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Contacts</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {contacts.length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Mail className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Created</p>
              <p className="text-sm text-gray-900 mt-1">
                {new Date(school.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* School Information */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">School Information</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">School Name</label>
                    <p className="mt-1 text-sm text-gray-900">{school.name}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Pilot Program</label>
                    <p className="mt-1 text-sm text-gray-900">{pilot?.name || 'Not assigned'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Province</label>
                    <p className="mt-1 text-sm text-gray-900">{school.province || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500">District</label>
                    <p className="mt-1 text-sm text-gray-900">{school.district || 'Not specified'}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Address</label>
                  {school.address ? (
                    <div className="mt-1 flex items-start">
                      <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <p className="text-sm text-gray-900">{school.address}</p>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-gray-500">No address provided</p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Stats */}
        <div>
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    school.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {school.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Created</span>
                  <span className="text-sm text-gray-900">
                    {new Date(school.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="text-sm text-gray-900">
                    {new Date(school.updated_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Actions</h3>
                  <div className="space-y-2">
                    <Link href={`/admin/schools/${school.id}/edit`}>
                      <Button variant="outline" fullWidth>
                        Edit School Details
                      </Button>
                    </Link>
                    <Button 
                      variant="destructive" 
                      fullWidth
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      Delete School
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Contacts Section */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">School Contacts</h2>
            <Button
              variant="outline"
              icon={<Plus className="h-4 w-4" />}
              onClick={handleAddContact}
            >
              Add Contact
            </Button>
          </div>

          {contacts.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-gray-400 mx-auto" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No contacts</h3>
              <p className="mt-1 text-sm text-gray-500">
                Add contacts for this school to enable communication.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Role
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Contact Info
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Primary
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {contacts.map((contact) => (
                    <tr key={contact.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                        <div className="font-medium text-gray-900">{contact.name}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {contact.role}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <Mail className="h-3 w-3 mr-1 text-gray-400" />
                            {contact.email}
                          </div>
                          {contact.phone && (
                            <div className="flex items-center">
                              <Phone className="h-3 w-3 mr-1 text-gray-400" />
                              {contact.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {contact.is_primary ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            Primary
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditContact(contact)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteContact(contact.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Archive School"
        message={`Are you sure you want to archive "${school.name}"? This will mark it as inactive but preserve all data. This action cannot be undone.`}
        confirmText="Archive School"
        cancelText="Cancel"
        type="danger"
        loading={isDeleting}
      />

      {/* Add/Edit Contact Modal */}
      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        schoolId={id}
        contact={editingContact}
        onSuccess={refreshContacts}
      />
    </div>
  );
}