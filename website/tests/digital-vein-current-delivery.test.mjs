import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import test from 'node:test';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {emittedTeachingSearch} from './atlas-emitted-teaching.ts';
import {websiteRoot,historicalRoot,sha,read,json,git,authenticateRows,authenticateDelivery,replayHistoricalDigitalVein,currentDigitalVeinApi} from './digital-vein-role-context.mjs';

// The retained theorem is historical. Its nine-path transition, artifact hashes,
// six teaching packets and complete original 41-case inverse are unchanged.
await replayHistoricalDigitalVein();
const sourcePaths=['app/body-content.ts','lib/digital-vein-ultrasound.ts',
 'content/digital-vein-ultrasound.ts','content/regional-teaching/hand.json'];
const fmas=['FMA85096','FMA85097','FMA85098','FMA85099','FMA85100','FMA85101'];

test('current digital-vein source, Review and learner runtime have one authenticated delivery context',()=>{
 const pin=validateCurrentAtlasDelivery(),atlas=currentAtlasDeliveryRoot();
 assert.equal(CURRENT_ATLAS_REVISION,pin.source);
 assert.notEqual(pin.source,'ed3c8cc0e99f6cf850a915d7a08de2e6489c1b6f');
 assert.throws(()=>validateCurrentAtlasDelivery({pin:json(historicalRoot,'tests/fixtures/current-atlas-delivery.json')}),
  'An authenticated historical context cannot masquerade as current delivery');
 assert.equal(git(atlas,'rev-parse',pin.source+'^{tree}').toString().trim(),pin.sourceTree);
 // Main supplies the immutable receipt for the integrated successor, so this
 // theorem never silently accepts the working tree's own mutable metadata.
 const receiptPath=process.env.VM_CURRENT_SOURCE_RECEIPT,digest=process.env.VM_CURRENT_SOURCE_SHA256;
 assert(receiptPath&&/^[a-f0-9]{64}$/.test(digest??''),'Explicit sealed integrated source receipt and digest required');
 const receiptBytes=readFileSync(receiptPath);assert.equal(sha(receiptBytes),digest);
 const receipt=JSON.parse(receiptBytes);
 assert.equal(resolve(receipt.website),resolve(websiteRoot));
 assert.equal(receipt.atlasHead,pin.source);assert.equal(receipt.atlasTree,pin.sourceTree);
 authenticateRows(websiteRoot,receipt.sourceRows);authenticateDelivery(websiteRoot,pin);
 assert.deepEqual(json(websiteRoot,'lib/atlas-model-inventory.json').models,
  json(historicalRoot,'lib/atlas-model-inventory.json').models,'Registered model byte identities remain exact');
 const review=json(websiteRoot,'atlas-review/manifest.json'),inputs=json(websiteRoot,'atlas-review/integration-inputs.json');
 const runtimeSources=new Set(Object.values(pin.runtimeSources));
 for(const path of sourcePaths){
  const bytes=git(atlas,'show',pin.source+':'+path),row=review.files.find(item=>item.path===path);assert(row,path);
  assert.equal(row.sourceSha256,sha(bytes),path);assert.equal(row.importedSha256,sha(read(websiteRoot,'atlas-review/'+path)),path);
  assert.equal(row.sourceSha256,row.importedSha256,path);
  assert.equal(inputs.inputs.find(item=>item.path==='atlas-review/'+path)?.sha256,row.importedSha256,path);
 }
 for(const module of ['head-neck','shoulder']){
  const base='public/atlas-runtime/'+module+'/',manifest=json(websiteRoot,base+'manifest.json');
  assert(runtimeSources.has(manifest.sourceCommit));
  const sourceInputs=json(websiteRoot,base+'source-inputs.json');
  for(const path of sourcePaths.slice(1)){
   const input=sourceInputs.find(item=>item.path===path);assert(input,module+': '+path);
   assert.equal(input.sha256,sha(git(atlas,'show',manifest.sourceCommit+':'+path)),module+': '+path);
  }
 }
 assert(!Object.hasOwn(pin,'clinicalApproval'));assert(!Object.hasOwn(pin,'userAuthorized'));
});

