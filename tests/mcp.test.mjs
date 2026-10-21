import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
test('MCP handshake and tools discovery over stdio',()=>{const input=[{jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'test',version:'1'}}},{jsonrpc:'2.0',id:2,method:'tools/list'}].map(x=>JSON.stringify(x)).join('\n')+'\n';const p=spawnSync(process.execPath,['tools/mcp-server.mjs'],{input,encoding:'utf8',timeout:5000});assert.equal(p.status,0,p.stderr);const messages=p.stdout.trim().split('\n').map(JSON.parse);assert.equal(messages.find(x=>x.id===1).result.serverInfo.name,'babi-local');assert.ok(messages.find(x=>x.id===2).result.tools.some(x=>x.name==='create_release'));});
test('MCP workspace project creation persists locally',async()=>{const dir=await mkdtemp(join(tmpdir(),'babi-mcp-'));try{const code="import {callTool} from './tools/mcp-workspace.mjs'; const p=await callTool('create_project',{name:'Demo',platform:'web'}); console.log(p.id)";const p=spawnSync(process.execPath,['--input-type=module','-e',code],{env:{...process.env,BABI_WORKSPACE_DIR:dir},encoding:'utf8',timeout:5000});assert.equal(p.status,0,p.stderr);const w=JSON.parse(await readFile(join(dir,'workspace.json'),'utf8'));assert.equal(w.projects[0].name,'Demo');}finally{await rm(dir,{recursive:true,force:true});}});
