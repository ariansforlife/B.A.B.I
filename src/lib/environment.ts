import {isEnvironmentValue,type EnvironmentValue} from './model';

export function resolveEnvironment(
 layers:ReadonlyArray<Record<string,EnvironmentValue>>,
 secrets:Record<string,string>={},
 files:Record<string,string>={}
):Record<string,unknown>{
 const merged=Object.assign({},...layers) as Record<string,EnvironmentValue>;
 const resolved:Record<string,unknown>={};
 const visiting=new Set<string>();
 function read(key:string):unknown{
  if(Object.prototype.hasOwnProperty.call(resolved,key))return resolved[key];
  if(visiting.has(key))throw Error('Cyclic environment reference: '+key);
  const entry=merged[key];
  if(!entry)throw Error('Unknown environment variable: '+key);
  if(!isEnvironmentValue(entry))throw Error('Invalid environment variable: '+key);
  visiting.add(key);
  let value:unknown;
  switch(entry.type){
   case 'string':case 'number':case 'boolean':case 'json':case 'array':case 'enum':value=entry.value;break;
   case 'secret':if(!(entry.secretId in secrets))throw Error('Secret not available: '+key);value=secrets[entry.secretId];break;
   case 'file':if(!(entry.fileId in files))throw Error('File not available: '+key);value=files[entry.fileId];break;
   case 'reference':{
    const match=/^\\{\\{([A-Za-z0-9_.-]+)\\}\\}$/.exec(entry.expression.trim());
    if(!match)throw Error('Invalid reference expression: '+key);
    value=read(match[1]);break;
   }
  }
  visiting.delete(key);
  resolved[key]=value;
  return value;
 }
 for(const key of Object.keys(merged))read(key);
 return resolved;
}
