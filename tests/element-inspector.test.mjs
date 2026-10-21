import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHierarchy,inspectAndroid,snippetFor} from '../tools/element-inspector.mjs';
test('extracts Android UI element IDs and attributes',()=>{const a=parseHierarchy('<hierarchy><node text="Login" resource-id="com.demo:id/login" class="android.widget.Button" bounds="[0,0][100,50]" clickable="true" enabled="true" /></hierarchy>');assert.equal(a.length,1);assert.equal(a[0].id,'com.demo:id/login');assert.equal(a[0].text,'Login');assert.equal(a[0].clickable,true);});
test('uses fixed ADB executable and argument array',async()=>{const result=await inspectAndroid('emulator-5554',{run:async(cmd,args)=>{assert.equal(cmd,'adb');assert.deepEqual(args,['-s','emulator-5554','exec-out','uiautomator','dump','/dev/tty']);return {stdout:'<?xml version="1.0"?><hierarchy><node text="Hi" resource-id="demo:id/hi" /></hierarchy>'};}});assert.equal(result.elements[0].id,'demo:id/hi');});
test('rejects unsafe device identifiers',async()=>{await assert.rejects(()=>inspectAndroid('--evil'),/Invalid device ID/);});
test('generates Appium and Maestro snippets',()=>{const el={id:'com.demo:id/login',text:'Login'};assert.match(snippetFor(el,'appium'),/driver/);assert.match(snippetFor(el,'maestro'),/tapOn/);});
