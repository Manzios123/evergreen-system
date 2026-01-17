// src/components/ui/status-badge.tsx
interface StatusBadgeProps {
    status: string;
  }
  
  export default function StatusBadge({ status }: StatusBadgeProps) {
    const getStatusColor = () => {
      const statusLower = status?.toLowerCase() || '';
      if (statusLower.includes('completed')) {
        return 'bg-green-100 text-green-800';
      }
      if (statusLower.includes('overdue')) {
        return 'bg-red-100 text-red-800';
      }
      if (statusLower.includes('in_progress') || statusLower.includes('progress')) {
        return 'bg-yellow-100 text-yellow-800';
      }
      if (statusLower.includes('assigned')) {
        return 'bg-blue-100 text-blue-800';
      }
      if (statusLower.includes('pending')) {
        return 'bg-gray-100 text-gray-800';
      }
      return 'bg-gray-100 text-gray-800';
    };
  
    const getStatusText = () => {
      const statusLower = status?.toLowerCase() || '';
      if (statusLower.includes('completed')) {
        return 'Completed';
      }
      if (statusLower.includes('overdue')) {
        return 'Overdue';
      }
      if (statusLower.includes('in_progress') || statusLower.includes('progress')) {
        return 'In Progress';
      }
      if (statusLower.includes('assigned')) {
        return 'Assigned';
      }
      if (statusLower.includes('pending')) {
        return 'Pending';
      }
      return status || 'Unknown';
    };
  
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
        {getStatusText()}
      </span>
    );
  }