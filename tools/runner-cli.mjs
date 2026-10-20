import { spawn } from 'node:child_process';
import { readFile,mkdir,writeFile,realpath } from 'node:fs/promises';
import { resolve,relative,sep,join } from 'node:path';
import { randomUUID } from 'node:crypto';
const ROOT=resolve(process.env.BABI_WORKSPACE_DIR||'./babi-data');
function within(root,path){const rel=relative(root,path);return rel!==''&&!rel.startsWith('..'+sep)&&rel!=='..'&&!resolve(path).startsWith('\\\\');}
export function resolveScript(relativePath){
 if(typeof relativePath!=='string'||!relativePath||relativePath.includes('\0'))throw Error('Invalid script path');
 const path=resolve(ROOT,relativePath);
 if(!within(ROOT,path))throw Error('Script must be inside workspace');
 return path;
}
export function commandFor(engine,scriptPath){
 if(engine==='playwright'&&scriptPath.endsWith('.spec.ts'))return {cmd:'pnpm',args:['exec','playwright','test',scriptPath]};
 if(engine==='maestro'&&/\.ya?ml$/.test(scriptPath))return {cmd:'maestro',args:['test',scriptPath]};
 if(engine==='appium'&&scriptPath.endsWith('.spec.js'))return {cmd:'node',args:['--test',scriptPath]};
 if(engine==='appium')throw Error('Appium requires a .spec.js Node test using a configured WebDriver client');
 throw Error('Unsupported engine or script extension');
}
export async function executeRun({engine,script,deviceId,approved=false,timeoutMs=120000,signal}, {spawnProcess=spawn}={}){
 if(!approved)throw Error('Execution requires explicit --approve');
 if(!Number.isInteger(timeoutMs)||timeoutMs<1000||timeoutMs>600000)throw Error('Timeout must be 1000–600000 ms');
 const path=resolveScript(script);
 const realRoot=await realpath(ROOT);
 const realScript=await realpath(path);
 if(!within(realRoot,realScript))throw Error('Script symlink escapes workspace');
 await readFile(realScript);
 const {cmd,args}=commandFor(engine,realScript);
 const id=randomUUID(),startedAt=new Date().toISOString(),logs=[];
 const exitCode=await new Promise((done,reject)=>{
  const child=spawnProcess(cmd,args,{cwd:ROOT,env:{...process.env,BABI_DEVICE_ID:deviceId||''},shell:false,stdio:['ignore','pipe','pipe'],signal});
  let finished=false;
  let timedOut=false;
  const timer=setTimeout(()=>{timedOut=true;child.kill('SIGTERM');},timeoutMs);
  const collect=chunk=>{if(logs.join('').length<1024*1024)logs.push(String(chunk).slice(0,16384));};
  child.stdout?.on('data',collect);child.stderr?.on('data',collect);
  child.once('error',error=>{if(finished)return;finished=true;clearTimeout(timer);if(error.name==='AbortError')done(130);else reject(error);});
  child.once('close',code=>{if(finished)return;finished=true;clearTimeout(timer);done(timedOut?124:(code??1));});
 });
 const result={id,engine,script,status:exitCode===0?'passed':'failed',exitCode,startedAt,finishedAt:new Date().toISOString(),logs};
 const directory=join(ROOT,'runs',id);await mkdir(directory,{recursive:true});await writeFile(join(directory,'result.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});
 return result;
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 const [engine,script,...flags]=process.argv.slice(2);
 try{const result=await executeRun({engine,script,approved:flags.includes('--approve')});console.log(JSON.stringify(result,null,2));process.exitCode=result.exitCode;}
 catch(error){console.error(error.message);process.exitCode=1;}
}
