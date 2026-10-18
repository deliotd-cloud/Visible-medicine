// Immutable completed thoracoabdominal website epoch. Test-only Git reads.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {dirname,relative} from 'node:path';

export const thoracoabdominalWebsiteEpoch='70da224dc1648d346722f815a7e9c0b0c8049f97';
export function thoracoabdominalEpochBytes(path:string):Buffer{
 assert(!path.includes('..')&&!path.startsWith('/')&&!path.includes('\\'));
 return execFileSync('git',['show',thoracoabdominalWebsiteEpoch+':'+path],{maxBuffer:32e6});
}
export function thoracoabdominalEpochPlugin(){
 const frozen=new Set(['atlas-review/app/body-content.ts','atlas-review/content/body-renderer-revision.json','atlas-review/content/body-review-display-pins.json']);
 return{name:'immutable-completed-thoracoabdominal-epoch',setup(api:import('esbuild').PluginBuild){
  api.onLoad({filter:/\.(?:ts|json)$/},args=>{
   const path=relative(process.cwd(),args.path).replaceAll('\\','/');if(!frozen.has(path))return;
   return{contents:thoracoabdominalEpochBytes(path).toString(),loader:path.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)};
  });
 }};
}
