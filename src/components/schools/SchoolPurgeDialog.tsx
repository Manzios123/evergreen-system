'use client';

import { useEffect, useRef, useState } from 'react';
import Modal from '@/components/ui/modal';
import Button from '@/components/ui/button';
import { schoolPurgeApi, SchoolDeletionPreview, SchoolPurgeConfirmation, SchoolPurgeJob } from '@/lib/api/schools';

const message = (error: unknown) => (error as {message?: string})?.message || 'The operation could not be confirmed. Check its result before retrying.';
const labels: Record<string,string> = {
  schools:'School', activities:'Activity reports', student_survey_responses:'Student survey responses', volunteer_survey_responses:'Volunteer survey responses', activity_survey_responses:'Activity survey responses',
  student_survey_answers:'Student answers', volunteer_survey_answers:'Volunteer answers', activity_survey_answers:'Activity answers', activity_media:'Report media', activity_photos:'Legacy photos', survey_answer_media:'Survey attachments',
  activity_approvals:'Approval history', school_contacts:'Contacts', user_schools:'School memberships', school_pilots:'Pilot links', comments:'Linked comments', notifications:'Linked notifications', upload_sessions:'Upload sessions',
};
async function finishFiles(job: SchoolPurgeJob): Promise<SchoolPurgeJob> {
  for (let n=0; n<10 && job.cleanupPending && !job.recoveryUnavailable; n++) {
    job = await schoolPurgeApi.cleanup(job.operationId);
    if (job.files.failed) break;
  }
  return job;
}
function JobResult({job}: {job: SchoolPurgeJob}) {
  return <div className="space-y-2 text-sm" role="status">
    <p className="font-semibold">{job.databaseDeleted ? 'School and linked records permanently deleted.' : 'Database deletion has not been confirmed.'}</p>
    {job.databaseDeleted && <p>Files: {job.files.removed} removed, {job.files.alreadyMissing} already missing, {job.files.retainedShared} shared files kept, {job.files.pending} pending.</p>}
    {job.needsReview && <p>Some files need technical review and have been kept.</p>}
    {job.failures.map((failure,index)=><p key={index} className="break-words text-destructive">{failure.name}: {failure.message}</p>)}
    <p className="break-all text-xs text-muted-foreground">Operation: {job.operationId}</p>
  </div>;
}

