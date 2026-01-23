
import CreatePilotForm from '@/components/pilots/create-pilot-form';

export default function CreatePilotPage() {
  return (
    
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Pilot</h1>
          <p className="mt-1 text-sm text-gray-600">
            Add a new pilot program to the platform. Fill in the required details below.
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <CreatePilotForm />
        </div>
      </div>
   
  );
}