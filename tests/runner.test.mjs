import test from 'node:test';
import assert from 'node:assert/strict';
import {commandFor,resolveScript,executeRun} from '../tools/runner-cli.mjs';
test('rejects traversal',()=>assert.throws(()=>resolveScript('../outside.spec.ts'),/inside workspace/));
test('maps engines to fixed executables',()=>{
 assert.equal(commandFor('playwright','/tmp/a.spec.ts').cmd,'pnpm');
 assert.equal(commandFor('maestro','/tmp/test.yaml').cmd,'maestro');
 assert.throws(()=>commandFor('appium','/tmp/test.ts'),/configured test harness/);
});
test('never runs without explicit approval',async()=>await assert.rejects(executeRun({engine:'playwright',script:'test.spec.ts'}),/explicit --approve/));
