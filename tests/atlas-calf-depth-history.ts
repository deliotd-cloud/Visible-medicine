// Test-only exact saved calf import. New thigh/current delivery coverage is
// independent; do not rewrite the calf fixture or its24/332 assertions.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync as currentRead} from 'node:fs';
import {relative,dirname} from 'node:path';
import type {Plugin} from 'esbuild';

export const calfDepthWebsiteEpoch='8e6499fd7ab73d57d9d255ff876b7f1fdeb845f8';
const options={cwd:process.cwd(),windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}};
const readEpoch=(path:string):Buffer=>execFileSync('git',['show',calfDepthWebsiteEpoch+':'+path],options);
export function calfDepthEpochRead(path:any,encoding?:any):any {
 const name=String(path).replaceAll('\\','/');
 const frozen=name.startsWith('atlas-review/')||name.startsWith('public/atlas-runtime/')||name.startsWith('public/atlas-review-viewer/')||['lib/atlas-model-inventory.json','lib/plexus-review-manifest.json','package-lock.json'].includes(name);
 if(!frozen)return currentRead(path,encoding);
 const bytes=readEpoch(name);return encoding==='utf8'?bytes.toString():bytes;
}
export function calfDepthEpochPlugin():Plugin {
 return {name:'saved-calf-depth-website-epoch',setup(api){
  api.onLoad({filter:/(?:^|[\\/])atlas-review[\\/]/},args=>{
   const path=relative(process.cwd(),args.path).replaceAll('\\','/');assert(path.startsWith('atlas-review/')&&!path.split('/').includes('..'));
   return {contents:readEpoch(path).toString(),loader:path.endsWith('.json')?'json':path.endsWith('.tsx')?'tsx':path.endsWith('.ts')?'ts':'js',resolveDir:dirname(args.path)};
  });
 }};
}
