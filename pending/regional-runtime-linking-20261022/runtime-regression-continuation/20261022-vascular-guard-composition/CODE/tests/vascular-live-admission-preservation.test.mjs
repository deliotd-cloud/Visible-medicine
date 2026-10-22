import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const sha=b=>createHash('sha256').update(b).digest('hex');
const read=name=>readFileSync(new URL(name,import.meta.url));
const historical='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const cases={
 'colic-arterial':{original:'76efe78cb9e237ac51d961390c762be364bbcad4ad18c448482a4c4552e16d0b',current:'262450cc8d41c27b4b4cbdb2605e63e4ae29d71efb46cb5490fe2c139a3297f5',family:[
  ["import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';","import {loadColicAdmissionImport} from './colic-admission-import-history.mjs';\nimport {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';"],
  ["test('seven exact colic arterial X-ray drafts reach body learner and protected Review',async()=>{","test('seven exact colic arterial X-ray drafts reach body learner and protected Review',async()=>{\n  const admission=validateCurrentAtlasDelivery();\n  assert.equal(admission.source,liveCommit);"],
  ['assert.equal(manifest.sourceCommit,revision,name);','assert.equal(manifest.sourceCommit,admission.runtimeSources[name],name);'],
  ['  const selected=new Set(entries().map(({identity}:any)=>identity.id));','  const selected=new Set(entries().map(({identity}:any)=>identity.id));\n  const admissionImported=await loadColicAdmissionImport();'],
  ["    for(const tab of current.contentTabs)\n      assert.deepEqual(imported.bodyLesson(structure,tab),current.bodyLesson(structure,tab),`${id}:${tab}: live imported`);","    for(const tab of current.contentTabs){\n      assert.deepEqual(imported.bodyLesson(structure,tab),live.bodyLesson(structure,tab),`${id}:${tab}: exact current imported`);\n      // Retain the original import/feature assertion at its actual old epoch,\n      // where ileocolic ultrasound was pending. Current delivery is separate.\n      {const imported=admissionImported;\n      assert.deepEqual(imported.bodyLesson(structure,tab),current.bodyLesson(structure,tab),`${id}:${tab}: live imported`);\n      }\n    }"],
 ]},
 'hepatic-arterial':{original:'55b2f98bb5e9436419f2db2a4e8e46195d0b91cbf0478105cecf57df597c5a74',current:'7ccc686e240ad9b77794047bcb952c14526195d574e3569465bbc53a642a74c4',family:[
  ["import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';","import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';"],
  ["const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));","const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));\nconst runtimeSources=validateCurrentAtlasDelivery().runtimeSources;"],
  ['assert.equal(manifest.sourceCommit,revision,name);','assert.equal(manifest.sourceCommit,runtimeSources[name],name);'],
 ]},
 'pancreatic-arterial':{original:'69ee2b967c071aaad1562efed45476ba02e68588c71fd2895f189840eadeeb9b',current:'073d9868e953301693ec28534f68583bbf9df18d4bb8b81525c7e7e7f7816d73',family:[
  ["import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';","import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';"],
  ["const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));","const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));\nconst runtimeSources=validateCurrentAtlasDelivery().runtimeSources;"],
  ['assert.equal(manifest.sourceCommit,revision,name);','assert.equal(manifest.sourceCommit,runtimeSources[name],name);'],
 ]},
 'leg-arterial':{original:'4f27cdf19e4f59d930db25ee3cc00147582998a56ae8200d7fede807d6739286',current:'73d3cb14dae874d61dca88b640db5dd88b402c0cc304159cb490eaa194ca7c91',family:[
  ["import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';","import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';"],
  ["  assert.equal(revision,liveCommit,'Exact pinned current Review source');","  assert.equal(revision,liveCommit,'Exact pinned current Review source');\n  const deliveryPin=validateCurrentAtlasDelivery();\n  assert.equal(revision,deliveryPin.source,'Review retains the strict current-source contract');"],
  ['assert.equal(manifest.sourceCommit,revision,name);','assert.equal(manifest.sourceCommit,deliveryPin.runtimeSources[name],name);'],
 ]},
 'leg-venous':{original:'cc554fa7ce6e3bd277a35ec2e45dea0ca50be52176589bba055f5c2325b9c5bf',current:'093925455c0b1fc5a19163502341d783f8597ffda2db00419f65cad96a68e999',family:[
  ["import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';","import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';"],
  ["  assert.equal(revision,liveCommit,'Exact pinned current Review source');","  assert.equal(revision,liveCommit,'Exact pinned current Review source');\n  const deliveryPin=validateCurrentAtlasDelivery();\n  assert.equal(revision,deliveryPin.source,'Review retains the strict current-source contract');"],
  ['assert.equal(manifest.sourceCommit,revision,name);','assert.equal(manifest.sourceCommit,deliveryPin.runtimeSources[name],name);'],
 ]},
 'visceral-arterial':{original:'881101a2d4b2df2d95c3f1a5a4b14ba50df821c973ea98717877619fba77a216',current:'be2e213ba210247d94a964bb4521c2630edab81f4496c3e2363d2cf725921c7b',family:[
  ["import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';","import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';"],
  ["test('four exact visceral arterial Xray drafts reach body learner and protected Review',async()=>{","test('four exact visceral arterial Xray drafts reach body learner and protected Review',async()=>{\n  const pin=validateCurrentAtlasDelivery();"],
  ['assert.equal(manifest.sourceCommit,revision,name);','assert.equal(manifest.sourceCommit,pin.runtimeSources[name],name);'],
 ]},
};
const seams=[
 ["import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';","import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';\nimport {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';"],
 [`const liveCommit='${historical}';`,`const historicalLiveCommit='${historical}';\nconst liveCommit=CURRENT_ATLAS_REVISION;`],
 ["const atlas='F:/VisibleMedicine/atlas';","const atlas=currentAtlasDeliveryRoot();"],
 ["  assert.equal(git(['rev-parse','HEAD']).toString().trim(),revision);","  assert.equal(revision,liveCommit,'Exact pinned current Review source');\n  assert.equal(git(['rev-parse','HEAD']).toString().trim(),revision);"],
 ["  assert.equal(git(['rev-parse','HEAD']).toString().trim(),liveCommit,'Exact live source head');","  assert.equal(git(['rev-parse','HEAD']).toString().trim(),liveCommit,'Exact live source head');\n  git(['merge-base','--is-ancestor',historicalLiveCommit,liveCommit]);\n  for(const path of paths)assert.deepEqual(committed(liveCommit,path),committed(historicalLiveCommit,path),`${path}: historical 9f teaching/source bytes preserved at current admission`);"],
];
const uniqueReplace=(text,from,to,label)=>{
 assert.equal(text.split(from).length,2,`${label}: exact unique seam`);
 return text.replace(from,to);
};
const inverse=(current,name)=>{
 let prior=current;
 for(const [before,after] of cases[name].family.toReversed())prior=uniqueReplace(prior,after,before,name+' family inverse');
 return prior;
};
const expectedPrior=(original,name)=>{
 let prior=original;
 for(const [from,to] of seams)prior=uniqueReplace(prior,from,to,name+' historical forward');
 return prior;
};
const originalFromPrior=(prior,name)=>{
 let original=prior;
 for(const [from,to] of seams.toReversed())original=uniqueReplace(original,to,from,name+' historical inverse');
 return original;
};

