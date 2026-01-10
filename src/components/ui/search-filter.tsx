// components/ui/search-filter.tsx
'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import Button from './button';
import Input from './form/input';

interface SearchFilterProps {
  onSearch: (query: string) => void;
  onFilterChange?: (filters: Record<string, any>) => void;
  filters?: Array<{
    key: string;
    label: string;
    type: 'select' | 'date' | 'text';
    options?: Array<{ value: string; label: string }>;
  }>;
  placeholder?: string;
}

export default function SearchFilter({ 
  onSearch, 
  onFilterChange, 
  filters = [], 
  placeholder = 'Search...' 
}: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...activeFilters, [key]: value };
    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const clearFilters = () => {
    setActiveFilters({});
    onFilterChange?.({});
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholder}
            className="pl-10"
          />
        </div>
        <Button type="submit">Search</Button>
        {filters.length > 0 && (
          <Button
            variant="outline"
            type="button"
            icon={<FunnelIcon className="h-4 w-4" />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
        )}
      </form>

      {showFilters && filters.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Filters</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filters.map((filter) => (
              <div key={filter.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {filter.label}
                </label>
                {filter.type === 'select' && filter.options ? (
                  <select
                    value={activeFilters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:border-green-500 focus:ring-green-500"
                  >
                    <option value="">All</option>
                    {filter.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : filter.type === 'date' ? (
                  <input
                    type="date"
                    value={activeFilters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:border-green-500 focus:ring-green-500"
                  />
                ) : (
                  <input
                    type="text"
                    value={activeFilters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:border-green-500 focus:ring-green-500"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {Object.keys(activeFilters).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(activeFilters).map(([key, value]) => {
            if (!value) return null;
            const filter = filters.find(f => f.key === key);
            return (
              <span
                key={key}
                className="inline-flex items-center rounded-full bg-green-100 px-3 py-0.5 text-sm font-medium text-green-800"
              >
                {filter?.label}: {String(value)}
                <button
                  onClick={() => handleFilterChange(key, '')}
                  className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-green-800 hover:bg-green-200"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}