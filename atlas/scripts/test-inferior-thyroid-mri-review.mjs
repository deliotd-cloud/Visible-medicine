import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
assert.equal(process.argv.length,2,'No acceptance-mode flags');
const pins=JSON.parse(readFileSync('content/inferior-thyroid-mri-pins.json','utf8'));
const oldPins=JSON.parse(readFileSync('content/arterial-evidence-limits-pins.json','utf8'));
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',windowsHide:true,maxBuffer:16e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
assert.equal(git('merge-base',pins.baseline,'HEAD').trim(),pins.baseline);
const staleDisplayIds=[
  'vm:anatomy:body:head-neck:left:bone:left-maxilla',
  'vm:anatomy:body:head-neck:right:bone:right-maxilla',
  'vm:anatomy:body:head-neck:left:bone:left-zygomatic-bone',
  'vm:anatomy:body:head-neck:right:bone:right-zygomatic-bone',
  'vm:anatomy:body:head-neck:midline:bone:mandible',
  'vm:anatomy:body:head-neck:midline:ligament:median-cricothyroid-ligament',
  'vm:anatomy:body:head-neck:left:membrane:left-thyrohyoid-membrane',
  'vm:anatomy:body:head-neck:right:membrane:right-thyrohyoid-membrane',
];
// The display-preimage algorithm is byte-identical to the predecessor. It can
// therefore independently diagnose its eight stale stored pins from old material.
for(const file of ['lib/body-review-display-evidence.ts','lib/body-source-additions.ts','lib/body-presentation-parts.ts'])assert.equal(readFileSync(file,'utf8').replaceAll('\r\n','\n'),git('show',pins.baseline+':'+file).replaceAll('\r\n','\n'));
// Materialize the exact predecessor in a separate process so its compiler and
// graph are released before compiling the current source; no test stubs.
const beforeScript=`import {exactSourceHistoryApi} from './scripts/exact-source-history-api.mjs';
const api=await exactSourceHistoryApi(${JSON.stringify(pins.baseline)},'inferior-thyroid-mra-legacy');
const result=[];
for(const id of ${JSON.stringify([...oldPins.entries.map(e=>e.identity.id),...staleDisplayIds])}){const material=await api.bodyReviewMaterial(id);result.push({id,material,context:await api.bodyReviewContext(id),accepted:!!await api.parseBodyReviewResponse(material,id)});}
console.log(JSON.stringify(result));`;
const previous=JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',beforeScript],{encoding:'utf8',windowsHide:true,maxBuffer:16e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}));
const compiled=await build({stdin:{contents:`export {bodyLesson,bodyContent} from './app/body-content';export {inferiorThyroidMriLesson} from './lib/inferior-thyroid-mri';export {arterialEvidenceLimitLesson} from './lib/arterial-evidence-limits';export * from './lib/body-review-material';export * from './lib/body-review-context';export * from './lib/body-review-response';export * from './lib/body-review-api';export * from './lib/body-review-decisions';export {sourceCanonical} from './lib/body-source-additions';export {bodyReviewDisplayPreimage} from './lib/body-review-display-evidence';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const live=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const digest=v=>createHash('sha256').update(live.sourceCanonical(JSON.parse(JSON.stringify(v)))).digest('hex');
function rehash(packet){
  const scope={schema:packet.schema,kind:packet.kind,structureId:packet.structureId};
  packet.fingerprints={
    source:digest({scope:{...scope,schema:'vm-body-review-worksheet-1'},source:packet.source}),
    teaching:digest({scope:{...scope,schema:'vm-body-review-worksheet-2'},topics:packet.topics,reasoning:packet.reasoning,...(packet.guidedTours.length?{guidedTours:packet.guidedTours}:{})}),
    checklist:digest({scope:{...scope,schema:'vm-body-review-worksheet-2'},checks:packet.checklist}),
  };
  packet.materialHash=digest({scope,fingerprints:packet.fingerprints});
  return packet;
}
let malformed=0,staleRefusals=0,storageCalls=0;
for(const e of pins.entries){
  const s=e.identity,lesson=live.inferiorThyroidMriLesson(s,'mri');assert(lesson);assert.equal(lesson.readiness,'draft');assert.equal(s.validation.anatomicalReview,false);
  assert.deepEqual(live.bodyLesson(s,'mri'),lesson);const{readiness,...section}=lesson;assert.deepEqual(live.bodyContent(s,'mri'),section);
  const old=previous.find(p=>p.id===s.id);assert(old);assert.deepEqual(old.material.topics.find(t=>t.tab==='mri'),{tab:'mri',...e.previousMRI});
  const packet=await live.bodyReviewMaterial(s.id),context=await live.bodyReviewContext(s.id);
  assert.deepEqual(await live.parseBodyReviewResponse(packet,s.id),packet);
  assert.deepEqual(await live.parseBodyReviewResponse(rehash(structuredClone(packet)),s.id),packet,'Rehash control must reproduce accepted current packet');
  assert.equal(await live.parseBodyReviewResponse(old.material,s.id),null,'Prior MRI material cannot masquerade as current');
  assert.deepEqual(packet.topics.find(t=>t.tab==='mri'),{tab:'mri',...lesson});
  assert.equal(context.sourceHash,old.context.sourceHash);assert.notEqual(context.revisions.teaching,old.context.revisions.teaching);assert.notEqual(context.materialHash,old.context.materialHash);
  assert(context.blockers.imaging.length>0,'Normal illustration does not authorize registered imaging');
  const edits=[p=>p.topics.find(t=>t.tab==='mri').body+=' foreign',p=>p.topics.find(t=>t.tab==='mri').readiness='pending',p=>p.topics.find(t=>t.tab==='mri').citations=['https://foreign.invalid/'],p=>p.source.structure.sources[0].sha256='0'.repeat(64),p=>p.source.structure.laterality='unspecified'];
  for(const edit of edits){const forged=structuredClone(packet);edit(forged);assert.equal(await live.parseBodyReviewResponse(forged,s.id),null);assert.equal(await live.parseBodyReviewResponse(rehash(forged),s.id),null,'Self-consistent forged hashes must not bypass current display evidence');malformed+=2;}
  const draft=live.blankBodyReview(context,'teaching');
  const decision={catalogScope:context.catalogScope,structureId:s.id,track:'teaching',expectedVersion:0,materialHash:old.context.materialHash,revisionHash:old.context.revisions.teaching,checklistVersion:context.checklistVersion,draft};
  const request=new Request('https://atlas.test/api/body-decisions',{method:'POST',headers:{origin:'https://atlas.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_THYROID_MRI'},body:JSON.stringify(decision)});
  const db={prepare(){storageCalls++;throw Error('Stale decision reached storage');}};
  assert.equal((await live.postBodyDecision(request,db)).status,409);staleRefusals++;
}
// The other evidence-limited family remains pending with exactly the same
// material and teaching revision in the current resolver.
for(const e of oldPins.entries.filter(e=>e.family==='middleCollateralUltrasound')){
  const old=previous.find(p=>p.id===e.identity.id),lesson=live.bodyLesson(e.identity,e.tab);
  assert.deepEqual(lesson,live.arterialEvidenceLimitLesson(e.identity,e.tab));assert.equal(lesson.readiness,'pending');
  assert.deepEqual(await live.bodyReviewMaterial(e.identity.id),old.material);
  assert.equal((await live.bodyReviewContext(e.identity.id)).revisions.teaching,old.context.revisions.teaching);
}
const displayPath='content/body-review-display-pins.json',before=JSON.parse(git('show',pins.baseline+':'+displayPath)),after=JSON.parse(readFileSync(displayPath,'utf8'));
for(const id of staleDisplayIds){
  const old=previous.find(p=>p.id===id),packet=await live.bodyReviewMaterial(id);
  assert.equal(old.accepted,false,'Predecessor must reproduce its stale-pin refusal');
  assert.deepEqual(packet,old.material,'Repair must not alter unrelated teaching or worksheet material');
  const expected=createHash('sha256').update(live.bodyReviewDisplayPreimage(old.material,id)).digest('hex');
  assert.notEqual(before.pins.find(p=>p.structureId===id).sha256,expected);
  assert.equal(after.pins.find(p=>p.structureId===id).sha256,expected);
  assert.deepEqual(await live.parseBodyReviewResponse(packet,id),packet,'Corrected exact-source worksheet must be accepted');
}
assert.equal(after.pins.length,before.pins.length);const targets=new Set([...pins.entries.map(e=>e.identity.id),...staleDisplayIds]);let changedPins=0;
for(const p of before.pins){const next=after.pins.find(r=>r.structureId===p.structureId);assert(next);if(targets.has(p.structureId)){assert.notEqual(next.sha256,p.sha256);changedPins++;}else assert.deepEqual(next,p);}
assert.equal(changedPins,10);assert.equal(storageCalls,0);
console.log(JSON.stringify({baseline:pins.baseline,currentNormalDrafts:2,unchangedPendingControls:2,changedDisplayPins:changedPins,preexistingStalePinsRepaired:8,unrelatedWorksheetMaterialUnchanged:true,malformedRefusals:malformed,staleRefusalsBeforeStorage:staleRefusals,storageCalls,clinicalApproval:false,spatialRegistration:false}));
