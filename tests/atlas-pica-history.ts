import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {dirname,relative} from 'node:path';
import type {Plugin} from 'esbuild';
const epoch='2df4395d6df36a53da361e1ab3b6c07ddbb67e2a';
const paths=['content/nested-teaching.ts','lib/nested-teaching.ts','lib/nested-review-material.ts'];
/** Historical teaching-only proof. Live PICA admission is tested separately. */
export function prePICANestedPlugin():Plugin{
 return{name:'immutable-pre-pica-teaching',setup(api){
  api.onLoad({filter:/\.ts$/},args=>{
   const p=relative(process.cwd(),args.path).replaceAll('\\','/');if(!paths.map(p=>'atlas-review/'+p).includes(p))return;
   return{contents:execFileSync('git',['show',epoch+':'+p],{encoding:'utf8',maxBuffer:32e6}),loader:'ts',resolveDir:dirname(args.path)};
  });
 }};
}
export function mcaImportMilestone(){return JSON.parse(execFileSync('git',['show',epoch+':atlas-review/manifest.json'],{encoding:'utf8',maxBuffer:32e6}));}
export function prePICAImportBytes(p:string):Buffer{
 assert(['manifest.json',...paths].map(p=>'atlas-review/'+p).includes(p));
 return execFileSync('git',['show',epoch+':'+p],{maxBuffer:32e6});
}
