// Test-only isolation for the neonatal inbox proof. No account records are read or persisted.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync,openSync,readSync,closeSync,realpathSync,statSync,existsSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {build} from 'esbuild';
import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const pinPath='atlas-review/content/neonatal-cranial-ultrasound-pins.json';
const pinHash='aa126b609b4a816083ac5c52b30905b6eda7f66d43cd31f90521664dfe6da53a';
const parent='c57449c1107a912442c6b0af23e270df41032522';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const hex40=/^[a-f0-9]{40}$/;
const hex64=/^[a-f0-9]{64}$/;
const git=(atlas,...args)=>execFileSync('git',args,{cwd:atlas,encoding:'utf8',windowsHide:true,
  maxBuffer:1024*1024,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim();
const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const keys=(value,expected)=>assert.deepEqual(Object.keys(value).sort(),expected.slice().sort());
// A complete checkout needs no staging scaffold. Only this independently
// verified thin proposal may borrow its explicitly declared parent inputs.
let preparation;
const preparationPath=resolve(root,'../PREPARATION.json');
if(existsSync(preparationPath)){
 const offered=JSON.parse(readFileSync(preparationPath));
 if(offered.parentReceiptSha256==='d41eecb7d72f96eaa52b4ac494646e58cbd075f32ad337b26d309ff277fa1d2a'&&
  offered.parentWebsite==='F:/VisibleMedicine/staging/20261023-head-pan-bound/website'){
  assert.equal(sha(readFileSync(offered.parentReceipt)),offered.parentReceiptSha256);preparation=offered;
 }
}
const parentRoot=preparation?.parentWebsite;
const junctions=new Set(preparation?.readOnlyDirectoryJunctions??[]);
const safePath=path=>{
 assert(typeof path==='string'&&/^(?!\.)(?!.*(?:^|\/)\.\.?\/)[a-zA-Z0-9_./@+-]+$/.test(path)&&!path.includes('\\'),
  'Unsafe Review integration path');
 const staged=resolve(root,path);
 const stagedExists=existsSync(staged);
 assert(stagedExists||parentRoot,'Missing bound input; no verified parent fallback');
 const target=realpathSync(stagedExists?staged:resolve(parentRoot,path));
 const direct=resolve(root,path).toLowerCase();
 const parent=parentRoot?resolve(parentRoot,path).toLowerCase():null;
 assert(target.toLowerCase()===direct ||
  (target.toLowerCase()===parent&&(!stagedExists||junctions.has(path.split('/')[0]))),
  'Review integration path escaped the bound website or its declared parent junction');
 assert(statSync(target).isFile());
 return target;
};
const fileSha=path=>{
 const hash=createHash('sha256'),buffer=Buffer.allocUnsafe(64*1024),fd=openSync(path,'r');
 try{let n;while((n=readSync(fd,buffer,0,buffer.length,null))>0)hash.update(buffer.subarray(0,n));}
 finally{closeSync(fd);}
 return hash.digest('hex');
};
const reviewRevision=(context,track)=>{
 const scope={catalogScope:context.catalogScope,structureId:context.structureId,
  checklistVersion:context.checklistVersion};
 return sha(JSON.stringify(track==='geometry'
  ? {...scope,source:context.sourceHash,renderer:context.rendererHash,checks:context.checklists.geometry}
  : {...scope,source:context.sourceHash,teaching:context.teachingHash,checks:context.checklists.teaching}));
};

export function neonatalInboxInputs(){
 const delivery=validateCurrentAtlasDelivery({root});
 const atlas=currentAtlasDeliveryRoot();
 const bytes=readFileSync(resolve(root,pinPath));
 const pins=JSON.parse(bytes);
 assert.equal(sha(JSON.stringify(pins)),pinHash,'Exact neonatal source pin');
 assert.equal(pins.parentCommit,parent);
 assert(Array.isArray(pins.entries)&&pins.entries.length===10);
 const ids=pins.entries.map(entry=>entry?.identity?.id);
 assert(ids.every(id=>typeof id==='string'&&id.startsWith('vm:anatomy:body:head-neck:')));
 assert.equal(new Set(ids).size,10,'Ten unique source-bound IDs');
 const source=delivery.source,sourceTree=delivery.sourceTree;
 assert.match(source,hex40);assert.match(sourceTree,hex40);
 assert.equal(git(atlas,'rev-parse','HEAD'),source);
 assert.equal(git(atlas,'rev-parse','HEAD^{tree}'),sourceTree);
 const parentTree=git(atlas,'rev-parse',parent+'^{tree}');
 assert.match(parentTree,hex40);
 assert.equal(git(atlas,'merge-base',parent,source),parent);
 const binding=JSON.parse(readFileSync(resolve(root,'atlas-review/integration-inputs.json')));
 assert.equal(binding.sourceCommit,source);
 assert.equal(binding.sha256,delivery.reviewIntegration);
 assert.equal(sha(JSON.stringify(binding.inputs)),delivery.reviewIntegration);
 assert(Array.isArray(binding.inputs)&&binding.inputs.length>0);
 const seenSource=new Set();
 for(const item of binding.inputs){
  assert(record(item));keys(item,['path','sha256']);assert.match(item.sha256,hex64);
  assert(!seenSource.has(item.path));seenSource.add(item.path);
  assert.equal(fileSha(safePath(item.path)),item.sha256,'Changed Review integration input: '+item.path);
 }
 const manifest=JSON.parse(readFileSync(resolve(root,'atlas-review/manifest.json')));
 assert.equal(manifest.revision,source);
 assert(Array.isArray(manifest.files)&&manifest.files.length===delivery.reviewSourceFiles);
 const seenImported=new Set();
 for(const item of manifest.files){
  assert(record(item)&&typeof item.path==='string');
  assert.match(item.importedSha256,hex64);assert(!seenImported.has(item.path));seenImported.add(item.path);
  assert.equal(fileSha(safePath('atlas-review/'+item.path)),item.importedSha256,
   'Changed imported Review source: '+item.path);
 }
 const currentRenderer=JSON.parse(readFileSync(resolve(root,'atlas-review/content/body-renderer-revision.json'))).sha256;
 const priorRenderer=JSON.parse(git(atlas,'show',parent+':content/body-renderer-revision.json')).sha256;
 assert.match(currentRenderer,hex64);assert.match(priorRenderer,hex64);
 return {source,sourceTree,parent,parentTree,pinHash,ids,currentRenderer,priorRenderer};
}

function checkedContext(context,id){
 assert(record(context),'Missing review context: '+id);
 keys(context,['catalogScope','structureId','checklistVersion','structureName','materialHash',
  'sourceHash','teachingHash','rendererHash','checklists','blockers','teachingTabs','revisions']);
 assert.equal(context.structureId,id,'Foreign review context');
 for(const field of ['materialHash','sourceHash','teachingHash','rendererHash'])assert.match(context[field],hex64,field);
 assert(typeof context.catalogScope==='string'&&context.catalogScope.length>0);
 assert(typeof context.checklistVersion==='string'&&context.checklistVersion.length>0);
 assert(typeof context.structureName==='string'&&context.structureName.length>0);
 keys(context.revisions,['geometry','teaching','imaging']);
 assert.match(context.revisions.geometry,hex64);assert.match(context.revisions.teaching,hex64);
 assert.equal(context.revisions.imaging,null,'No imaging approval');
 keys(context.checklists,['geometry','teaching','imaging']);
 keys(context.blockers,['geometry','teaching','imaging']);
 for(const group of ['geometry','teaching','imaging']){
  assert(Array.isArray(context.checklists[group]));assert(Array.isArray(context.blockers[group]));
  for(const item of context.checklists[group]){
   assert(record(item));keys(item,['id','label']);
   assert(typeof item.id==='string'&&typeof item.label==='string');
  }
  assert(context.blockers[group].every(text=>typeof text==='string'));
 }
 assert(context.blockers.imaging.length>0,'Imaging review remains blocked');
 assert(Array.isArray(context.teachingTabs)&&context.teachingTabs.every(tab=>typeof tab==='string'));
}

export function parseNeonatalInboxReply(raw,phase,input){
 assert(['current','prior'].includes(phase));
 assert(typeof raw==='string'&&Buffer.byteLength(raw)<=4*1024*1024,'Bounded child reply');
 const reply=JSON.parse(raw);
 assert(record(reply));keys(reply,['phase','input','contexts']);
 assert.equal(reply.phase,phase);
 assert.deepEqual(reply.input,input,'Source identity changed or foreign child reply');
 assert(record(reply.contexts));
 assert.deepEqual(Object.keys(reply.contexts).sort(),input.ids.slice().sort(),'Missing or extra context');
 for(const id of input.ids){
  const context=reply.contexts[id];checkedContext(context,id);
  assert.equal(context.rendererHash,phase==='current'?input.currentRenderer:input.priorRenderer,
   'Renderer revision changed');
  assert.equal(context.revisions.geometry,reviewRevision(context,'geometry'),'Geometry revision changed');
  assert.equal(context.revisions.teaching,reviewRevision(context,'teaching'),'Teaching revision changed');
 }
 return reply.contexts;
}

async function compute(phase,input){
 let api;
 if(phase==='current'){
  const built=await build({stdin:{contents:"export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
   resolveDir:root,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
  api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
 }else{
  const atlas=currentAtlasDeliveryRoot();
  const history=await import(pathToFileURL(resolve(atlas,'scripts/exact-source-history-api.mjs')).href);
  api=await history.exactSourceHistoryApi(parent,'review-security');
 }
 const contexts=Object.create(null);
 for(const id of input.ids)contexts[id]=await api.bodyReviewContext(id);
 return contexts;
}

export function readNeonatalInboxContexts(){
 const before=neonatalInboxInputs();
 const run=phase=>{
  const raw=execFileSync(process.execPath,['--max-old-space-size=128',fileURLToPath(import.meta.url),'--child',phase],{
   cwd:root,encoding:'utf8',windowsHide:true,maxBuffer:4*1024*1024,timeout:120000});
  return parseNeonatalInboxReply(raw,phase,before);
 };
 const currentContexts=run('current');
 const priorContexts=run('prior');
 assert.deepEqual(neonatalInboxInputs(),before,'Source changed while computing review contexts');
 for(const id of before.ids){
  assert.equal(currentContexts[id].sourceHash,priorContexts[id].sourceHash,id+': source identity drift');
  assert.notEqual(currentContexts[id].revisions.teaching,priorContexts[id].revisions.teaching,
   id+': expected teaching revision transition');
 }
 return {currentContexts,priorContexts};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  assert.deepEqual(process.argv.slice(2).length,2);
  assert.equal(process.argv[2],'--child');
  const phase=process.argv[3];assert(['current','prior'].includes(phase));
  const input=neonatalInboxInputs();
  const contexts=await compute(phase,input);
  assert.deepEqual(neonatalInboxInputs(),input);
  const raw=JSON.stringify({phase,input,contexts});
  parseNeonatalInboxReply(raw,phase,input);
  process.stdout.write(raw);
 }catch(error){process.stderr.write(String(error?.stack??error)+'\n');process.exitCode=1;}
}
