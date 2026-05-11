'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/alert';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import { analyticsApi, type AnalyticsFilters, type AnalyticsOverview, type ReportAnalytics, type SurveyAnalytics } from '@/lib/api/analytics';
import { api } from '@/lib/api';

type Option = { id: string; name: string };

const emptyOverview: AnalyticsOverview = {
  totalActivities: 0,
  submittedReports: 0,
  activityStatuses: [],
  surveyTemplates: 0,
  surveyAssignments: 0,
  surveyResponses: 0,
  activeSchools: 0,
  activePilots: 0,
};

const emptyReports: ReportAnalytics = {
  byStatus: [],
  bySchool: [],
  byPilot: [],
  byFacilitator: [],
  overTime: [],
};

const emptySurveys: SurveyAnalytics = {
  assignmentStatus: [],
  responsesByTemplate: [],
  questionBreakdown: [],
};

function normalizeArray<T>(value: any): T[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.items)) return value.items;
  return [];
}

function parseAnswer(value: string | null): string | number {
  if (value === null || value === undefined || value === '') return 'Blank';
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === 'number' || typeof parsed === 'string') return parsed;
    return JSON.stringify(parsed);
  } catch {
    return value;
  }
}

function formatNumber(value: number | string | null | undefined) {
  return Number(value || 0).toLocaleString();
}

