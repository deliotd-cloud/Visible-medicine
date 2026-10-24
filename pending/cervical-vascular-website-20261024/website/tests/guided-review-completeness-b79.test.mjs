import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {resolve,relative,isAbsolute} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {runInNewContext} from 'node:vm';
import {build} from 'esbuild';
import {validateCurrentAtlasDelivery,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
import {assertCompleteGuidedReview} from './guided-review-completeness.mjs';

const site=fileURLToPath(new URL('../',import.meta.url));
const source='b79e110d2d28f18993263926ba35aa7a3f478b20';
const tree='0dd97cc55ef9aff3493b91752309d1d661c0b0c8';
const renalSource='2381efe43b75f8a7fb768a069eecd7268c508dac';
const sha=b=>createHash('sha256').update(b).digest('hex');
const json=p=>JSON.parse(readFileSync(p));
const wire=value=>JSON.parse(JSON.stringify(value));
const require=createRequire(resolve(site,'package.json'));
const git=(root,...args)=>execFileSync('git',['-C',root,...args],{windowsHide:true,maxBuffer:64e6,
 env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
let cached;
async function actualDelivery(){
 if(cached)return cached;
 const pin=validateCurrentAtlasDelivery();assert.equal(pin.source,source);assert.equal(pin.sourceTree,tree);
 const atlas=currentAtlasDeliveryRoot();
 const manifest=json(resolve(site,'atlas-review/manifest.json'));
 assert.equal(manifest.revision,source);assert.equal(manifest.files.length,1603);
 const binding=json(resolve(site,'atlas-review/integration-inputs.json'));
 assert.equal(binding.sourceCommit,source);assert.equal(binding.sha256,manifest.websiteIntegrationSha256);
 assert.equal(binding.sha256,sha(JSON.stringify(binding.inputs)));
 for(const row of binding.inputs){
  assert(!isAbsolute(row.path)&&!row.path.split(/[\\/]/).some(p=>!p||p==='.'||p==='..'));
  const target=resolve(site,row.path),local=relative(site,target);assert(local&&!local.startsWith('..')&&!isAbsolute(local));
  assert.equal(sha(readFileSync(target)),row.sha256,row.path);
 }
 const rendererPath='content/body-renderer-revision.json';
 const renderer=json(resolve(site,'atlas-review',rendererPath));
 const originalRenderer=JSON.parse(git(atlas,'show',`${source}:${rendererPath}`));
 assert.equal(renderer.sourceRendererSha256,originalRenderer.sha256);
 assert.equal(renderer.websiteIntegrationSha256,binding.sha256);
 assert.equal(renderer.sha256,sha(JSON.stringify({source:originalRenderer.sha256,website:binding.sha256})));
 const restored={...renderer,sha256:originalRenderer.sha256};delete restored.sourceRendererSha256;delete restored.websiteIntegrationSha256;
 assert.deepEqual(restored,originalRenderer,'Only the declared Website renderer binding differs');
 const result=await build({stdin:{contents:[
  "export * from './lib/regional-tours';",
  "export * from './lib/body-review-material';",
  "export * from './lib/body-review-response';",
  "export {sourceCanonical} from './lib/body-source-additions';",
  "export {bodyDisplayCatalog} from './lib/body-display-catalog';",
 ].join('\n'),resolveDir:resolve(site,'atlas-review'),loader:'ts'},bundle:true,write:false,metafile:true,
  format:'cjs',platform:'node',packages:'external'});
 const actualInputs=Object.keys(result.metafile.inputs).map(p=>p.replaceAll('\\','/'));
 assert(actualInputs.includes('<stdin>'),'Only the declared export-only virtual bridge is synthetic');
 assert(actualInputs.some(p=>p.endsWith('atlas-review/lib/body-review-material.ts')));
 assert(actualInputs.some(p=>p.endsWith('atlas-review/lib/body-review-response.ts')));
 assert(actualInputs.some(p=>p.endsWith('atlas-review/lib/regional-tours.ts')));
 const closure=[];
 for(const input of actualInputs){
  if(input==='<stdin>')continue;
  const absolute=resolve(site,input),local=relative(resolve(site,'atlas-review'),absolute).replaceAll('\\','/');
  assert(!local.startsWith('..')&&!isAbsolute(local),'Actual application closure must be imported Review source');
  const row=manifest.files.find(row=>row.path===local);assert(row,local);
  assert.equal(sha(readFileSync(absolute)),row.importedSha256,local);
  closure.push(row);
 }
 const blobs=execFileSync('git',['-C',atlas,'cat-file','--batch'],{input:closure.map(row=>`${source}:${row.path}\n`).join(''),
  windowsHide:true,maxBuffer:128e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 let offset=0;
 for(const row of closure){
  const end=blobs.indexOf(10,offset),header=blobs.subarray(offset,end).toString().match(/^[a-f0-9]{40} blob (\d+)$/);assert(header,row.path);
  const size=Number(header[1]),start=end+1;
  assert.equal(sha(blobs.subarray(start,start+size)),row.sourceSha256,row.path);
  assert.equal(blobs[start+size],10);offset=start+size+1;
 }
 assert.equal(offset,blobs.length);
 const module={exports:{}};
 runInNewContext(result.outputFiles[0].text,{module,exports:module.exports,require,
  crypto,TextEncoder,TextDecoder,Request,Response,structuredClone,URL,URLSearchParams});
 const current=module.exports;
 const {exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
 const historical=await exactSourceHistoryApi(renalSource,'regional-tour-review');
 const live=await exactSourceHistoryApi(source,'regional-tour-review',{
  [rendererPath]:readFileSync(resolve(site,'atlas-review',rendererPath)),
 });
 assert.deepEqual(wire(current.regionalTours),wire(live.regionalTours));
 assert.deepEqual(wire(current.regionalTours.slice(0,51)),wire(historical.regionalTours));
 const catalog=current.bodyDisplayCatalog(json(resolve(site,'atlas-review/public/models/bodyparts3d/full-body/catalog.json')));
 assert.equal(catalog.structures.length,1104);
 cached={current,historical,live,catalog,closureFiles:actualInputs.length};
 return cached;
}

// Test-only adversary can recompute transport hashes, but cannot change trusted
// source membership. No review decisions or storage are read or written.
function rehashTeaching(api,packet){
 const scope={schema:packet.schema,kind:packet.kind,structureId:packet.structureId};
 const digest=value=>sha(api.sourceCanonical(wire(value)));
 packet.fingerprints.teaching=digest({scope:{...scope,schema:'vm-body-review-worksheet-2'},
  topics:packet.topics,reasoning:packet.reasoning,...(packet.guidedTours.length?{guidedTours:packet.guidedTours}:{})});
 packet.materialHash=digest({scope,fingerprints:packet.fingerprints});
 return packet;
}

test('every current imported structure has all and only its complete source-bound Review guides',
 {timeout:300000},async()=>{
 const {current,historical,live,catalog,closureFiles}=await actualDelivery();
 const tours=wire(current.regionalTours);
 let structures=0,guidedStructures=0,placements=0,newStructures=0,newPlacements=0,omissionRefusals=0;
 const samples=[];
 for(const structure of catalog.structures){
  const oldGuides=wire(historical.regionalTourEvidence(historical.catalog,structure.id));
  const packet=wire(await current.bodyReviewMaterial(structure.id));
  const native=wire(await live.bodyReviewMaterial(structure.id));
  assert.deepEqual(packet,native,`${structure.id}: actual imported versus exact native packet`);
  assert.equal(packet.approval,false);assert.equal(packet.status,'worksheet-not-submitted');
  const checked=assertCompleteGuidedReview(structure.id,oldGuides,packet.guidedTours,tours);
  assert.deepEqual(wire(current.regionalTourEvidence(catalog,structure.id)),packet.guidedTours);
  structures++;placements+=checked.guideIds.length;newPlacements+=checked.addedIds.length;
  if(checked.guideIds.length){
   guidedStructures++;
   assert.deepEqual(rehashTeaching(current,wire(packet)),packet,'Adversarial rehash uses the genuine transport domains');
   assert.deepEqual(wire(await current.parseBodyReviewResponse(packet,structure.id)),packet);
   for(let index=0;index<packet.guidedTours.length;index++){
    const missing=wire(packet.guidedTours);missing.splice(index,1);
    assert.throws(()=>assertCompleteGuidedReview(structure.id,oldGuides,missing,tours),`${structure.id}: guide ${index} omission`);
    const bad=wire(packet);bad.guidedTours=missing;rehashTeaching(current,bad);
    assert.equal(await current.parseBodyReviewResponse(bad,structure.id),null,`${structure.id}: parser omission refusal`);
    omissionRefusals++;
   }
  }
  if(checked.addedIds.length){newStructures++;samples.push({id:structure.id,oldGuides,packet});}
 }
 assert.equal(structures,1104);assert.equal(newStructures,10);assert.equal(newPlacements,10);
 assert(guidedStructures>=314);assert.equal(omissionRefusals,placements);
 assert.equal(new Set(samples.map(sample=>sample.id)).size,10);
 console.log(JSON.stringify({structures,guidedStructures,placements,newStructures,newPlacements,omissionRefusals,closureFiles}));
});

test('complete-guide gate refuses empty, partial, duplicate, reordered, wrong-side and forged evidence',
 {timeout:300000},async()=>{
 const {current,historical,catalog}=await actualDelivery(),tours=wire(current.regionalTours);
 const hamstrings=tours.slice(51);
 assert.deepEqual(hamstrings.map(t=>t.id),['right-hamstring-orientation','left-hamstring-orientation']);
 let mutations=0;
 for(const tour of hamstrings){
  const members=[...tour.contextIds,...tour.steps.map(step=>step.selectedId)];
  assert.equal(members.length,5);
  for(const id of members){
   const oldGuides=wire(historical.regionalTourEvidence(historical.catalog,id));
   const packet=wire(await current.bodyReviewMaterial(id));
   assertCompleteGuidedReview(id,oldGuides,packet.guidedTours,tours);
   const added=packet.guidedTours.find(guide=>guide.tour.id===tour.id);assert(added);
   const variants=[[],packet.guidedTours.filter(guide=>guide.tour.id!==tour.id),
    [...packet.guidedTours,added], [...packet.guidedTours].reverse()];
   const opposite=hamstrings.find(other=>other.id!==tour.id);
   const wrong=wire(await current.bodyReviewMaterial(opposite.steps[0].selectedId));
   variants.push([...packet.guidedTours.filter(guide=>guide.tour.id!==tour.id),wrong.guidedTours.find(g=>g.tour.id===opposite.id)]);
   const forged=wire(packet.guidedTours);forged.find(g=>g.tour.id===tour.id).continuousPlayback.stepDurationsMs[0]=1;
   variants.push(forged);
   for(const value of variants){
    if(JSON.stringify(value)===JSON.stringify(packet.guidedTours))continue; // Reversal of a singleton is unchanged.
    assert.throws(()=>assertCompleteGuidedReview(id,oldGuides,value,tours));mutations++;
   }
   const omittedHistory=wire(oldGuides);if(omittedHistory.length){omittedHistory.pop();
    assert.throws(()=>assertCompleteGuidedReview(id,omittedHistory,packet.guidedTours,tours));mutations++;}
   const falseTourBank=wire(tours);falseTourBank.at(-1).steps[0].caption+=' forged';
   assert.throws(()=>assertCompleteGuidedReview(id,oldGuides,packet.guidedTours,falseTourBank));mutations++;
  }
 }
 const unaffected=catalog.structures.find(s=>!tours.some(t=>[...t.contextIds,...t.steps.map(step=>step.selectedId)].includes(s.id)));
 assert(unaffected);assert.deepEqual(assertCompleteGuidedReview(unaffected.id,[],[],tours),{guideIds:[],addedIds:[]});
 const forged=wire(await current.bodyReviewMaterial(hamstrings[0].steps[0].selectedId));
 assert.throws(()=>assertCompleteGuidedReview(unaffected.id,[],forged.guidedTours,tours));mutations++;
 assert(mutations>=61);console.log(JSON.stringify({independentMutationRefusals:mutations}));
});