for(const [name,pin] of Object.entries(cases)){
 const file='clinical-review-'+name+'-xray.test.ts';
 const original=read('fixtures/vascular-live-before-20261019/'+file+'.raw');
 const actual=read(file);
 const prior=expectedPrior(original.toString('utf8'),name);
 const prove=(bytes,checkCurrentPin=true)=>{
  if(checkCurrentPin)assert.equal(sha(bytes),pin.current,'Exact whole reviewed V6 '+name);
  const recoveredPrior=inverse(bytes.toString('utf8'),name);
  assert.deepEqual(Buffer.from(recoveredPrior),Buffer.from(prior),'Exact current to prior '+name);
  assert.deepEqual(Buffer.from(originalFromPrior(recoveredPrior,name)),original,'Exact prior to original '+name);
 };
 test(name+' retains the complete original proof through exact family and current-admission inverses',()=>{
  assert.equal(sha(original),pin.original,'Exact whole original '+name);
  prove(actual);
 });
 test(name+' refuses historical, source, mapping, Review, model, emitted, population and security guard deletion',()=>{
  const text=actual.toString('utf8');
  for(const needle of [`historicalLiveCommit='${historical}'`,
   'for(const path of paths)assert.deepEqual(committed(liveCommit,path),committed(historicalLiveCommit,path)',
   "assert.deepEqual(imported.bodyDisplayCatalog(json('atlas-review/'+catalogPath)),catalog)",
   'for(const bundle of catalog.bundles)',
   'const livePacket=wire(await live.bodyReviewMaterial(id))',
   name.startsWith('leg-')?"assert.equal((await save(forged)).status,422":"assert.equal((await saveLive(forgedLiveDecision)).status,422",
   'const emitted=[emittedTeaching(learner.base,learner.manifest.files,true),',
   "for(const key of ['source','reasoning','guidedTours','checklist','atlasLink','limits'])",
   'assert.deepEqual({placements,changed,packets,changedPackets,storageCalls}',
  ]){assert(text.includes(needle));assert.throws(()=>prove(Buffer.from(text.replace(needle,'')),false),needle);}
  assert.throws(()=>prove(Buffer.from(text.replace('const liveCommit=CURRENT_ATLAS_REVISION;',`const liveCommit='${historical}';`)),false));
  for(const [,guard] of pin.family){
   assert(text.includes(guard),`${name}: reviewed family guard present`);
   assert.throws(()=>prove(Buffer.from(text.replace(guard,'')),false),`${name}: family guard removal refused`);
  }
  assert.throws(()=>prove(Buffer.from(text+'\nconst unreviewed=true;\n'),false));
 });
}
