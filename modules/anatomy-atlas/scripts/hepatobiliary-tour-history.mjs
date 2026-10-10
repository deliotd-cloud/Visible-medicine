// Historical tour validators retain the exact pre-hepatobiliary teaching epoch.
// Current delivery, all prior definitions and the four Review changes are tested
// independently by test-hepatobiliary-tour.mjs and the current player/library tests.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {dirname,relative} from 'node:path';
import {build as workspaceBuild} from './workspace-test-build.mjs';
export const preHepatobiliaryTourCommit='aa290176f8bfdb02157f7197e4647508c9c41d87';
const frozen=new Set(['lib/regional-tours.ts','content/body-renderer-revision.json','content/body-review-display-pins.json']);
const bytes=new Map();
function historical(path){
 if(!bytes.has(path)){
  const opts={cwd:process.cwd(),encoding:'utf8',maxBuffer:4e6,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}};
  assert.equal(execFileSync('git',['rev-parse',preHepatobiliaryTourCommit+'^{commit}'],opts).trim(),preHepatobiliaryTourCommit);
  bytes.set(path,execFileSync('git',['show',preHepatobiliaryTourCommit+':'+path],opts));
 }
 return bytes.get(path);
}
export function build(options){
 return workspaceBuild({...options,plugins:[...(options.plugins??[]),{name:'recorded-pre-hepatobiliary-tour-epoch',setup(api){
  // Explicit earlier-baseline plugins keep precedence over this epoch.
  api.onLoad({filter:/.*/,namespace:'workspace-test'},args=>{
   const path=relative(process.cwd(),args.path).replaceAll('\\','/');
   if(!frozen.has(path))return;
   return{contents:historical(path),loader:path.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)};
  });
 }}]});
}
