export type Engine = 'playwright'|'appium'|'maestro';
export type Target = 'web'|'android'|'ios';
export type TestCase = { id:string; title:string; engine:Engine; script:string; expected:string; status:'draft'|'ready' };
export type Project = { id:string; name:string; target:Target; url?:string; cases:TestCase[] };
export type Workspace = { schemaVersion:1; projects:Project[] };
export const emptyWorkspace = ():Workspace => ({schemaVersion:1,projects:[]});
export function parseWorkspace(input:string):Workspace { const data:unknown=JSON.parse(input); if(!data||typeof data!=='object'||!('schemaVersion' in data)||data.schemaVersion!==1||!('projects' in data)||!Array.isArray(data.projects))throw Error('Invalid workspace schema'); for(const p of data.projects){if(!p||typeof p.id!=='string'||typeof p.name!=='string'||!['web','android','ios'].includes(p.target)||!Array.isArray(p.cases))throw Error('Invalid project');for(const c of p.cases){if(!c||typeof c.id!=='string'||typeof c.title!=='string'||typeof c.script!=='string'||!['playwright','appium','maestro'].includes(c.engine))throw Error('Invalid test case');}}return data as Workspace; }
