import type { Workspace,Project,TestCase } from './model';
export function validateWorkspace(input:unknown):Workspace {
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Workspace must be an object');
 const w=input as Record<string,unknown>;
 if(w.schemaVersion!==1||!Array.isArray(w.projects))throw Error('Unsupported workspace schema');
 const ids=new Set<string>();
 for(const p of w.projects as Project[]){
  if(!p||typeof p.id!=='string'||!p.id||ids.has(p.id)||typeof p.name!=='string'||!['web','android','ios'].includes(p.target)||!Array.isArray(p.cases))throw Error('Invalid or duplicate project');
  ids.add(p.id);
  const caseIds=new Set<string>();
  for(const c of p.cases as TestCase[]){
   if(!c||typeof c.id!=='string'||!c.id||caseIds.has(c.id)||typeof c.title!=='string'||typeof c.script!=='string'||typeof c.expected!=='string'||!['playwright','appium','maestro'].includes(c.engine)||!['draft','ready'].includes(c.status))throw Error('Invalid or duplicate test case');
   caseIds.add(c.id);
  }
 }
 return w as Workspace;
}
export function stringifyWorkspace(workspace:Workspace):string {return JSON.stringify(validateWorkspace(workspace),null,2)+'\n';}
