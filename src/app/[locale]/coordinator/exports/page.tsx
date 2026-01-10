// app/[locale]/coordinator/exports/page.tsx
'use client';

import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import DataTable from '@/components/ui/data-table';
import StatusBadge from '@/components/ui/status-badge';
import SearchFilter from '@/components/ui/search-filter';
import EmptyState from '@/components/ui/empty-state';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import Alert from '@/components/ui/alert';
import { Progress } from '@/components/ui/proggress';
import { useApiQuery, useApiMutation } from '@/lib/hooks/use-api';
import { ExportJob } from '@/lib/types';
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
} from '@heroicons/react/24/outline';
import { useState, useMemo } from 'react';
import { format as formatDate } from 'date-fns';

// Import the API
import { api } from '@/lib/api/api';

export default function CoordinatorExportsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [exportType, setExportType] = useState<'all' | 'activities' | 'surveys' | 'photos'>('all');
  const [isCreatingExport, setIsCreatingExport] = useState(false);

  // Fetch export jobs
  const { 
    data: exports, 
    isLoading, 
    error, 
    refetch 
  } = useApiQuery<ExportJob[]>(
    ['exports', exportType],
    () => api.get('/exports', { type: exportType === 'all' ? undefined : exportType })
  );

  // Create export mutation
  const createExportMutation = useApiMutation(
    (data: { type: string; format: string; filters?: any }) => 
      api.post('/exports', data)
  );

  const exportTypes = [
    { id: 'activities', label: 'Activities', icon: CalendarIcon, color: 'bg-blue-100 text-blue-600' },
    { id: 'surveys', label: 'Surveys', icon: DocumentTextIcon, color: 'bg-purple-100 text-purple-600' },
    { id: 'photos', label: 'Photos', icon: PhotoIcon, color: 'bg-green-100 text-green-600' },
    { id: 'volunteers', label: 'Volunteers', icon: UserGroupIcon, color: 'bg-orange-100 text-orange-600' },
    { id: 'schools', label: 'Schools', icon: BuildingOfficeIcon, color: 'bg-indigo-100 text-indigo-600' },
  ];

  const exportFormats = [
    { id: 'csv', label: 'CSV', description: 'Comma-separated values' },
    { id: 'excel', label: 'Excel', description: 'Microsoft Excel format' },
    { id: 'json', label: 'JSON', description: 'JavaScript Object Notation' },
    { id: 'pdf', label: 'PDF', description: 'Portable Document Format' },
  ];

  const handleCreateExport = async (type: string, format: string) => {
    setIsCreatingExport(true);
    try {
      await createExportMutation.mutateAsync({
        type,
        format,
        filters: {
          dateRange: {
            start: formatDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
            end: formatDate(new Date(), 'yyyy-MM-dd'),
          },
        },
      });
      refetch();
    } catch (error) {
      console.error('Failed to create export:', error);
    } finally {
      setIsCreatingExport(false);
    }
  };

  const handleDownload = (exportJob: ExportJob) => {
    if (exportJob.downloadUrl) {
      window.open(exportJob.downloadUrl, '_blank');
    }
  };

  const handleSearch = (query: string) => {
    setSearchTerm(query);
  };

  // Map export status to ActivityStatus for StatusBadge component
  const getMappedStatus = (status: ExportJob['status']) => {
    switch (status) {
      case 'pending': return 'pending';
      case 'processing': return 'in_edit'; // Map to closest ActivityStatus
      case 'completed': return 'completed';
      case 'failed': return 'rejected';
      default: return 'pending';
    }
  };

  const columns = [
    {
      key: 'export',
      header: 'Export',
      render: (exportJob: ExportJob) => {
        // Cast exportJob to any to access potentially missing properties
        const job = exportJob as any;
        
        return (
          <div className="flex items-start space-x-3">
            <div className="shrink-0">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                job.type === 'activities' ? 'bg-blue-100 text-blue-600' :
                job.type === 'surveys' ? 'bg-purple-100 text-purple-600' :
                job.type === 'photos' ? 'bg-green-100 text-green-600' :
                job.type === 'volunteers' ? 'bg-orange-100 text-orange-600' :
                job.type === 'schools' ? 'bg-indigo-100 text-indigo-600' :
                'bg-gray-100 text-gray-600'
              }`}>
                {job.type === 'activities' && <CalendarIcon className="h-5 w-5" />}
                {job.type === 'surveys' && <DocumentTextIcon className="h-5 w-5" />}
                {job.type === 'photos' && <PhotoIcon className="h-5 w-5" />}
                {job.type === 'volunteers' && <UserGroupIcon className="h-5 w-5" />}
                {job.type === 'schools' && <BuildingOfficeIcon className="h-5 w-5" />}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-900 capitalize">
                  {job.type} Export
                </p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {job.format.toUpperCase()}
                </span>
              </div>
              <div className="mt-1 flex items-center text-sm text-gray-500">
                <CalendarIcon className="h-4 w-4 mr-1 shrink-0" />
                {formatDate(new Date(job.createdAt), 'MMM d, yyyy HH:mm')}
              </div>
              {job.description && (
                <p className="mt-1 text-sm text-gray-500">{job.description}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (exportJob: ExportJob) => {
        const job = exportJob as any;
        
        if (job.status === 'processing') {
          return (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center rounded-full ring-1 ring-inset font-medium bg-blue-100 text-blue-800 ring-blue-600/20 px-3 py-1.5 text-sm">
                  <span>Processing</span>
                </div>
                {job.progress && (
                  <span className="text-xs text-gray-500">{job.progress || 0}%</span>
                )}
              </div>
              {job.progress !== undefined && (
                <Progress value={job.progress || 0} />
              )}
            </div>
          );
        }
        
        // Use StatusBadge for other statuses with mapped ActivityStatus
        return <StatusBadge status={getMappedStatus(job.status)} />;
      },
    },
    {
      key: 'size',
      header: 'Size',
      render: (exportJob: ExportJob) => (
        <div className="text-sm text-gray-900">
          {exportJob.fileSize ? `${(exportJob.fileSize / 1024 / 1024).toFixed(2)} MB` : '--'}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (exportJob: ExportJob) => {
        const job = exportJob as any;
        
        return (
          <div className="flex space-x-2">
            {job.status === 'completed' && job.downloadUrl && (
              <Button
                size="sm"
                variant="outline"
                icon={<ArrowDownTrayIcon className="h-4 w-4" />}
                onClick={() => handleDownload(job)}
              >
                Download
              </Button>
            )}
            {job.status === 'failed' && (
              <Button
                size="sm"
                variant="outline"
                icon={<XCircleIcon className="h-4 w-4" />}
                onClick={() => {
                  // Retry failed export
                  handleCreateExport(job.type, job.format);
                }}
              >
                Retry
              </Button>
            )}
            {(job.status === 'pending' || job.status === 'processing') && (
              <Button size="sm" variant="outline" disabled>
                <ClockIcon className="h-4 w-4 mr-1" />
                {job.status === 'pending' ? 'Queued' : 'Processing'}
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const filteredExports = useMemo(() => {
    if (!exports) return [];
    if (!searchTerm) return exports;
    
    return exports.filter(exportJob => {
      const job = exportJob as any;
      return (
        job.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.format.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.description && job.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
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
        onClose={() => refetch()}
      >
        <p className="mb-2">There was an error loading export history. Please try again.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
        >
          Try Again
        </Button>
      </Alert>
    );
  }

  const stats = {
    total: exports?.length || 0,
    completed: exports?.filter(e => e.status === 'completed').length || 0,
    processing: exports?.filter(e => e.status === 'processing').length || 0,
    failed: exports?.filter(e => e.status === 'failed').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Exports</h1>
          <p className="mt-1 text-sm text-gray-500">
            Export data from your pilot program for analysis and reporting
          </p>
        </div>
        <SearchFilter
          onSearch={handleSearch}
          placeholder="Search exports by type or description..."
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      </div>

      {/* Quick Export Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Export</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {exportTypes.map((exportTypeItem) => (
            <Card key={exportTypeItem.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center mb-3 ${exportTypeItem.color}`}>
                  <exportTypeItem.icon className="h-6 w-6" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">{exportTypeItem.label}</h3>
                <div className="flex space-x-2 mt-2">
                  {exportFormats.slice(0, 2).map((format) => (
                    <Button
                      key={format.id}
                      size="sm"
                      variant="outline"
                      onClick={() => handleCreateExport(exportTypeItem.id, format.id)}
                      loading={isCreatingExport}
                      className="flex-1"
                    >
                      {format.id.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

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
              variant={exportType === 'activities' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setExportType('activities')}
            >
              Activities
            </Button>
            <Button
              variant={exportType === 'surveys' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setExportType('surveys')}
            >
              Surveys
            </Button>
            <Button
              variant={exportType === 'photos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setExportType('photos')}
            >
              Photos
            </Button>
          </div>
        </div>

        {filteredExports.length > 0 ? (
          <Card>
            <DataTable
              data={filteredExports}
              columns={columns}
            />
          </Card>
        ) : (
          <EmptyState
            icon={<DocumentArrowDownIcon className="h-12 w-12 text-gray-400" />}
            title="No exports found"
            description={
              searchTerm || exportType !== 'all'
                ? "Try adjusting your filters to find exports."
                : "You haven't created any exports yet. Use the quick export buttons above to get started."
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