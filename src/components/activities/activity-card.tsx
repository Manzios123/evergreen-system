// components/activities/activity-card.tsx
import Link from 'next/link';
import { CalendarIcon, UsersIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import StatusBadge from '@/components/ui/status-badge';
import type { Activity } from '@/lib/types';

interface ActivityCardProps {
  activity: Activity;
  showActions?: boolean;
  onAction?: (action: 'edit' | 'submit' | 'view') => void;
}

export default function ActivityCard({ activity, showActions = true, onAction }: ActivityCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center">
              <h3 className="text-lg font-medium text-gray-900">{activity.title}</h3>
              <div className="ml-3">
                <StatusBadge status={activity.status} size="sm" />
              </div>
            </div>
            {activity.description && (
              <p className="mt-2 text-sm text-gray-500 line-clamp-2">{activity.description}</p>
            )}
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="flex items-center text-sm text-gray-500">
            <CalendarIcon className="shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
            <span>{new Date(activity.scheduled_date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <BuildingOfficeIcon className="shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
            <span>{activity.school?.name || 'School'}</span> {/* Fixed: activity.school_name -> activity.school?.name */}
          </div>
          {activity.number_of_participants !== undefined && (
            <div className="flex items-center text-sm text-gray-500">
              <UsersIcon className="shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
              <span>
                {activity.number_of_participants} participants
                {' '}({activity.number_of_boys ?? 'Not recorded'} boys, {activity.number_of_girls ?? 'Not recorded'} girls)
              </span>
            </div>
          )}
          {activity.pilot?.name && ( // Fixed: activity.pilot_name -> activity.pilot?.name
            <div className="flex items-center text-sm text-gray-500">
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                {activity.pilot.name} {/* Fixed: activity.pilot_name -> activity.pilot.name */}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {showActions && (
        <div className="px-4 py-4 sm:px-6">
          <div className="flex space-x-3">
            <Link
              href={`/en/volunteer/activities/${activity.id}`}
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              View Details
            </Link>
            
            {activity.status === 'draft' && (
              <button
                onClick={() => onAction?.('submit')}
                className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
              >
                Submit for Approval
              </button>
            )}
            
            {activity.status === 'pending' && (
              <button
                onClick={() => onAction?.('edit')}
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Make Edits
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
