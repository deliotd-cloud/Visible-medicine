import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import pins from '../content/thoracoabdominal-organ-quiz-pins.json' with {type:'json'};
const before=await exactSourceHistoryApi(pins.baseline,'review-security');
const compiled=await build({stdin:{contents:`export {bodyLesson} from './app/body-content';
export {bodyDisplayCatalog} from './lib/body-display-catalog';
export * from './lib/body-review-material';
export * from './lib/body-review-context';
export * from './lib/body-review-response';
export * from './lib/body-review-decisions';
export * from './lib/body-review-api';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const now=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const display=now.bodyDisplayCatalog(JSON.parse(readFileSync('public/models/bodyparts3d/full-body/catalog.json')));
const targets=new Set(pins.entries.map(e=>e.identity.id));let changed=0,preserved=0,forged=0,stale=0,storageCalls=0;
for(const s of display.structures){
 const old=await before.bodyReviewMaterial(s.id),current=await now.bodyReviewMaterial(s.id);
 assert.deepEqual(current.source,old.source);assert.equal(current.fingerprints.source,old.fingerprints.source);
 assert.deepEqual(current.reasoning,old.reasoning);assert.deepEqual(current.guidedTours,old.guidedTours);
 assert.deepEqual(current.checklist,old.checklist);assert.equal(current.approval,false);
 if(!targets.has(s.id)){assert.deepEqual(current.topics,old.topics);assert.equal(current.fingerprints.teaching,old.fingerprints.teaching);preserved++;continue;}
 assert.notEqual(current.fingerprints.teaching,old.fingerprints.teaching);changed++;
 assert.deepEqual(current.topics.find(t=>t.tab==='quiz'),{tab:'quiz',...now.bodyLesson(s,'quiz')});
 assert(await now.parseBodyReviewResponse(current,s.id));
 for(const mutate of [
  p=>{p.topics.find(t=>t.tab==='quiz').correctAnswer='foreign';},
  p=>{p.topics.find(t=>t.tab==='quiz').explanation+=' foreign';},
  p=>{p.topics.find(t=>t.tab==='quiz').bullets.reverse();},
  p=>{p.topics.find(t=>t.tab==='quiz').citations=['https://foreign.example'];},
  p=>{p.topics=p.topics.filter(t=>t.tab!=='quiz');},
  p=>{p.source.structure.sources=[];},
 ]){const packet=structuredClone(current);mutate(packet);assert.equal(await now.parseBodyReviewResponse(packet,s.id),null);forged++;}
 const prior=await before.bodyReviewContext(s.id),context=await now.bodyReviewContext(s.id);
 assert.notEqual(context.revisions.teaching,prior.revisions.teaching);assert.equal(context.revisions.imaging,null);assert(context.teachingTabs.includes('quiz'));
 const packet={catalogScope:context.catalogScope,structureId:s.id,track:'teaching',expectedVersion:0,materialHash:context.materialHash,revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,draft:now.blankBodyReview(context,'teaching')};
 for(const oldHashes of [{materialHash:prior.materialHash,revisionHash:prior.revisions.teaching},{materialHash:prior.materialHash},{revisionHash:prior.revisions.teaching}]){
  const response=await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions',{method:'POST',headers:{origin:'https://atlas.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_ORGAN_QUIZ'},body:JSON.stringify({...packet,...oldHashes})}),{prepare(){storageCalls++;throw Error('Stale packet reached storage');}});
  assert.equal(response.status,409);stale++;
 }
}
assert.equal(changed,8);assert.equal(preserved,1096);assert.equal(forged,48);assert.equal(stale,24);assert.equal(storageCalls,0);
console.log(JSON.stringify({changedTeachingMaterials:changed,preservedTeachingMaterials:preserved,sourceAndGeometryUnchanged:true,forgedRefusals:forged,staleRefusals:stale,storageCalls,clinicalApproval:false}));
