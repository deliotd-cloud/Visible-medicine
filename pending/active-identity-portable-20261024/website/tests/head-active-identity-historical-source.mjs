// Isolated source role for the original active-identity test; never a product viewer.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire,registerHooks,stripTypeScriptTypes,syncBuiltinESMExports} from 'node:module';
import {pathToFileURL} from 'node:url';

const MANIFEST_SHA256='a24dcd2271fc2c191c69a68ccafdb81e8ac97454f08ed6be0de9fe0851a25ee1';
const SOURCE_RECEIPT_SHA256='c292417e48c6e36666bcb0bf29f250e944bbb8b5c037948e6c0a3d1af4074129';
const ENTRY='tests/head-comparison-active-identity.test.ts';
const VIEWER='components/HeadAtlasViewer.tsx';
const EXPECTED_TEST_SHA256='fc657ede570acaed1729aa9d47cc89b9bb23388701f4ac9a706fae94f7395aac';
const EXPECTED_VIEWER_SHA256='8fa8cc8d613812c1a426f29007f4b48b293c81cc13a1353b69a5987c9150118b';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function safePath(path){
  assert(typeof path==='string'&&/^[A-Za-z0-9_./-]+$/.test(path),'Explicit relative source path');
  assert(path.split('/').every(part=>part&&part!=='.'&&part!=='..'),'No source traversal');
  return path;
}
function fixtureFiles(directory,prefix=''){
  const found=[];
  for(const item of fs.readdirSync(directory,{withFileTypes:true})){
    assert(!item.isSymbolicLink(),'No source fixture symlinks');
    const relative=prefix+item.name;
    if(item.isDirectory())found.push(...fixtureFiles(new URL(item.name+'/',directory),relative+'/'));
    else{assert(item.isFile(),'Only raw source files');found.push(relative);}
  }
  return found.sort();
}
function freeze(value){if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;}
export function validateHistoricalManifest(value){
  assert.equal(value.schema,'vm-head-active-identity-legacy-fixture/1');
  assert.equal(value.sourceReceiptSha256,SOURCE_RECEIPT_SHA256);
  assert.equal(value.entryPath,ENTRY);assert.equal(value.viewerPath,VIEWER);
  assert(Array.isArray(value.sourceRows)&&value.sourceRows.length===28);
  assert(Array.isArray(value.modulePaths)&&value.modulePaths.length===27);
  const rows=new Map();
  for(const row of value.sourceRows){
    safePath(row.path);assert(!rows.has(row.path),'Unique saved source');
    assert.equal(row.fixture,'source/'+row.path+'.raw');
    assert(Number.isSafeInteger(row.bytes)&&row.bytes>0);
    assert.match(row.sha256,/^[a-f0-9]{64}$/);
    rows.set(row.path,row);
  }
  assert.equal(value.sourceRows.reduce((sum,row)=>sum+row.bytes,0),263433);
  assert.equal(rows.get(ENTRY)?.sha256,EXPECTED_TEST_SHA256);
  assert.equal(rows.get(VIEWER)?.sha256,EXPECTED_VIEWER_SHA256);
  assert.equal(new Set(value.modulePaths).size,27);
  assert.deepEqual([...value.modulePaths].sort(),[...rows.keys()].filter(path=>path!==VIEWER).sort());
  for(const path of value.modulePaths)assert(path.endsWith('.ts')||path.endsWith('.mjs'),'Only proven pure modules execute');
  assert.deepEqual(Object.keys(value.thirdPartyVersions).sort(),['@noble/hashes','react','react-dom','typescript']);
  assert.equal(value.thirdPartyVersions.typescript,'5.9.3');
  assert.equal(value.thirdPartyVersions.react,'19.2.8');
  assert.equal(value.thirdPartyVersions['react-dom'],'19.2.8');
  assert.equal(value.thirdPartyVersions['@noble/hashes'],'2.4.0');
  return freeze(structuredClone(value));
}
export function validatedBytes(row,bytes){
  assert.equal(bytes.length,row.bytes,'Exact historical source size: '+row.path);
  assert.equal(sha(bytes),row.sha256,'Exact historical source hash: '+row.path);
  assert(!bytes.includes(0),'Text source excludes binary assets');
  new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  return bytes;
}
export function loadHistoricalActiveIdentityFixture(){
  const base=new URL('./fixtures/head-active-identity-before-separate/',import.meta.url);
  const manifestBytes=fs.readFileSync(new URL('manifest.json',base));
  assert.equal(sha(manifestBytes),MANIFEST_SHA256,'Exact historical fixture manifest');
  const manifest=validateHistoricalManifest(JSON.parse(manifestBytes));
  assert.deepEqual(fixtureFiles(new URL('source/',base)),manifest.sourceRows.map(row=>row.path+'.raw').sort(),'Exact raw source inventory');
  const source=new Map();
  for(const row of manifest.sourceRows)source.set(row.path,Buffer.from(validatedBytes(row,fs.readFileSync(new URL(row.fixture,base)))));
  return Object.freeze({base,manifest,
    read(path){assert(source.has(path),'Only closed historical source');return Buffer.from(source.get(path));},
    verify(){assert.deepEqual(fixtureFiles(new URL('source/',base)),manifest.sourceRows.map(row=>row.path+'.raw').sort(),'Exact raw source inventory at verification');for(const row of manifest.sourceRows)validatedBytes(row,fs.readFileSync(new URL(row.fixture,base)));},
  });
}
export function resolveHistoricalModule(root,parentURL,specifier,modulePaths){
  let url;
  if(specifier.startsWith(root))url=new URL(specifier);
  else{
    assert(parentURL?.startsWith(root),'Only saved parents resolve relative modules');
    assert(specifier.startsWith('./')||specifier.startsWith('../'),'No current source alias or absolute fallback');
    assert(!/[\\?#]/.test(specifier),'Only exact saved source specifiers');
    url=new URL(specifier,parentURL);
  }
  assert(url.href.startsWith(root),'Historical source cannot escape fixture namespace');
  const relative=decodeURIComponent(url.href.slice(root.length));safePath(relative);
  const candidates=[relative,relative+'.ts',relative+'.mjs',relative+'/index.ts'];
  const found=candidates.find(path=>modulePaths.includes(path));
  assert(found,'No saved module or current filesystem fallback: '+relative);
  return new URL(found,root).href;
}
let running;
export function runHistoricalActiveIdentity(){
  if(running)return running;
  running=(async()=>{
    const material=loadHistoricalActiveIdentityFixture(),{manifest,base}=material;
    const require=createRequire(import.meta.url);
    for(const [name,version] of Object.entries(manifest.thirdPartyVersions)){
      const packagePath=new URL('../node_modules/'+name+'/package.json',import.meta.url);
      assert.equal(JSON.parse(fs.readFileSync(packagePath,'utf8')).version,version,'Historical package version: '+name);
    }
    const root=new URL('virtual/',base).href;
    const viewerURL=new URL(VIEWER,root).href;
    const loaded=new Set();
    registerHooks({
      resolve(specifier,context,next){
        if(specifier.startsWith(root)||context.parentURL?.startsWith(root)){
          if(specifier.startsWith('node:'))return next(specifier,context);
          if(['react','react/jsx-runtime','react-dom/server','typescript','@noble/hashes/sha2.js'].includes(specifier))
            return next(specifier,{...context,parentURL:import.meta.url});
          return {url:resolveHistoricalModule(root,context.parentURL,specifier,manifest.modulePaths),shortCircuit:true};
        }
        return next(specifier,context);
      },
      load(url,context,next){
        if(!url.startsWith(root))return next(url,context);
        const relative=decodeURIComponent(url.slice(root.length));
        assert(manifest.modulePaths.includes(relative),'Only proven historical modules execute');
        loaded.add(relative);
        const raw=material.read(relative).toString('utf8');
        return {format:'module',source:relative.endsWith('.mjs')?raw:stripTypeScriptTypes(raw,{mode:'strip',sourceUrl:url}),shortCircuit:true};
      },
    });
    let viewerReads=0;
    const original=fs.readFileSync;
    const viewerText=material.read(VIEWER).toString('utf8');
    fs.readFileSync=function(path,options){
      const url=path instanceof URL?path.href:typeof path==='string'?(path.startsWith('file:')?new URL(path).href:pathToFileURL(path).href):null;
      if(url?.startsWith(root)){
        assert.equal(url,viewerURL,'Only original test viewer read is redirected');
        assert.equal(options,'utf8','Original viewer text read shape');
        viewerReads++;
        return viewerText;
      }
      return original.apply(this,arguments);
    };
    syncBuiltinESMExports();
    try{await import(new URL(ENTRY,root).href);}
    finally{fs.readFileSync=original;syncBuiltinESMExports();}
    assert.equal(viewerReads,1,'Exactly one original whole-viewer source read');
    assert.deepEqual([...loaded].sort(),[...manifest.modulePaths].sort(),'Complete proven module namespace');
    material.verify();
    process.once('exit',()=>{
      try{
        assert.deepEqual([...loaded].sort(),[...manifest.modulePaths].sort(),'Complete historical modules at exit');
        material.verify();
      }catch(error){console.error(error);process.exitCode=1;}
    });
    return {historicalModules:loaded.size,sourceRows:manifest.sourceRows.length};
  })();
  return running;
}