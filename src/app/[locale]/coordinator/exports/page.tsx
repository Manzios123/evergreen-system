// app/[locale]/coordinator/exports/page.tsx
'use client';

import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import SearchFilter from '@/components/ui/search-filter';
import Alert from '@/components/ui/alert';
import { exportsApi } from '@/lib/api/exports';
import {
  CalendarIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';

const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export default function CoordinatorExportsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingExport, setIsCreatingExport] = useState(false);
  const [selectedExportType, setSelectedExportType] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'json' | ''>('');
  const [error, setError] = useState<string | null>(null);

  const handleExport = async (type: string, format: 'csv' | 'json', options?: Record<string, any>) => {
    setIsCreatingExport(true);
    setSelectedExportType(type);
    setSelectedFormat(format);
    setError(null);

    try {
      let result: Blob | any;
      const params = { ...options };

      switch (type) {
        case 'activities':
          result = await exportsApi.exportActivities(params, format);
          break;
        case 'surveys':
          result = await exportsApi.exportSurveys(params, format);
          break;
        case 'schools':
          result = await exportsApi.exportSchools(params, format);
          break;
        case 'activity-templates':
          result = await exportsApi.exportActivityTemplates(params, format);
          break;
        default:
          throw new Error(`Unsupported export type: ${type}`);
      }

      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `${type}-export-${timestamp}.${format}`;

      if (result instanceof Blob) {
        downloadBlob(result, filename);
      } else {
        const content = format === 'csv'
          ? (typeof result === 'string' ? result : JSON.stringify(result, null, 2))
          : JSON.stringify(result, null, 2);
        const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
        downloadBlob(blob, filename);
      }

      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} export completed. The file will download automatically.`);
    } catch (error: any) {
      console.error('Failed to create export:', error);
      setError(error?.message || 'Export failed. Please try again.');
    } finally {
      setIsCreatingExport(false);
      setSelectedExportType('');
      setSelectedFormat('');
    }
  };

  const exportTypes = [
    {
      id: 'activities',
      label: 'Activities',
      icon: CalendarIcon,
      color: 'bg-blue-100 text-blue-600',
      description: 'Activities for your assigned pilot only',
    },
    {
      id: 'surveys',
      label: 'Surveys',
      icon: DocumentTextIcon,
      color: 'bg-purple-100 text-purple-600',
      description: 'Survey responses for your assigned pilot only',
    },
    {
      id: 'schools',
      label: 'Schools',
      icon: BuildingOfficeIcon,
      color: 'bg-indigo-100 text-indigo-600',
      description: 'Schools in your assigned pilot only',
    },
    {
      id: 'activity-templates',
      label: 'Activity Templates',
      icon: DocumentTextIcon,
      color: 'bg-green-100 text-green-600',
      description: 'Activity templates for your assigned pilot only',
    },
  ];

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredExportTypes = normalizedSearch
    ? exportTypes.filter((exportType) =>
        exportType.label.toLowerCase().includes(normalizedSearch) ||
        exportType.description.toLowerCase().includes(normalizedSearch)
      )
    : exportTypes;

  const exportFormats = [
    { id: 'csv', label: 'CSV', description: 'Comma-separated values' },
    { id: 'json', label: 'JSON', description: 'JavaScript Object Notation' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Exports</h1>
          <p className="mt-1 text-sm text-gray-500">
            Export data for the pilot you are allowed to manage
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
        type="info"
        title="Scoped Coordinator Exports"
      >
        Coordinator exports are limited to your assigned pilot. Full system backups, user directory exports, and pilot-wide system exports remain administrator-only.
      </Alert>

      {error && (
        <Alert type="error" title="Export failed">
          <p className="mt-2">{error}</p>
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </div>
        </Alert>
      )}

      {/* Quick Export Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Exports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredExportTypes.map((exportTypeItem) => (
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
                  <div className="space-y-2">
                    <select
                      value={selectedExportType === exportTypeItem.id ? selectedFormat : ''}
                      onChange={(e) => {
                        setSelectedExportType(exportTypeItem.id);
                        setSelectedFormat(e.target.value as 'csv' | 'json' | '');
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
                </div>
              </div>
            </Card>
          ))}
        </div>
        {filteredExportTypes.length === 0 && (
          <Card className="p-6 text-center text-sm text-gray-500">
            No matching export types found.
          </Card>
        )}
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
                <li>Coordinators can export activities, surveys, schools, and activity templates for their assigned pilot only</li>
                <li>Full system backups, users, and pilot program exports are administrator-only</li>
                <li>Downloads use authenticated requests and do not put tokens in URLs</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
