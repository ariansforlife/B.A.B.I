export type Engine = 'playwright'|'appium'|'maestro';
export type Target = 'web'|'android'|'ios';
export type TestCase = { id:string; title:string; engine:Engine; script:string; expected:string; status:'draft'|'ready' };
export type MasterTestCase = {id:string;title:string;steps:string[];expected:string;status:'draft'|'ready'};
export type MasterScript = {id:string;name:string;engine:Engine;platform:Target;content:string;description?:string};
export type ScriptBinding = {id:string;testCaseId:string;scriptId:string;platform:Target};
export type Scenario = {id:string;title:string;testCaseIds:string[];description?:string};
export type Feature = {id:string;name:string;scenarios:Scenario[];description?:string};
export type Release = {id:string;name:string;createdAt:string;features:Feature[];status:'draft'|'locked'};
export type Project = { id:string; name:string; target:Target; url?:string; cases:TestCase[]; platforms?:Target[]; testCaseIds?:string[]; features?:Feature[]; releases?:Release[]; activeReleaseId?:string };
export type Workspace = { schemaVersion:1; projects:Project[]; masterTestCases?:MasterTestCase[]; masterScripts?:MasterScript[]; scriptBindings?:ScriptBinding[] };
export const emptyWorkspace = ():Workspace => ({schemaVersion:1,projects:[],masterTestCases:[],masterScripts:[],scriptBindings:[]});
export function parseWorkspace(input:string):Workspace {
 const data:unknown=JSON.parse(input);
 if(!data||typeof data!=='object'||!('schemaVersion' in data)||data.schemaVersion!==1||!('projects' in data)||!Array.isArray(data.projects))throw Error('Invalid workspace schema');
 const w=data as Workspace;
 for(const p of w.projects){if(!p||typeof p.id!=='string'||typeof p.name!=='string'||!['web','android','ios'].includes(p.target)||!Array.isArray(p.cases))throw Error('Invalid project');if(p.platforms&&(!Array.isArray(p.platforms)||p.platforms.some(t=>!['web','android','ios'].includes(t))))throw Error('Invalid project platforms');if(p.releases!==undefined){if(!Array.isArray(p.releases))throw Error('Invalid releases');for(const release of p.releases){if(!release||typeof release.id!=='string'||typeof release.name!=='string'||!Array.isArray(release.features)||!['draft','locked'].includes(release.status))throw Error('Invalid release');}}if(p.features!==undefined){if(!Array.isArray(p.features))throw Error('Invalid features');for(const feature of p.features){if(!feature||typeof feature.id!=='string'||typeof feature.name!=='string'||!Array.isArray(feature.scenarios))throw Error('Invalid feature');for(const scenario of feature.scenarios){if(!scenario||typeof scenario.id!=='string'||typeof scenario.title!=='string'||!Array.isArray(scenario.testCaseIds)||scenario.testCaseIds.some(id=>typeof id!=='string'))throw Error('Invalid scenario');}}}for(const c of p.cases){if(!c||typeof c.id!=='string'||typeof c.title!=='string'||typeof c.script!=='string'||!['playwright','appium','maestro'].includes(c.engine))throw Error('Invalid test case');}}
 if(w.masterTestCases!==undefined&&(!Array.isArray(w.masterTestCases)||w.masterTestCases.some(c=>!c||typeof c.id!=='string'||typeof c.title!=='string'||!Array.isArray(c.steps)||typeof c.expected!=='string')))throw Error('Invalid master test cases');
 if(w.masterScripts!==undefined&&(!Array.isArray(w.masterScripts)||w.masterScripts.some(s=>!s||typeof s.id!=='string'||typeof s.name!=='string'||typeof s.content!=='string'||!['playwright','appium','maestro'].includes(s.engine)||!['web','android','ios'].includes(s.platform))))throw Error('Invalid master scripts');
 if(w.scriptBindings!==undefined&&(!Array.isArray(w.scriptBindings)||w.scriptBindings.some(b=>!b||typeof b.id!=='string'||typeof b.testCaseId!=='string'||typeof b.scriptId!=='string'||!['web','android','ios'].includes(b.platform))))throw Error('Invalid script bindings');
 return {...w,masterTestCases:w.masterTestCases??[],masterScripts:w.masterScripts??[],scriptBindings:w.scriptBindings??[]};
}
