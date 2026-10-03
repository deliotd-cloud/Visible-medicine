// Immutable test-only replay of the completed tarsal website milestone.
// Live hepatobiliary delivery has its own independent acceptance test.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {dirname,relative} from 'node:path';
import {build as liveBuild} from 'esbuild';
import type {BuildOptions,BuildResult,PluginBuild} from 'esbuild';
import {emittedTeaching as liveEmittedTeaching} from './atlas-emitted-teaching.ts';
export const preHepatobiliaryWebsiteEpoch='bee7d759305803ade07ecd26fc877099b7008ff1';
const cache=new Map<string,Buffer>();
export function epochBytes(path:string):Buffer{
 assert(!path.includes('..')&&!path.startsWith('/')&&!path.includes('\\'));
 if(!cache.has(path))cache.set(path,execFileSync('git',['show',preHepatobiliaryWebsiteEpoch+':'+path],{maxBuffer:32e6,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}));
 return cache.get(path)!;
}
export function readFileSync(path:string,encoding:'utf8'):string;
export function readFileSync(path:string):Buffer;
export function readFileSync(path:string,encoding?:'utf8'):Buffer|string{
 const bytes=epochBytes(path);return encoding?bytes.toString():bytes;
}
export function build<T extends BuildOptions>(options:T):Promise<BuildResult<T>>{
 const replayOptions:BuildOptions={...options,plugins:[...(options.plugins??[]),{name:'immutable-completed-pre-hepatobiliary-import',setup(api:PluginBuild){
  api.onLoad({filter:/\.(?:ts|tsx|json)$/},args=>{
   const path=relative(process.cwd(),args.path).replaceAll('\\','/');if(!path.startsWith('atlas-review/'))return;
   return{contents:epochBytes(path).toString(),loader:path.endsWith('.json')?'json':path.endsWith('.tsx')?'tsx':'ts',resolveDir:dirname(args.path)};
  });
 }}]};
 // Only plugins change: preserve esbuild's write:false result inference.
 return liveBuild(replayOptions) as Promise<BuildResult<T>>;
}
export function emittedTeaching(base:string,files:{path:string;sha256:string}[],allReachable=false,readArtifact:(path:string)=>Buffer=epochBytes){
 return liveEmittedTeaching(base,files,allReachable,readArtifact);
}
let noticeModule:Promise<{withoutCircleWillisNotice:(text:string)=>string}>|undefined;
/** Compile the original notice-helper closure with saved-epoch metadata reads.
 * The live helper is unchanged; this must never be used as learner delivery.
 */
export function circleWillisNoticeAtSavedEpoch(){
 noticeModule??=(async()=>{
  const result=await liveBuild({stdin:{contents:"export {withoutCircleWillisNotice} from './tests/atlas-circle-willis-history';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node',packages:'external',plugins:[{name:'saved-notice-helper-closure',setup(api){
   api.onResolve({filter:/^node:fs$/},args=>args.importer.includes('/tests/')||args.importer.includes('\\tests\\')?{path:'saved-epoch-fs',namespace:'notice-epoch-fs'}:undefined);
   api.onLoad({filter:/.*/,namespace:'notice-epoch-fs'},()=>({loader:'js',contents:`import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';const cache=new Map();export function readFileSync(path,encoding){assert(!path.includes('..')&&!path.startsWith('/')&&!path.includes('\\\\'));if(!cache.has(path))cache.set(path,execFileSync('git',['show','${preHepatobiliaryWebsiteEpoch}:'+path],{maxBuffer:32e6,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}));const value=cache.get(path);return encoding?value.toString(encoding):value;}`}));
   api.onLoad({filter:/[\\/]tests[\\/].*\.ts$/},args=>{
    const path=relative(process.cwd(),args.path).replaceAll('\\','/');
    return{contents:epochBytes(path).toString(),loader:'ts',resolveDir:dirname(args.path)};
   });
  }}]});
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
 })();return noticeModule;
}
