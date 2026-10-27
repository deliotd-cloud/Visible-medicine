import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

const pins=JSON.parse(readFileSync('content/pharyngeal-mri-pins.json'));
const before=await exactSourceHistoryApi(pins.parentCommit,'review-security');
const compiled=await build({stdin:{contents:`
export {bodyLesson} from './app/body-content';
export * from './lib/body-review-material';
export * from './lib/body-review-context';
export * from './lib/body-review-response';
export * from './lib/body-review-api';
export * from './lib/body-review-decisions';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const now=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
let worksheets=0,stale=0,tampered=0,storageCalls=0;
for(const {identity:s} of pins.entries){
  const old=await before.bodyReviewMaterial(s.id),current=await now.bodyReviewMaterial(s.id);
  assert.equal(current.approval,false);
  for(const key of ['source','reasoning','guidedTours','checklist'])assert.deepEqual(current[key],old[key]);
  assert.equal(current.fingerprints.source,old.fingerprints.source);
  assert.equal(current.fingerprints.checklist,old.fingerprints.checklist);
  assert.notEqual(current.fingerprints.teaching,old.fingerprints.teaching);
  assert.notEqual(current.materialHash,old.materialHash);
  assert.deepEqual(current.topics.find(t=>t.tab==='mri'),{tab:'mri',...now.bodyLesson(s,'mri')});
  assert.deepEqual(current.topics.find(t=>t.tab==='ct'),old.topics.find(t=>t.tab==='ct'));
  assert.deepEqual(await now.parseBodyReviewResponse(current,s.id),current);
  assert.equal(await now.parseBodyReviewResponse(old,s.id),null);
  for(const change of [
    p=>{p.topics.find(t=>t.tab==='mri').body+=' changed';},
    p=>{p.topics.find(t=>t.tab==='mri').readiness='approved';},
    p=>{p.source.structure.sources[0].sha256='foreign';},
  ]){const forged=structuredClone(current);change(forged);assert.equal(await now.parseBodyReviewResponse(forged,s.id),null);tampered++;}
  const oldContext=await before.bodyReviewContext(s.id),context=await now.bodyReviewContext(s.id);
  assert.equal(context.sourceHash,oldContext.sourceHash);
  assert.notEqual(context.revisions.teaching,oldContext.revisions.teaching);
  assert.equal(context.revisions.imaging,null);
  const packet={catalogScope:context.catalogScope,structureId:s.id,track:'teaching',expectedVersion:0,
    materialHash:context.materialHash,revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,
    draft:now.blankBodyReview(context,'teaching')};
  for(const hashes of [{materialHash:oldContext.materialHash},{revisionHash:oldContext.revisions.teaching},
    {materialHash:oldContext.materialHash,revisionHash:oldContext.revisions.teaching}]){
    const response=await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions',{
      method:'POST',headers:{origin:'https://atlas.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_PHARYNGEAL_MRI'},
      body:JSON.stringify({...packet,...hashes}),
    }),{prepare(){storageCalls++;throw Error('Stale request reached storage');}});
    assert.equal(response.status,409);stale++;
  }
  worksheets++;
}
assert.equal(worksheets,9);assert.equal(stale,27);assert.equal(tampered,27);assert.equal(storageCalls,0);
console.log(JSON.stringify({worksheets,oldWorksheetsRefused:9,tampered,staleRefused:stale,storageCalls,clinicalApproval:false}));
