import type {Workspace,Release,MasterTestCase,ReleaseSuite,TestSuite} from './model';

export function releaseSuites(workspace:Workspace,projectId:string):ReleaseSuite[]{
 const cases=new Map((workspace.masterTestCases||[]).map(c=>[c.id,c]));
 return (workspace.testSuites||[]).filter(s=>s.projectId===projectId&&s.mandatory).map(s=>snapshotSuite(s,cases));
}
export function snapshotSuite(s:TestSuite,cases:Map<string,MasterTestCase>):ReleaseSuite{
 return {suiteId:s.id,name:s.name,type:s.type,mandatory:s.mandatory,testCases:s.testCaseIds.map(id=>cases.get(id)).filter((x):x is MasterTestCase=>!!x).map(x=>structuredClone(x))};
}
export function releaseCaseIds(release:Release,scope:'full'|'feature'|'regression'|'custom',selected:string[]=[]):string[]{
 const features=release.features.flatMap(f=>f.scenarios.flatMap(s=>s.testCaseIds));
 const regression=(release.testSuites||[]).flatMap(s=>s.testCases.map(c=>c.id));
 const ids=scope==='full'?[...features,...regression]:scope==='feature'?features:scope==='regression'?regression:selected;
 return [...new Set(ids)];
}
export function validateBindings(workspace:Workspace,ids:string[],platform:'web'|'android'|'ios'):{
 ready:boolean;missing:string[];bindings:Record<string,string>
}{
 const scripts=new Map((workspace.masterScripts||[]).map(s=>[s.id,s]));
 const bindings:Record<string,string>={};const missing:string[]=[];
 for(const id of ids){
  const binding=(workspace.scriptBindings||[]).find(b=>b.testCaseId===id&&b.platform===platform);
  if(!binding||!scripts.has(binding.scriptId)){missing.push(id);continue}
  bindings[id]=binding.scriptId;
 }
 return {ready:missing.length===0,missing,bindings};
}
