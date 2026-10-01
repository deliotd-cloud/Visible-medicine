import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
export const parentCommit='2f470a6a7e89163bc3b39ef8558888932d103673';
export const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export const snapshot=(api,display)=>({body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});
if(process.argv[1]?.replaceAll('\\','/').endsWith('/pin-cerebellar-mca-imaging.mjs')){
 const previous=await exactSourceHistoryApi(parentCommit);
 const raw=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
 const display=previous.bodyDisplayCatalog(raw);
 const entries=['FMA50519','FMA50520','FMA50574','FMA50575','FMA50082'].map(fma=>{
  const matches=display.structures.filter(s=>s.fmaId===fma);assert.equal(matches.length,1);
  const identity=matches[0];assert.equal(identity.bundle,'cranial-arteries');assert.equal(identity.system,'vessels');assert.equal(identity.region,'head-neck');
  const topics=['ct','mri'];const prior=Object.fromEntries(topics.map(t=>{const lesson=previous.bodyLesson(identity,t);assert.equal(lesson.readiness,'pending');return[t,lesson];}));
  const group=fma==='FMA50082'?'mca':fma==='FMA50519'||fma==='FMA50520'?'pica':'sca';
  return {identity,group,topics,previous:prior};
 });
 const bundles=display.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));assert.equal(bundles.length,1);
 for(const bundle of bundles){const bytes=await readFile('public'+bundle.url.split('?')[0]);assert.equal(bytes.length,bundle.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);}
 const pins={parentCommit,sourceVersion:display.sourceVersion,license:display.license,coordinateSystem:display.coordinateSystem,bundles,previousAllLessonsAndRecipesHash:hash(snapshot(previous,display)),entries};
 const path='content/cerebellar-mca-imaging-pins.json';
 if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(await readFile(path)),pins);
 else await writeFile(path,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({targets:entries.length,topics:10,pinsHash:hash(pins)}));
}
