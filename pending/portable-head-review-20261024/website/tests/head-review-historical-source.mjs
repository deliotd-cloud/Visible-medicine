// Isolated historical test/pure-source fixture, never a learner/runtime source.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire,registerHooks,stripTypeScriptTypes} from 'node:module';
import {fileURLToPath} from 'node:url';

const MANIFEST_SHA256='c6880b41ec988457d6113cca19d52f4948a404e1334ef03f034a6758b8d9896e';
const BEFORE_RECEIPT='dc0532736094fcd7225e1229af3a41322aacc591789bf1179c44476b98b7077e';
const ENTRY='tests/head-mri-comparison-page.test.ts';
const PAGE='app/workspace/atlas-review/head-learning/page.tsx';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function safePath(value){
  assert(typeof value==='string'&&/^[A-Za-z0-9_./-]+$/.test(value),'Explicit relative source path');
  assert(value.split('/').every(part=>part&&part!=='.'&&part!=='..'),'No source traversal');
  return value;
}
function freeze(value){if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;}
export function validateHistoricalManifest(value){
  assert.equal(value.schema,'vm-head-review-legacy-fixture/1');
  assert.equal(value.sourceReceiptSha256,BEFORE_RECEIPT);
  assert.equal(value.entryPath,ENTRY);assert.equal(value.pagePath,PAGE);
  assert.equal(value.sourceRows.length,17);assert.equal(value.modulePaths.length,16);
  const rows=new Map();
  for(const row of value.sourceRows){
    safePath(row.path);assert(!rows.has(row.path),'Unique saved source');
    assert.equal(row.fixture,'source/'+row.path+'.raw');
    assert(Number.isSafeInteger(row.bytes)&&row.bytes>0);assert.match(row.sha256,/^[a-f0-9]{64}$/);
    rows.set(row.path,row);
  }
  assert.equal(value.sourceRows.reduce((sum,row)=>sum+row.bytes,0),118219);
  assert.equal(rows.get(ENTRY)?.sha256,'4ec8991cd826c4b614b780607b74584c4bd8bec2544782c02c31944c79351363');
  assert.equal(rows.get(PAGE)?.sha256,'7da7521176d7867a1233e87d5ee4ba5dbcf6b4d44dd22383e9e996b0517a4913');
  assert.equal(new Set(value.modulePaths).size,16);
  assert.deepEqual([...value.modulePaths].sort(),value.sourceRows.map(row=>row.path).filter(name=>name!==PAGE).sort());
  for(const name of value.modulePaths)assert(name.endsWith('.ts'),'Only the proven erasable pure module graph');
  assert.deepEqual(Object.keys(value.thirdPartyVersions).sort(),['react','react-dom','typescript']);
  for(const version of Object.values(value.thirdPartyVersions))assert(typeof version==='string'&&version.length>0);
  return freeze(structuredClone(value));
}
export function validateHistoricalBytes(row,bytes){
  assert.equal(bytes.length,row.bytes,'Exact historical source length: '+row.path);
  assert.equal(sha(bytes),row.sha256,'Exact historical source digest: '+row.path);
  assert(!bytes.includes(0),'Source is text, not an image or mask');
  new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  return bytes;
}
export function resolveHistoricalModule(virtualRoot,parentURL,specifier,modulePaths){
  let url;
  if(specifier.startsWith(virtualRoot))url=new URL(specifier);
  else{
    assert(parentURL?.startsWith(virtualRoot),'Only the saved parent can resolve a relative module');
    assert(specifier.startsWith('./')||specifier.startsWith('../'),'No current application alias or absolute fallback');
    assert(!/[\\?#]/.test(specifier),'Only exact saved source specifiers');
    url=new URL(specifier,parentURL);
  }
  assert(url.href.startsWith(virtualRoot),'Historical source must stay in the fixture');
  const relative=decodeURIComponent(url.href.slice(virtualRoot.length));safePath(relative);
  const candidates=[relative,...['.ts','.mjs','.js','.json'].map(ext=>relative+ext),relative+'/index.ts'];
  const found=candidates.find(name=>modulePaths.includes(name));
  assert(found,'No saved module; current filesystem fallback is forbidden: '+relative);
  return new URL(found,virtualRoot).href;
}
export function loadHistoricalHeadFixture(){
  const base=new URL('./fixtures/head-review-before-guided/',import.meta.url);
  const bytes=readFileSync(new URL('manifest.json',base));assert.equal(sha(bytes),MANIFEST_SHA256,'Exact historical fixture manifest');
  const manifest=validateHistoricalManifest(JSON.parse(bytes));
  const sources=new Map();
  for(const row of manifest.sourceRows)sources.set(row.path,Buffer.from(validateHistoricalBytes(row,readFileSync(new URL(row.fixture,base)))));
  return Object.freeze({manifest,base,
    read(relative){assert(sources.has(relative),'Only the closed historical source inventory');return Buffer.from(sources.get(relative));},
    verify(){for(const row of manifest.sourceRows)validateHistoricalBytes(row,readFileSync(new URL(row.fixture,base)));},
  });
}
let running;
export function runHistoricalHeadReview(){
  if(running)return running;
  running=(async()=>{
    const material=loadHistoricalHeadFixture(),{manifest,base}=material;
    const require=createRequire(import.meta.url);
    for(const [name,version]of Object.entries(manifest.thirdPartyVersions))assert.equal(require(name+'/package.json').version,version,'Proven historical test package ABI: '+name);
    const virtualRoot=new URL('virtual/',base).href,loaded=new Set();
    registerHooks({
      resolve(specifier,context,next){
        if(specifier.startsWith(virtualRoot)||context.parentURL?.startsWith(virtualRoot)){
          if(specifier.startsWith('node:'))return next(specifier,context);
          if(/^(?:react|react-dom|typescript)(?:\/|$)/.test(specifier)){
            assert(!/[\\?#]/.test(specifier)&&specifier.split('/').every(part=>part&&part!=='.'&&part!=='..'),'No package path escape');
            return next(specifier,{...context,parentURL:import.meta.url});
          }
          return {url:resolveHistoricalModule(virtualRoot,context.parentURL,specifier,manifest.modulePaths),shortCircuit:true};
        }
        return next(specifier,context);
      },
      load(url,context,next){
        if(!url.startsWith(virtualRoot))return next(url,context);
        const relative=decodeURIComponent(url.slice(virtualRoot.length));assert(manifest.modulePaths.includes(relative),'Only proven historical modules execute');
        loaded.add(relative);
        return {format:'module',source:stripTypeScriptTypes(material.read(relative).toString('utf8'),{mode:'strip',sourceUrl:url}),shortCircuit:true};
      },
    });
    process.once('exit',()=>{
      try{assert.deepEqual([...loaded].sort(),[...manifest.modulePaths].sort(),'Complete evaluated historical pure graph');material.verify();}
      catch(error){console.error(error);process.exitCode=1;}
    });
    assert.equal(process.env.PAGE_SOURCE,undefined,'Use the separate current-role suite for a current page; no external source override');
    process.env.PAGE_SOURCE=fileURLToPath(new URL(manifest.sourceRows.find(row=>row.path===PAGE).fixture,base));
    try{await import(new URL(ENTRY,virtualRoot).href);}
    finally{delete process.env.PAGE_SOURCE;}
  })();
  return running;
}
