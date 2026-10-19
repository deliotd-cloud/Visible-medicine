// Immutable completed website import epoch for the earlier abdominal MRI test.
// Test-only Git reads; never used by a learner or to transfer review decisions.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {dirname,relative} from 'node:path';

export const abdominalVascularMriWebsiteEpoch='e9542886d8db5ab02d9575f49990569e7ba7dc2f';
export function abdominalVascularMriEpochBytes(path:string):Buffer{
 assert(!path.includes('..')&&!path.startsWith('/')&&!path.includes('\\'));
 return execFileSync('git',['show',abdominalVascularMriWebsiteEpoch+':'+path],{maxBuffer:32e6});
}
export function abdominalVascularMriEpochPlugin(){
 const frozen=new Set(['atlas-review/app/body-content.ts','atlas-review/content/body-renderer-revision.json','atlas-review/content/body-review-display-pins.json']);
 return{name:'immutable-completed-abdominal-mri-epoch',setup(api:import('esbuild').PluginBuild){
  api.onLoad({filter:/\.(?:ts|json)$/},args=>{
   const path=relative(process.cwd(),args.path).replaceAll('\\','/');
   if(!frozen.has(path))return;
   return{contents:abdominalVascularMriEpochBytes(path).toString(),loader:path.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)};
  });
 }};
}
