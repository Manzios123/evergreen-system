// components/exports/export-button.tsx
'use client';

import { useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/button';
import Modal from '@/components/ui/modal';
import Input from '@/components/ui/form/input';
import Select from '@/components/ui/form/select';

interface ExportButtonProps {
  type: 'activities' | 'surveys' | 'users' | 'schools' | 'pilots' | 'all';
  filters?: Record<string, any>;
}

export default function ExportButton({ type, filters = {} }: ExportButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [format, setFormat] = useState('json');
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        format,
        ...filters,
      });

      const response = await fetch(`/api/exports/${type}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_export_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        // For JSON, create a downloadable file
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_export_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      setShowModal(false);
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const typeLabels = {
    activities: 'Activities',
    surveys: 'Surveys',
    users: 'Users',
    schools: 'Schools',
    pilots: 'Pilots',
    all: 'All Data',
  };

  return (
    <>
      <Button
        variant="outline"
        icon={<ArrowDownTrayIcon className="h-4 w-4" />}
        onClick={() => setShowModal(true)}
      >
        Export {typeLabels[type]}
      </Button>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={`Export ${typeLabels[type]}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} loading={loading}>
              Export Data
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Choose the format for exporting {typeLabels[type].toLowerCase()}.
          </p>
          
          <Select
            label="Format"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            options={[
              { value: 'json', label: 'JSON' },
              { value: 'csv', label: 'CSV' },
            ]}
          />

          {format === 'csv' && (
            <div className="rounded-md bg-blue-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">CSV Export</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>CSV files can be opened in spreadsheet applications like Excel or Google Sheets.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {Object.keys(filters).length > 0 && (
            <div className="rounded-md bg-gray-50 p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Active Filters:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {Object.entries(filters).map(([key, value]) => (
                  <li key={key}>
                    <span className="font-medium">{key}:</span> {String(value)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}