export default function SchoolPurgeDialog({schoolId,onClose,onDeleted}: {schoolId:string; onClose:()=>void; onDeleted:(id:string)=>void}) {
  const [preview,setPreview]=useState<SchoolDeletionPreview|null>(null);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [name,setName]=useState('');
  const [reason,setReason]=useState('');
  const [confirmed,setConfirmed]=useState(false);
  const [job,setJob]=useState<SchoolPurgeJob|null>(null);
  const [reload,setReload]=useState(0);
  const [uncertain,setUncertain]=useState(false);
  const lock=useRef(false), alive=useRef(true), notified=useRef(false);
  const attempt=useRef<SchoolPurgeConfirmation|null>(null);
  const [operationId,setOperationId]=useState('');
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  useEffect(()=>{
    let cancelled=false;setPreview(null);setError('');
    schoolPurgeApi.preview(schoolId).then(value=>{if(!cancelled)setPreview(value);}).catch(e=>{if(!cancelled)setError(message(e));});
    return()=>{cancelled=true;};
  },[schoolId,reload]);
  function received(value: SchoolPurgeJob) {
    if(alive.current)setJob(value);
    if(value.databaseDeleted && !notified.current){notified.current=true;onDeleted(schoolId);}
  }
  async function run(mode:'delete'|'status'|'cleanup') {
    if(lock.current)return;lock.current=true;setBusy(true);setError('');
    try {
      let result:SchoolPurgeJob;
      if(mode==='delete'){
        if(!preview)throw Error('Load a fresh preview first.');
        attempt.current??={operationId:crypto.randomUUID(),fingerprint:preview.fingerprint,confirmName:name,reason:reason.trim(),testDataConfirmed:confirmed};
        setOperationId(attempt.current.operationId);setUncertain(true);
        result=await schoolPurgeApi.purge(schoolId,attempt.current);
      }else{
        if(!attempt.current)throw Error('No deletion reference is available.');
        result=await schoolPurgeApi.status(attempt.current.operationId);
      }
      received(result);setUncertain(false);
      if(result.databaseDeleted){result=await finishFiles(result);received(result);}
    }catch(e){if(alive.current)setError(message(e));}
    finally{lock.current=false;if(alive.current)setBusy(false);}
  }
  const canDelete=preview && !preview.blockedReasons.length && name.trim()===preview.school.name.trim() && reason.trim().length>=10 && reason.length<=500 && confirmed;
  return <Modal open onClose={()=>{if(!lock.current)onClose();}} title="Permanently delete test school" size="lg">
    <div className="space-y-4 text-foreground">
      {error && <p role="alert" className="rounded-lg border border-destructive p-3 text-sm text-destructive">{error}</p>}
      {job?.databaseDeleted ? <JobResult job={job}/> : <>
        <p className="text-sm text-muted-foreground">This removes the archived school and every linked record listed below, including test reports and survey answers. User accounts, pilots and shared templates stay. A private recovery copy is kept; there is no one-click undo.</p>
        {!preview ? <p>{error?'Preview unavailable.':'Loading deletion preview…'}</p> : <>
          <h4 className="break-words font-semibold">{preview.school.name}</h4>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 rounded-lg border border-border p-3 text-sm sm:grid-cols-2">
            {Object.entries(preview.counts).filter(([,n])=>n>0).map(([key,n])=><div key={key} className="flex justify-between gap-3"><dt>{labels[key]||key}</dt><dd className="font-semibold tabular-nums">{n}</dd></div>)}
          </dl>
          <p className="text-sm">Stored files: {preview.files.total} ({preview.files.missing} already missing). Shared files will be kept.</p>
          {preview.blockedReasons.map((text,index)=><p key={index} role="alert" className="text-sm text-destructive">{text}</p>)}
          {!uncertain && <fieldset disabled={busy} className="space-y-3">
            <label className="block text-sm">Type the school name<input aria-label="Type the school name" className="mt-1 block w-full rounded-md border border-input bg-background p-2 text-foreground" value={name} onChange={e=>setName(e.target.value)}/></label>
            <label className="block text-sm">Cleanup reason (10–500 characters)<textarea aria-label="Cleanup reason" maxLength={500} rows={3} className="mt-1 block w-full rounded-md border border-input bg-background p-2 text-foreground" value={reason} onChange={e=>setReason(e.target.value)}/></label>
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} className="mt-1 shrink-0"/><span>I checked every listed item and confirm the school, reports, surveys and attachments are all test data.</span></label>
          </fieldset>}
        </>}
      </>}
      {operationId && !job?.databaseDeleted && <p className="break-all text-xs text-muted-foreground">Keep this deletion reference: {operationId}. Check its result before retrying.</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" disabled={busy} onClick={onClose}>{job?.databaseDeleted?'Done':'Cancel'}</Button>
        {!job?.databaseDeleted && !uncertain && <Button variant="outline" disabled={busy} onClick={()=>setReload(n=>n+1)}>Reload preview</Button>}
        {uncertain && !job?.databaseDeleted && <Button variant="outline" disabled={busy} onClick={()=>run('status')}>Check deletion result</Button>}
        {job?.databaseDeleted && job.cleanupPending && !job.recoveryUnavailable && <Button disabled={busy} onClick={()=>run('cleanup')}>{busy?'Cleaning files…':'Retry file cleanup'}</Button>}
        {!job?.databaseDeleted && <Button variant="destructive" disabled={busy||(!uncertain&&!canDelete)} onClick={()=>run('delete')}>{busy?'Working…':uncertain?'Retry same deletion':'Delete all listed test data'}</Button>}
      </div>
    </div>
  </Modal>;
}

export function SchoolPurgeHistory({refreshKey=0}: {refreshKey?:number}) {
  const [jobs,setJobs]=useState<SchoolPurgeJob[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const lock=useRef(false);
  const load=()=>schoolPurgeApi.recent().then(setJobs).catch(e=>setError(message(e)));
  useEffect(()=>{let active=true;schoolPurgeApi.recent().then(v=>{if(active){setJobs(v);setError('');}}).catch(e=>{if(active)setError(message(e));});return()=>{active=false;};},[refreshKey]);
  async function retry(job:SchoolPurgeJob){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{const result=await finishFiles(await schoolPurgeApi.status(job.operationId));setJobs(old=>old.map(item=>item.operationId===result.operationId?result:item));}catch(e){setError(message(e));}finally{lock.current=false;setBusy(false);}}
  return <details className="rounded-xl border border-border bg-card p-4 text-card-foreground"><summary className="cursor-pointer font-medium">Recent permanent deletions</summary>
    <div className="mt-4 space-y-4">{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button size="sm" variant="outline" disabled={busy} onClick={()=>{setError('');void load();}}>Refresh deletion status</Button>
      {!jobs.length&&!error&&<p className="text-sm text-muted-foreground">No recent permanent deletions.</p>}
      {jobs.map(job=><div key={job.operationId} className="space-y-2 rounded-lg border border-border p-3"><h3 className="break-words font-medium">{job.schoolName}</h3><JobResult job={job}/>{job.cleanupPending&&!job.recoveryUnavailable&&<Button size="sm" disabled={busy} onClick={()=>retry(job)}>Retry file cleanup</Button>}</div>)}
    </div>
  </details>;
}
