// Immutable completed imaging milestone. Live tours independently compare the
// entire actual current catalogue, topics, reasoning and prior tour definitions.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {relative,dirname} from 'node:path';
import {readFile as actualReadFile} from 'node:fs/promises';
import {build as componentBuild} from './workspace-component-test-build.mjs';
import {build as helperBuild} from './workspace-test-build.mjs';
export {writeFile} from 'node:fs/promises';
export const teachingEpoch='1517521a5ee3eed985fff01bcd8608965b693fae';
const cache=new Map();
function bytes(path){assert(!path.startsWith('/')&&!path.includes('..')&&!path.includes('\\'));if(!cache.has(path))cache.set(path,execFileSync('git',['show',teachingEpoch+':'+path],{maxBuffer:32e6,windowsHide:true}));return cache.get(path);}
export async function readFile(path,encoding){if(path.startsWith('scripts/'))return actualReadFile(path,encoding);const value=bytes(path);return encoding?value.toString():value;}
export function build(options){
 const replay={name:'completed-hand-venous-imaging-epoch',setup(api){api.onLoad({filter:/\.(?:ts|tsx|json)$/},args=>{
  const path=relative(process.cwd(),args.path).replaceAll('\\','/');
  if(!/^(?:app|lib|content|public\/models)\//.test(path))return;
  return{contents:bytes(path).toString(),loader:path.endsWith('.json')?'json':path.endsWith('.tsx')?'tsx':'ts',resolveDir:dirname(args.path)};
 });}};
 return(options.format==='esm'?helperBuild:componentBuild)({...options,plugins:[...(options.plugins??[]),replay]});
}
