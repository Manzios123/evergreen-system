
import CreateSchoolForm from '@/components/schools/create-school-form';

export default function CreateSchoolPage() {
  return (
    
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New School</h1>
          <p className="mt-1 text-sm text-gray-600">
            Add a new school to the platform. Fill in the required details below.
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <CreateSchoolForm />
        </div>
      </div>
    
  );
}