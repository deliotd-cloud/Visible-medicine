import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {context,hash,snapshot} from './pin-pica-clinical.mjs';
import {beforeMetatarsalSurfaceImaging} from './metatarsal-surface-imaging-history.mjs';
import {beforeLesserToeXray} from './lesser-toe-xray-history.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {contentContext,contentValidator} from './content-contract-tools.mjs';
import {build} from './workspace-test-build.mjs';
import pins from '../content/metatarsal-surface-imaging-pins.json' with {type:'json'};
import transition from '../content/metatarsal-surface-imaging-transition.json' with {type:'json'};
import {
  metatarsalSurfaceReferences,
  metatarsalSurfaceScopeNote,
  metatarsalSurfaceSelections,
  metatarsalSurfaceTopics,
} from '../content/metatarsal-surface-imaging.ts';

const expected={
  FMA24507:'FJ3351',FMA24508:'FJ3241',FMA24509:'FJ3353',FMA24510:'FJ3244',FMA24511:'FJ3355',
  FMA24512:'FJ3247',FMA24513:'FJ3357',FMA24514:'FJ3250',FMA24515:'FJ3359',FMA24516:'FJ3253',
};
assert.deepEqual(Object.fromEntries(metatarsalSurfaceSelections.map(s=>[s.fmaId,s.file])),expected);
assert.equal(metatarsalSurfaceSelections.length,10);
assert(metatarsalSurfaceSelections.every(s=>s.topics.length===2&&s.topics[0]==='xray'&&s.topics[1]==='ultrasound'));
assert.deepEqual(metatarsalSurfaceSelections.map(s=>s.group),['first','first','central','central','central','central','central','central','fifth','fifth']);
assert.equal(metatarsalSurfaceScopeNote,'Draft orientation for revision-bound radiologist review. No radiograph, ultrasound examination, patient registration or clinical approval is loaded. Atlas, imaging-case and paid-lecture access remain independent.');

