'use client';

import { Fragment, ReactNode, useId, useState, useSyncExternalStore } from 'react';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Button from './button';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  className?: string;
  cellClassName?: string;
  truncate?: boolean;
  minWidth?: string;
}

function subscribeToCompactLayout(listener: () => void) {
  const query = window.matchMedia('(max-width: 767px)');
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
}
const compactLayout = () => window.matchMedia('(max-width: 767px)').matches;
const serverLayout = () => false;

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (item: T) => void;
  emptyMessage?: string | ReactNode;
  pagination?: {
    page: number;
    total: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  };
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  onRowClick,
  emptyMessage = 'No data available',
  pagination,
}: DataTableProps<T>) {
  const compact = useSyncExternalStore(subscribeToCompactLayout, compactLayout, serverLayout);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const tableId = useId();
  const dataColumns = columns.filter(column => column.key !== 'actions' && column.key !== 'action');
  const hasStatus = dataColumns.some(column => column.key === 'status');
  // Keep essential fields in the row. Every supplied field and action remains
  // available in Details, including full text that is truncated in the row.
  const visibleColumns = dataColumns.filter((column, index) => compact
    ? index === 0 || column.key === 'status' || (!hasStatus && index === 1)
    : dataColumns.length <= 5 || index < 4 || column.key === 'status');

  const getCellContent = (item: T, column: Column<T>, full = false) => {
    if (column.render) {
      return column.render(item);
    }

    const value = item[column.key];
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400">-</span>;
    }

    const text = String(value);
    if (full || column.truncate === false) {
      return <span className="whitespace-normal [overflow-wrap:anywhere]">{text}</span>;
    }

    return (
      <span className="block max-w-xs truncate" title={text}>
        {text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="min-w-0">
        <table className="w-full table-fixed divide-y divide-gray-200">
          <thead className="bg-gray-50 dark:bg-slate-950">
            <tr>
              {visibleColumns.map((column, index) => (
                <th
                  key={column.key || index}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-400 ${
                    column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''
                  } ${column.className || ''}`}
                >
                  {column.header}
                </th>
              ))}
              <th scope="col" className="w-12"><span className="sr-only">Details</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-slate-900 dark:divide-slate-800">
            {[1, 2, 3].map((row) => (
              <tr key={row} className="animate-pulse">
                {visibleColumns.map((column, colIndex) => (
                  <td key={colIndex} className="px-4 py-4">
                    <div className="h-4 rounded bg-gray-100 dark:bg-slate-800"></div>
                  </td>
                ))}
                <td className="w-12" />
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    );
  }

  if (data.length === 0 && !pagination) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 48 48"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.712-3.714m0 0A10.009 10.009 0 0124 26c4.21 0 7.813 2.602 9.288 6.286M30 14a6 6 0 11-12 0 6 6 0 0112 0zm12 6a4 4 0 11-8 0 4 4 0 018 0zm-28 0a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-slate-200">No data</h3>
        <div className="mt-1 text-sm text-gray-500 dark:text-slate-400">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="min-w-0">
        <table className="w-full table-fixed divide-y divide-gray-200 dark:divide-slate-800">
          <thead className="bg-gray-50 dark:bg-slate-950">
            <tr>
              {visibleColumns.map((column, index) => (
                <th
                  key={column.key || index}
                  scope="col"
                  className={`px-3 py-3.5 text-left text-sm font-semibold text-gray-900 [overflow-wrap:anywhere] dark:text-slate-200 ${
                    column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''
                  } ${column.className || ''}`}
                >
                  {column.header}
                </th>
              ))}
              <th scope="col" className="w-12"><span className="sr-only">Details</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
            {data.length === 0 && (
              <tr><td colSpan={visibleColumns.length + 1} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-slate-400">{emptyMessage}</td></tr>
            )}
            {data.map((item, rowIndex) => {
              const rowKey = String(item.id ?? rowIndex);
              const expanded = expandedKey === rowKey;
              const detailsId = `${tableId}-details-${rowIndex}`;
              return (
              <Fragment key={rowKey}>
              <tr
                onClick={() => onRowClick?.(item)}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={event => {
                  if (onRowClick && event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    onRowClick(item);
                  }
                }}
                className={`${onRowClick ? 'hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer' : ''}`}
              >
                {visibleColumns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={`px-3 py-4 align-top text-sm text-gray-900 dark:text-slate-200 ${
                      column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''
                    } ${column.cellClassName || ''}`}
                  >
                    <div className={`min-w-0 max-w-full overflow-hidden [overflow-wrap:anywhere] ${column.truncate === false ? '' : 'line-clamp-2 max-h-10 leading-5'}`}>{getCellContent(item, column)}</div>
                  </td>
                ))}
                <td className="w-12 px-1 py-2">
                  <button type="button" aria-expanded={expanded} aria-controls={detailsId}
                    aria-label={`${expanded ? 'Hide' : 'Show'} details for row ${rowIndex + 1}`}
                    className="flex h-11 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 dark:text-slate-300 dark:hover:bg-slate-800"
                    onClick={event => { event.stopPropagation(); setExpandedKey(expanded ? null : rowKey); }}>
                    <ChevronDownIcon aria-hidden="true" className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  </button>
                </td>
              </tr>
              {expanded && (
                <tr>
                  <td colSpan={visibleColumns.length + 1} className="border-t border-gray-100 bg-gray-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-950">
                    <div id={detailsId} className="min-w-0">
                      <dl className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {columns.map(column => (
                          <div key={column.key} className={`min-w-0 ${column.key === 'actions' || column.key === 'action' ? 'col-span-full' : ''}`}>
                            <dt className="text-xs font-medium text-gray-500 dark:text-slate-400">{column.header}</dt>
                            <dd className="mt-1 min-w-0 text-sm text-gray-900 [overflow-wrap:anywhere] [&_.flex]:flex-wrap [&_.whitespace-nowrap]:whitespace-normal [&_.truncate]:overflow-visible [&_.truncate]:whitespace-normal [&_.truncate]:text-clip dark:text-slate-100">
                              {getCellContent(item, column, true)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </td>
                </tr>
              )}
              </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {pagination && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-1 justify-between sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page * pagination.pageSize >= pagination.total}
            >
              Next
            </Button>
          </div>
          <div className="hidden gap-3 sm:flex sm:flex-1 sm:flex-wrap sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-slate-300">
                Showing{' '}
                <span className="font-medium">{data.length === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1}</span> to{' '}
                <span className="font-medium">
                  {data.length === 0 ? 0 : Math.min((pagination.page - 1) * pagination.pageSize + data.length, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                icon={<ChevronLeftIcon className="h-4 w-4" />}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-700">
                Page {pagination.page} of {Math.max(1, Math.ceil(pagination.total / pagination.pageSize))}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page * pagination.pageSize >= pagination.total}
                icon={<ChevronRightIcon className="h-4 w-4" />}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
