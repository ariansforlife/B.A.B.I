import {executeRun} from './runner-cli.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
const endpoint=process.env.BABI_API_URL||'http://127.0.0.1:8080';
const root=process.env.BABI_WORKSPACE_DIR||'./babi-data';
const interval=Number(process.env.BABI_WORKER_POLL_MS||3000);
const token=process.env.BABI_WORKER_TOKEN;
if(!token||token.length<32)throw Error('Set BABI_WORKER_TOKEN to a secret of at least 32 characters');
if(!endpoint.startsWith('http://127.0.0.1:')&&!endpoint.startsWith('http://localhost:'))throw Error('Worker API must be loopback');
async function post(path,payload){const r=await fetch(endpoint+path,{method:'POST',headers:{'Content-Type':'application/json','X-BABI-Worker-Token':token},body:JSON.stringify(payload)});if(r.status===204)return null;if(!r.ok)throw Error(path+': '+r.status+' '+await r.text());return r.json()}
async function processJob(job){
 const tests=job.snapshot?.tests||[];
 const results=[];
 for(const test of tests){
  const script=test.scriptId;
  const engine=test.engine;
  const extension=engine==='maestro'?'.yaml':engine==='appium'?'.spec.js':'.spec.ts';
  if(!/^[a-zA-Z0-9_-]{1,100}$/.test(script)||!['maestro','appium','playwright'].includes(engine)||engine!==job.engine)throw Error('Invalid script metadata');
  if(typeof test.content!=='string'||test.content.length>250000||!test.testCaseId)throw Error('Invalid test script payload');
  const path='scripts/'+script+extension;
  await mkdir(join(root,'scripts'),{recursive:true});
  await writeFile(join(root,path),test.content,{mode:0o600});
  const start=Date.now();
  try{const run=await executeRun({engine,script:path,deviceId:job.deviceId,approved:true});
   results.push({testCaseId:test.testCaseId,status:run.status==='passed'?'passed':'failed',durationMs:Date.now()-start,logs:run.logs,artifacts:run.artifacts});
  }catch(error){results.push({testCaseId:test.testCaseId,status:'failed',durationMs:Date.now()-start,logs:[String(error)],artifacts:[]})}
 }
 if(!results.length)throw Error('Execution snapshot has no tests');
 await post('/api/v1/worker/complete',{id:job.id,results});
}
for(;;){try{const job=await post('/api/v1/worker/claim',{});if(job){try{await processJob(job)}catch(error){console.error('Job failed:',job.id,error);try{await post('/api/v1/worker/fail',{id:job.id,error:String(error)})}catch(reportError){console.error('Failed to report job failure:',reportError)}}}}catch(error){console.error('Worker poll:',error)}await new Promise(resolve=>setTimeout(resolve,interval))}
