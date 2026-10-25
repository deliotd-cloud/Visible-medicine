// Explicit historical test source role. No application or current-source fallback.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire,registerHooks,stripTypeScriptTypes,syncBuiltinESMExports} from 'node:module';
import {pathToFileURL} from 'node:url';

const MANIFEST='abb8aefee9e270a23f3737fe0350c687fc4eca1185dc9539543a62fd176c4a2f';
const RECEIPT='dc0532736094fcd7225e1229af3a41322aacc591789bf1179c44476b98b7077e';
const ENTRY='tests/head-atlas-teaching.test.ts';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function safe(path){
 assert(typeof path==='string'&&/^[A-Za-z0-9_./-]+$/.test(path),'Finite source path');
 assert(path.split('/').every(part=>part&&part!=='.'&&part!=='..'),'No path traversal');
 return path;
}
function inventory(base,prefix=''){
 const found=[];
 for(const item of fs.readdirSync(base,{withFileTypes:true})){
  assert(!item.isSymbolicLink(),'No fixture symlinks');
  if(item.isDirectory())found.push(...inventory(new URL(item.name+'/',base),prefix+item.name+'/'));
  else {assert(item.isFile());found.push(prefix+item.name);}
 }
 return found.sort();
}
export function validateManifest(value){
 assert.equal(value.schema,'vm-head-teaching-legacy-fixture/1');
 assert.equal(value.sourceReceiptSha256,RECEIPT);assert.equal(value.entryPath,ENTRY);
 assert.equal(value.sourceRows.length,65);assert.equal(value.modulePaths.length,47);assert.equal(value.sourceReadPaths.length,18);
 assert.equal(value.sourceRows.reduce((sum,row)=>sum+row.bytes,0),497256);
 const rows=new Map();
 for(const row of value.sourceRows){
  safe(row.path);assert(!rows.has(row.path));assert.equal(row.fixture,'source/'+row.path+'.raw');
  assert(Number.isSafeInteger(row.bytes)&&row.bytes>0);assert.match(row.sha256,/^[a-f0-9]{64}$/);rows.set(row.path,row);
 }
 assert.equal(rows.get(ENTRY)?.sha256,'d1f433a4a303e4debf3c11174959146c881ffa555c1df523f4952c986a696ea7');
 assert.equal(rows.get('components/HeadTeachingReviewNavigator.tsx')?.sha256,'f5637bcb8e4385b86bcb5490ec10e6244baa6e38c051345ba5a95bd028d2b079');
 assert.equal(rows.get('app/workspace/atlas-review/head-learning/page.tsx')?.sha256,'7da7521176d7867a1233e87d5ee4ba5dbcf6b4d44dd22383e9e996b0517a4913');
 const modules=new Set(value.modulePaths),reads=new Set(value.sourceReadPaths);
 assert.equal(modules.size,47);assert.equal(reads.size,18);
 assert.deepEqual([...new Set([...modules,...reads])].sort(),[...rows.keys()].sort());
 for(const path of modules){assert(rows.has(path));assert(/\.(?:ts|mjs)$/.test(path));assert(!reads.has(path));}
 assert.deepEqual(value.thirdPartyVersions,{'react':'19.2.8','react-dom':'19.2.8','typescript':'5.9.3','@noble/hashes':'2.4.0'});
 assert.deepEqual(value.externalSpecifiers,['@noble/hashes/sha2.js','node:assert/strict','node:crypto','node:fs','node:module','node:test','react','react-dom/server','typescript']);
 return structuredClone(value);
}
export function validateBytes(row,bytes){
 assert.equal(bytes.length,row.bytes,'Source length: '+row.path);assert.equal(sha(bytes),row.sha256,'Source hash: '+row.path);
 assert(!bytes.includes(0));new TextDecoder('utf-8',{fatal:true}).decode(bytes);return bytes;
}
export function loadFixture(){
 const base=new URL('./fixtures/head-teaching-before-guided/',import.meta.url);
 const bytes=fs.readFileSync(new URL('manifest.json',base));assert.equal(sha(bytes),MANIFEST,'Exact fixture manifest');
 const manifest=validateManifest(JSON.parse(bytes)),sources=new Map();
 const check=()=>assert.deepEqual(inventory(new URL('source/',base)),manifest.sourceRows.map(row=>row.path+'.raw').sort(),'Exact fixture inventory');
 check();
 for(const row of manifest.sourceRows)sources.set(row.path,Buffer.from(validateBytes(row,fs.readFileSync(new URL(row.fixture,base)))));
 return {manifest,base,read(path){assert(sources.has(path),'Only finite saved text');return Buffer.from(sources.get(path));},
  verify(){check();for(const row of manifest.sourceRows)validateBytes(row,fs.readFileSync(new URL(row.fixture,base)));}};
}
export function resolveModule(root,parent,specifier,paths){
 let url;
 if(specifier.startsWith(root))url=new URL(specifier);
 else {assert(parent?.startsWith(root));assert(/^\.\.?\//.test(specifier),'No current aliases or absolute fallback');assert(!/[\\?#]/.test(specifier));url=new URL(specifier,parent);}
 assert(url.href.startsWith(root),'Stay inside historical namespace');
 const relative=decodeURIComponent(url.href.slice(root.length));safe(relative);
 const path=[relative,relative+'.ts',relative+'.mjs',relative+'/index.ts'].find(item=>paths.includes(item));
 assert(path,'Unbound historical module: '+relative);return new URL(path,root).href;
}
let running;
export function runHistoricalTeaching(){
 if(running)return running;
 running=(async()=>{
  const material=loadFixture(),{manifest,base}=material,require=createRequire(import.meta.url);
  for(const [name,version] of Object.entries(manifest.thirdPartyVersions))
   assert.equal(JSON.parse(fs.readFileSync(new URL('../node_modules/'+name+'/package.json',import.meta.url))).version,version,'Package ABI: '+name);
  const root=new URL('virtual/',base).href,loaded=new Set(),reads=new Map();
  const external=new Set([...manifest.externalSpecifiers,'react/jsx-runtime']);
  registerHooks({
   resolve(specifier,context,next){
    if(specifier.startsWith(root)||context.parentURL?.startsWith(root)){
     if(external.has(specifier))return next(specifier,{...context,parentURL:import.meta.url});
     return {url:resolveModule(root,context.parentURL,specifier,manifest.modulePaths),shortCircuit:true};
    }
    return next(specifier,context);
   },
   load(url,context,next){
    if(!url.startsWith(root))return next(url,context);
    const path=decodeURIComponent(url.slice(root.length));assert(manifest.modulePaths.includes(path),'Only finite saved modules execute');
    loaded.add(path);const raw=material.read(path).toString('utf8');
    return {format:'module',source:path.endsWith('.mjs')?raw:stripTypeScriptTypes(raw,{mode:'strip',sourceUrl:url}),shortCircuit:true};
   },
  });
  const original=fs.readFileSync;
  fs.readFileSync=function(path,options){
   const url=path instanceof URL?path.href:typeof path==='string'?(path.startsWith('file:')?new URL(path).href:pathToFileURL(path).href):null;
   if(url?.startsWith(root)){
    const relative=decodeURIComponent(url.slice(root.length));
    assert(manifest.sourceReadPaths.includes(relative),'Unbound historical source IO: '+relative);
    assert.equal(options,'utf8','Original source-read encoding');
    reads.set(relative,(reads.get(relative)??0)+1);return material.read(relative).toString('utf8');
   }
   return original.apply(this,arguments);
  };
  syncBuiltinESMExports();
  // Test callbacks perform source reads after import; keep this isolated-worker binding until exit.
  process.once('exit',()=>{
   try {
    assert(loaded.has(ENTRY));assert(reads.has('components/HeadTeachingReviewNavigator.tsx'));
    assert(reads.has('app/workspace/atlas-review/head-learning/page.tsx'));material.verify();
    console.log(JSON.stringify({historicalTeachingModules:[...loaded].sort(),historicalTeachingSourceReads:Object.fromEntries([...reads].sort())}));
   }catch(error){console.error(error);process.exitCode=1;}
   finally{fs.readFileSync=original;syncBuiltinESMExports();}
  });
  await import(new URL(ENTRY,root).href);
 })();
 return running;
}
