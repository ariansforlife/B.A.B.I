import {stdin,stdout,stderr} from 'node:process';
import {toolDefinitions,callTool} from './mcp-workspace.mjs';
const version='2025-03-26';
const MAX_MESSAGE=1024*1024;
function send(message){stdout.write(JSON.stringify(message)+'\n');}
function error(id,code,message){send({jsonrpc:'2.0',id,error:{code,message}});}
async function dispatch(msg){
 if(!msg||msg.jsonrpc!=='2.0'||typeof msg.method!=='string')return;
 const id=msg.id;
 if(msg.method==='notifications/initialized'||msg.method==='notifications/cancelled')return;
 if(id===undefined)return;
 try{
  if(msg.method==='initialize'){send({jsonrpc:'2.0',id,result:{protocolVersion:version,capabilities:{tools:{listChanged:false}},serverInfo:{name:'babi-local',version:'0.1.0'}}});return;}
  if(msg.method==='ping'){send({jsonrpc:'2.0',id,result:{}});return;}
  if(msg.method==='tools/list'){send({jsonrpc:'2.0',id,result:{tools:toolDefinitions}});return;}
  if(msg.method==='tools/call'){
   const name=msg.params?.name,args=msg.params?.arguments||{};
   if(!toolDefinitions.some(t=>t.name===name))return error(id,-32602,'Unknown tool');
   try{const value=await callTool(name,args);send({jsonrpc:'2.0',id,result:{content:[{type:'text',text:JSON.stringify(value,null,2)}]}});}
   catch(e){send({jsonrpc:'2.0',id,result:{isError:true,content:[{type:'text',text:String(e.message||e)}]}});}
   return;
  }
  error(id,-32601,'Method not found');
 }catch(e){error(id,-32603,String(e.message||e));}
}
let buffer='';
stdin.setEncoding('utf8');
stdin.on('data',chunk=>{
 buffer+=chunk;
 if(buffer.length>MAX_MESSAGE*2){stderr.write('MCP input too large\n');process.exitCode=1;stdin.pause();return;}
 let newline;
 while((newline=buffer.indexOf('\n'))!==-1){
  const line=buffer.slice(0,newline);buffer=buffer.slice(newline+1);
  if(!line.trim())continue;
  if(line.length>MAX_MESSAGE){stderr.write('MCP message too large\n');continue;}
  try{void dispatch(JSON.parse(line)).catch(e=>stderr.write(String(e)+'\n'));}
  catch{error(null,-32700,'Parse error');}
 }
});
