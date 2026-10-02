// Immutable completed shoulder-girdle website epoch. Test-only Git reads;
// never a learner dependency or an approval migration.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {dirname,relative} from 'node:path';
export const shoulderGirdleWebsiteEpoch='d71bacf180d971cfc98a763414deedd3d8a6b0f0';
export function shoulderGirdleEpochBytes(path:string):Buffer{
 assert(!path.includes('..')&&!path.startsWith('/')&&!path.includes('\\'));
 return execFileSync('git',['show',shoulderGirdleWebsiteEpoch+':'+path],{maxBuffer:32e6});
}
export function shoulderGirdleEpochPlugin(){
 const frozen=new Set(['atlas-review/app/body-content.ts','atlas-review/content/body-renderer-revision.json','atlas-review/content/body-review-display-pins.json']);
 return{name:'immutable-completed-shoulder-girdle-epoch',setup(api:import('esbuild').PluginBuild){
  api.onLoad({filter:/\.(?:ts|json)$/},args=>{
   const path=relative(process.cwd(),args.path).replaceAll('\\','/');if(!frozen.has(path))return;
   return{contents:shoulderGirdleEpochBytes(path).toString(),loader:path.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)};
  });
 }};
}
