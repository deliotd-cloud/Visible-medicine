// Offline replay of the original eye-only library contract. Never used by the
// learner or Review. Source resolution is from one immutable Git tree, without
// a working-tree fallback; the original test's explicit child doubles remain.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {dirname,extname,isAbsolute,relative,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build as bundle} from 'esbuild';
import {createGitObjectReader} from './git-object-reader.mjs';

// Last commit that authored the original assertions, including its 25 regional
// tours. The immediate pre-ventricular commit is later and already has 32.
export const historicalEpoch='acd99b11e279a0525f1488456c0a8adf2abb2cf7';
export const historicalTree='95eba3f5d3036e8d303664c32643410c49101f60';
const root=fileURLToPath(new URL('../',import.meta.url));
const git=(...args)=>execFileSync('git',['--no-replace-objects',...args],{cwd:root,windowsHide:true,maxBuffer:64e6});
assert.equal(git('rev-parse',historicalEpoch+'^{tree}').toString().trim(),historicalTree,'Exact historical tree required');
const entries=new Map(git('ls-tree','-r','-z',historicalEpoch).toString('utf8').split('\0').filter(Boolean).map(row=>{
 const match=/^(\d{6}) (blob|commit) ([a-f0-9]{40})\t(.+)$/.exec(row);assert(match,'Invalid historical Git tree entry');
 return [match[4],{mode:match[1],type:match[2],oid:match[3]}];
}));
const reads=new Map(),cache=new Map();
function confined(path){
 const value=relative(root,path).replaceAll('\\','/');
 assert(!isAbsolute(value)&&value!==''&&!value.split('/').some(s=>s===''||s==='.'||s==='..'),'Historical module outside checkout');
 return value;
}
function entry(path){
 assert(typeof path==='string'&&!path.includes('\\')&&!path.startsWith('/')&&!path.split('/').some(s=>s===''||s==='.'||s==='..'),'Unsafe historical module path');
 const value=entries.get(path);assert(value&&value.type==='blob'&&['100644','100755'].includes(value.mode),'Missing or unsupported exact historical module: '+path);return value;
}
function remember(path,raw){
 const value=entry(path);assert.equal(createHash('sha1').update(`blob ${raw.length}\0`).update(raw).digest('hex'),value.oid,'Exact historical bytes required');
 reads.set(path,{path,oid:value.oid,bytes:raw.length,sha256:createHash('sha256').update(raw).digest('hex')});
 return raw;
}
export function historicalReadEvidence(){return [...reads.values()].map(row=>({...row})).sort((a,b)=>a.path.localeCompare(b.path));}
export function readFileSync(path,encoding){
 assert(['app/whole-body-guided-learning.css','app/whole-body-guided-learning.tsx'].includes(path),'Unlisted historical direct read');
 const value=entry(path),raw=remember(path,git('cat-file','blob',value.oid));
 return encoding?raw.toString(encoding):Buffer.from(raw);
}
export async function build(options){
 assert(options.platform==='node'&&options.format==='cjs'&&options.bundle===true&&options.write===false,'Historical component test requires in-memory Node CJS');
 const reader=createGitObjectReader({cwd:root});
 const plugin={name:'exact-eye-library-git-tree',setup(api){
  api.onResolve({filter:/.*/},args=>{
   const local=args.kind==='entry-point'||args.path.startsWith('@/')||args.path.startsWith('.')||isAbsolute(args.path);
   if(!local)return {path:args.path,external:true}; // Original installed-package test boundary.
   const target=args.path.startsWith('@/')?resolve(root,args.path.slice(2)):resolve(args.resolveDir||root,args.path);
   for(const suffix of ['', '.ts','.tsx','.js','.mjs','.json','/index.ts','/index.tsx']){
    const path=confined(target+suffix);if(!entries.has(path))continue;entry(path);return {path:resolve(root,path),namespace:'nested-library-history'};
   }
   throw Error('Missing exact historical import: '+args.path);
  });
  api.onLoad({filter:/.*/,namespace:'nested-library-history'},async args=>{
   const path=confined(args.path),value=entry(path);
   if(!cache.has(path))cache.set(path,await reader.readBlob(value.oid));
   const raw=remember(path,cache.get(path));return {contents:raw,loader:({'.ts':'ts','.tsx':'tsx','.json':'json','.css':'empty'})[extname(path)]||'js',resolveDir:dirname(args.path)};
  });
 }};
 try{return await bundle({...options,absWorkingDir:root,tsconfigRaw:{compilerOptions:{jsx:'react-jsx'}},plugins:[...(options.plugins??[]),plugin]});}
 finally{await reader.close();}
}
