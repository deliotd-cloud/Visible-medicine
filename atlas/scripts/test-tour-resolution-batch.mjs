import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {build} from './workspace-test-build.mjs';

// First-party 7e2552a source fixture. Keep this immutable when the proposal is integrated.
const original=readFileSync(new URL('./fixtures/regional-tours-original.ts.raw',import.meta.url),'utf8');
assert.equal(createHash('sha256').update(original).digest('hex'),'b1a1bc9d9d80b84d4d98aed1aaa08aa4e9d7313e58bdd40f3b8a10ea0bab215d');
const root=process.cwd();
const tourPath=resolve(root,'lib/regional-tours.ts');
const entry="export * from './lib/regional-tours'; import raw from './public/models/bodyparts3d/full-body/catalog.json'; import {bodyDisplayCatalog} from './lib/body-display-catalog'; export const catalog=bodyDisplayCatalog(raw as any);";
async function compile(preimage) {
  const output=await build({stdin:{contents:entry,resolveDir:root,loader:'ts'},bundle:true,platform:'node',format:'esm',write:false,
    plugins:preimage?[{name:'pinned-regional-tours',setup(api){api.onLoad({filter:/regional-tours\.ts$/,namespace:'workspace-test'},args=>
      args.path===tourPath?{contents:original,loader:'ts',resolveDir:resolve(root,'lib')}:undefined);}}]:[]});
  return import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'));
}
const [before,after]=await Promise.all([compile(true),compile(false)]);
assert.equal(Object.hasOwn(before,'regionalTourResolvedFrames'),false,'Pinned baseline substitution must have taken effect');
assert.equal(typeof after.regionalTourResolvedFrames,'function','The proposal must expose the admitted batch entry');
assert.deepEqual(after.regionalTours,before.regionalTours,'Registered tour fields and teaching remain exact');
assert.deepEqual(after.catalog,before.catalog,'Source display catalogue remains exact');
const capture=fn=>{try{return {ok:true,value:fn()};}catch(error){return {ok:false,error:{name:error.name,message:error.message}};}};
function compareOutcomes(current,original,label){
  assert.equal(current.ok,original.ok,`${label}: admission/refusal must match`);
  if(current.ok)assert.deepEqual(current.value,original.value,label);
  else assert.deepEqual(current.error,original.error,`${label}: refusal must match exactly`);
}
let admittedTours=0,refusedTours=0,admittedEvidence=0,refusedEvidence=0;
const admitted=[];
for(const tour of after.regionalTours){
  const oldEvaluation=capture(()=>({structures:before.regionalTourStructures(before.catalog,tour),
    frames:tour.steps.map((_,i)=>before.regionalTourFrame(before.catalog,tour,i))}));
  const batch=capture(()=>after.regionalTourResolvedFrames(after.catalog,tour));
  compareOutcomes(batch,oldEvaluation,`${tour.id}: exact source and frames`);
  if(batch.ok){
    admittedTours++;admitted.push(tour);
    assert.deepEqual(after.regionalTourFrame(after.catalog,tour),before.regionalTourFrame(before.catalog,tour),`${tour.id}: overview`);
    assert.deepEqual(after.regionalTourStepFrames(after.catalog,tour),before.regionalTourStepFrames(before.catalog,tour),`${tour.id}: optional frames`);
  }else refusedTours++;
  for(const id of new Set([...tour.contextIds,...tour.steps.map(step=>step.selectedId)])){
    const oldEvidence=capture(()=>before.regionalTourEvidence(before.catalog,id));
    const newEvidence=capture(()=>after.regionalTourEvidence(after.catalog,id));
    compareOutcomes(newEvidence,oldEvidence,`${tour.id}: complete evidence for ${id}`);
    if(newEvidence.ok)admittedEvidence++;else refusedEvidence++;
  }
}
assert(admittedTours>0,'At least one tour must be source-admitted for positive frame proof');
assert(admittedEvidence>0,'At least one evidence packet must be source-admitted');
const tour=admitted.find(t=>t.steps.some(step=>step.frameIds)&&
  capture(()=>before.regionalTourEvidence(before.catalog,t.steps[0].selectedId)).ok);
assert(tour,'An admitted explicit camera tour with evidence is required for the work proof');
const tampered=structuredClone(after.catalog);
tampered.structures=tampered.structures.filter(s=>s.id!==tour.steps[0].selectedId);
assert.throws(()=>after.regionalTourResolvedFrames(tampered,tour));
assert.throws(()=>after.regionalTourEvidence(tampered,tour.steps[0].selectedId));
assert.throws(()=>after.regionalTourFrame(tampered,tour,0));
const sameCatalog=structuredClone(after.catalog);
const firstFrames=after.regionalTourResolvedFrames(sameCatalog,tour).frames;
const removedIndex=sameCatalog.structures.findIndex(s=>s.id===tour.steps[0].selectedId);
assert(removedIndex>=0);
const [removed]=sameCatalog.structures.splice(removedIndex,1);
assert.throws(()=>after.regionalTourResolvedFrames(sameCatalog,tour),'Mutated same-object source must be refused afresh');
sameCatalog.structures.splice(removedIndex,0,removed);
assert.deepEqual(after.regionalTourResolvedFrames(sameCatalog,tour).frames,firstFrames,
  'Restored same-object source must be admitted afresh');
for(const index of [-1,tour.steps.length,1.5,NaN]){
  assert.throws(()=>after.regionalTourFrame(after.catalog,tour,index),{message:'Invalid tour step.'});
  assert.throws(()=>before.regionalTourFrame(before.catalog,tour,index),{message:'Invalid tour step.'});
}
const withoutFrames=after.regionalTours.find(t=>!t.steps.some(step=>step.frameIds));
assert(withoutFrames);
assert.equal(after.regionalTourStepFrames(tampered,withoutFrames),undefined,'No explicit frames skips source resolution');
function countSourceScans(catalog,fn){
  const counted={...catalog,structures:[...catalog.structures]};
  const filter=counted.structures.filter.bind(counted.structures);
  let scans=0;
  counted.structures.filter=(...args)=>{scans++;return filter(...args);};
  fn(counted);
  return scans;
}
const singleScans=countSourceScans(after.catalog,c=>tour.steps.map((_,i)=>before.regionalTourFrame(c,tour,i)));
const batchScans=countSourceScans(after.catalog,c=>after.regionalTourResolvedFrames(c,tour));
assert(singleScans>batchScans&&batchScans>0,`Expected fewer exact source scans: ${singleScans} > ${batchScans}`);
const evidenceBefore=countSourceScans(after.catalog,c=>before.regionalTourEvidence(c,tour.steps[0].selectedId));
const evidenceAfter=countSourceScans(after.catalog,c=>after.regionalTourEvidence(c,tour.steps[0].selectedId));
assert(evidenceBefore>evidenceAfter&&evidenceAfter>0,`Expected fewer evidence source scans: ${evidenceBefore} > ${evidenceAfter}`);
console.log(JSON.stringify({registeredTours:after.regionalTours.length,admittedTours,refusedTours,
  admittedEvidence,refusedEvidence,singleScans,batchScans,evidenceBefore,evidenceAfter}));
