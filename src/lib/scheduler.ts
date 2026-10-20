import type { RunRequest,RunRecord } from './runner';
import { createQueuedRun } from './runner';
export type RunExecutor = (request:RunRequest, signal:AbortSignal)=>Promise<{exitCode:number;logs:string[]}>;
export class RunScheduler {
 private readonly pending:RunRequest[]=[];
 private readonly active=new Map<string,AbortController>();
 private readonly records=new Map<string,RunRecord>();
 constructor(private readonly executor:RunExecutor,readonly concurrency=2,private readonly onUpdate:(run:RunRecord)=>void=()=>{}){
  if(!Number.isInteger(concurrency)||concurrency<1)throw Error('Concurrency must be positive');
 }
 submit(request:RunRequest):RunRecord {
  if(this.records.has(request.id))throw Error('Duplicate run ID');
  const run=createQueuedRun(request);this.records.set(run.id,run);this.pending.push(request);this.onUpdate({...run});this.pump();return run;
 }
 cancel(id:string):boolean {
  const record=this.records.get(id);if(!record||['passed','failed','error','cancelled'].includes(record.status))return false;
  const controller=this.active.get(id);if(controller)controller.abort();
  else {const index=this.pending.findIndex(r=>r.id===id);if(index>=0)this.pending.splice(index,1);}
  this.update(id,{status:'cancelled',finishedAt:new Date().toISOString()});return true;
 }
 get(id:string){const record=this.records.get(id);return record?{...record,logs:[...record.logs]}:undefined;}
 private update(id:string,changes:Partial<RunRecord>){const current=this.records.get(id);if(!current)return;const next={...current,...changes};this.records.set(id,next);this.onUpdate({...next,logs:[...next.logs]});}
 private pump(){while(this.active.size<this.concurrency&&this.pending.length){const request=this.pending.shift()!;const controller=new AbortController();this.active.set(request.id,controller);this.update(request.id,{status:'running',startedAt:new Date().toISOString()});void this.executor(request,controller.signal).then(result=>{if(this.records.get(request.id)?.status!=='cancelled')this.update(request.id,{status:result.exitCode===0?'passed':'failed',exitCode:result.exitCode,logs:result.logs,finishedAt:new Date().toISOString()});}).catch(e=>{if(this.records.get(request.id)?.status!=='cancelled')this.update(request.id,{status:'error',logs:[String(e)],finishedAt:new Date().toISOString()});}).finally(()=>{this.active.delete(request.id);this.pump();});}}
}
