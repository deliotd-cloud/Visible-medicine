// Test-only exact saved deep-hip import. The live knee-guide regression proves
// current retention separately; this helper never supplies learner content.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync as currentRead} from 'node:fs';
import {relative,dirname} from 'node:path';
import type {Plugin} from 'esbuild';

export const deepHipDepthWebsiteEpoch='d48b32c8341cec0618678c6e81945cadd7cf4840';
const options={cwd:process.cwd(),windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}};
const cache=new Map<string,Buffer>();
const readEpoch=(path:string):Buffer=>{
 if(!cache.has(path))cache.set(path,execFileSync('git',['show',deepHipDepthWebsiteEpoch+':'+path],options));
 return cache.get(path)!;
};
export function deepHipDepthEpochRead(path:any,encoding?:any):any {
 const name=String(path).replaceAll('\\','/');
 const frozen=name.startsWith('atlas-review/')||name.startsWith('public/atlas-runtime/')||name.startsWith('public/atlas-review-viewer/')||['lib/atlas-model-inventory.json','lib/plexus-review-manifest.json','package-lock.json'].includes(name);
 if(!frozen)return currentRead(path,encoding);
 const bytes=readEpoch(name);return encoding==='utf8'?bytes.toString():bytes;
}
export function deepHipDepthEpochPlugin():Plugin {
 return {name:'saved-deep-hip-depth-website-epoch',setup(api){
  api.onLoad({filter:/(?:^|[\\/])atlas-review[\\/]/},args=>{
   const path=relative(process.cwd(),args.path).replaceAll('\\','/');assert(path.startsWith('atlas-review/')&&!path.split('/').includes('..'));
   return {contents:readEpoch(path).toString(),loader:path.endsWith('.json')?'json':path.endsWith('.tsx')?'tsx':path.endsWith('.ts')?'ts':'js',resolveDir:dirname(args.path)};
  });
 }};
}
