'use client';

import { Suspense, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useApiQuery } from '@/lib/hooks/use-api';
import { pilotsApi } from '@/lib/api/pilots';
import { Card } from '@/components/ui/card';
import Alert from '@/components/ui/alert';
import Button from '@/components/ui/button';

const number = (value: number) => new Intl.NumberFormat('en').format(value);
function Loading() { return <p role="status" className="p-4 text-muted-foreground">Loading pilot overview…</p>; }
function Metric({ label, value, note }: { label: string; value: number; note?: string }) {
  return <Card className="p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 break-words text-3xl font-semibold tabular-nums">{number(value)}</p>{note && <p className="mt-2 text-xs leading-5 text-muted-foreground">{note}</p>}</Card>;
}

function Overview({ id, view, actor, reload, locale }: { id: string; view: 'current' | 'history'; actor: string; reload: () => void; locale: string }) {
  const { data, isLoading, isFetching, error, refetch } = useApiQuery(['admin-pilot-overview', actor, id, view], () => pilotsApi.getHistoryOverview(id, view), { placeholderData: undefined, staleTime: 0, refetchOnMount: 'always' });
  if (isLoading || isFetching) return <Loading />;
  if (error || !data?.data || data.data.pilot.id !== id || data.data.mode !== view) return <Alert type="error" title="Overview unavailable"><p>{error?.message || 'Reload to verify the selected pilot.'}</p><Button className="mt-3" variant="outline" onClick={() => { reload(); void refetch(); }}>Reload context</Button></Alert>;
  const overview = data.data;
  const responses = overview.surveys.studentResponses + overview.surveys.volunteerResponses + overview.surveys.activityResponses;
  return <section aria-label="Selected pilot overview" className="space-y-5">
    <Card className="p-4 sm:p-6">
      <p className="text-sm font-medium text-muted-foreground">{view === 'history' ? 'History' : 'Current pilot'} · Read-only overview</p>
      <h2 className="mt-2 break-words text-2xl font-semibold">{overview.pilot.name}</h2>
      <p className="mt-2 text-sm capitalize">{overview.pilot.status}</p>
      <p className="mt-1 text-sm text-muted-foreground">{overview.pilot.start_date} – {overview.pilot.end_date}</p>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">Viewing this overview leaves pilot status and assignments unchanged. Counts belong to this pilot.</p>
    </Card>
    <nav aria-label="Pilot history records" className="flex flex-wrap gap-2">
      {[['reports','Reports'],['assignments','Survey assignments'],['surveys','Survey responses'],['schools','Schools'],['media','Report media']].map(([tab,label])=><Link key={tab} href={`/${locale}/admin/pilots/records?${new URLSearchParams({view,pilot_id:id,tab})}`} className="inline-flex min-h-11 items-center rounded-md border border-border bg-card px-3 text-sm text-foreground hover:bg-accent">{label}</Link>)}
    </nav>
    <div className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
      <Metric label="Reports" value={overview.reports.total} note="Excludes deleted reports." />
      <Metric label="Linked accounts" value={overview.memberships.people} note={`${number(overview.memberships.activePeople)} currently active; excludes deleted accounts.`} />
      <Metric label="Linked schools" value={overview.memberships.schools} note={`${number(overview.memberships.archivedSchools)} additional archived memberships.`} />
      <Metric label="Registered report files" value={overview.registeredReportFiles} note="Each registered report attachment is counted once." />
    </div>
    <Card className="p-4 sm:p-6"><h3 className="text-lg font-semibold">Report status</h3>
      {overview.reports.byStatus.length ? <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">{overview.reports.byStatus.map(row => <div key={row.status} className="min-w-0"><dt className="break-words text-sm capitalize text-muted-foreground">{row.status.replaceAll('_', ' ')}</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{number(row.count)}</dd></div>)}</dl> : <p className="mt-3 text-sm text-muted-foreground">No reports recorded for this pilot.</p>}
    </Card>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Metric label="Activity templates" value={overview.templates.activities} note="Excludes deleted templates." />
      <Metric label="Survey templates" value={overview.templates.surveys} note="Excludes deleted templates." />
      <Metric label="Survey assignments" value={overview.surveys.assignments} note={`${number(overview.surveys.completedAssignments)} marked completed.`} />
      <Metric label="Survey response records" value={responses} note="Several response records may belong to one assignment." />
    </div>
    <Card className="p-4 sm:p-6"><h3 className="text-lg font-semibold">Survey response records</h3><dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {[['Student', overview.surveys.studentResponses], ['Volunteer', overview.surveys.volunteerResponses], ['Activity', overview.surveys.activityResponses]].map(([label, count]) => <div key={String(label)}><dt className="text-sm text-muted-foreground">{label}</dt><dd className="mt-1 text-xl font-semibold">{number(Number(count))}</dd></div>)}
    </dl></Card>
    {overview.surveys.ownershipMismatches > 0 && <Alert type="warning" title="Assignment ownership needs review">{number(overview.surveys.ownershipMismatches)} assignment records reference a template in another pilot. They are counted under their assigned pilot; no records were moved.</Alert>}
    <p className="text-sm leading-6 text-muted-foreground">Account status and school details reflect the current registry, rather than historical snapshots. Responses linked to deleted reports are excluded. File totals show registered attachments; availability is checked when opening a file. This view contains summaries only.</p>
  </section>;
}

function PilotContextPage() {
  const { user, isLoading: authLoading } = useAuth();
  const actor = user?.id;
  const queryClient = useQueryClient();
  useEffect(() => () => {
    if (!actor) return;
    queryClient.removeQueries({ queryKey: ['admin-pilot-context', actor] });
    queryClient.removeQueries({ queryKey: ['admin-pilot-overview', actor] });
  }, [queryClient, actor]);
  const params = useParams(), router = useRouter(), search = useSearchParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'en';
  const query = search.toString();
  const isAdmin = user?.role === 'admin';
  const context = useApiQuery(['admin-pilot-context', user?.id, query], () => pilotsApi.getAdminContext(query), { enabled: isAdmin, placeholderData: undefined, staleTime: 0, refetchOnMount: 'always' });
  const selected = context.data?.data;
  const navigate = (view: 'current' | 'history', id?: string) => {
    const next = new URLSearchParams({ view });
    if (id) next.set('pilot_id', id);
    router.push(`/${locale}/admin/pilots/overview?${next}`);
  };
  const reload = () => { void context.refetch(); };
  if (authLoading) return <Loading />;
  if (!isAdmin) return <Alert type="error" title="Administrator access required">This overview is available to administrators.</Alert>;
  return <div className="min-w-0 space-y-5">
    <div><Link href={`/${locale}/admin/pilots`} className="inline-flex min-h-11 items-center text-sm text-primary underline underline-offset-4">Back to pilots</Link><h1 className="mt-2 text-2xl font-semibold">Pilot overview and history</h1></div>
    <nav aria-label="Pilot view" className="flex flex-wrap gap-2">
      <Button variant={selected?.mode === 'current' ? 'default' : 'outline'} onClick={() => navigate('current')}>Current pilot</Button>
      <Button variant={selected?.mode === 'history' ? 'default' : 'outline'} onClick={() => navigate('history', selected?.pilot?.id)}>History</Button>
    </nav>
    {context.isLoading || context.isFetching ? <Loading /> : context.error ? <Alert type="error" title="Pilot context unavailable"><p>{context.error.message}</p><Button className="mt-3" variant="outline" onClick={reload}>Reload context</Button></Alert> : selected && <>
      {selected.mode === 'history' && <Card className="p-4"><label htmlFor="history-pilot" className="block text-sm font-medium">Choose a pilot</label><select id="history-pilot" value={selected.pilot?.id || ''} onChange={event => navigate('history', event.target.value || undefined)} className="mt-2 min-h-11 w-full min-w-0 rounded-lg border border-border bg-background px-3 text-base text-foreground"><option value="">Select a pilot…</option>{selected.options.map(pilot => <option key={pilot.id} value={pilot.id}>{pilot.name} · {pilot.status}</option>)}</select></Card>}
      {selected.mode === 'history' && selected.activePilotCount > 1 && <Alert type="warning">Multiple active pilots need administrator review. This history overview remains read-only.</Alert>}
      {selected.state === 'no_active' && <Alert title="No active pilot">There is no active pilot. Choose History to read a previous pilot without changing its status.</Alert>}
      {selected.state === 'selection_required' && <Alert title="Choose a pilot">Select a pilot to read its overview. No activation is needed.</Alert>}
      {selected.state === 'ready' && selected.pilot && <Overview key={`${user.id}:${selected.pilot.id}:${selected.mode}`} actor={user.id} id={selected.pilot.id} view={selected.mode} reload={reload} locale={locale} />}
    </>}
  </div>;
}

export default function Page() { return <Suspense fallback={<Loading />}><PilotContextPage /></Suspense>; }
