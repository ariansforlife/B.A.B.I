import {createServer} from 'node:http';
import {randomBytes} from 'node:crypto';
import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {discoverDevices} from './device-discovery.mjs';
import {executeRun} from './runner-cli.mjs';
import {JobQueue} from './job-queue.mjs';
const root=resolve(process.env.BABI_WORKSPACE_DIR||'./babi-data');
const token=process.env.BABI_RUNNER_TOKEN||randomBytes(24).toString('hex');
const port=Number(process.env.BABI_RUNNER_PORT||4318);
const allowed=new Set(['http://localhost:3000','http://127.0.0.1:3000']);
const runs=new Map();
function send(res,code,value){res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
async function json(req){const parts=[];let n=0;for await(const part of req){n+=part.length;if(n>1000000)throw Error('Payload too large');parts.push(part);}return JSON.parse(Buffer.concat(parts).toString());}
export function handler({devices=discoverDevices,run=executeRun}={}){
 const queue=new JobQueue(async(job,signal)=>run({engine:job.engine,script:job.script,deviceId:job.deviceId,approved:true,signal}),{concurrency:2,onUpdate:record=>runs.set(record.id,record)});
 return async(req,res)=>{
  const origin=req.headers.origin;
  if(origin&&!allowed.has(origin))return send(res,403,{error:'Origin not allowed'});
  if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Access-Control-Allow-Headers','Content-Type,X-BABI-Token');res.setHeader('Access-Control-Allow-Methods','GET,PUT,POST,OPTIONS');}
  if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
  if(req.headers['x-babi-token']!==token)return send(res,401,{error:'Unauthorized'});
  try{
   const path=new URL(req.url,'http://localhost').pathname;
   if(path==='/health'&&req.method==='GET')return send(res,200,{ok:true});
   if(path==='/devices'&&req.method==='GET')return send(res,200,await devices());
   if(path==='/workspace'&&req.method==='GET'){
    try{return send(res,200,JSON.parse(await readFile(join(root,'workspace.json'),'utf8')));}
    catch(e){if(e.code==='ENOENT')return send(res,200,{schemaVersion:1,projects:[]});throw e;}
   }
   if(path==='/workspace'&&req.method==='PUT'){
    const data=await json(req);
    if(data?.schemaVersion!==1||!Array.isArray(data.projects))return send(res,400,{error:'Invalid workspace'});
    await mkdir(root,{recursive:true});
    await writeFile(join(root,'workspace.json'),JSON.stringify(data,null,2)+'\n',{mode:0o600});
    return send(res,200,{saved:true});
   }
   if(path==='/scripts'&&req.method==='PUT'){
    const data=await json(req);
    if(typeof data.id!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(data.id)||!['playwright','maestro','appium'].includes(data.engine)||typeof data.content!=='string'||data.content.length>250000)return send(res,400,{error:'Invalid script'});
    const extension=data.engine==='maestro'?'.yaml':data.engine==='appium'?'.spec.js':'.spec.ts';
    const name=data.id+extension;
    await mkdir(join(root,'scripts'),{recursive:true});
    await writeFile(join(root,'scripts',name),data.content,{mode:0o600});
    return send(res,200,{saved:true,path:'scripts/'+name});
   }
   if(path==='/runs'&&req.method==='POST'){
    const data=await json(req);
    if(!['playwright','maestro','appium'].includes(data.engine)||typeof data.script!=='string'||(data.deviceId!==undefined&&typeof data.deviceId!=='string'))return send(res,400,{error:'Unsupported run'});
    const record=queue.submit({engine:data.engine,script:data.script,deviceId:data.deviceId||undefined});
    return send(res,202,{id:record.id,status:record.status});
   }
   if(path==='/runs'&&req.method==='GET')return send(res,200,queue.list());
   if(path==='/reports'&&req.method==='GET'){
    const directory=join(root,'runs');let ids=[];try{ids=await readdir(directory);}catch(e){if(e.code!=='ENOENT')throw e;}
    const reports=[];for(const id of ids.slice(-200)){if(!/^[a-f0-9-]{16,40}$/.test(id))continue;try{reports.push(JSON.parse(await readFile(join(directory,id,'result.json'),'utf8')));}catch{}}
    return send(res,200,reports.reverse());
   }
   const cancel=path.match(/^\/runs\/([a-f0-9-]+)\/cancel$/);
   if(cancel&&req.method==='POST')return send(res,200,{cancelled:queue.cancel(cancel[1])});
   return send(res,404,{error:'Not found'});
  }catch(e){return send(res,400,{error:String(e.message||e)});}
 };
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 createServer(handler()).listen(port,'127.0.0.1',()=>{console.log('Runner listening on http://127.0.0.1:'+port);console.log('BABI_RUNNER_TOKEN='+token);});
}
