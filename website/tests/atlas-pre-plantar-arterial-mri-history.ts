// Immutable completed shoulder-imaging milestone; current plantar MRI is checked separately.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {dirname,relative} from 'node:path';
import {build as liveBuild} from 'esbuild';
import type {BuildOptions,BuildResult,PluginBuild} from 'esbuild';
import {emittedTeaching as liveEmittedTeaching} from './atlas-emitted-teaching.ts';
import {openGitSnapshot} from './git-snapshot-reader.mjs';
import {createGitObjectReader} from './git-object-reader.mjs';

export const prePlantarArterialMriEpoch='209238512f8950f9c182caac5a2696107fd3427a';
let epoch:{read(path:string):Promise<Buffer>;close():Promise<void>}|undefined;
export async function openEpoch(){
 assert(!epoch,'Historical snapshot already open');
 epoch=await openGitSnapshot({cwd:process.cwd(),commit:prePlantarArterialMriEpoch,createBlobReader:createGitObjectReader,maxBlobBytes:32_000_000});
}
export async function closeEpoch(){const open=epoch;epoch=undefined;if(open)await open.close();}
export async function epochBytes(path:string):Promise<Buffer>{
 assert(epoch,'Historical snapshot is not open');
 return epoch.read(path);
}
export async function readFile(path:string,encoding:'utf8'):Promise<string>;
export async function readFile(path:string):Promise<Buffer>;
export async function readFile(path:string,encoding?:'utf8'):Promise<Buffer|string>{const bytes=await epochBytes(path);return encoding?bytes.toString():bytes;}
export function build<T extends BuildOptions>(options:T):Promise<BuildResult<T>>{
 const replayOptions:BuildOptions={...options,plugins:[...(options.plugins??[]),{name:'completed-shoulder-imaging-epoch',setup(api:PluginBuild){api.onLoad({filter:/\.(?:ts|tsx|json)$/},async args=>{
  const path=relative(process.cwd(),args.path).replaceAll('\\','/');if(!path.startsWith('atlas-review/'))return;
  return{contents:(await epochBytes(path)).toString(),loader:path.endsWith('.json')?'json':path.endsWith('.tsx')?'tsx':'ts',resolveDir:dirname(args.path)};
 });}}]};
 return liveBuild(replayOptions) as Promise<BuildResult<T>>;
}
export async function emittedTeaching(base:string,files:{path:string;sha256:string}[],allReachable=false){
 const bytes=new Map<string,Buffer>();
 const visit=async(path:string):Promise<void>=>{
  if(bytes.has(path))return;
  const file=files.find(file=>file.path===path);assert(file,`${path} in manifest`);
  const value=await epochBytes(base+path);bytes.set(path,value);
  assert.equal(createHash('sha256').update(value).digest('hex'),file.sha256,path);
  for(const match of value.toString().matchAll(/(?:assets\/|\.\/)([A-Za-z0-9_-]+\.js)/g))await visit('assets/'+match[1]);
 };
 await visit('index.html');
 const teaching=files.filter(file=>/^assets\/body-content-[^/]+\.js$/.test(file.path));
 assert.equal(teaching.length,1,'One emitted deferred teaching module');
 assert(bytes.has(teaching[0].path),'Teaching is reachable through emitted entry imports');
 return liveEmittedTeaching(base,files,allReachable,path=>{
  const value=bytes.get(path.slice(base.length));assert(value,`${path} was read from the authenticated snapshot`);return value;
 });
}
