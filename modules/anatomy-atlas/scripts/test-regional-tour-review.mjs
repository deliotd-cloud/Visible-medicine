import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
const compile=async contents=>{const r=await build({stdin:{contents,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});return import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'));};
const api=await compile(`export * from './lib/regional-tours';export * from './lib/body-review-material';export * from './lib/body-review-context';export * from './lib/body-review-response';export * from './lib/body-review-decisions';import raw from './public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);`);
// Keep all fourteen prior definitions/context/captions unchanged. Shared context
// gains another reviewed tour; previous individual tour evidence stays exact.
const parent='8da967df7f4f419014ea03b323d239732a787be1';
assert.equal(readFileSync('lib/chest-wall-tour.ts','utf8').replace(/\r/g,''),execFileSync('git',['show',parent+':lib/chest-wall-tour.ts'],{encoding:'utf8'}).replace(/\r/g,''));
const priorTours=await compile(execFileSync('git',['show',parent+':lib/regional-tours.ts'],{encoding:'utf8'}).replaceAll("from './","from './lib/"));
assert.equal(readFileSync('lib/orbital-tour.ts','utf8').replace(/\r/g,''),execFileSync('git',['show',parent+':lib/orbital-tour.ts'],{encoding:'utf8'}).replace(/\r/g,''));
assert.deepEqual(api.regionalTours.filter(t=>![api.maleDuctTour.id,api.deepBrainTour.id].includes(t.id)),priorTours.regionalTours);
for(const s of priorTours.regionalTours.flatMap(t=>priorTours.regionalTourStructures(api.catalog,t))){
 assert.deepEqual(api.regionalTourEvidence(api.catalog,s.id).filter(e=>![api.maleDuctTour.id,api.deepBrainTour.id].includes(e.tour.id)),priorTours.regionalTourEvidence(api.catalog,s.id),'Every prior individual tour retains its evidence');
}
const oldParser=await compile(execFileSync('git',['show','6b1539f:lib/body-review-response.ts'],{encoding:'utf8'}).replaceAll("from './","from './lib/"));
const canonical=v=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
const digest=v=>createHash('sha256').update(canonical(JSON.parse(JSON.stringify(v)))).digest('hex');
const selected=api.regionalTourStructures(api.catalog,api.thoraxTour);
assert.equal(selected.length,8);assert.equal(api.thoraxTour.steps.length,6);
const cervical=api.regionalTourStructures(api.catalog,api.cervicalSpineTour);
assert.equal(cervical.length,8);assert.equal(api.cervicalSpineTour.steps.length,5);
assert.equal(new Set(cervical.map(s=>s.bundle)).size,1);
assert.equal(api.regionalTourFor('spine').id,api.cervicalSpineTour.id);
assert.equal(api.regionalTourFor('head-neck').id,'laryngeal-framework-orientation','Head-neck has its own tour, not a duplicate spine tour');
const abdominal=api.regionalTourStructures(api.catalog,api.celiacTour);
assert.equal(abdominal.length,6);assert.equal(api.celiacTour.steps.length,5);
assert.equal(api.regionalTourFor('abdomen').id,api.celiacTour.id);
const celiac=abdominal.find(s=>s.id===api.celiacTour.steps[0].selectedId);
assert.equal(celiac.bundle,'celiac-display-corrected');
assert.equal(new Set(abdominal.map(s=>s.bundle)).size,2);
const forearm=api.regionalTourStructures(api.catalog,api.forearmTour);
const forearmMuscles=['right-brachioradialis','right-extensor-digitorum','right-flexor-carpi-radialis','right-flexor-digitorum-superficialis','right-pronator-quadratus'].map(name=>`vm:anatomy:body:forearm:right:muscle:${name}`);
const forearmBones=['right-radius','right-ulna'].map(name=>`vm:anatomy:body:forearm:right:bone:${name}`);
assert.equal(api.forearmTour.id,'right-forearm-muscle-orientation');assert.equal(api.forearmTour.revision,'right-forearm-muscle-orientation-v1');
assert.equal(api.forearmTour.status,'draft');assert.equal(api.forearmTour.region,'forearm');
assert.equal(api.regionalTourFor('forearm').id,api.forearmTour.id);
assert.deepEqual(api.forearmTour.steps.map(s=>s.selectedId),forearmMuscles);
assert.deepEqual(api.forearmTour.contextIds,forearmBones);
assert.deepEqual(forearm.map(s=>s.id).sort(),[...forearmBones,...forearmMuscles].sort());
assert.deepEqual([...new Set(forearm.map(s=>s.bundle))].sort(),['forearm-muscles','forearm-skeleton']);
assert(forearm.every(s=>s.laterality==='right'&&!s.id.includes(':nerve:')));
assert.deepEqual(api.forearmTour.steps.map(s=>s.view),['right','posterior','anterior','anterior','anterior']);
for(const step of api.forearmTour.steps){assert.deepEqual(step.frameIds,[step.selectedId]);assert.equal(step.fadeOthers,true);}
const limbCases=[
 {region:'thigh',names:['right-rectus-femoris','right-vastus-lateralis','right-adductor-longus','long-head-of-right-biceps-femoris','right-semitendinosus'],views:['anterior','right','left','posterior','posterior'],bones:['right-femur'],bundles:['thigh-muscles','thigh-muscles-dissection','thigh-skeleton']},
 {region:'leg',names:['right-tibialis-anterior','right-extensor-digitorum-longus','right-fibularis-longus','right-soleus','right-tibialis-posterior'],views:['anterior','anterior','right','posterior','posterior'],bones:['right-tibia','right-fibula'],bundles:['leg-muscles','leg-skeleton']},
 {region:'hand',names:['right-abductor-pollicis-brevis','right-opponens-pollicis','abductor-digiti-minimi-of-right-hand','flexor-digiti-minimi-brevis-of-right-hand','opponens-digiti-minimi-of-right-hand'],views:Array(5).fill('anterior'),bones:['right-first-metacarpal-bone','right-fifth-metacarpal-bone'],bundles:['hand-muscles','hand-skeleton']},
  {region:'foot',names:['right-extensor-hallucis-brevis','right-abductor-hallucis','right-flexor-digitorum-brevis','abductor-digiti-minimi-of-right-foot','right-flexor-accessorius'],views:['superior','inferior','inferior','inferior','inferior'],bones:['right-calcaneus','right-first-metatarsal-bone','right-fifth-metatarsal-bone'],bundles:['foot-muscles','foot-skeleton']},
  {region:'shoulder-arm',exportName:'upperArmTour',id:'right-upper-arm-muscle-orientation',bonePrefix:'vm:anatomy:upper-limb:shoulder:right:bone:',names:['long-head-of-right-biceps-brachii','short-head-of-right-biceps-brachii','right-brachialis','long-head-of-right-triceps-brachii','lateral-head-of-right-triceps-brachii','medial-head-of-right-triceps-brachii'],views:['anterior','anterior','anterior','posterior','posterior','posterior'],bones:['humerus','scapula'],bundles:['shoulder-arm-muscles','shoulder-arm-muscles-dissection','shoulder-arm-skeleton']},
];
for(const spec of limbCases){
 const tour=api[spec.exportName??`${spec.region}Tour`],ids=spec.names.map(name=>`vm:anatomy:body:${spec.region}:right:muscle:${name}`),bones=spec.bones.map(name=>(spec.bonePrefix??`vm:anatomy:body:${spec.region}:right:bone:`)+name);
 const structures=api.regionalTourStructures(api.catalog,tour);
 assert.equal(tour.id,spec.id??`right-${spec.region}-muscle-orientation`);assert.equal(tour.revision,`${tour.id}-v1`);
 assert.equal(tour.status,'draft');assert.equal(tour.region,spec.region);assert.equal(api.regionalTourFor(spec.region).id,tour.id);
 assert.deepEqual(tour.steps.map(s=>s.selectedId),ids);assert.deepEqual(tour.steps.map(s=>s.view),spec.views);assert.deepEqual(tour.contextIds,bones);
 assert.deepEqual(structures.map(s=>s.id).sort(),[...ids,...bones].sort());assert.deepEqual([...new Set(structures.map(s=>s.bundle))].sort(),spec.bundles);
 assert(structures.every(s=>s.laterality==='right'));
 for(const step of tour.steps){assert.deepEqual(step.frameIds,[step.selectedId]);assert.equal(step.fadeOthers,true);assert.equal(step.durationMs,14000);}
}
const oldTours=await compile(execFileSync('git',['show','82dee8b:lib/regional-tours.ts'],{encoding:'utf8'}).replaceAll("from './","from './lib/"));
assert.deepEqual(api.regionalTourEvidence(api.catalog,selected[0].id),oldTours.regionalTourEvidence(api.catalog,selected[0].id),'Existing thorax evidence unchanged');
assert.deepEqual(api.regionalTourEvidence(api.catalog,cervical[0].id),oldTours.regionalTourEvidence(api.catalog,cervical[0].id),'Existing cervical evidence unchanged');
for(const s of oldTours.regionalTours.flatMap(t=>oldTours.regionalTourStructures(api.catalog,t)))assert.deepEqual(api.regionalTourEvidence(api.catalog,s.id),oldTours.regionalTourEvidence(api.catalog,s.id),'All 65 prior tour member evidence unchanged');
let checked=0;
for(const s of api.catalog.structures){
 const m=await api.bodyReviewMaterial(s.id),c=await api.bodyReviewContext(s.id);
 assert(api.parseBodyReviewResponse(m,s.id));
 assert.equal(oldParser.parseBodyReviewResponse(m,s.id),null,'Old UI cannot silently omit guided review');
 const scope={schema:'vm-body-review-worksheet-2',kind:m.kind,structureId:s.id};
 const previous=digest({scope,topics:m.topics,reasoning:m.reasoning});
 const priorEvidence=priorTours.regionalTourEvidence(api.catalog,s.id);
 const beforeDuct=digest({scope,topics:m.topics,reasoning:m.reasoning,...(priorEvidence.length?{guidedTours:priorEvidence}:{})});
 const gainsDuct=[...api.maleDuctTour.contextIds,...api.maleDuctTour.steps.map(step=>step.selectedId)].includes(s.id);
 const gainsBrain=[...api.deepBrainTour.contextIds,...api.deepBrainTour.steps.map(step=>step.selectedId)].includes(s.id);
 if(gainsDuct||gainsBrain)assert.notEqual(m.fingerprints.teaching,beforeDuct,'New tour teaching requires fresh review');
 else assert.equal(m.fingerprints.teaching,beforeDuct,'No unrelated teaching review is invalidated');
 const tours=api.regionalTours.filter(t=>[...t.contextIds,...t.steps.map(step=>step.selectedId)].includes(s.id));
 if(tours.length){
  assert.equal(m.guidedTours.length,tours.length);assert.notEqual(m.fingerprints.teaching,previous);
  assert(c.checklists.teaching.some(v=>v.id==='guided-tour'));
  assert.equal(m.guidedTours[0].structures.length,api.regionalTourStructures(api.catalog,tours[0]).length);
  assert.equal(m.guidedTours[0].tour.steps.length,tours[0].steps.length);checked++;
 }else{assert.equal(m.guidedTours.length,0);assert.equal(m.fingerprints.teaching,previous,'Unrelated teaching history retained');assert(!c.checklists.teaching.some(v=>v.id==='guided-tour'));}
 assert.equal(c.revisions.imaging,null);
}
assert.equal(api.catalog.structures.length,1104);assert.equal(checked,114);assert.equal(api.regionalTours.length,16);
const orbitalStructures=api.regionalTourStructures(api.catalog,api.orbitalTour);
assert.equal(orbitalStructures.length,7);assert.equal(api.regionalToursFor('head-neck').length,4);
let orbitalRejected=0;
for(const structure of orbitalStructures){
 const packet=await api.bodyReviewMaterial(structure.id);
 assert.equal(packet.approval,false);assert.equal(packet.guidedTours.length,1);
 assert.deepEqual(packet.guidedTours,api.regionalTourEvidence(api.catalog,structure.id));
 assert.equal(packet.guidedTours[0].stepFrames.length,6);
 for(const mutate of [
  p=>p.guidedTours[0].tour.steps.reverse(),p=>p.guidedTours[0].tour.contextIds=[],
  p=>delete p.guidedTours[0].tour.requiredDisplayBundles,
  p=>p.guidedTours[0].stepFrames[0].min[0]-=1,
  p=>p.guidedTours[0].tour.steps[0].caption+=' changed',
  p=>p.guidedTours[0].structures.find(s=>s.id!==structure.id).sources[0].sha256='0'.repeat(64),
 ]){const altered=structuredClone(packet);mutate(altered);assert.equal(api.parseBodyReviewResponse(altered,structure.id),null);orbitalRejected++;}
}
assert.equal(orbitalRejected,42);
const intrinsic=api.regionalTourStructures(api.catalog,api.intrinsicLarynxTour);
assert.equal(intrinsic.length,10);assert.equal(api.intrinsicLarynxTour.steps.length,7);
let intrinsicRejected=0,sharedContext=0;
for(const structure of intrinsic){
 const packet=await api.bodyReviewMaterial(structure.id);
 const index=packet.guidedTours.findIndex(e=>e.tour.id===api.intrinsicLarynxTour.id);
 assert(index>=0);assert.equal(packet.approval,false);
 assert.equal(packet.guidedTours[index].stepFrames.length,7);
 const context=api.intrinsicLarynxTour.contextIds.includes(structure.id);
 assert.equal(packet.guidedTours.length,context?2:1);
 if(context){sharedContext++;
  assert.deepEqual(packet.guidedTours.find(e=>e.tour.id===api.larynxTour.id),priorTours.regionalTourEvidence(api.catalog,structure.id)[0]);
 }
 for(const mutate of [
  p=>p.guidedTours.splice(index,1),
  p=>p.guidedTours.push(structuredClone(p.guidedTours[index])),
  p=>p.guidedTours[index].tour.steps.reverse(),
  p=>p.guidedTours[index].tour.steps[0].caption+=' changed',
  p=>p.guidedTours[index].stepFrames[6].max[0]+=1,
  p=>p.guidedTours[index].structures.find(s=>s.id!==structure.id).sources[0].sha256='0'.repeat(64),
  p=>p.guidedTours[index].tour.contextIds=[],
 ]){const altered=structuredClone(packet);mutate(altered);assert.equal(api.parseBodyReviewResponse(altered,structure.id),null);intrinsicRejected++;}
 if(context){const altered=structuredClone(packet);altered.guidedTours=altered.guidedTours.filter(e=>e.tour.id!==api.larynxTour.id);assert.equal(api.parseBodyReviewResponse(altered,structure.id),null);intrinsicRejected++;}
}
assert.equal(sharedContext,3);assert.equal(intrinsicRejected,73);
const chestStructures=api.regionalTourStructures(api.catalog,api.chestWallTour);
assert.equal(chestStructures.length,9);assert.equal(api.regionalToursFor('thorax').length,2);
assert.equal(api.regionalTourFor('thorax').id,api.thoraxTour.id,'The original airway tour remains the regional default');
let chestInvalidPackets=0;
for(const structure of chestStructures){
 const packet=await api.bodyReviewMaterial(structure.id);
 assert.equal(packet.approval,false);
 assert.deepEqual(packet.guidedTours,api.regionalTourEvidence(api.catalog,structure.id));
 assert.equal(packet.guidedTours.length,1);assert.equal(packet.guidedTours[0].stepFrames.length,6);
 for(const mutate of [
  p=>p.guidedTours[0].tour.steps.reverse(),
  p=>p.guidedTours[0].tour.steps[0].caption+=' changed',
  p=>p.guidedTours[0].tour.contextIds=[],
  p=>delete p.guidedTours[0].tour.requiredDisplayBundles,
  p=>p.guidedTours[0].stepFrames[3].min[0]-=1,
  p=>p.guidedTours[0].structures.find(s=>s.id!==structure.id).sources[0].sha256='0'.repeat(64),
 ]){const altered=structuredClone(packet);mutate(altered);assert.equal(api.parseBodyReviewResponse(altered,structure.id),null);chestInvalidPackets++;}
}
assert.equal(chestInvalidPackets,54);
const sample=await api.bodyReviewMaterial(selected[0].id);
for(const mutate of [p=>delete p.guidedTours,p=>p.guidedTours=[],p=>p.guidedTours.push(structuredClone(p.guidedTours[0])),p=>p.schema='vm-body-review-worksheet-2',p=>p.guidedTours[0].tour.steps[0].references=['javascript:alert(1)'],p=>p.guidedTours[0].tour.steps[0].selectedId='missing',p=>p.guidedTours[0].structures[0].sources[0].sha256='0'.repeat(64),p=>p.guidedTours[0].transitionMs=0,p=>p.guidedTours[0].tour.steps[0].durationMs=-1]){
 const p=structuredClone(sample);mutate(p);assert.equal(api.parseBodyReviewResponse(p,selected[0].id),null);
}
const ev=api.regionalTourEvidence(api.catalog,selected[0].id);ev[0].tour.steps[0].caption='changed';assert.notEqual(api.thoraxTour.steps[0].caption,'changed');
for(const s of selected) {const missing={...api.catalog,structures:api.catalog.structures.filter(v=>v.id!==s.id)};assert.throws(()=>api.regionalTourStructures(missing,api.thoraxTour));}
for(const s of cervical) {const missing={...api.catalog,structures:api.catalog.structures.filter(v=>v.id!==s.id)};assert.throws(()=>api.regionalTourStructures(missing,api.cervicalSpineTour));}
const spinePacket=await api.bodyReviewMaterial(cervical[0].id);
for(const mutate of [p=>p.guidedTours[0].tour.limitations='Approved',p=>p.guidedTours[0].limitations='Approved',p=>p.guidedTours[0].tour.contextIds=[],p=>p.guidedTours[0].tour.steps.reverse()]){
 const p=structuredClone(spinePacket);mutate(p);assert.equal(api.parseBodyReviewResponse(p,cervical[0].id),null);
}
for(const s of abdominal) {const missing={...api.catalog,structures:api.catalog.structures.filter(v=>v.id!==s.id)};assert.throws(()=>api.regionalTourStructures(missing,api.celiacTour));}
const wrongDisplay=structuredClone(api.catalog);wrongDisplay.structures.find(s=>s.id===celiac.id).bundle='abdomen-vessels-recovery';
assert.throws(()=>api.regionalTourStructures(wrongDisplay,api.celiacTour),'Never fall back to archived duplicate geometry');
const missingDisplay={...api.catalog,bundles:api.catalog.bundles.filter(b=>b.id!==celiac.bundle)};
assert.throws(()=>api.regionalTourStructures(missingDisplay,api.celiacTour));
const abdominalPacket=await api.bodyReviewMaterial(celiac.id);
const tampered=structuredClone(abdominalPacket);delete tampered.guidedTours[0].tour.requiredDisplayBundles;
assert.equal(api.parseBodyReviewResponse(tampered,celiac.id),null);
assert.equal(abdominalPacket.guidedTours[0].stepFrames.length,5);
for(const mutate of [p=>delete p.guidedTours[0].stepFrames,p=>p.guidedTours[0].stepFrames[0].min[0]-=1,p=>p.guidedTours[0].tour.steps[0].frameIds=[]]){
 const p=structuredClone(abdominalPacket);mutate(p);assert.equal(api.parseBodyReviewResponse(p,celiac.id),null);
}
for(const frameIds of [[],['missing'],[celiac.id,celiac.id],[api.celiacTour.contextIds[0]]]) {
 const tour=structuredClone(api.celiacTour);tour.steps[0].frameIds=frameIds;assert.throws(()=>api.regionalTourFrame(api.catalog,tour,0));
}
for(const s of forearm){const missing={...api.catalog,structures:api.catalog.structures.filter(v=>v.id!==s.id)};assert.throws(()=>api.regionalTourStructures(missing,api.forearmTour));}
const forearmPacket=await api.bodyReviewMaterial(forearmMuscles[0]);
const forearmEvidence=forearmPacket.guidedTours[0];
assert.deepEqual(forearmEvidence,api.regionalTourEvidence(api.catalog,forearmMuscles[0])[0]);
assert.equal(forearmEvidence.transitionMs,1800);assert.equal(forearmEvidence.separation,0);assert.equal(forearmEvidence.stepFrames.length,5);
for(let i=0;i<5;i++)assert.deepEqual(forearmEvidence.stepFrames[i],api.regionalTourFrame(api.catalog,api.forearmTour,i));
for(const [label,mutate] of [['caption',p=>p.guidedTours[0].tour.steps[0].caption='Changed teaching'],['frame bounds',p=>p.guidedTours[0].stepFrames[0].min[0]-=1],['frame target',p=>p.guidedTours[0].tour.steps[0].frameIds=[forearmMuscles[1]]],['context side',p=>p.guidedTours[0].structures[0].laterality='left'],['unknown context side',p=>p.guidedTours[0].structures[0].laterality='unknown'],['missing context side',p=>delete p.guidedTours[0].structures[0].laterality],['selected side',p=>p.guidedTours[0].tour.steps[0].selectedId=forearmMuscles[0].replace(':right:',':left:')]]){
 const p=structuredClone(forearmPacket);mutate(p);assert.equal(api.parseBodyReviewResponse(p,forearmMuscles[0])===null,true,`Reject altered forearm ${label}`);
}
let limbInvalidPackets=0,limbMissingSources=0,limbInvalidFrames=0;
for(const spec of limbCases){
 const tour=api[spec.exportName??`${spec.region}Tour`],id=tour.steps[0].selectedId,packet=await api.bodyReviewMaterial(id),evidence=packet.guidedTours[0];
 assert.deepEqual(evidence,api.regionalTourEvidence(api.catalog,id)[0]);
 assert.equal(evidence.transitionMs,1800);assert.equal(evidence.separation,0);assert.equal(evidence.stepFrames.length,tour.steps.length);
 for(let i=0;i<tour.steps.length;i++)assert.deepEqual(evidence.stepFrames[i],api.regionalTourFrame(api.catalog,tour,i));
 for(const s of api.regionalTourStructures(api.catalog,tour)){
  const missing={...api.catalog,structures:api.catalog.structures.filter(v=>v.id!==s.id)};
  assert.throws(()=>api.regionalTourStructures(missing,tour));limbMissingSources++;
 }
 for(const [label,mutate] of [
  ['caption',p=>p.guidedTours[0].tour.steps[0].caption='Changed teaching'],
  ['revision',p=>p.guidedTours[0].tour.revision+='-changed'],
  ['step order',p=>p.guidedTours[0].tour.steps.reverse()],
  ['limitations',p=>p.guidedTours[0].tour.limitations='Approved'],
  ['context',p=>p.guidedTours[0].tour.contextIds=[]],
  ['frame bounds',p=>p.guidedTours[0].stepFrames[0].min[0]-=1],
  ['missing frames',p=>delete p.guidedTours[0].stepFrames],
  ['frame target',p=>p.guidedTours[0].tour.steps[0].frameIds=[tour.steps[1].selectedId]],
  ['context side',p=>p.guidedTours[0].structures[0].laterality='left'],
  ['unknown side',p=>p.guidedTours[0].structures[0].laterality='unknown'],
  ['missing side',p=>delete p.guidedTours[0].structures[0].laterality],
  ['selected side',p=>p.guidedTours[0].tour.steps[0].selectedId=id.replace(':right:',':left:')],
  ['selected source digest',p=>p.guidedTours[0].structures.find(s=>s.id===id).sources[0].sha256='0'.repeat(64)],
  ['context source digest',p=>p.guidedTours[0].structures.find(s=>s.id===tour.contextIds[0]).sources[0].sha256='0'.repeat(64)],
  ['context bounds',p=>p.guidedTours[0].structures.find(s=>s.id===tour.contextIds[0]).bounds.min[0]-=1],
  ['context node name',p=>p.guidedTours[0].structures.find(s=>s.id===tour.contextIds[0]).nodeName+='-changed'],
  ['coordinate system',p=>p.guidedTours[0].coordinateSystem.unitsPerMillimetre*=2],
  ['source version',p=>p.guidedTours[0].sourceVersion+='-changed'],
  ['nonselected bundle digest',p=>p.guidedTours[0].bundles.find(b=>b.id!==p.source.bundle.id).sha256='0'.repeat(64)],
 ]){
  const p=structuredClone(packet);mutate(p);assert.equal(api.parseBodyReviewResponse(p,id),null,`Reject altered ${spec.region} ${label}`);limbInvalidPackets++;
 }
 for(const frameIds of [[],['missing'],[id,id],[tour.contextIds[0]]]){
  const altered=structuredClone(tour);altered.steps[0].frameIds=frameIds;assert.throws(()=>api.regionalTourFrame(api.catalog,altered,0));limbInvalidFrames++;
 }
}
assert.equal(limbMissingSources,36);assert.equal(limbInvalidPackets,95);assert.equal(limbInvalidFrames,20);
let visceralMissing=0,visceralInvalid=0;
for(const [tour,expectedId,count,bundles] of [
 [api.larynxTour,'laryngeal-framework-orientation',6,['head-neck-connective-recovery','head-neck-organs-visceral-detail','head-neck-skeleton']],
 [api.malePelvisTour,'male-pelvic-viscera-orientation',8,['pelvis-organs','pelvis-organs-recovery','pelvis-skeleton','spine-skeleton']],
]){
 assert.equal(tour.id,expectedId);assert.equal(tour.revision,expectedId+'-v1');assert.equal(tour.status,'draft');
 const structures=api.regionalTourStructures(api.catalog,tour);
 assert.equal(structures.length,count);assert.equal(tour.steps.length,5);
 assert.deepEqual([...new Set(structures.map(s=>s.bundle))].sort(),bundles);
 assert(!structures.some(s=>/female|independent|ureter|urethra/i.test(s.id)));
 for(const structure of structures){
  const missing={...api.catalog,structures:api.catalog.structures.filter(s=>s.id!==structure.id)};
  assert.throws(()=>api.regionalTourStructures(missing,tour));visceralMissing++;
  const packet=await api.bodyReviewMaterial(structure.id);
  assert.deepEqual(packet.guidedTours[0],api.regionalTourEvidence(api.catalog,structure.id)[0]);
  for(const mutate of [
   p=>p.guidedTours[0].tour.steps.reverse(),
   p=>p.guidedTours[0].tour.limitations='Approved anatomy',
   p=>p.guidedTours[0].tour.steps[0].caption+=' changed',
   p=>p.guidedTours[0].structures.find(s=>s.id!==structure.id).sources[0].sha256='0'.repeat(64),
   p=>p.guidedTours[0].stepFrames[0].min[0]-=1,
   p=>p.guidedTours[0].tour.contextIds=['independent-female-pelvis'],
   p=>p.guidedTours[0].sourceVersion+='-mixed-source',
  ]){const altered=structuredClone(packet);mutate(altered);assert.equal(api.parseBodyReviewResponse(altered,structure.id),null);visceralInvalid++;}
 }
 for(let i=0;i<5;i++){
  assert.deepEqual(tour.steps[i].frameIds,[tour.steps[i].selectedId]);
  assert.equal(tour.steps[i].durationMs,14000);
  assert.deepEqual(api.regionalTourEvidence(api.catalog,tour.steps[i].selectedId)[0].stepFrames[i],api.regionalTourFrame(api.catalog,tour,i));
 }
}
assert.equal(visceralMissing,14);assert.equal(visceralInvalid,98);

const ductStructures=api.regionalTourStructures(api.catalog,api.maleDuctTour);
assert.equal(ductStructures.length,8);assert.equal(api.regionalToursFor('pelvis').length,2);
let ductRejected=0,sharedPelvic=0;
for(const structure of ductStructures){
 const packet=await api.bodyReviewMaterial(structure.id),index=packet.guidedTours.findIndex(e=>e.tour.id===api.maleDuctTour.id);
 assert(index>=0);assert.equal(packet.approval,false);assert.equal(packet.guidedTours[index].stepFrames.length,6);
 const prior=priorTours.regionalTourEvidence(api.catalog,structure.id);
 assert.equal(packet.guidedTours.length,prior.length+1);
 assert.deepEqual(packet.guidedTours.filter(e=>e.tour.id!==api.maleDuctTour.id),prior);
 if(prior.length){sharedPelvic++;const p=structuredClone(packet);p.guidedTours=[p.guidedTours[index]];assert.equal(api.parseBodyReviewResponse(p,structure.id),null);ductRejected++;}
 for(const mutate of [
  p=>p.guidedTours.splice(index,1),p=>p.guidedTours.push(structuredClone(p.guidedTours[index])),
  p=>p.guidedTours[index].tour.steps.reverse(),p=>p.guidedTours[index].tour.steps[0].caption+=' changed',
  p=>p.guidedTours[index].tour.revision+='-foreign',p=>p.guidedTours[index].tour.limitations='Approved',
  p=>p.guidedTours[index].stepFrames[5].max[0]+=1,
  p=>p.guidedTours[index].structures[0].sources[0].sha256='0'.repeat(64),
  p=>p.guidedTours[index].tour.contextIds=[],
  p=>p.guidedTours[index].structures[0].laterality='unknown',
  p=>p.guidedTours[index].tour.requiredDisplayBundles={},
 ]){const altered=structuredClone(packet);mutate(altered);assert.equal(api.parseBodyReviewResponse(altered,structure.id),null);ductRejected++;}
}
assert.equal(sharedPelvic,3);assert.equal(ductRejected,91);

console.log(JSON.stringify({ductRejected,sharedPelvic,reviewed:api.catalog.structures.length,tourBound:checked,otherTeachingUnchanged:api.catalog.structures.length-checked,priorTourEvidenceUnchanged:65,priorTourDefinitionsUnchanged:14,sharedContext,invalidPacketsRejected:24+limbInvalidPackets+visceralInvalid+chestInvalidPackets+orbitalRejected+intrinsicRejected,missingSourcesRejected:29+limbMissingSources+visceralMissing,wrongOrMissingDisplayRejected:2,invalidFramesRejected:4+limbInvalidFrames}));
