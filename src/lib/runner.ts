import type { Engine, Target, TestCase } from './model';
export type Device = { id:string; platform:'android'|'ios'; name:string; state:'available'|'busy'|'offline' };
export type RunStatus = 'queued'|'running'|'passed'|'failed'|'error'|'cancelled';
export type RunRecord = { id:string; projectId:string; testCaseId:string; engine:Engine; target:Target; deviceId?:string; status:RunStatus; startedAt?:string; finishedAt?:string; exitCode?:number; logs:string[] };
export type RunnerCapabilities = { engines:Engine[]; platforms:Target[]; maxConcurrency:number; devices:Device[] };
export type RunRequest = { id:string; projectId:string; test:TestCase; target:Target; url?:string; deviceId?:string };
export function canRun(request:RunRequest, capabilities:RunnerCapabilities):boolean {
 if(!capabilities.engines.includes(request.test.engine)||!capabilities.platforms.includes(request.target))return false;
 if(request.target==='web')return request.test.engine==='playwright' && Boolean(request.url && /^https?:\/\//.test(request.url));
 return Boolean(request.deviceId && capabilities.devices.some(d=>d.id===request.deviceId&&d.platform===request.target&&d.state==='available'));
}
export function createQueuedRun(request:RunRequest):RunRecord {
 return {id:request.id,projectId:request.projectId,testCaseId:request.test.id,engine:request.test.engine,target:request.target,deviceId:request.deviceId,status:'queued',logs:[]};
}
