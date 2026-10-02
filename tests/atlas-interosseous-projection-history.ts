// Immutable offline teaching epoch, never a learner fallback or approval transfer.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {dirname,relative} from 'node:path';
export function preProjectionImportBytes(path:string){
 assert(path.startsWith('atlas-review/')&&!path.includes('..'));
 return execFileSync('git',['show','0b85c1ab71c8557f0869b272d20a75db5864e5f4:'+path],{maxBuffer:32e6});
}
export function preProjectionTeachingPlugin(){
 return{name:'exact-pre-membrane-teaching-epoch',setup(api:any){
  api.onLoad({filter:/\.(?:ts|json)$/},(args:any)=>{
   const path=relative(process.cwd(),args.path).replaceAll('\\','/');
   if(!['atlas-review/app/body-content.ts','atlas-review/content/body-review-display-pins.json'].includes(path))return;
   return{contents:preProjectionImportBytes(path).toString(),loader:path.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)};
  });
 }};
}
