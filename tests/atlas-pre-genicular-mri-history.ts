// Immutable completed hand-venous tour milestone; current genicular notes are checked separately.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {dirname,relative} from 'node:path';
import {build as liveBuild} from 'esbuild';
import type {BuildOptions,BuildResult,PluginBuild} from 'esbuild';
import {emittedTeaching as liveEmittedTeaching} from './atlas-emitted-teaching.ts';
export const preGenicularMriEpoch='72a7e809eb4394f268394d40e455c2239ae1ea0f';
const cache=new Map<string,Buffer>();
export function epochBytes(path:string):Buffer{
 assert(!path.includes('..')&&!path.startsWith('/')&&!path.includes('\\'));
 if(!cache.has(path))cache.set(path,execFileSync('git',['show',preGenicularMriEpoch+':'+path],{maxBuffer:32e6,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}));
 return cache.get(path)!;
}
export {writeFile} from 'node:fs/promises';
export {writeFileSync} from 'node:fs';
export async function readFile(path:string,encoding:'utf8'):Promise<string>;
export async function readFile(path:string):Promise<Buffer>;
export async function readFile(path:string,encoding?:'utf8'):Promise<Buffer|string>{const bytes=epochBytes(path);return encoding?bytes.toString():bytes;}
export function readFileSync(path:string,encoding:'utf8'):string;
export function readFileSync(path:string):Buffer;
export function readFileSync(path:string,encoding?:'utf8'):Buffer|string{const bytes=epochBytes(path);return encoding?bytes.toString():bytes;}
export function build<T extends BuildOptions>(options:T):Promise<BuildResult<T>>{
 const replayOptions:BuildOptions={...options,plugins:[...(options.plugins??[]),{name:'completed-hand-venous-tour-epoch',setup(api:PluginBuild){api.onLoad({filter:/\.(?:ts|tsx|json)$/},args=>{
  const path=relative(process.cwd(),args.path).replaceAll('\\','/');if(!path.startsWith('atlas-review/'))return;
  return{contents:epochBytes(path).toString(),loader:path.endsWith('.json')?'json':path.endsWith('.tsx')?'tsx':'ts',resolveDir:dirname(args.path)};
 });}}]};
 return liveBuild(replayOptions) as Promise<BuildResult<T>>;
}
export function emittedTeaching(base:string,files:{path:string;sha256:string}[],allReachable=false){return liveEmittedTeaching(base,files,allReachable,epochBytes);}
