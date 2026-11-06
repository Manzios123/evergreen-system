import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

interface PrimaryMetricCardProps {
  label: string;
  value: number;
  description: string;
  details: { label: string; value: number | string }[];
  href: string;
  actionLabel?: string;
}

export default function PrimaryMetricCard({
  label, value, description, details, href, actionLabel = 'View activities',
}: PrimaryMetricCardProps) {
  const format = (number: number) => new Intl.NumberFormat('en').format(number);
  return (
    <section aria-label={`${label} overview`} className="flex h-full min-w-0 flex-col rounded-2xl border border-green-200 bg-white p-5 shadow-sm sm:p-6 dark:border-green-900 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <p className="text-sm font-medium text-gray-600 dark:text-slate-300">{label}</p>
        <Link href={href} className="inline-flex min-h-11 max-w-full items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-green-700 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 dark:text-green-300 dark:hover:bg-green-950">
          {actionLabel}<ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      <p className="mt-4 break-words text-5xl font-semibold tracking-tight text-gray-950 sm:text-6xl dark:text-white">{format(value)}</p>
      <p className="mt-3 max-w-md text-sm leading-6 text-gray-500 dark:text-slate-400">{description}</p>
      <dl className="mt-auto grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 dark:border-slate-800">
        {details.map(detail => (
          <div key={detail.label} className="min-w-0 pt-3">
            <dt className="text-xs text-gray-500 dark:text-slate-400">{detail.label}</dt>
            <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-slate-100">{typeof detail.value === 'number' ? format(detail.value) : detail.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
