import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile);
const decode=s=>String(s||'').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
export function parseHierarchy(xml){
 const elements=[];
 for(const match of String(xml).matchAll(/<(?:node|\w+:node)\b([^>]*?)\/?\s*>/g)){
  const attributes={};
  for(const a of match[1].matchAll(/([\w:-]+)="([^"]*)"/g))attributes[a[1]]=decode(a[2]);
  const id=attributes['resource-id']||attributes['name']||attributes['content-desc']||'';
  const text=attributes.text||attributes.label||'';
  const type=attributes.class||attributes.type||'';
  const bounds=attributes.bounds||'';
  if(!id&&!text&&!type)continue;
  elements.push({id,text,type,bounds,accessibilityId:attributes['content-desc']||attributes.name||'',clickable:attributes.clickable==='true',enabled:attributes.enabled!=='false'});
  if(elements.length>=2000)break;
 }
 return elements;
}
export async function inspectAndroid(deviceId,{run=exec}={}){
 if(typeof deviceId!=='string'||!/^[\w.:-]{1,150}$/.test(deviceId))throw Error('Invalid device ID');
 const {stdout}=await run('adb',['-s',deviceId,'exec-out','uiautomator','dump','/dev/tty'],{timeout:20000,maxBuffer:5*1024*1024});
 const xml=String(stdout).slice(String(stdout).indexOf('<?xml')>=0?String(stdout).indexOf('<?xml'):0);
 if(!xml.includes('<hierarchy'))throw Error('Unable to retrieve UI hierarchy; unlock device and open the app');
 return {platform:'android',elements:parseHierarchy(xml)};
}
export function snippetFor(element,engine){
 const id=element.id||element.accessibilityId;
 const selector=id?'id='+id:element.text?'android=new UiSelector().text('+JSON.stringify(element.text)+')':'';
 if(!selector)return '';
 if(engine==='appium')return 'await driver.$('+JSON.stringify(selector)+').click();';
 if(engine==='maestro')return '- tapOn:\n    '+(id?'id: '+JSON.stringify(id):'text: '+JSON.stringify(element.text));
 return '';
}
