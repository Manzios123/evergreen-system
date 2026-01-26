// app/[locale]/coordinator/exports/page.tsx
'use client';

import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import DataTable from '@/components/ui/data-table';
import StatusBadge from '@/components/ui/status-badge';
import SearchFilter from '@/components/ui/search-filter';
import { Progress } from '@/components/ui/proggress';
import EmptyState from '@/components/ui/empty-state';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import Alert from '@/components/ui/alert';
import { useApiQuery, useApiMutation } from '@/lib/hooks/use-api';
import { ExportJob, ActivityStatus } from '@/lib/types';
import { api } from '@/lib/api';
import { exportsApi } from '@/lib/api/exports';
import { dashboardApi } from '@/lib/api/dashboard';
import {
  ArrowDownTrayIcon,
  CalendarIcon,
  DocumentArrowDownIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  PhotoIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  ServerIcon,
  CircleStackIcon,
} from '@heroicons/react/24/outline';
import { useState, useMemo } from 'react';
import { format } from 'date-fns';

interface SystemStats {
  totalUsers: number;
  totalActivities: number;
  totalSurveys: number;
  totalPilots: number;
  totalSchools: number;
}

export default function AdminExportsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingExport, setIsCreatingExport] = useState(false);
  const [selectedExportType, setSelectedExportType] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('');

  // Fetch system stats from admin dashboard
  const { 
    data: systemStats, 
    isLoading: statsLoading, 
    error: statsError 
  } = useApiQuery<SystemStats>(
    ['system-stats'],
    async () => {
      const stats = await dashboardApi.getSystemStats();
      return {
        totalUsers: stats.total_users || 0,
        totalActivities: stats.total_activities || 0,
        totalSurveys: (stats.activity_surveys || 0) + (stats.student_surveys || 0) + (stats.volunteer_surveys || 0),
        totalPilots: stats.total_pilots || 0,
        totalSchools: stats.total_schools || 0,
      };
    }
  );

  // Since backend doesn't have export job tracking, we'll show a simple message
  const exports = []; // Empty array since no job tracking exists

  const handleExport = async (type: string, format: string, options?: any) => {
    setIsCreatingExport(true);
    try {
      let downloadUrl = '';
      const params: any = { format };
      
      // Add any options as query params
      if (options) {
        Object.assign(params, options);
      }
      
      // Create the appropriate export URL
      switch (type) {
        case 'activities':
          downloadUrl = `/api/exports/activities?${new URLSearchParams(params).toString()}`;
          break;
        case 'surveys':
          downloadUrl = `/api/exports/surveys?${new URLSearchParams(params).toString()}`;
          break;
        case 'users':
          downloadUrl = `/api/exports/users?${new URLSearchParams(params).toString()}`;
          break;
        case 'schools':
          downloadUrl = `/api/exports/schools?${new URLSearchParams(params).toString()}`;
          break;
        case 'pilots':
          downloadUrl = `/api/exports/pilots?${new URLSearchParams(params).toString()}`;
          break;
        case 'activity-templates':
          downloadUrl = `/api/exports/activity-templates?${new URLSearchParams(params).toString()}`;
          break;
        case 'full_backup':
        case 'all':
          downloadUrl = `/api/exports/all?${new URLSearchParams(params).toString()}`;
          break;
        default:
          throw new Error(`Unsupported export type: ${type}`);
      }
      
      // Trigger download
      window.open(downloadUrl, '_blank');
      
      // Show success message
      alert(`Export of ${type} has been initiated. The file will download automatically.`);
    } catch (error) {
      console.error('Failed to create export:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to create export. Please try again. Error: ${errorMessage}`);
    } finally {
      setIsCreatingExport(false);
      setSelectedExportType('');
      setSelectedFormat('');
    }
  };

  const handleFullBackup = () => {
    if (window.confirm('Full system backup will export all data. This may take a while. Continue?')) {
      handleExport('all', 'json', {
        compress: true,
      });
    }
  };

  const exportTypes = [
    { 
      id: 'all', 
      label: 'Full System Backup', 
      icon: CircleStackIcon, 
      color: 'bg-red-100 text-red-600',
      description: 'Complete database backup including all data',
      requiresConfirmation: true,
    },
    { 
      id: 'activities', 
      label: 'All Activities', 
      icon: CalendarIcon, 
      color: 'bg-blue-100 text-blue-600',
      description: 'All activities across all pilot programs',
    },
    { 
      id: 'surveys', 
      label: 'All Surveys', 
      icon: DocumentTextIcon, 
      color: 'bg-purple-100 text-purple-600',
      description: 'All survey responses and results',
    },
    { 
      id: 'users', 
      label: 'User Directory', 
      icon: UserGroupIcon, 
      color: 'bg-orange-100 text-orange-600',
      description: 'All user accounts and profiles',
    },
    { 
      id: 'schools', 
      label: 'Schools Directory', 
      icon: BuildingOfficeIcon, 
      color: 'bg-indigo-100 text-indigo-600',
      description: 'All schools and their information',
    },
    { 
      id: 'pilots', 
      label: 'Pilot Programs', 
      icon: ChartBarIcon, 
      color: 'bg-teal-100 text-teal-600',
      description: 'All pilot programs and their configurations',
    },
    { 
      id: 'activity-templates', 
      label: 'Activity Templates', 
      icon: DocumentTextIcon, 
      color: 'bg-green-100 text-green-600',
      description: 'All activity templates and their configurations',
    },
  ];

  const exportFormats = [
    { id: 'csv', label: 'CSV', description: 'Comma-separated values' },
    { id: 'json', label: 'JSON', description: 'JavaScript Object Notation' },
  ];

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader type="card" />
        <SkeletonLoader type="table" />
      </div>
    );
  }

  if (statsError) {
    const errorMessage = statsError instanceof Error ? statsError.message : String(statsError);
    return (
      <Alert
        type="error"
        title="Unable to load system statistics"
      >
        <div className="space-y-2">
          <p>There was an error loading system statistics. Please try again.</p>
          <p className="text-sm text-gray-600">
            Error: {errorMessage}
          </p>
        </div>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Exports</h1>
          <p className="mt-1 text-sm text-gray-500">
            Export system-wide data for backup, analysis, and reporting
          </p>
        </div>
        <div className="w-full sm:w-64">
          <SearchFilter
            placeholder="Search export types..."
            onSearch={setSearchTerm}
          />
        </div>
      </div>

      {/* Warning Alert for Large Exports */}
      <Alert
        type="warning"
        title="Large Data Exports"
      >
        Full system backups and large data exports may take several minutes to process. Please schedule these during off-peak hours.
      </Alert>

      {/* System Statistics */}
      {systemStats && (
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{systemStats.totalUsers}</p>
                <p className="text-sm text-gray-500">Total Users</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{systemStats.totalActivities}</p>
                <p className="text-sm text-gray-500">Total Activities</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{systemStats.totalSurveys}</p>
                <p className="text-sm text-gray-500">Total Surveys</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">{systemStats.totalSchools}</p>
                <p className="text-sm text-gray-500">Total Schools</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-teal-600">{systemStats.totalPilots}</p>
                <p className="text-sm text-gray-500">Total Pilots</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Export Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Exports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {exportTypes.map((exportTypeItem) => (
            <Card key={exportTypeItem.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col h-full">
                <div className="flex items-start mb-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-3 ${exportTypeItem.color}`}>
                    <exportTypeItem.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{exportTypeItem.label}</h3>
                    <p className="text-sm text-gray-500 mt-1">{exportTypeItem.description}</p>
                  </div>
                </div>
                
                <div className="mt-auto pt-3 border-t">
                  {exportTypeItem.id === 'all' ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleFullBackup}
                      loading={isCreatingExport && selectedExportType === exportTypeItem.id}
                    >
                      Create Backup
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <select
                        value={selectedExportType === exportTypeItem.id ? selectedFormat : ''}
                        onChange={(e) => {
                          setSelectedExportType(exportTypeItem.id);
                          setSelectedFormat(e.target.value);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Select format...</option>
                        {exportFormats.map((format) => (
                          <option key={format.id} value={format.id}>
                            {format.label} ({format.description})
                          </option>
                        ))}
                      </select>
                      
                      {selectedExportType === exportTypeItem.id && selectedFormat && (
                        <Button
                          variant="default"
                          className="w-full"
                          onClick={() => handleExport(exportTypeItem.id, selectedFormat)}
                          loading={isCreatingExport && selectedExportType === exportTypeItem.id}
                        >
                          Export as {selectedFormat.toUpperCase()}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Export Information */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Information</h2>
          <div className="space-y-4 text-sm text-gray-600">
            <p>
              <strong>Note:</strong> The current export system provides immediate downloads. There is no export job tracking or history available.
            </p>
            <div className="bg-blue-50 p-4 rounded-md">
              <h3 className="font-medium text-blue-900 mb-2">Available Export Formats:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>CSV:</strong> Comma-separated values format for spreadsheet applications</li>
                <li><strong>JSON:</strong> JavaScript Object Notation for data interchange</li>
              </ul>
            </div>
            <div className="bg-yellow-50 p-4 rounded-md">
              <h3 className="font-medium text-yellow-900 mb-2">Permissions:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Only administrators can export user data and full system backups</li>
                <li>Coordinators can export data for their assigned pilots only</li>
                <li>Volunteers have access to their own data only</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}