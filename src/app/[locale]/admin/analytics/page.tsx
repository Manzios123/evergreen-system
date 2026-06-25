'use client';

import { useEffect, useMemo, useState, type ComponentType } from 'react';
import Link from 'next/link';
import {
  ArrowDownTrayIcon,
  BuildingLibraryIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  DocumentTextIcon,
  FunnelIcon,
  QuestionMarkCircleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/alert';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import {
  analyticsApi,
  type AnalyticsFilters,
  type AnalyticsOverview,
  type AnalyticsOption,
  type QuestionAnalyticsRow,
  type TemplateAnalyticsRow,
} from '@/lib/api/analytics';

const emptyOverview: AnalyticsOverview = {
  filters: {
    pilots: [],
    schools: [],
    templates: [],
    facilitators: [],
    questionTypes: [],
  },
  kpis: {
    totalTemplates: 0,
    totalAssignments: 0,
    totalSubmissions: 0,
    completionRate: 0,
    pendingSubmissions: 0,
    activeSchools: 0,
  },
  submissionTrend: [],
  completionBySchool: [],
};

function formatNumber(value: number | string | null | undefined) {
  return Number(value || 0).toLocaleString();
}

function formatPercent(value: number | string | null | undefined) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'No activity yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function formatLabel(value: string | null | undefined, fallback = 'Unknown') {
  return (value || fallback).replace(/_/g, ' ');
}

function optionName(option: AnalyticsOption) {
  return option.name || option.id || 'Unknown';
}

const METADATA_QUESTION_PATTERNS = [
  /\bname\b/i,
  /\bizina\b/i,
  /\bschool name\b/i,
  /\bname of school\b/i,
  /\bizina ry'ishuri\b/i,
  /\bdate\b/i,
  /\bitariki\b/i,
  /\bgrade\b/i,
  /\bclass\b/i,
  /\bemail\b/i,
  /\bphone\b/i,
  /\btelephone\b/i,
  /\bid\b/i,
];

const USEFUL_QUESTION_TYPES = new Set([
  'agree_disagree_unsure',
  'single_choice',
  'multiple_choice',
  'yes_no',
  'radio',
  'select',
  'checkbox',
  'number',
  'scale_1_5',
  'scale_1_10',
  'rating',
  'scale',
  'media',
  'text',
]);

function isMetadataQuestion(questionText: string | null | undefined) {
  const text = String(questionText || '').trim();
  return METADATA_QUESTION_PATTERNS.some((pattern) => pattern.test(text));
}

function isCleanReflection(question: QuestionAnalyticsRow, value: string) {
  const text = value.trim();
  if (isMetadataQuestion(question.question_text)) return false;
  if (question.normalized_type !== 'text') return false;
  if (text.length < 24) return false;
  if (!/^[\x00-\x7F]+$/.test(text)) return false;
  if (/^\d{1,4}([/-]\d{1,2}){1,2}$/.test(text)) return false;
  if (/^[\w.+-]+@[\w.-]+\.\w+$/.test(text)) return false;
  if (/^\+?\d[\d\s().-]{5,}$/.test(text)) return false;
  return true;
}

