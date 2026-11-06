'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { useApiQuery } from '@/lib/hooks/use-api';
import { pilotsApi, type PilotDataset, type PilotRecord, type PilotRecords } from '@/lib/api/pilots';
import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/alert';
import DataTable from '@/components/ui/data-table';
import { ProtectedImage, ProtectedVideo, ProtectedMediaLink } from '@/components/media/protected-media';

const tabs: { id: PilotDataset; label: string }[] = [{ id: 'reports', label: 'Reports' }, { id: 'assignments', label: 'Survey assignments' }, { id: 'surveys', label: 'Survey responses' }, { id: 'schools', label: 'Schools' }, { id: 'media', label: 'Report media' }];
const text = (value: unknown): string => value === null || value === undefined || value === '' ? 'Not recorded' : typeof value === 'object' ? JSON.stringify(value) : String(value);
function answerText(value: string) {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(text).join(', ');
    if (parsed && typeof parsed === 'object') return typeof parsed.file_name === 'string' ? parsed.file_name : typeof parsed.media_id === 'string' ? 'Media attachment' : Object.entries(parsed).map(([key,val])=>`${key.replaceAll('_',' ')}: ${text(val)}`).join('\n');
  } catch { /* Plain answers remain unchanged. */ }
  return value;
}
function Loading() { return <p role="status" className="p-4 text-muted-foreground">Loading selected pilot records…</p>; }
function FileView({ file }: { file: PilotRecord & { file_name?: string; file_type?: string } }) {
  const name = file.file_name || file.title || 'Attachment';
  return <Card className="overflow-hidden p-3">
    {file.url && (file.media_type === 'video' ? <div className="aspect-video"><ProtectedVideo src={file.url} controls preload="metadata" className="h-full w-full object-contain" /></div> : file.media_type === 'photo' || file.file_type?.startsWith('image/') ? <ProtectedImage src={file.url} alt={name} className="max-h-80 w-full object-contain" /> : null)}
    <p className="mt-2 break-words text-sm font-medium">{name}</p>
    {file.url && <ProtectedMediaLink href={file.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm text-primary underline">Open attachment</ProtectedMediaLink>}
  </Card>;
}
function Detail({ data }: { data: PilotRecords }) {
  const record = data.record!;
  const fields: [string, unknown][] = [['Status',record.status],['School',record.school_name],['Recorded by / assigned to',record.person_name],['Date',record.date]];
  if (data.report) for (const [label,key] of [['Description','description'],['Scheduled date','scheduled_date'],['Actual date','actual_date'],['Participants','number_of_participants'],['Boys','number_of_boys'],['Girls','number_of_girls'],['Engagement','engagement_level'],['Facilitator notes','volunteer_notes'],['Student quotes','student_quotes'],['Coordinator feedback','coordinator_feedback'],['Assignment notes','assignment_notes']]) fields.push([label,data.report[key]]);
  if (data.dataset === 'schools') for (const key of ['province','district','address']) fields.push([key,record[key]]);
  if (data.dataset === 'assignments') for (const [label,key] of [['Survey type','survey_type'],['Survey period','survey_period'],['Completed at','completed_at']]) fields.push([label,record[key]]);
  return <section aria-label="Selected record" className="space-y-4">
    <Card className="p-4 sm:p-6"><h2 className="break-words text-xl font-semibold">{record.title || 'Record details'}</h2><dl className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">{fields.map(([label,value])=><div key={label} className="min-w-0"><dt className="text-sm capitalize text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap [overflow-wrap:anywhere]">{text(value)}</dd></div>)}</dl></Card>
    {record.ownership_mismatch === 1 && <Alert type="warning" title="Assignment ownership needs review">The survey template belongs to another pilot. This record is listed under its assigned pilot.</Alert>}
    {data.dataset === 'surveys' && <Card className="p-4 sm:p-6"><h3 className="text-lg font-semibold">Recorded answers</h3><p className="mt-2 text-sm text-muted-foreground">Question labels reflect the stored question definitions. Answers are shown as recorded.</p><dl className="mt-5 space-y-5">{data.answers?.map(answer=><div key={answer.id}><dt className="font-medium [overflow-wrap:anywhere]">{answer.question_text || 'Question unavailable'}</dt><dd className="mt-2 whitespace-pre-wrap text-sm [overflow-wrap:anywhere]">{answerText(answer.answer)}</dd></div>)}</dl>{!data.answers?.length && <p className="mt-3 text-muted-foreground">No answers recorded.</p>}</Card>}
    {data.contacts && <Card className="p-4 sm:p-6"><h3 className="text-lg font-semibold">Current school contacts</h3><p className="mt-2 text-sm text-muted-foreground">These are current profiles, rather than historical contact snapshots.</p><ul className="mt-4 space-y-4">{data.contacts.map((contact,index)=><li key={index} className="space-y-1 text-sm [overflow-wrap:anywhere]"><p className="font-medium">{contact.name}{contact.is_primary ? ' · Primary' : ''}</p><p>{contact.role}</p><p>{contact.email}</p><p>{text(contact.phone)}</p></li>)}</ul>{!data.contacts.length && <p className="mt-3 text-muted-foreground">No current contacts recorded.</p>}</Card>}
    {data.dataset === 'media' && <FileView file={record} />}
    {Boolean(data.attachments?.length) && <section aria-label="Record attachments"><h3 className="mb-3 text-lg font-semibold">Attachments</h3><div className="grid gap-3 sm:grid-cols-2">{data.attachments!.map(file=><FileView key={file.id} file={file} />)}</div></section>}
  </section>;
}

function Records({ pilotId, view, dataset, actor, locale }: { pilotId: string; view: 'current'|'history'; dataset: PilotDataset; actor: string; locale: string }) {
  const search = useSearchParams(), router = useRouter();
  const page = search.get('page') || '1', query = search.get('q') || '', recordId = search.get('record_id') || '';
  const [draft,setDraft] = useState(query), [exporting,setExporting] = useState(false), [exportError,setExportError] = useState('');
  const exportController = useRef<AbortController | null>(null);
  useEffect(()=>()=>exportController.current?.abort(),[]);
  const params = { view, page, q: query, limit: 25 };
  const result = useApiQuery(['admin-pilot-records',actor,pilotId,view,dataset,page,query,recordId],()=>pilotsApi.getHistoryRecords(pilotId,dataset,params,recordId||undefined),{placeholderData:undefined,staleTime:0,refetchOnMount:'always'});
  const href = (updates: Record<string,string>) => { const next=new URLSearchParams(search.toString()); for(const[key,value]of Object.entries(updates)) { if(value)next.set(key,value);else next.delete(key); } return `/${locale}/admin/pilots/records?${next}`; };
  const exportCsv = async () => {
    if(exportController.current)return;
    const controller=new AbortController(), token=localStorage.getItem('token')||'';
    exportController.current=controller;setExporting(true);setExportError('');
    try {
      const base=process.env.NEXT_PUBLIC_API_BASE_URL||'';
      const response=await fetch(`${base}/pilots/${encodeURIComponent(pilotId)}/history/export?${new URLSearchParams({view,dataset,q:query})}`,{headers:{Authorization:`Bearer ${token}`},credentials:'omit',signal:controller.signal});
      if(!response.ok){const body=await response.json();throw new Error(body.error||'Export failed');}
      const blob=await response.blob();
      if(controller.signal.aborted||localStorage.getItem('token')!==token)return;
      const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`pilot-${pilotId}-${dataset}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }catch(error){if(!controller.signal.aborted)setExportError(error instanceof Error?error.message:'Export failed');}finally{exportController.current=null;setExporting(false);}
  };
  if(result.isLoading||result.isFetching)return <Loading/>;
  if(result.error||!result.data?.data)return <Alert type="error" title="Records unavailable"><p>{result.error?.message||'Unable to load selected records.'}</p><Button variant="outline" className="mt-3" onClick={()=>void result.refetch()}>Retry</Button></Alert>;
  const data=result.data.data;
  if(data.pilot.id!==pilotId||data.mode!==view||data.dataset!==dataset)return <Alert type="error">The selected context changed. Reload before continuing.</Alert>;
  if(recordId)return <div className="space-y-4"><Link href={href({record_id:''})} className="inline-flex min-h-11 items-center text-sm text-primary underline">Back to selected records</Link>{data.record?<Detail data={data}/>:<Alert type="error">Record unavailable.</Alert>}</div>;
  const rows=data.records||[];
  const columns=[{key:'title',header:'Record',render:(row:PilotRecord)=><Link href={href({record_id:row.id})} className="inline-flex min-h-11 items-center font-medium text-primary underline [overflow-wrap:anywhere]">{row.title||'Untitled'}</Link>},{key:'status',header:dataset==='surveys'?'Response type':dataset==='media'?'File type':'Status',render:(row:PilotRecord)=><span>{text(dataset==='surveys'?row.source_type:dataset==='media'?row.media_type:row.status)}</span>},{key:'school_name',header:'School'},{key:'person_name',header:'Recorded by / assigned to'},{key:'date',header:'Date'},{key:'actions',header:'Actions',render:(row:PilotRecord)=><Link href={href({record_id:row.id})} className="inline-flex min-h-11 items-center text-sm text-primary underline">Read details</Link>}];
  return <div className="space-y-4">
    <Card className="p-4"><form onSubmit={event=>{event.preventDefault();router.push(href({q:draft,page:'1',record_id:''}));}} className="flex flex-col gap-3 sm:flex-row"><label htmlFor="pilot-record-search" className="sr-only">Search selected records</label><input id="pilot-record-search" type="search" maxLength={200} value={draft} onChange={event=>setDraft(event.target.value)} placeholder="Search this pilot’s records" className="min-h-11 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-base"/><Button type="submit">Search</Button><Button type="button" variant="outline" onClick={()=>{setDraft('');router.push(href({q:'',page:'1'}));}}>Clear</Button></form></Card>
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{data.pagination?.total||0} matching records · Read-only</p><Button variant="outline" disabled={exporting} onClick={exportCsv}>{exporting?'Preparing CSV…':'Export filtered CSV'}</Button></div>
    {exportError&&<Alert type="error" title="Export unavailable">{exportError}</Alert>}
    <DataTable key={`${dataset}:${page}:${query}`} data={rows} columns={columns} emptyMessage="No matching records in this pilot." pagination={data.pagination?{...data.pagination,onPageChange:next=>router.push(href({page:String(next),record_id:''}))}:undefined}/>
    <p className="text-sm leading-6 text-muted-foreground">School membership includes archived profiles. Names and contacts reflect the current registry. Survey response records are separate from survey assignments. CSV exports include matching rows, stored survey answers or current school contacts, with limits of 5,000 rows and 8 MiB. Attachments open separately.</p>
  </div>;
}

function Workspace() {
  const {user,isLoading:authLoading}=useAuth(), search=useSearchParams(), params=useParams(), queryClient=useQueryClient();
  const actor=user?.id, locale=typeof params.locale==='string'?params.locale:'en', query=search.toString();
  useEffect(()=>()=>{if(actor)queryClient.removeQueries({queryKey:['admin-pilot-records',actor]});},[actor,queryClient]);
  useEffect(()=>()=>{if(actor)queryClient.removeQueries({queryKey:['admin-pilot-readers-context',actor]});},[actor,queryClient]);
  const isAdmin=user?.role==='admin';
  const context=useApiQuery(['admin-pilot-readers-context',actor,query],()=>pilotsApi.getAdminContext(query),{enabled:isAdmin,placeholderData:undefined,staleTime:0,refetchOnMount:'always'});
  if(authLoading)return <Loading/>;
  if(!isAdmin)return <Alert type="error">Administrator access required.</Alert>;
  if(['tab','q','page','record_id'].some(key=>search.getAll(key).length>1))return <Alert type="error">Repeated record filters are not supported.</Alert>;
  if(context.isLoading||context.isFetching)return <Loading/>;
  if(context.error||!context.data?.data)return <Alert type="error" title="Pilot context unavailable">{context.error?.message||'Select a pilot from its overview.'}</Alert>;
  const selected=context.data.data, dataset=(search.get('tab')||'reports') as PilotDataset;
  const overview=`/${locale}/admin/pilots/overview?${new URLSearchParams({view:selected.mode,...(selected.pilot?{pilot_id:selected.pilot.id}:{})})}`;
  if(!selected.pilot||!tabs.some(tab=>tab.id===dataset))return <div className="space-y-3"><Alert type="warning">Choose a valid pilot and dataset from the overview.</Alert><Link href={overview} className="underline">Return to overview</Link></div>;
  return <div className="min-w-0 space-y-5"><Link href={overview} className="inline-flex min-h-11 items-center text-sm text-primary underline">Back to pilot overview</Link><div><p className="text-sm text-muted-foreground">{selected.mode==='history'?'History':'Current pilot'} · Read-only records</p><h1 className="mt-2 break-words text-2xl font-semibold">{selected.pilot.name}</h1></div>
    <nav aria-label="Pilot record categories" className="flex flex-wrap gap-2">{tabs.map(tab=><Link key={tab.id} aria-current={dataset===tab.id?'page':undefined} href={`/${locale}/admin/pilots/records?${new URLSearchParams({view:selected.mode,pilot_id:selected.pilot!.id,tab:tab.id})}`} className={`inline-flex min-h-11 items-center rounded-md border px-3 text-sm ${dataset===tab.id?'border-primary bg-primary text-primary-foreground':'border-border bg-card text-foreground hover:bg-accent'}`}>{tab.label}</Link>)}</nav>
    <Records key={`${actor}:${selected.pilot.id}:${selected.mode}:${dataset}`} pilotId={selected.pilot.id} view={selected.mode} dataset={dataset} actor={actor!} locale={locale}/>
  </div>;
}
export default function Page(){return <Suspense fallback={<Loading/>}><Workspace/></Suspense>;}
