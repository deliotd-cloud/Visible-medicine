// Immutable test-only replay of the completed hepatobiliary website milestone.
// Live hand-arterial CT delivery has its own independent acceptance test.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {dirname,relative} from 'node:path';
import {build as liveBuild} from 'esbuild';
import type {BuildOptions,BuildResult,PluginBuild} from 'esbuild';
import {emittedTeaching as liveEmittedTeaching} from './atlas-emitted-teaching.ts';

export const preHandCtWebsiteEpoch='5c1e040f4456b35a53950fdcd6b248d92551441a';
const cache=new Map<string,Buffer>();
export function epochBytes(path:string):Buffer{
 assert(!path.includes('..')&&!path.startsWith('/')&&!path.includes('\\'));
 if(!cache.has(path))cache.set(path,execFileSync('git',['show',preHandCtWebsiteEpoch+':'+path],
  {maxBuffer:32e6,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}));
 return cache.get(path)!;
}
export function readFileSync(path:string,encoding:'utf8'):string;
export function readFileSync(path:string):Buffer;
export function readFileSync(path:string,encoding?:'utf8'):Buffer|string{
 const bytes=epochBytes(path);return encoding?bytes.toString():bytes;
}
export function build<T extends BuildOptions>(options:T,prior?:(path:string)=>Buffer|undefined):Promise<BuildResult<T>>{
 const replayOptions:BuildOptions={...options,plugins:[...(options.plugins??[]),{name:'immutable-completed-hepatobiliary-import',setup(api:PluginBuild){
  api.onLoad({filter:/\.(?:ts|tsx|json)$/},args=>{
   const path=relative(process.cwd(),args.path).replaceAll('\\','/');
   if(!path.startsWith('atlas-review/'))return;
   return{contents:(prior?.(path)??epochBytes(path)).toString(),
    loader:path.endsWith('.json')?'json':path.endsWith('.tsx')?'tsx':'ts',resolveDir:dirname(args.path)};
  });
 }}]};
 return liveBuild(replayOptions) as Promise<BuildResult<T>>;
}
export function emittedTeaching(base:string,files:{path:string;sha256:string}[],allReachable=false,
 readArtifact:(path:string)=>Buffer=epochBytes){
 return liveEmittedTeaching(base,files,allReachable,readArtifact);
}