function KpiCard({
  title,
  value,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <Card className="h-full">
      <CardContent className="h-full">
        <div className="flex min-h-[88px] items-center gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${accent}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-500" title={title}>{title}</p>
            <p className="mt-1 truncate text-2xl font-bold text-gray-900" title={String(value)}>{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FilterSelect({
  label,
  value,
  options,
  allLabel,
  onChange,
}: {
  label: string;
  value: string;
  options: AnalyticsOption[];
  allLabel: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-semibold text-gray-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {optionName(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function ProgressBar({
  value,
  max,
  className = 'bg-green-500',
}: {
  value: number;
  max: number;
  className?: string;
}) {
  const width = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
      <div className={`h-full rounded-full ${className}`} style={{ width: `${width}%` }} />
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [overview, setOverview] = useState<AnalyticsOverview>(emptyOverview);
  const [templates, setTemplates] = useState<TemplateAnalyticsRow[]>([]);
  const [questions, setQuestions] = useState<QuestionAnalyticsRow[]>([]);
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [draftFilters, setDraftFilters] = useState<AnalyticsFilters>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllQuestions, setShowAllQuestions] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadAnalytics() {
      setIsLoading(true);
      setError(null);

      try {
        const [overviewResult, templatesResult, questionsResult] = await Promise.allSettled([
          analyticsApi.overview(filters),
          analyticsApi.templates(filters),
          analyticsApi.questions(filters),
        ]);

        if (!isMounted) return;

        let failedSections = 0;

        if (overviewResult.status === 'fulfilled') {
          setOverview(overviewResult.value.data || emptyOverview);
        } else {
          failedSections += 1;
          setOverview(emptyOverview);
        }

        if (templatesResult.status === 'fulfilled') {
          setTemplates(Array.isArray(templatesResult.value.data) ? templatesResult.value.data : []);
        } else {
          failedSections += 1;
          setTemplates([]);
        }

        if (questionsResult.status === 'fulfilled') {
          setQuestions(Array.isArray(questionsResult.value.data) ? questionsResult.value.data : []);
        } else {
          failedSections += 1;
          setQuestions([]);
        }

        if (failedSections === 3) {
          setError('Unable to load analytics right now.');
        } else if (failedSections > 0) {
          setError('Some analytics sections could not be loaded.');
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

  const kpis = overview.kpis;
  const filterOptions = overview.filters || emptyOverview.filters;

  const maxTemplateAssignments = useMemo(
    () => Math.max(1, ...templates.map((template) => template.assignments_count)),
    [templates]
  );

  const cleanQuestions = useMemo(() => (
    questions.filter((question) => {
      if (isMetadataQuestion(question.question_text)) return false;
      const type = question.normalized_type || question.question_type;
      return USEFUL_QUESTION_TYPES.has(type);
    })
  ), [questions]);

  const visibleQuestions = useMemo(
    () => (showAllQuestions ? cleanQuestions : cleanQuestions.slice(0, 8)),
    [cleanQuestions, showAllQuestions]
  );
  const textResponses = useMemo(() => (
    cleanQuestions
      .flatMap((question) => question.recent_responses.map((response) => ({
        question: question.question_text || 'Unknown question',
        template: question.template_name || 'Unknown template',
        value: response.value,
        submitted_at: response.submitted_at,
        sourceQuestion: question,
      })))
      .filter((response) => isCleanReflection(response.sourceQuestion, response.value))
      .sort((a, b) => String(b.submitted_at || '').localeCompare(String(a.submitted_at || '')))
      .slice(0, 6)
      .map(({ sourceQuestion, ...response }) => response)
  ), [cleanQuestions]);

  const namedCompletionBySchool = useMemo(
    () => overview.completionBySchool.filter((school) => (
      school.school_id &&
      school.school_name &&
      school.school_name.toLowerCase() !== 'unknown school'
    )),
    [overview.completionBySchool]
  );

  const updateDraftFilter = (key: keyof AnalyticsFilters, value: string) => {
    setDraftFilters((current) => ({ ...current, [key]: value || undefined }));
  };

  const applyFilters = () => setFilters(draftFilters);
  const clearFilters = () => {
    setDraftFilters({});
    setFilters({});
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-sm text-gray-500">Admin / Analytics</div>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">Evergreen Analytics</h1>
          <p className="mt-1 text-sm text-gray-600">Pilot Survey Performance &amp; Insights</p>
        </div>
        <Link href="/admin/exports">
          <Button type="button" variant="outline">
            <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
            <FilterSelect
              label="Pilot"
              value={draftFilters.pilot_id || ''}
              options={filterOptions.pilots || []}
              allLabel="All pilots"
              onChange={(value) => updateDraftFilter('pilot_id', value)}
            />
            <FilterSelect
              label="Template"
              value={draftFilters.template_id || ''}
              options={filterOptions.templates || []}
              allLabel="All templates"
              onChange={(value) => updateDraftFilter('template_id', value)}
            />
            <FilterSelect
              label="Question Type"
              value={draftFilters.question_type || ''}
              options={filterOptions.questionTypes || []}
              allLabel="All types"
              onChange={(value) => updateDraftFilter('question_type', value)}
            />
            <FilterSelect
              label="School / Group"
              value={draftFilters.school_id || ''}
              options={filterOptions.schools || []}
              allLabel="All schools"
              onChange={(value) => updateDraftFilter('school_id', value)}
            />
            <FilterSelect
              label="Facilitator"
              value={draftFilters.facilitator_id || ''}
              options={filterOptions.facilitators || []}
              allLabel="All facilitators"
              onChange={(value) => updateDraftFilter('facilitator_id', value)}
            />
            <label className="space-y-1 text-sm">
              <span className="font-semibold text-gray-700">From</span>
              <input
                type="date"
                value={draftFilters.date_from || ''}
                onChange={(event) => updateDraftFilter('date_from', event.target.value)}
                className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-semibold text-gray-700">To</span>
              <input
                type="date"
                value={draftFilters.date_to || ''}
                onChange={(event) => updateDraftFilter('date_to', event.target.value)}
                className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" onClick={applyFilters}>
              <FunnelIcon className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
            <Button type="button" variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert type="warning" title="Analytics partially unavailable">
          {error}
        </Alert>
      )}

      {isLoading ? (
        <SkeletonLoader type="dashboard" />
      ) : (
        <>
          <section className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <KpiCard title="Total Templates" value={formatNumber(kpis.totalTemplates)} icon={DocumentTextIcon} accent="bg-green-50 text-green-700" />
            <KpiCard title="Assignments" value={formatNumber(kpis.totalAssignments)} icon={UsersIcon} accent="bg-blue-50 text-blue-700" />
            <KpiCard title="Submissions" value={formatNumber(kpis.totalSubmissions)} icon={ClipboardDocumentCheckIcon} accent="bg-emerald-50 text-emerald-700" />
            <KpiCard title="Completion Rate" value={formatPercent(kpis.completionRate)} icon={ChartBarIcon} accent="bg-lime-50 text-lime-700" />
            <KpiCard title="Pending" value={formatNumber(kpis.pendingSubmissions)} icon={ClockIcon} accent="bg-orange-50 text-orange-700" />
            <KpiCard title="Active Schools" value={formatNumber(kpis.activeSchools)} icon={BuildingLibraryIcon} accent="bg-teal-50 text-teal-700" />
          </section>

          <section className="grid gap-6 xl:grid-cols-5">
            <Card className="xl:col-span-3">
              <CardHeader title="Template Performance" />
              <CardContent className="p-0">
                {templates.length === 0 ? (
                  <div className="px-6 py-8 text-sm text-gray-500">No template performance data yet.</div>
                ) : (
                  <div className="max-h-[360px] overflow-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="sticky top-0 z-10 bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Template</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Assignments</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Completed</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Pending</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Completion</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Last Activity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {templates.map((template) => (
                          <tr key={template.template_id}>
                            <td className="px-4 py-3">
                              <div className="max-w-64 truncate font-medium text-gray-900" title={template.template_name || 'Unknown template'}>{template.template_name || 'Unknown template'}</div>
                              <div className="text-xs capitalize text-gray-500">
                                {formatLabel(template.survey_type, 'survey')} / {formatLabel(template.survey_period, 'period')}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-700">{formatNumber(template.assignments_count)}</td>
                            <td className="px-4 py-3 text-gray-700">{formatNumber(template.completed_count)}</td>
                            <td className="px-4 py-3 text-gray-700">{formatNumber(template.pending_count)}</td>
                            <td className="px-4 py-3">
                              <div className="flex min-w-32 items-center gap-3">
                                <ProgressBar value={template.assignments_count} max={maxTemplateAssignments} />
                                <span className="w-14 text-right font-semibold text-gray-700">
                                  {formatPercent(template.completion_percentage)}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{formatDate(template.last_activity_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader title="Submission Trend" />
              <CardContent>
                {overview.submissionTrend.length === 0 ? (
                  <div className="py-10 text-sm text-gray-500">No submission trend data yet.</div>
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={overview.submissionTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="submissions" stroke="#15803d" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="movingAverage" stroke="#2563eb" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-5">
            <Card className="xl:col-span-3">
              <CardHeader
                title="Question Analysis"
                action={cleanQuestions.length > 8 ? (
                  <button
                    type="button"
                    onClick={() => setShowAllQuestions((current) => !current)}
                    className="text-sm font-medium text-green-700 hover:text-green-800"
                  >
                    {showAllQuestions ? 'Show fewer' : 'View all questions'}
                  </button>
                ) : (
                  <span className="text-sm font-medium text-green-700">Showing {visibleQuestions.length}</span>
                )}
              />
              <CardContent className="min-h-0">
                {visibleQuestions.length === 0 ? (
                  <div className="py-8 text-sm text-gray-500">No question response data yet.</div>
                ) : (
                  <div className="max-h-[560px] overflow-y-auto pr-2">
                    <div className="grid gap-4 lg:grid-cols-2">
                    {visibleQuestions.map((question) => (
                      <div key={question.question_id} className="rounded-lg border border-gray-200 p-4">
                        <div className="flex items-start gap-3">
                          <QuestionMarkCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                          <div className="min-w-0">
                            <p className="max-h-12 overflow-hidden font-semibold text-gray-900">{question.question_text || 'Unknown question'}</p>
                            <p className="mt-1 text-xs capitalize text-gray-500">
                              {question.template_name || 'Unknown template'} / {formatLabel(question.question_type, 'text')}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-md bg-gray-50 p-3">
                            <div className="text-gray-500">Answered</div>
                            <div className="mt-1 text-lg font-bold text-gray-900">{formatNumber(question.answered_count)}</div>
                          </div>
                          <div className="rounded-md bg-gray-50 p-3">
                            <div className="text-gray-500">Skipped</div>
                            <div className="mt-1 text-lg font-bold text-gray-900">{formatNumber(question.skipped_count)}</div>
                          </div>
                        </div>

                        {question.distribution.length > 0 && (
                          <div className="mt-4 space-y-2">
                            {question.distribution.slice(0, 5).map((item) => (
                              <div key={item.option} className="space-y-1">
                                <div className="flex justify-between text-xs text-gray-600">
                                  <span className="truncate pr-3">{item.option}</span>
                                  <span>{formatNumber(item.count)} ({formatPercent(item.percentage)})</span>
                                </div>
                                <ProgressBar value={item.count} max={Math.max(1, question.answered_count)} />
                              </div>
                            ))}
                          </div>
                        )}

                        {question.numeric.average !== null && (
                          <div className="mt-4 grid grid-cols-4 gap-2 text-center text-sm">
                            <div className="rounded-md border border-gray-100 p-2">
                              <div className="text-gray-500">Total</div>
                              <div className="font-semibold text-gray-900">{formatNumber(question.numeric.total)}</div>
                            </div>
                            <div className="rounded-md border border-gray-100 p-2">
                              <div className="text-gray-500">Avg</div>
                              <div className="font-semibold text-gray-900">{question.numeric.average}</div>
                            </div>
                            <div className="rounded-md border border-gray-100 p-2">
                              <div className="text-gray-500">Min</div>
                              <div className="font-semibold text-gray-900">{question.numeric.min}</div>
                            </div>
                            <div className="rounded-md border border-gray-100 p-2">
                              <div className="text-gray-500">Max</div>
                              <div className="font-semibold text-gray-900">{question.numeric.max}</div>
                            </div>
                          </div>
                        )}

                        {question.normalized_type === 'media' && (
                          <div className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-800">
                            Media uploaded: {formatNumber(question.answered_count)}
                          </div>
                        )}

                        {question.normalized_type === 'text' && question.recent_responses.length > 0 && (
                          <div className="mt-4 space-y-2">
                            {question.recent_responses
                              .filter((response) => isCleanReflection(question, response.value))
                              .slice(0, 3)
                              .map((response, index) => (
                              <div key={`${question.question_id}-${index}`} className="max-h-20 overflow-hidden rounded-md bg-gray-50 p-3 text-sm text-gray-700">
                                {response.value}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader title="Completion by School / Group" />
              <CardContent className="min-h-0">
                {namedCompletionBySchool.length === 0 ? (
                  <div className="py-8 text-sm text-gray-500">No school or group completion data yet.</div>
                ) : (
                  <div className="max-h-[560px] space-y-4 overflow-y-auto pr-2">
                    {namedCompletionBySchool.map((school) => {
                      const total = Math.max(1, school.completed + school.pending + school.notStarted);
                      return (
                        <div key={school.school_id || school.school_name} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="truncate pr-3 font-medium text-gray-900" title={school.school_name}>{school.school_name}</span>
                            <span className="text-gray-500">{school.completionRate}%</span>
                          </div>
                          <div className="flex h-3 overflow-hidden rounded-full bg-gray-100">
                            <div className="bg-green-500" style={{ width: `${(school.completed / total) * 100}%` }} />
                            <div className="bg-orange-400" style={{ width: `${(school.pending / total) * 100}%` }} />
                            <div className="bg-gray-300" style={{ width: `${(school.notStarted / total) * 100}%` }} />
                          </div>
                          <div className="flex gap-4 text-xs text-gray-500">
                            <span>Completed {school.completed}</span>
                            <span>Pending {school.pending}</span>
                            <span>Not started {school.notStarted}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-5">
            <Card className="xl:col-span-2">
              <CardHeader title="What participants are saying" />
              <CardContent className="min-h-0">
                {textResponses.length === 0 ? (
                  <div className="py-8 text-sm text-gray-500">No text responses yet.</div>
                ) : (
                  <div className="max-h-[360px] space-y-3 overflow-y-auto pr-2">
                    {textResponses.map((response, index) => (
                      <div key={`${response.template}-${response.question}-${index}`} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <p className="max-h-24 overflow-hidden text-sm text-gray-800">{response.value}</p>
                        <p className="mt-2 truncate text-xs text-gray-500" title={`${response.template} / ${response.question}`}>
                          {response.template} / {response.question}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader title="Question Type Mix" />
              <CardContent>
                {cleanQuestions.length === 0 ? (
                  <div className="py-8 text-sm text-gray-500">No question type data yet.</div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={Object.entries(
                          cleanQuestions.reduce<Record<string, number>>((acc, question) => {
                            const key = formatLabel(question.normalized_type, 'text');
                            acc[key] = (acc[key] || 0) + 1;
                            return acc;
                          }, {})
                        ).map(([type, count]) => ({ type, count }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {cleanQuestions.map((question, index) => (
                            <Cell key={`${question.question_id}-${index}`} fill={index % 2 === 0 ? '#16a34a' : '#2563eb'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <CalendarDaysIcon className="h-4 w-4" />
            <span>All times shown in your local time zone.</span>
          </div>
        </>
      )}
    </div>
  );
}
