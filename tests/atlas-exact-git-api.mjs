// Test-only replay: every Atlas application module is read from one Git epoch.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {resolve,relative,dirname,extname,isAbsolute} from 'node:path';
import {build} from 'esbuild';
import {createGitObjectReader} from './git-object-reader.mjs';
export async function atlasExactGitApi(commit,entry){
 const root=process.cwd(),options={cwd:root,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}};
 assert.match(commit,/^[a-f0-9]{40}$/);
 assert.equal(execFileSync('git',['rev-parse',commit+'^{commit}'],options).toString().trim(),commit);
 const paths=new Map(),cache=new Map();
 for(const row of execFileSync('git',['ls-tree','-r','-z','--full-tree',commit],options).toString().split('\0')){
  const match=/^(100644|100755) blob ([a-f0-9]{40})\t([\s\S]+)$/.exec(row);
  if(match&&match[3].startsWith('atlas-review/'))paths.set(match[3],match[2]);
 }
 const reader=createGitObjectReader({cwd:root,maxBytes:32e6});
 let result;
 try { result=await build({stdin:{contents:entry,resolveDir:root,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node',plugins:[{name:'exact-atlas-git',setup(api){
  api.onResolve({filter:/.*/},args=>{
   if(args.namespace!=='exact-atlas-git'&&args.kind!=='import-statement')return;
   let target;
   if(args.path.startsWith('@/atlas-review/'))target=resolve(root,args.path.slice(2));
   else if(args.path.startsWith('.'))target=resolve(args.resolveDir||root,args.path);
   else {assert(!isAbsolute(args.path),'Absolute historical imports forbidden');return;}
   const path=relative(root,target).replaceAll('\\','/');
   assert(path.startsWith('atlas-review/'),'Historical import outside Atlas');
   for(const suffix of ['','.ts','.tsx','.json','.js','.mjs','/index.ts','/index.tsx'])if(paths.has(path+suffix))return{path:resolve(root,path+suffix),namespace:'exact-atlas-git'};
   throw Error('Missing historical Atlas module: '+path);
  });
  api.onLoad({filter:/.*/,namespace:'exact-atlas-git'},async args=>{
   const path=relative(root,args.path).replaceAll('\\','/'),object=paths.get(path);assert(object);
   if(!cache.has(object))cache.set(object,reader.readBlob(object));
   const bytes=await cache.get(object);
   return{contents:bytes.toString('utf8'),loader:({'.ts':'ts','.tsx':'tsx','.json':'json'})[extname(path)]||'js',resolveDir:dirname(args.path)};
  });
 }}]}); } finally { await reader.close(); }
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
