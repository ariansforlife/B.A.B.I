import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {handler} from '../tools/local-bridge.mjs';
const withServer=async(fn)=>{
 const server=createServer(handler({devices:async()=>({devices:[{id:'android-1',state:'device',platform:'android'}]}),run:async()=>({status:'passed',exitCode:0,logs:['ok']})}));
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{return await fn('http://127.0.0.1:'+server.address().port);}finally{await new Promise(resolve=>server.close(resolve));}
};
test('runner rejects missing token and unsafe origin',async()=>withServer(async url=>{
 assert.equal((await fetch(url+'/health')).status,401);
 assert.equal((await fetch(url+'/health',{headers:{Origin:'https://evil.example'}})).status,403);
}));
test('runner rejects unapproved script paths and unknown devices',async()=>withServer(async url=>{
 const headers={'X-BABI-Token':'wrong','Content-Type':'application/json'};
 assert.equal((await fetch(url+'/runs',{method:'POST',headers,body:JSON.stringify({engine:'playwright',script:'../escape.spec.ts'})})).status,401);
}));
