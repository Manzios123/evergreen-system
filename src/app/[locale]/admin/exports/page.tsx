// app/[locale]/admin/exports/page.tsx
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
  CircleStackIcon, // Changed from DatabaseIcon
} from '@heroicons/react/24/outline';
import { useState, useMemo } from 'react';
import { format } from 'date-fns';

// Extended type for ExportJob to include missing properties
interface ExtendedExportJob extends Omit<ExportJob, 'type' | 'status'> {
  type: 'full_backup' | 'activities' | 'surveys' | 'photos' | 'users' | 'schools' | 'pilots' | 'system_logs' | 'reports';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  description?: string;
  recordCount?: number;
  progress?: number;
}

interface SystemStats {
  totalUsers: number;
  totalActivities: number;
  totalPhotos: number;
  totalSurveys: number;
}

export default function AdminExportsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [exportType, setExportType] = useState<'all' | 'full' | 'partial'>('all');
  const [isCreatingExport, setIsCreatingExport] = useState(false);
  const [selectedExportType, setSelectedExportType] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('');

  // Fetch export jobs
  const { 
    data: exports, 
    isLoading, 
    error, 
    refetch 
  } = useApiQuery<ExtendedExportJob[]>(
    ['admin-exports', exportType],
    () => api.get('/exports', { 
      type: exportType === 'all' ? undefined : exportType 
    })
  );

  // Fetch system stats for full exports
  const { data: systemStats } = useApiQuery<SystemStats>(
    ['system-stats'],
    () => api.get('/dashboard/stats')
  );

  // Create export mutation
  const createExportMutation = useApiMutation(
    (data: { type: string; format: string; options?: any }) => 
      api.post('/exports', data)
  );

  const exportTypes = [
    { 
      id: 'full_backup', 
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
      id: 'photos', 
      label: 'Photo Metadata', 
      icon: PhotoIcon, 
      color: 'bg-green-100 text-green-600',
      description: 'Photo information and metadata (not actual files)',
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
      id: 'system_logs', 
      label: 'System Logs', 
      icon: ServerIcon, 
      color: 'bg-gray-100 text-gray-600',
      description: 'System audit logs and activity history',
    },
  ];

  const exportFormats = [
    { id: 'csv', label: 'CSV', description: 'Comma-separated values' },
    { id: 'excel', label: 'Excel', description: 'Microsoft Excel format' },
    { id: 'json', label: 'JSON', description: 'JavaScript Object Notation' },
    { id: 'sql', label: 'SQL', description: 'Database SQL dump' },
    { id: 'pdf', label: 'PDF', description: 'Portable Document Format' },
  ];

  const handleCreateExport = async (type: string, format: string, options?: any) => {
    setIsCreatingExport(true);
    try {
      await createExportMutation.mutateAsync({
        type,
        format,
        options,
      });
      refetch();
      alert(`Export job for ${type} has been queued successfully.`);
    } catch (error) {
      console.error('Failed to create export:', error);
      alert('Failed to create export. Please try again.');
    } finally {
      setIsCreatingExport(false);
      setSelectedExportType('');
      setSelectedFormat('');
    }
  };

  const handleDownload = (exportJob: ExtendedExportJob) => {
    if (exportJob.downloadUrl) {
      window.open(exportJob.downloadUrl, '_blank');
    }
  };

  const handleFullBackup = () => {
    if (window.confirm('Full system backup will export all data. This may take a while. Continue?')) {
      handleCreateExport('full_backup', 'sql', {
        includeMedia: false, // Don't include actual photo files
        compress: true,
      });
    }
  };

  const columns = [
    {
      key: 'export',
      header: 'Export',
      render: (exportJob: ExtendedExportJob) => (
        <div className="flex items-start space-x-3">
          <div className="shrink-0">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
              exportJob.type === 'full_backup' ? 'bg-red-100 text-red-600' :
              exportJob.type === 'activities' ? 'bg-blue-100 text-blue-600' :
              exportJob.type === 'surveys' ? 'bg-purple-100 text-purple-600' :
              exportJob.type === 'photos' ? 'bg-green-100 text-green-600' :
              exportJob.type === 'users' ? 'bg-orange-100 text-orange-600' :
              exportJob.type === 'schools' ? 'bg-indigo-100 text-indigo-600' :
              exportJob.type === 'pilots' ? 'bg-teal-100 text-teal-600' :
              'bg-gray-100 text-gray-600'
            }`}>
              {exportJob.type === 'full_backup' && <CircleStackIcon className="h-5 w-5" />}
              {exportJob.type === 'activities' && <CalendarIcon className="h-5 w-5" />}
              {exportJob.type === 'surveys' && <DocumentTextIcon className="h-5 w-5" />}
              {exportJob.type === 'photos' && <PhotoIcon className="h-5 w-5" />}
              {exportJob.type === 'users' && <UserGroupIcon className="h-5 w-5" />}
              {exportJob.type === 'schools' && <BuildingOfficeIcon className="h-5 w-5" />}
              {exportJob.type === 'pilots' && <ChartBarIcon className="h-5 w-5" />}
              {exportJob.type === 'system_logs' && <ServerIcon className="h-5 w-5" />}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-900 capitalize">
                {exportJob.type.replace('_', ' ')} Export
              </p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {exportJob.format.toUpperCase()}
              </span>
            </div>
            <div className="mt-1 flex items-center text-sm text-gray-500">
              <CalendarIcon className="h-4 w-4 mr-1 shrink-0" />
              {format(new Date(exportJob.createdAt), 'MMM d, yyyy HH:mm')}
            </div>
            {exportJob.description && (
              <p className="mt-1 text-sm text-gray-500">{exportJob.description}</p>
            )}
            {exportJob.recordCount && (
              <p className="mt-1 text-xs text-gray-500">
                {exportJob.recordCount.toLocaleString()} records
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (exportJob: ExtendedExportJob) => {
        if (exportJob.status === 'processing') {
          return (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                  Processing
                </span>
                <span className="text-xs text-gray-500">{exportJob.progress || 0}%</span>
              </div>
              <Progress value={exportJob.progress || 0} />
            </div>
          );
        }
        
        if (exportJob.status === 'failed') {
          return (
            <span className="inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium bg-red-100 text-red-800 ring-1 ring-inset ring-red-600/20">
              Failed
            </span>
          );
        }
        
        if (exportJob.status === 'pending') {
          return (
            <span className="inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
              Pending
            </span>
          );
        }
        
        if (exportJob.status === 'completed') {
          return <StatusBadge status="completed" />;
        }
        
        return (
          <span className="inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-800 ring-1 ring-inset ring-gray-600/20">
            {exportJob.status}
          </span>
        );
      },
    },
    {
      key: 'size',
      header: 'Size',
      render: (exportJob: ExtendedExportJob) => (
        <div className="text-sm text-gray-900">
          {exportJob.fileSize ? `${(exportJob.fileSize / 1024 / 1024).toFixed(2)} MB` : '--'}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (exportJob: ExtendedExportJob) => (
        <div className="flex space-x-2">
          {exportJob.status === 'completed' && exportJob.downloadUrl && (
            <Button
              size="sm"
              variant="outline"
              icon={<ArrowDownTrayIcon className="h-4 w-4" />}
              onClick={() => handleDownload(exportJob)}
            >
              Download
            </Button>
          )}
          {exportJob.status === 'failed' && (
            <Button
              size="sm"
              variant="outline"
              icon={<XCircleIcon className="h-4 w-4" />}
              onClick={() => {
                handleCreateExport(exportJob.type, exportJob.format);
              }}
            >
              Retry
            </Button>
          )}
          {(exportJob.status === 'pending' || exportJob.status === 'processing') && (
            <Button size="sm" variant="outline" disabled>
              <ClockIcon className="h-4 w-4 mr-1" />
              {exportJob.status === 'pending' ? 'Queued' : 'Processing'}
            </Button>
          )}
        </div>
      ),
    },
  ];

  const filteredExports = useMemo(() => {
    if (!exports) return [];
    if (!searchTerm) return exports;
    
    return exports.filter(exportJob =>
      exportJob.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exportJob.format.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exportJob.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [exports, searchTerm]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader type="card" />
        <SkeletonLoader type="table" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        title="Unable to load exports"
      >
        <div className="space-y-2">
          <p>There was an error loading export history. Please try again.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            Try Again
          </Button>
        </div>
      </Alert>
    );
  }

  const stats = {
    total: exports?.length || 0,
    completed: exports?.filter(e => e.status === 'completed').length || 0,
    processing: exports?.filter(e => e.status === 'processing').length || 0,
    failed: exports?.filter(e => e.status === 'failed').length || 0,
    totalSize: exports?.reduce((sum, e) => sum + (e.fileSize || 0), 0) || 0,
  };

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
            placeholder="Search exports by type or description..."
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Exports</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.total}
              </p>
            </div>
            <DocumentArrowDownIcon className="h-8 w-8 text-gray-300" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {stats.completed}
              </p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-gray-300" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Processing</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {stats.processing}
              </p>
            </div>
            <ClockIcon className="h-8 w-8 text-gray-300" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Failed</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {stats.failed}
              </p>
            </div>
            <XCircleIcon className="h-8 w-8 text-gray-300" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Size</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {(stats.totalSize / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <CircleStackIcon className="h-8 w-8 text-gray-300" />
          </div>
        </Card>
      </div>

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
                  {exportTypeItem.id === 'full_backup' ? (
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
                          onClick={() => handleCreateExport(exportTypeItem.id, selectedFormat)}
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

      {/* System Statistics */}
      {systemStats && (
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{systemStats.totalUsers}</p>
                <p className="text-sm text-gray-500">Total Users</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{systemStats.totalActivities}</p>
                <p className="text-sm text-gray-500">Total Activities</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{systemStats.totalPhotos}</p>
                <p className="text-sm text-gray-500">Total Photos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{systemStats.totalSurveys}</p>
                <p className="text-sm text-gray-500">Total Surveys</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Export History */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Export History</h2>
          <div className="flex space-x-2">
            <Button
              variant={exportType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setExportType('all')}
            >
              All
            </Button>
            <Button
              variant={exportType === 'full' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setExportType('full')}
            >
              Full Backups
            </Button>
            <Button
              variant={exportType === 'partial' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setExportType('partial')}
            >
              Partial Exports
            </Button>
          </div>
        </div>

        {filteredExports.length > 0 ? (
          <Card>
            <DataTable
              data={filteredExports}
              columns={columns}
              emptyMessage="No exports found"
            />
          </Card>
        ) : (
          <EmptyState
            icon={<DocumentArrowDownIcon className="h-12 w-12 text-gray-400" />}
            title="No exports found"
            description={
              searchTerm || exportType !== 'all'
                ? "Try adjusting your filters to find exports."
                : "No system exports have been created yet."
            }
            action={
              searchTerm
                ? {
                    label: 'Clear Search',
                    onClick: () => setSearchTerm(''),
                  }
                : undefined
            }
          />
        )}
      </div>
    </div>
  );
}