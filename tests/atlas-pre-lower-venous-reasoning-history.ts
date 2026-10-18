// Immutable completed lower-venous-tour milestone; live reasoning is checked separately.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {dirname,relative} from 'node:path';
import {build as liveBuild} from 'esbuild';
import type {BuildOptions,BuildResult,PluginBuild} from 'esbuild';
import {emittedTeaching as liveEmittedTeaching} from './atlas-emitted-teaching.ts';
export const lowerVenousTourEpoch='7ad008589684b622efc6a31f5254d05676991683';
const cache=new Map<string,Buffer>();
export function epochBytes(path:string):Buffer{
 assert(!path.includes('..')&&!path.startsWith('/')&&!path.includes('\\'));
 if(!cache.has(path))cache.set(path,execFileSync('git',['show',lowerVenousTourEpoch+':'+path],{maxBuffer:32e6,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}));
 return cache.get(path)!;
}
export function readFileSync(path:string,encoding:'utf8'):string;
export function readFileSync(path:string):Buffer;
export function readFileSync(path:string,encoding?:'utf8'):Buffer|string{const bytes=epochBytes(path);return encoding?bytes.toString():bytes;}
export function build<T extends BuildOptions>(options:T):Promise<BuildResult<T>>{
 const replayOptions:BuildOptions={...options,plugins:[...(options.plugins??[]),{name:'completed-lower-venous-tour-epoch',setup(api:PluginBuild){api.onLoad({filter:/\.(?:ts|tsx|json)$/},args=>{
  const path=relative(process.cwd(),args.path).replaceAll('\\','/');if(!path.startsWith('atlas-review/'))return;
  return{contents:epochBytes(path).toString(),loader:path.endsWith('.json')?'json':path.endsWith('.tsx')?'tsx':'ts',resolveDir:dirname(args.path)};
 });}}]};
 return liveBuild(replayOptions) as Promise<BuildResult<T>>;
}
export function emittedTeaching(base:string,files:{path:string;sha256:string}[],allReachable=false){return liveEmittedTeaching(base,files,allReachable,epochBytes);}
