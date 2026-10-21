import {readFile,mkdir,writeFile,rename} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {randomUUID,randomBytes} from 'node:crypto';
const root=resolve(process.env.BABI_WORKSPACE_DIR||'./babi-data');
const path=join(root,'workspace.json');
const empty=()=>({schemaVersion:1,projects:[],masterTestCases:[],masterScripts:[],scriptBindings:[]});
function validate(w){if(w?.schemaVersion!==1||!Array.isArray(w.projects))throw Error('Invalid workspace schema');return w;}
export async function readWorkspace(){try{return validate(JSON.parse(await readFile(path,'utf8')));}catch(e){if(e.code==='ENOENT')return empty();throw e;}}
let lock=Promise.resolve();
export function mutateWorkspace(fn){const operation=lock.then(async()=>{const w=await readWorkspace();const result=fn(w);validate(w);await mkdir(root,{recursive:true});const tmp=join(root,'workspace.'+randomBytes(8).toString('hex')+'.tmp');await writeFile(tmp,JSON.stringify(w,null,2)+'\n',{mode:0o600});await rename(tmp,path);return result;});lock=operation.catch(()=>{});return operation;}
function required(v,label){if(typeof v!=='string'||!v.trim()||v.length>200)throw Error('Invalid '+label);return v.trim();}
function find(list,id,label){const item=list?.find(x=>x.id===id);if(!item)throw Error(label+' not found');return item;}
const clone=value=>JSON.parse(JSON.stringify(value));
export const toolDefinitions=[
 {name:'list_projects',description:'List B.A.B.I projects',inputSchema:{type:'object',properties:{},additionalProperties:false}},
 {name:'get_project',description:'Get a project including its releases and features',inputSchema:{type:'object',properties:{projectId:{type:'string'}},required:['projectId']}},
 {name:'create_project',description:'Create a project in the local workspace',inputSchema:{type:'object',properties:{name:{type:'string'},platform:{type:'string',enum:['web','android','ios']}},required:['name','platform']}},
 {name:'create_release',description:'Create an editable release snapshot for a project',inputSchema:{type:'object',properties:{projectId:{type:'string'},name:{type:'string'},copyFromReleaseId:{type:'string'}},required:['projectId','name']}},
 {name:'add_feature',description:'Add a feature to an unlocked release',inputSchema:{type:'object',properties:{projectId:{type:'string'},releaseId:{type:'string'},name:{type:'string'}},required:['projectId','releaseId','name']}},
 {name:'add_scenario',description:'Add a scenario to a feature in an unlocked release',inputSchema:{type:'object',properties:{projectId:{type:'string'},releaseId:{type:'string'},featureId:{type:'string'},title:{type:'string'}},required:['projectId','releaseId','featureId','title']}},
 {name:'list_test_cases',description:'List reusable master test cases',inputSchema:{type:'object',properties:{},additionalProperties:false}},
 {name:'create_test_case',description:'Create a reusable master test case',inputSchema:{type:'object',properties:{title:{type:'string'},steps:{type:'array',items:{type:'string'}},expected:{type:'string'}},required:['title','steps','expected']}},
 {name:'link_test_case',description:'Link a master test case to a release scenario',inputSchema:{type:'object',properties:{projectId:{type:'string'},releaseId:{type:'string'},featureId:{type:'string'},scenarioId:{type:'string'},testCaseId:{type:'string'}},required:['projectId','releaseId','featureId','scenarioId','testCaseId']}},
 {name:'list_automation_library',description:'List reusable automation snippets and helpers',inputSchema:{type:'object',properties:{},additionalProperties:false}},
 {name:'create_automation_library_item',description:'Create a reusable snippet or helper without executing code',inputSchema:{type:'object',properties:{name:{type:'string'},kind:{type:'string',enum:['snippet','helper']},engine:{type:'string',enum:['playwright','appium','maestro']},platform:{type:'string',enum:['web','android','ios']},content:{type:'string'},description:{type:'string'}},required:['name','kind','engine','platform','content']}},
 {name:'list_scripts',description:'List automation scripts with content',inputSchema:{type:'object',properties:{},additionalProperties:false}},
 {name:'create_script',description:'Create a reusable automation script without executing it',inputSchema:{type:'object',properties:{name:{type:'string'},engine:{type:'string',enum:['playwright','appium','maestro']},platform:{type:'string',enum:['web','android','ios']},content:{type:'string'}},required:['name','engine','platform','content']}},
 {name:'bind_script',description:'Bind an existing master script to an existing test case',inputSchema:{type:'object',properties:{testCaseId:{type:'string'},scriptId:{type:'string'}},required:['testCaseId','scriptId']}}
];
export async function callTool(name,a={}){
 if(name==='list_projects')return (await readWorkspace()).projects.map(p=>({id:p.id,name:p.name,platforms:p.platforms||[p.target],releases:p.releases?.length||0}));
 if(name==='get_project'){const w=await readWorkspace();return find(w.projects,a.projectId,'Project');}
 if(name==='list_test_cases')return (await readWorkspace()).masterTestCases||[];
 if(name==='list_automation_library')return (await readWorkspace()).automationLibrary||[];
 if(name==='list_scripts')return (await readWorkspace()).masterScripts||[];
 if(!toolDefinitions.some(t=>t.name===name))throw Error('Unknown tool');
 return mutateWorkspace(w=>{
  w.masterTestCases??=[];w.masterScripts??=[];w.scriptBindings??=[];w.automationLibrary??=[];
  if(name==='create_project'){const platform=a.platform;if(!['web','android','ios'].includes(platform))throw Error('Invalid platform');const p={id:randomUUID(),name:required(a.name,'name'),target:platform,platforms:[platform],cases:[],features:[],releases:[]};w.projects.push(p);return p;}
  if(name==='create_test_case'){if(!Array.isArray(a.steps)||a.steps.some(x=>typeof x!=='string')||typeof a.expected!=='string')throw Error('Invalid test steps or expected');const c={id:randomUUID(),title:required(a.title,'title'),steps:a.steps,expected:a.expected,status:'draft'};w.masterTestCases.push(c);return c;}
  if(name==='create_automation_library_item'){if(!['snippet','helper'].includes(a.kind)||!['playwright','appium','maestro'].includes(a.engine)||!['web','android','ios'].includes(a.platform)||typeof a.content!=='string'||a.content.length>250000)throw Error('Invalid library item');const item={id:randomUUID(),name:required(a.name,'name'),kind:a.kind,engine:a.engine,platform:a.platform,content:a.content,description:typeof a.description==='string'?a.description:''};w.automationLibrary.push(item);return item;}
  if(name==='create_script'){if(!['playwright','appium','maestro'].includes(a.engine)||!['web','android','ios'].includes(a.platform)||typeof a.content!=='string'||a.content.length>250000)throw Error('Invalid script');const script={id:randomUUID(),name:required(a.name,'name'),engine:a.engine,platform:a.platform,content:a.content};w.masterScripts.push(script);return script;}
  if(name==='bind_script'){find(w.masterTestCases,a.testCaseId,'Test case');const script=find(w.masterScripts,a.scriptId,'Script');if(w.scriptBindings.some(x=>x.testCaseId===a.testCaseId&&x.scriptId===a.scriptId))return {alreadyLinked:true};const binding={id:randomUUID(),testCaseId:a.testCaseId,scriptId:a.scriptId,platform:script.platform};w.scriptBindings.push(binding);return binding;}
  const p=find(w.projects,a.projectId,'Project');p.releases??=[];
  if(name==='create_release'){const source=a.copyFromReleaseId?find(p.releases,a.copyFromReleaseId,'Source release'):p.releases.find(x=>x.id===p.activeReleaseId);const release={id:randomUUID(),name:required(a.name,'name'),createdAt:new Date().toISOString(),features:clone(source?.features||p.features||[]),status:'draft'};p.releases.push(release);p.activeReleaseId=release.id;return release;}
  const release=find(p.releases,a.releaseId,'Release');if(release.status!=='draft')throw Error('Release is locked');
  if(name==='add_feature'){const feature={id:randomUUID(),name:required(a.name,'name'),scenarios:[]};release.features.push(feature);return feature;}
  const feature=find(release.features,a.featureId,'Feature');
  if(name==='add_scenario'){const scenario={id:randomUUID(),title:required(a.title,'title'),testCaseIds:[]};feature.scenarios.push(scenario);return scenario;}
  if(name==='link_test_case'){find(w.masterTestCases,a.testCaseId,'Test case');const scenario=find(feature.scenarios,a.scenarioId,'Scenario');if(!scenario.testCaseIds.includes(a.testCaseId))scenario.testCaseIds.push(a.testCaseId);return scenario;}
  throw Error('Unknown tool');
 });
}
