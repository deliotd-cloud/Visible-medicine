import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {dirname,relative} from 'node:path';
import type {Plugin} from 'esbuild';
const baseline='a8349b2fefbe8be1403c78822487ba7eb95d7d8c';
const registryPaths=['content/nested-teaching.ts','lib/nested-teaching.ts'];
/** Immutable test-only epoch; never a production fallback or decision migration. */
export function preMCAImportBytes(path:string):Buffer{
 assert(['manifest.json',...registryPaths].map(p=>'atlas-review/'+p).includes(path));
 return execFileSync('git',['show',baseline+':'+path],{maxBuffer:32e6});
}
/** Historical quiz proofs retain pre-MCA nested teaching. The dedicated live
 * MCA test independently checks all 108 current source/teaching/review packets. */
export function preMCANestedPlugin():Plugin{
 return {name:'immutable-pre-mca-nested-registry',setup(api){
  api.onLoad({filter:/[\\/](?:content|lib)[\\/]nested-teaching\.ts$/},args=>{
   const path=relative(process.cwd(),args.path).replaceAll('\\','/');
   if(!registryPaths.map(p=>'atlas-review/'+p).includes(path))return;
   return {contents:preMCAImportBytes(path).toString(),loader:'ts',resolveDir:dirname(args.path)};
  });
 }};
}
