import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {test} from 'node:test';
import {context,hash,snapshot} from './pin-pica-clinical.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {beforeLaryngealImaging} from './laryngeal-imaging-history.mjs';
import pins from '../content/laryngeal-imaging-pins.json' with {type:'json'};
import transition from '../content/laryngeal-imaging-transition.json' with {type:'json'};

const current=await context({current:true});
const prior=beforeLaryngealImaging(current.api);

test('actual current API reconstructs the exact saved parent API',async()=>{
 assert.equal(hash(snapshot(current.api,current.display)),transition.currentAllLessonsAndRecipesHash);
 assert.equal(hash(snapshot(prior,current.display)),pins.previousAllLessonsAndRecipesHash);
 const saved=await exactSourceHistoryApi(pins.sourceCommit);
 const catalog=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
 assert.deepEqual(saved.bodyDisplayCatalog(catalog),current.display);
 assert.deepEqual(snapshot(saved,current.display),snapshot(prior,current.display));
 assert.equal(beforeLaryngealImaging(prior),prior);
});

test('only exact pinned identities and CT/MRI topics are rolled back',()=>{
 for(const entry of pins.entries)for(const topic of ['ct','mri']){
  const lesson=prior.bodyLesson(structuredClone(entry.identity),topic);
  assert.deepEqual(lesson,entry.previous[topic]);assert.equal(lesson.readiness,'pending');
  const {readiness:_readiness,...content}=lesson;assert.deepEqual(prior.bodyContent(entry.identity,topic),content);
 }
 const target=pins.entries[0],foreign=structuredClone(target.identity);foreign.name+=' foreign';
 const unrelated={id:'vm:test:untargeted'},foreignLesson={readiness:'draft',title:'foreign identity'},untargetedLesson={readiness:'draft',title:'untargeted'};
 const tracking={...current.api,bodyLesson(structure,topic){
  if(structure===foreign&&topic==='ct')return foreignLesson;
  if(structure===unrelated&&topic==='anatomy')return untargetedLesson;
  return current.api.bodyLesson(structure,topic);
 }};
 const historical=beforeLaryngealImaging(tracking);
 assert.equal(historical.bodyLesson(foreign,'ct'),foreignLesson);
 assert.equal(historical.bodyLesson(unrelated,'anatomy'),untargetedLesson);
 assert.equal(historical.dissectionProfiles,current.api.dissectionProfiles);
 assert.equal(historical.structures,current.api.structures);
});

test('mixed and foreign teaching states are rejected',()=>{
 const target=pins.entries[0],topic='ct';
 assert.throws(()=>beforeLaryngealImaging({...current.api,bodyLesson(structure,tab){
  return structure.id===target.identity.id&&tab===topic?structuredClone(target.previous[topic]):current.api.bodyLesson(structure,tab);
 }}),/Mixed laryngeal imaging history/);
 assert.throws(()=>beforeLaryngealImaging({...current.api,bodyLesson(structure,tab){
  const lesson=current.api.bodyLesson(structure,tab);
  return structure.id===target.identity.id&&tab===topic?{...lesson,body:lesson.body+' foreign'}:lesson;
 }}),/Unrecorded laryngeal imaging teaching/);
});

test('profiles-only APIs are unchanged',()=>{
 const api={dissectionProfiles:current.api.dissectionProfiles};
 assert.equal(beforeLaryngealImaging(api),api);
});
