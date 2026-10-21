import test from 'node:test';
import assert from 'node:assert/strict';
import {JobQueue} from '../tools/job-queue.mjs';

test('runner result does not overwrite queue job identity', async()=>{
 let finish;
 const executor=()=>new Promise(resolve=>{finish=resolve;});
 const queue=new JobQueue(executor);
 const job=queue.submit({engine:'playwright',script:'scripts/test.spec.ts'});
 const originalId=job.id;
 finish({id:'different-run-id',status:'passed',exitCode:0,artifacts:[]});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(queue.list()[0].id,originalId);
 assert.equal(queue.list()[0].runId,'different-run-id');
 assert.equal(queue.list()[0].status,'passed');
 assert.equal(queue.cancel(originalId),false);
});