test('current six digital-vein drafts retain whole identity, safe teaching, reachable learner text and private Review rejection',
 {timeout:180000},async()=>{
 const api=await currentDigitalVeinApi();
 const catalog=api.bodyDisplayCatalog(json(websiteRoot,'atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
 const pins=json(websiteRoot,'atlas-review/content/hand-venous-imaging-pins.json');
 const selected=pins.entries.filter(row=>fmas.includes(row.identity.fmaId));
 assert.equal(selected.length,6);assert.deepEqual(selected.map(row=>row.identity.fmaId).sort(),[...fmas].sort());
 const teaching=api.digitalVeinUltrasoundTeaching;
 // The case-comparison teaching itself remains exact; broader dispatch and
 // hand coverage may legitimately gain additional lessons in later revisions.
 assert.deepEqual(read(websiteRoot,'atlas-review/content/digital-vein-ultrasound.ts'),read(historicalRoot,'atlas-review/content/digital-vein-ultrasound.ts'));
 assert.match(teaching.body,/In one patient/);assert.match(teaching.body,/abnormal case, not a study of normal/);
 assert.match(teaching.bullets.join(' '),/does not identify the individual imaged finger veins/);
 assert.match(teaching.bullets.join(' '),/does not establish ultrasound visibility of the superficial or deep palmar venous arches/);
 assert.match(teaching.bullets.join(' '),/no ultrasound image, live compression, Doppler flow, patency assessment, diagnostic conclusion or acquired-image registration/);
 assert.match(teaching.note,/revision-bound radiologist review pending/);
 assert.match(teaching.note,/Atlas, imaging-case and paid-lecture access remain independent/);
 const snapshot=json(websiteRoot,'atlas-review/content/regional-teaching/hand.json');
 const titles=[];
 for(const {identity,group} of selected){
  assert.equal(group,'proper-digital-venous-detail');
  const display=catalog.structures.find(row=>row.id===identity.id);assert.deepEqual(display,identity);
  assert.equal(identity.validation.status,'unvalidated');assert.equal(identity.validation.anatomicalReview,false);
  const lesson=api.digitalVeinUltrasoundLesson(display,'ultrasound');
  assert.equal(lesson.readiness,'draft');assert.match(lesson.title,/Ultrasound case comparison · draft$/);
  assert.deepEqual(api.bodyLesson(display,'ultrasound'),lesson);
  assert.deepEqual(api.bodyContent(display,'ultrasound'),((({readiness,...shown})=>shown)(lesson)));
  assert.equal(lesson.body,teaching.body);assert.deepEqual(lesson.bullets,[...teaching.bullets]);
  assert.deepEqual(lesson.citations,[...teaching.references]);assert.equal(lesson.note,teaching.note);titles.push(lesson.title);
  const entries=snapshot.entries.filter(row=>JSON.parse(row.identity).id===identity.id);assert.equal(entries.length,1);
  assert.deepEqual(JSON.parse(entries[0].identity),identity);assert.deepEqual(entries[0].lessons.ultrasound,lesson);
  assert.equal(api.digitalVeinUltrasoundLesson({...display,name:display.name+' changed'},'ultrasound'),undefined);
  assert.equal(api.digitalVeinUltrasoundLesson(display,'mri'),undefined);
  const packet=await api.bodyReviewMaterial(identity.id);assert.equal(packet.approval,false);assert.equal(packet.status,'worksheet-not-submitted');
  assert.deepEqual(packet.topics.find(row=>row.tab==='ultrasound'),{tab:'ultrasound',...lesson});
  assert.deepEqual(await api.parseBodyReviewResponse(packet,identity.id),packet);
  const forged=structuredClone(packet);forged.topics.find(row=>row.tab==='ultrasound').body+=' false';
  assert.equal(await api.parseBodyReviewResponse(forged,identity.id),null);
 }
 for(const module of ['head-neck','shoulder']){
  const base='public/atlas-runtime/'+module+'/',manifest=json(websiteRoot,base+'manifest.json');
  const emitted=emittedTeachingSearch(resolve(websiteRoot,base)+'/',manifest.files);
  for(const value of [...titles,teaching.body,...teaching.bullets,...teaching.references,teaching.note])
   assert(emitted.includes(value)||emitted.includes(JSON.stringify(value).slice(1,-1)),module+': '+value.slice(0,40));
 }
});

test('current digital-vein access remains administrator draft with independent lecture and case rights',async()=>{
 const api=await currentDigitalVeinApi(),policy=api.ATLAS_DELIVERY_POLICY;
 assert.equal(policy.audience,'administrator-review');
 assert.equal(policy.manifestRevision,sha(read(websiteRoot,'lib/atlas-model-inventory.json')));
 assert(!Object.hasOwn(policy,'approvedRevision'));
 let queries=[];
 const database=roles=>({withSession(mode){assert.equal(mode,'first-primary');return {prepare(sql){queries.push(sql);return {bind(){return {async first(){return {roles,status:'active'};}};}};}};}});
 await assert.rejects(api.authorizeAtlasDelivery(database('administrator'),null,policy),error=>error.status===401);
 await assert.rejects(api.authorizeAtlasDelivery(database('learner,course-student,case-viewer'),'subject',policy),error=>error.status===403);
 await api.authorizeAtlasDelivery(database('administrator'),'subject',policy);
 assert(queries.length>0);assert(queries.every(sql=>!/(?:course_enrol|case_right|studio_access|organization_entitlements)/.test(sql)));
});
