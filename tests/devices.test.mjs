import test from 'node:test';
import assert from 'node:assert/strict';
import {parseAdbDevices,parseSimctlDevices,discoverDevices} from '../tools/device-discovery.mjs';
test('ADB parses available and offline devices',()=>{
 assert.deepEqual(parseAdbDevices('List of devices attached\nABC device product:a model:Pixel_7\nXYZ unauthorized\n').map(d=>[d.id,d.name,d.state]),[['ABC','Pixel 7','available'],['XYZ','XYZ','offline']]);
});
test('simctl identifies booted simulators',()=>{
 const devices=parseSimctlDevices(JSON.stringify({devices:{'iOS 18':[{udid:'SIM1',name:'iPhone',state:'Booted',isAvailable:true},{udid:'SIM2',name:'Other',state:'Shutdown'}]}}));
 assert.equal(devices[0].state,'available');assert.equal(devices[1].state,'offline');
});
test('discovery degrades when tools are unavailable',async()=>{
 const result=await discoverDevices({run:async()=>{const e=new Error('missing');e.code='ENOENT';throw e;}});
 assert.equal(result.devices.length,0);assert.equal(result.errors.length,2);
});
