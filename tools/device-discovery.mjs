import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile);
export function parseAdbDevices(output) {
 return output.split(/\r?\n/).slice(1).map(line=>line.trim()).filter(Boolean).map(line=>{
  const match=line.match(/^(\S+)\s+(device|offline|unauthorized|recovery|sideload)(?:\s+(.*))?$/);
  if(!match)return null;
  const [,id,state,details='']=match;
  const model=details.match(/(?:^|\s)model:(\S+)/)?.[1]?.replaceAll('_',' ')||id;
  return {id,platform:'android',name:model,state:state==='device'?'available':'offline'};
 }).filter(Boolean);
}
export function parseSimctlDevices(output) {
 const data=JSON.parse(output);
 if(!data||typeof data.devices!=='object'||Array.isArray(data.devices))throw Error('Invalid simctl output');
 return Object.values(data.devices).flat().filter(d=>d&&typeof d.udid==='string').map(d=>({
  id:d.udid,platform:'ios',name:d.name||d.udid,state:d.state==='Booted'&&d.isAvailable!==false?'available':'offline'
 }));
}
export async function discoverDevices({run=exec}={}) {
 const devices=[],errors=[];
 for(const [command,args,parser] of [['adb',['devices','-l'],parseAdbDevices],['xcrun',['simctl','list','devices','--json'],parseSimctlDevices]]){
  try{const {stdout}=await run(command,args,{timeout:8000,maxBuffer:1024*1024});devices.push(...parser(stdout));}
  catch(error){errors.push({tool:command,message:error?.code==='ENOENT'?'Not installed':String(error.message||error)});}
 }
 return {devices,errors};
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 const result=await discoverDevices();
 console.log(JSON.stringify(result,null,2));
}