function DataTable({
  title,
  subtitle,
  columns,
  rows,
}: {
  title: string;
  subtitle?: string;
  columns: string[];
  rows: Array<Array<string | number | null | undefined>>;
}) {
  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <div className="px-6 py-8 text-sm text-gray-500">No analytics data found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column) => (
                    <th key={column} className="px-4 py-3 text-left font-semibold text-gray-700">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={`${rowIndex}-${cellIndex}`} className="max-w-xs px-4 py-3 text-gray-700">
                        <span className="block truncate" title={String(cell ?? '')}>
                          {cell ?? 'Unknown'}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminAnalyticsPage() {
  const [overview, setOverview] = useState<AnalyticsOverview>(emptyOverview);
  const [reports, setReports] = useState<ReportAnalytics>(emptyReports);
  const [surveys, setSurveys] = useState<SurveyAnalytics>(emptySurveys);
  const [pilots, setPilots] = useState<Option[]>([]);
  const [schools, setSchools] = useState<Option[]>([]);
  const [templates, setTemplates] = useState<Option[]>([]);
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadOptions() {
      try {
        const [pilotResponse, schoolResponse, templateResponse] = await Promise.all([
          api.get<any>('/pilots', { isActive: true, limit: 100 }),
          api.get<any>('/schools', { limit: 200 }),
          api.get<any>('/survey-templates'),
        ]);

        if (!isMounted) return;

        setPilots(normalizeArray<any>(pilotResponse).map((item) => ({
          id: item.id,
          name: item.name || item.title || item.id,
        })));
        setSchools(normalizeArray<any>(schoolResponse).map((item) => ({
          id: item.id,
          name: item.name || item.school_name || item.id,
        })));
        setTemplates(normalizeArray<any>(templateResponse).map((item) => ({
          id: item.id,
          name: item.name || item.title || item.id,
        })));
      } catch {
        if (isMounted) {
          setPilots([]);
          setSchools([]);
          setTemplates([]);
        }
      }
    }

    loadOptions();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadAnalytics() {
      setIsLoading(true);
      setError(null);
      try {
        const [overviewResponse, reportResponse, surveyResponse] = await Promise.all([
          analyticsApi.overview(),
          analyticsApi.reports(filters),
          analyticsApi.surveys(filters),
        ]);

        if (!isMounted) return;

        setOverview(overviewResponse.data || emptyOverview);
        setReports(reportResponse.data || emptyReports);
        setSurveys(surveyResponse.data || emptySurveys);
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Unable to load analytics.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadAnalytics();
    return () => {
      isMounted = false;
    };
  }, [filters]);

  const questionBreakdowns = useMemo(() => {
    const grouped = new Map<string, {
      question: string;
      type: string;
      template: string;
      total: number;
      answers: Array<{ answer: string; count: number }>;
      numericValues: Array<{ value: number; count: number }>;
    }>();

    for (const row of surveys.questionBreakdown) {
      const key = row.question_id;
      const parsed = parseAnswer(row.answer_value);
      const count = Number(row.count || 0);
      const answerText = String(parsed);
      const existing = grouped.get(key) || {
        question: row.question_text,
        type: row.question_type,
        template: row.template_name,
        total: 0,
        answers: [],
        numericValues: [],
      };

      existing.total += count;
      existing.answers.push({ answer: answerText, count });

      const numeric = typeof parsed === 'number' ? parsed : Number(answerText);
      if (!Number.isNaN(numeric) && answerText.trim() !== '') {
        existing.numericValues.push({ value: numeric, count });
      }

      grouped.set(key, existing);
    }

    return Array.from(grouped.values()).map((item) => {
      const numericTotal = item.numericValues.reduce((sum, value) => sum + value.count, 0);
      const weightedSum = item.numericValues.reduce((sum, value) => sum + value.value * value.count, 0);
      return {
        ...item,
        average: numericTotal > 0 ? weightedSum / numericTotal : null,
        topAnswers: item.answers.slice(0, 5),
      };
    });
  }, [surveys.questionBreakdown]);

  const updateFilter = (key: keyof AnalyticsFilters, value: string) => {
    setFilters((current) => ({
      ...current,
      [key]: value || undefined,
    }));
  };

  const clearFilters = () => setFilters({});

  const overviewCards = [
    ['Total activities/reports', overview.totalActivities],
    ['Submitted reports', overview.submittedReports],
    ['Survey templates', overview.surveyTemplates],
    ['Survey assignments', overview.surveyAssignments],
    ['Survey responses', overview.surveyResponses],
    ['Active schools', overview.activeSchools],
    ['Active pilots', overview.activePilots],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Report and Survey Analytics</h1>
        <p className="mt-1 text-sm text-gray-600">
          Admin-only overview of activity/report submissions and survey responses.
        </p>
      </div>

      <Card>
        <CardHeader title="Filters" subtitle="Filter report and survey analytics without changing underlying data." />
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <label className="space-y-1 text-sm">
              <span className="font-medium text-gray-700">Pilot</span>
              <select
                value={filters.pilot_id || ''}
                onChange={(event) => updateFilter('pilot_id', event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="">All pilots</option>
                {pilots.map((pilot) => (
                  <option key={pilot.id} value={pilot.id}>{pilot.name}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-gray-700">School</span>
              <select
                value={filters.school_id || ''}
                onChange={(event) => updateFilter('school_id', event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="">All schools</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>{school.name}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-gray-700">Status</span>
              <select
                value={filters.status || ''}
                onChange={(event) => updateFilter('status', event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="">All statuses</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="in_edit">Returned/In edit</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="assigned">Assigned</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-gray-700">Survey template</span>
              <select
                value={filters.template_id || ''}
                onChange={(event) => updateFilter('template_id', event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="">All templates</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-gray-700">From</span>
              <input
                type="date"
                value={filters.date_from || ''}
                onChange={(event) => updateFilter('date_from', event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-gray-700">To</span>
              <input
                type="date"
                value={filters.date_to || ''}
                onChange={(event) => updateFilter('date_to', event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
          </div>
          <div className="mt-4">
            <Button type="button" variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert type="error" title="Unable to load analytics">
          {error}
        </Alert>
      )}

      {isLoading ? (
        <SkeletonLoader type="dashboard" />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {overviewCards.map(([label, value]) => (
              <Card key={label}>
                <CardContent>
                  <p className="text-sm font-medium text-gray-500">{label}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{formatNumber(value)}</p>
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Reports / Activities</h2>
            <div className="grid gap-4 xl:grid-cols-2">
              <DataTable
                title="By status"
                columns={['Status', 'Count']}
                rows={reports.byStatus.map((item) => [item.status, formatNumber(item.count)])}
              />
              <DataTable
                title="Over time"
                subtitle="Grouped by scheduled, actual, or created date."
                columns={['Date', 'Count']}
                rows={reports.overTime.map((item) => [item.date, formatNumber(item.count)])}
              />
              <DataTable
                title="By school"
                columns={['School', 'Count']}
                rows={reports.bySchool.map((item) => [item.school_name, formatNumber(item.count)])}
              />
              <DataTable
                title="By pilot"
                columns={['Pilot', 'Count']}
                rows={reports.byPilot.map((item) => [item.pilot_name, formatNumber(item.count)])}
              />
              <DataTable
                title="By assigned facilitator"
                subtitle="Uses the legacy activities.volunteer_id field as the assigned user."
                columns={['Facilitator / user', 'Count']}
                rows={reports.byFacilitator.map((item) => [item.user_name, formatNumber(item.count)])}
              />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Survey Analytics</h2>
            <div className="grid gap-4 xl:grid-cols-2">
              <DataTable
                title="Assignments by status"
                columns={['Status', 'Count']}
                rows={surveys.assignmentStatus.map((item) => [item.status, formatNumber(item.count)])}
              />
              <DataTable
                title="Responses by template"
                columns={['Template', 'Responses']}
                rows={surveys.responsesByTemplate.map((item) => [item.template_name, formatNumber(item.response_count)])}
              />
            </div>
            <Card>
              <CardHeader
                title="Per-question answer breakdown"
                subtitle="Top answer counts are shown first. Numeric answers include a simple weighted average."
              />
              <CardContent className="space-y-4">
                {questionBreakdowns.length === 0 ? (
                  <p className="text-sm text-gray-500">No survey answer data found.</p>
                ) : (
                  questionBreakdowns.map((question) => (
                    <div key={`${question.template}-${question.question}`} className="rounded-lg border border-gray-200 p-4">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{question.question}</p>
                          <p className="text-xs text-gray-500">{question.template} · {question.type}</p>
                        </div>
                        <span className="text-xs font-medium text-gray-500">{formatNumber(question.total)} responses</span>
                      </div>
                      {question.average !== null && (
                        <p className="mt-2 text-sm text-gray-700">Average: {question.average.toFixed(2)}</p>
                      )}
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        {question.topAnswers.map((answer) => (
                          <div key={`${answer.answer}-${answer.count}`} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm">
                            <span className="truncate pr-3" title={answer.answer}>{answer.answer}</span>
                            <span className="font-semibold text-gray-700">{formatNumber(answer.count)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
