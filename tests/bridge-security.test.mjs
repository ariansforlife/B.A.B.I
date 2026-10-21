import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {handler} from '../tools/local-bridge.mjs';

test('local bridge rejects unauthorized requests and invalid engine-script pairing',async()=>{
 const server=createServer(handler({devices:async()=>({devices:[{id:'emulator-1',state:'available'}],errors:[]}),run:async()=>({status:'passed',exitCode:0})}));
 server.listen(0,'127.0.0.1');await once(server,'listening');
 const url='http://127.0.0.1:'+server.address().port;
 try{
  const unauthorized=await fetch(url+'/health');
  assert.equal(unauthorized.status,401);
  const forbiddenOrigin=await fetch(url+'/health',{headers:{origin:'https://untrusted.example','x-babi-token':'invalid'}});
  assert.equal(forbiddenOrigin.status,403);
  const badRun=await fetch(url+'/runs',{method:'POST',headers:{'x-babi-token':'invalid','content-type':'application/json'},body:JSON.stringify({engine:'appium',script:'scripts/foo.spec.ts',deviceId:'emulator-1'})});
  assert.equal(badRun.status,401);
 }finally{server.close();await once(server,'close');}
});
