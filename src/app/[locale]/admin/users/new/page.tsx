import CreateUserForm from '@/components/users/create-user-form';

export default function CreateUserPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New User</h1>
        <p className="mt-1 text-sm text-gray-600">
          Add a new user to the platform. Fill in the required details below.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <CreateUserForm />
      </div>
    </div>
  );
}