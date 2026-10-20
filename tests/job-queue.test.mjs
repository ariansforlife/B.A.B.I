import test from 'node:test';
import assert from 'node:assert/strict';
import {JobQueue} from '../tools/job-queue.mjs';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
test('parallel jobs respect concurrency',async()=>{
 let active=0,peak=0;
 const queue=new JobQueue(async()=>{active++;peak=Math.max(peak,active);await delay(15);active--;return {exitCode:0};},{concurrency:2});
 for(let i=0;i<5;i++)queue.submit({engine:'playwright'});
 await delay(110);assert.equal(peak,2);assert.equal(queue.list().filter(j=>j.status==='passed').length,5);
});
test('same device is leased to only one run',async()=>{
 let active=0,peak=0;
 const queue=new JobQueue(async()=>{active++;peak=Math.max(peak,active);await delay(15);active--;return {exitCode:0};},{concurrency:3});
 queue.submit({deviceId:'ABC'});queue.submit({deviceId:'ABC'});
 await delay(70);assert.equal(peak,1);
});
test('queued jobs can be cancelled',async()=>{
 const queue=new JobQueue(async()=>{await delay(30);return {exitCode:0};},{concurrency:1});
 queue.submit({});const second=queue.submit({});
 assert.equal(queue.cancel(second.id),true);await delay(50);
 assert.equal(queue.jobs.get(second.id).status,'cancelled');
});