const {api:rawApi,display}=await context({current:true}),api=beforeLesserToeXray(rawApi),before=beforeMetatarsalSurfaceImaging(api);
assert.equal(transition.parentCommit,pins.sourceCommit);
assert.equal(transition.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
assert.equal(transition.entries.length,pins.entries.length);
assert.equal(hash(snapshot(api,display)),transition.currentAllLessonsAndRecipesHash);
assert.equal(hash(snapshot(before,display)),pins.previousAllLessonsAndRecipesHash);
const raw=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
const savedApi=await exactSourceHistoryApi(pins.sourceCommit),savedDisplay=savedApi.bodyDisplayCatalog(raw);
assert.deepEqual(savedDisplay,display);
assert.deepEqual(snapshot(savedApi,savedDisplay),snapshot(before,display));
assert.equal(beforeMetatarsalSurfaceImaging(before),before);
assert.equal(display.sourceVersion,pins.sourceVersion);
assert.equal(display.license,pins.license);
assert.deepEqual(display.coordinateSystem,pins.coordinateSystem);

const compiled=await build({
  stdin:{contents:"export {metatarsalSurfaceImagingLesson} from './lib/metatarsal-surface-imaging';export {bodyReviewMaterial} from './lib/body-review-material';export {acralBoneImagingGroups} from './content/acral-bone-imaging';",resolveDir:process.cwd(),loader:'ts'},
  bundle:true,write:false,platform:'node',format:'esm',
});
const {metatarsalSurfaceImagingLesson:lesson,bodyReviewMaterial,acralBoneImagingGroups}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const contracts=await contentContext(),body=contracts.api.bodyContentRecords(display);
const registry=new Map([...contracts.shoulder,...body].map(record=>[record.representationScope+'|'+record.id,record]));
const validate=await contentValidator(registry),selected=new Map(pins.entries.map(entry=>[entry.identity.id,entry]));
let changed=0,unchanged=0,rejected=0,reviewed=0;
for(const s of display.structures)for(const topic of api.contentTabs){
  const entry=selected.get(s.id),now=api.bodyLesson(s,topic),prior=before.bodyLesson(s,topic);
  if(!entry?.topics.includes(topic)){
    assert.equal(lesson(s,topic),undefined);
    assert.deepEqual(now,prior);
    unchanged++;
    continue;
  }
  changed++;
  assert.deepEqual(s,entry.identity);
  assert.deepEqual(prior,entry.previous[topic]);
  assert.equal(prior.readiness,'pending');
  assert.equal(now.readiness,'draft');
  assert.deepEqual(now,lesson(s,topic));
  const authored=metatarsalSurfaceTopics[entry.group][topic],imagingGroup=acralBoneImagingGroups[entry.imagingGroup];
  assert(imagingGroup);
  assert.equal(now.body,authored.body);
  assert.deepEqual(now.bullets,[...authored.bullets,imagingGroup.landmark,imagingGroup.limitation]);
  assert.deepEqual(now.citations,[...new Set([...authored.references.map(key=>metatarsalSurfaceReferences[key]),...imagingGroup.anatomyReferences])]);
  assert.equal(now.note,metatarsalSurfaceScopeNote);
  assert.equal(new Set(now.citations).size,now.citations.length);
  const rendered=api.bodyContent(s,topic),{readiness:_readiness,...expectedContent}=now;
  assert.deepEqual(rendered,expectedContent);
  const record=body.find(item=>item.id===s.id);
  assert(validate(record));
  assert.deepEqual(record.content[topic],now);
  assert.equal(record.validation.clinicalApproval,'not-included');
  const copy=structuredClone(now);
  now.bullets.length=0;
  now.citations.push('foreign');
  assert.deepEqual(lesson(s,topic),copy);
}
assert.equal(changed,20);
assert.equal(unchanged,9916);

const leaves=(value,path=[])=>value===null||typeof value!=='object'?[path]:Object.entries(value).flatMap(([key,child])=>leaves(child,[...path,key]));
for(const entry of pins.entries){
  for(const path of leaves(entry.identity)){
    const bad=structuredClone(entry.identity);let target=bad;
    for(const key of path.slice(0,-1))target=target[key];
    const key=path.at(-1),value=target[key];
    target[key]=typeof value==='number'?value+.01:typeof value==='string'?value+'-foreign':typeof value==='boolean'?!value:'foreign';
    for(const topic of entry.topics){assert.equal(lesson(bad,topic),undefined);rejected++;}
  }
  const review=await bodyReviewMaterial(entry.identity.id);
  assert.equal(review.approval,false);
  assert.deepEqual(review.source.structure,entry.identity);
  for(const topic of entry.topics){
    const {tab,...actual}=review.topics.find(item=>item.tab===topic);
    assert.deepEqual(actual,api.bodyLesson(entry.identity,topic));
    reviewed++;
  }
}

const sesamoids=Object.fromEntries(['FMA45097','FMA45098'].map(fma=>{
  const s=display.structures.find(item=>item.fmaId===fma);
  assert(s);
  assert.deepEqual(api.bodyLesson(s,'xray'),before.bodyLesson(s,'xray'));
  assert.deepEqual(api.bodyLesson(s,'ultrasound'),before.bodyLesson(s,'ultrasound'));
  assert.equal(api.bodyLesson(s,'xray').readiness,'pending');
  assert.equal(api.bodyLesson(s,'ultrasound').readiness,'pending');
  assert.equal(lesson(s,'xray'),undefined);
  assert.equal(lesson(s,'ultrasound'),undefined);
  return[fma,s.sources.map(source=>source.file)];
}));
assert.deepEqual(sesamoids,{FMA45097:['FJ3372','FJ3376'],FMA45098:['FJ3266','FJ3270']});

const first=pins.entries[0];
assert.throws(()=>beforeMetatarsalSurfaceImaging({...api,bodyLesson:(s,t)=>s.id===first.identity.id&&t==='xray'?first.previous.xray:api.bodyLesson(s,t)}),/Mixed/);
assert.throws(()=>beforeMetatarsalSurfaceImaging({...api,bodyLesson:(s,t)=>s.id===first.identity.id&&t==='xray'?{...api.bodyLesson(s,t),body:'foreign'}:api.bodyLesson(s,t)}),/Unrecorded/);
for(const bundle of pins.bundles){
  assert.deepEqual(display.bundles.find(item=>item.id===bundle.id),bundle);
  const bytes=await readFile('public'+bundle.url.split('?')[0]);
  assert.equal(bytes.length,bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);
}

assert.match(metatarsalSurfaceTopics.first.xray.body,/first metatarsal/);
assert.match(metatarsalSurfaceTopics.central.xray.body,/selected ray/);
assert.match(metatarsalSurfaceTopics.fifth.xray.body,/fifth-metatarsal base/);
assert.match(metatarsalSurfaceTopics.central.ultrasound.bullets.join(' '),/does not exclude a bone stress injury/);
assert.match(metatarsalSurfaceTopics.fifth.ultrasound.bullets.join(' '),/not a stand-alone exclusion test/);
const budgets={};
for(const group of Object.values(metatarsalSurfaceTopics))for(const topic of Object.values(group)){
  const words=[topic.body,...topic.bullets].join(' ').trim().split(/\s+/).length;
  for(const ref of topic.references)budgets[ref]=(budgets[ref]??0)+words;
}
for(const [ref,words] of Object.entries(budgets)){
  assert(words>0);
  assert(words<=200,ref+': '+words);
  assert.equal(new URL(metatarsalSurfaceReferences[ref]).protocol,'https:');
}

const report={
  source:pins.sourceCommit,selections:10,xrayPlacements:10,ultrasoundPlacements:10,draftPlacements:changed,
  unchangedTopics:unchanged,reviewedTopics:reviewed,rejectedIdentityLeafMutations:rejected,heldSesamoids:Object.keys(sesamoids),
  sourceWordBudgets:budgets,beforeHash:pins.previousAllLessonsAndRecipesHash,afterHash:transition.currentAllLessonsAndRecipesHash,
  geometryChanged:false,recipesChanged:false,clinicalApproval:false,browserAcceptance:false,
};
console.log(JSON.stringify(report));
