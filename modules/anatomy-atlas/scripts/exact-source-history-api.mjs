// Test-only Git replay. Every application import comes from the named commit.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {relative,dirname,extname,resolve,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from './workspace-test-build.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
export async function exactSourceHistoryApi(commit, profile='display'){
 const exportsByProfile={
  display:"export {bodyLesson} from './app/body-content';export {structures} from './app/anatomy-data';export {dissectionProfiles} from './app/dissection-data';export {bodyDisplayCatalog} from './lib/body-display-catalog';export {contentTabs} from './lib/content-types';",
  curriculum:"export {bodyContent,bodyLesson} from './app/body-content';export {structures} from './app/anatomy-data';export {dissectionProfiles} from './app/dissection-data';export {contentTabs} from './lib/content-types';",
  copy:"export {bodyContent} from './app/body-content';export {structures} from './app/anatomy-data';export {dissectionProfiles} from './app/dissection-data';",
 };
 assert(Object.hasOwn(exportsByProfile,profile),'Unknown exact-history export profile');
 assert(/^[a-f0-9]{40}$/.test(commit));
 assert.equal(execFileSync('git',['rev-parse',commit+'^{commit}'],{cwd:root,encoding:'utf8'}).trim(),commit);
 const sourcePaths=new Set(execFileSync('git',['ls-tree','-r','--name-only',commit],{cwd:root,encoding:'utf8',maxBuffer:16e6}).trim().split(/\r?\n/));
 const compiled=await build({stdin:{contents:exportsByProfile[profile],resolveDir:root,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'exact-application-git-replay',setup(b){
 b.onResolve({filter:/.*/},args=>{
  // Keep explicitly allowed installed dependencies with the hermetic builder;
  // resolve application paths against Git, including old-only/renamed files.
  if(relative(root,args.resolveDir||root).replaceAll('\\','/').startsWith('node_modules/'))return;
  let target;
  if(args.path.startsWith('@/'))target=resolve(root,args.path.slice(2));
  else if(args.path.startsWith('.')||isAbsolute(args.path))target=resolve(args.resolveDir||root,args.path);
  else return;
  const path=relative(root,target).replaceAll('\\','/');
  assert(path!=='..'&&!path.startsWith('../')&&!isAbsolute(path),'Historical import outside checkout');
  for(const suffix of ['','.ts','.tsx','.mjs','.js','.json','/index.ts','/index.tsx'])
   if(sourcePaths.has(path+suffix))return {path:resolve(root,path+suffix),namespace:'workspace-test'};
  throw Error('Missing historical application module: '+path);
 });
 b.onLoad({filter:/.*/,namespace:'workspace-test'},args=>{
  const path=relative(root,args.path).replaceAll('\\','/');if(path.startsWith('node_modules/'))return;
  assert(!path.startsWith('../'));return {contents:execFileSync('git',['show',commit+':'+path],{cwd:root,encoding:'utf8',maxBuffer:16e6}),loader:({'.ts':'ts','.tsx':'tsx','.json':'json'})[extname(path)]||'js',resolveDir:dirname(args.path)};
 });}}]});
 return import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
}
