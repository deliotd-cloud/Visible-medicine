import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {atlasExactGitApi} from './atlas-exact-git-api.mjs';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
const baseline='26e9377202d04ad6a250cc6fc394b37655f5ec94',revision='398edc60a43f8d0235d9e6963c1ad56954b3fa98';
// Complete immutable four-topic epoch; the current batch separately proves
// that these lessons survive in today's imported and emitted application.
const milestone='3c0bf9383b9b1668bc51e39340c68d47850f0581';
const readFileSync=path=>execFileSync('git',['show',milestone+':'+path],{windowsHide:true,maxBuffer:32e6});
const hash=value=>createHash('sha256').update(typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value)).digest('hex');
const old=path=>execFileSync('git',['show',baseline+':'+path],{windowsHide:true,maxBuffer:32e6});
const common="export {bodyLesson,bodyContent} from './atlas-review/app/body-content';export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';export {contentTabs} from './atlas-review/lib/content-types';export {structures} from './atlas-review/app/anatomy-data';export {dissectionProfiles} from './atlas-review/app/dissection-data';export {regionalTours} from './atlas-review/lib/regional-tours';export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-context';export * from './atlas-review/lib/body-review-response';export * from './atlas-review/lib/body-review-api';export * from './atlas-review/lib/body-review-decisions';";
const before=await atlasExactGitApi(baseline,common);
const now=await atlasExactGitApi(milestone,common+"export * from './atlas-review/lib/suprascapular-vessel-ultrasound';export * from './atlas-review/content/suprascapular-vessel-ultrasound';");
const pins=JSON.parse(readFileSync('atlas-review/content/suprascapular-vessel-ultrasound-pins.json'));
assert.equal(hash(pins),'0ed9e6ba9dabbbad9079639a7ecc23cc203d6c25a78b3b8d11045804498c6389');
assert.equal(pins.entries.length,4);assert.equal(pins.baseline,'cbca085f2862f14df28007b32a4f2cd688dd01d5');
const catalog=now.bodyDisplayCatalog(JSON.parse(readFileSync('atlas-review/public/models/bodyparts3d/full-body/catalog.json')));
assert.equal(catalog.structures.length,1104);
assert.deepEqual(catalog,before.bodyDisplayCatalog(JSON.parse(old('atlas-review/public/models/bodyparts3d/full-body/catalog.json'))));
assert.deepEqual(now.structures,before.structures);assert.deepEqual(now.dissectionProfiles,before.dissectionProfiles);assert.deepEqual(now.regionalTours,before.regionalTours);
const snapshot=api=>({catalog,body:catalog.structures.map(s=>({id:s.id,topics:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});
assert.equal(hash(snapshot(before)),pins.beforeAllTeachingSnapshotHash);
const reconstructed=snapshot(now),ids=new Set(pins.entries.map(e=>e.identity.id));
let changed=0,preserved=0,refusals=0,malformed=0,stale=0,storageCalls=0,worksheetChanges=0;
for(const row of reconstructed.body)for(const tab of now.contentTabs){
 const s=catalog.structures.find(s=>s.id===row.id),prior=before.bodyLesson(s,tab),lesson=now.bodyLesson(s,tab);
 if(ids.has(s.id)&&tab==='ultrasound'){
  assert.equal(prior.readiness,'pending');assert.equal(lesson.readiness,'draft');
  assert.deepEqual(prior,pins.entries.find(e=>e.identity.id===s.id).previous);
  assert.deepEqual(lesson,now.suprascapularVesselUltrasoundLesson(s,tab));
  const {readiness,...shown}=lesson;assert.deepEqual(now.bodyContent(s,tab),shown);
  row.topics[tab]=prior;changed++;
 }else{assert.deepEqual(lesson,prior,s.id+':'+tab);preserved++;}
}
assert.equal(changed,4);assert.equal(preserved,9932);assert.equal(hash(reconstructed),pins.beforeAllTeachingSnapshotHash);
function leaves(value,path=[]){return value===null||typeof value!=='object'?[path]:Object.entries(value).flatMap(([k,v])=>leaves(v,[...path,k]));}
for(const {identity:s,family}of pins.entries){
 assert.deepEqual(catalog.structures.find(r=>r.id===s.id),s);
 for(const path of leaves(s)){
  const foreign=structuredClone(s);let parent=foreign;for(const k of path.slice(0,-1))parent=parent[k];
  const k=path.at(-1),v=parent[k];parent[k]=typeof v==='string'?v+'-foreign':typeof v==='number'?v+.01:v===null?'foreign':!v;
  assert.equal(now.suprascapularVesselUltrasoundLesson(foreign,'ultrasound'),undefined,path.join('.'));refusals++;
 }
 for(const edit of [s=>s.sources=[],s=>s.sources.push(structuredClone(s.sources[0])),s=>s.unexpected=true,s=>s.regions.unshift('foreign')]){
  const foreign=structuredClone(s);edit(foreign);assert.equal(now.suprascapularVesselUltrasoundLesson(foreign,'ultrasound'),undefined);refusals++;
 }
 for(const t of now.contentTabs.filter(t=>t!=='ultrasound'))assert.equal(now.suprascapularVesselUltrasoundLesson(s,t),undefined);
 const lesson=now.suprascapularVesselUltrasoundLesson(s,'ultrasound'),original=structuredClone(lesson);
 assert.match(original.note,/revision-bound radiologist sign-off pending/);
 assert.match(original.note,/no sonogram, Doppler measurement or validated nerve\/ligament relationship/);
 assert.match(original.note,/not registered to a scan/);assert.match(original.note,/Atlas, case and paid-lecture access remain independent/);
 assert.equal(original.body,now.suprascapularVesselUltrasoundTeaching[family].body);
 assert.deepEqual(original.citations,now.suprascapularVesselUltrasoundTeaching[family].citations.map(k=>now.suprascapularVesselUltrasoundReferences[k]));
 lesson.bullets.push('foreign');lesson.citations.push('https://foreign.example');assert.deepEqual(now.suprascapularVesselUltrasoundLesson(s,'ultrasound'),original);
 const material=await now.bodyReviewMaterial(s.id);assert(await now.parseBodyReviewResponse(material,s.id));assert.equal(material.approval,false);
 assert.deepEqual(material.topics.find(t=>t.tab==='ultrasound'),{tab:'ultrasound',...original});
 for(const edit of [p=>p.topics.find(t=>t.tab==='ultrasound').body+=' foreign',p=>p.topics.find(t=>t.tab==='ultrasound').readiness='approved',p=>p.topics.find(t=>t.tab==='ultrasound').citations=['https://foreign.example'],p=>p.source.structure.sources=[],p=>p.topics.splice(p.topics.findIndex(t=>t.tab==='ultrasound'),1)]){
  const foreign=structuredClone(material);edit(foreign);assert.equal(await now.parseBodyReviewResponse(foreign,s.id),null);malformed++;
 }
 const prior=await before.bodyReviewContext(s.id),current=await now.bodyReviewContext(s.id);
 assert.equal(current.sourceHash,prior.sourceHash);assert.notEqual(current.revisions.teaching,prior.revisions.teaching);assert.equal(current.revisions.imaging,null);
 const packet={catalogScope:current.catalogScope,structureId:s.id,track:'teaching',expectedVersion:0,materialHash:current.materialHash,revisionHash:current.revisions.teaching,checklistVersion:current.checklistVersion,draft:now.blankBodyReview(current,'teaching')};
 for(const delta of [{materialHash:prior.materialHash,revisionHash:prior.revisions.teaching},{materialHash:prior.materialHash},{revisionHash:prior.revisions.teaching}]){
  const response=await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions',{method:'POST',headers:{origin:'https://atlas.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_SUPRASCAPULAR_ULTRASOUND'},body:JSON.stringify({...packet,...delta})}),{prepare(){storageCalls++;throw Error('Stale request reached storage');}});
  assert.equal(response.status,409);stale++;
 }
}
for(const s of catalog.structures){
 const prior=await before.bodyReviewMaterial(s.id),current=await now.bodyReviewMaterial(s.id);
 assert.deepEqual(current.source,prior.source);assert.deepEqual(current.reasoning,prior.reasoning);assert.deepEqual(current.guidedTours,prior.guidedTours);assert.equal(current.approval,false);
 if(ids.has(s.id)){assert.notEqual(current.fingerprints.teaching,prior.fingerprints.teaching);worksheetChanges++;}
 else{assert.deepEqual(current.topics,prior.topics);assert.equal(current.fingerprints.teaching,prior.fingerprints.teaching);assert.equal(now.suprascapularVesselUltrasoundLesson(s,'ultrasound'),undefined);}
}
// 136 individual identity leaves plus four collection/extra-field mutations
// for each of the four structures: no refusal is dropped from the count.
assert.equal(worksheetChanges,4);assert.equal(refusals,152);assert.equal(malformed,20);assert.equal(stale,12);assert.equal(storageCalls,0);
for(const bundle of catalog.bundles){const path='public/atlas-runtime/head-neck'+bundle.url.split('?')[0],bytes=readFileSync(path);assert.equal(hash(bytes),bundle.sha256);assert.deepEqual(bytes,old(path));}
for(const path of ['package-lock.json','public/atlas-runtime/head-neck/LICENSES/BODYPARTS3D_FULL_BODY.md','atlas-review/LICENSES/THIRD_PARTY_NOTICES.md','atlas-review/app/body-explorer.tsx','atlas-review/lib/imaging-sync.ts','atlas-review/lib/didanix-atlas-adapter.ts','atlas-review/lib/independent-study-links.ts','atlas-review/lib/body-review-context.ts','atlas-review/lib/body-review-api.ts'])assert.equal(readFileSync(path).toString().replaceAll('\r\n','\n'),old(path).toString().replaceAll('\r\n','\n'),path);
const review=JSON.parse(readFileSync('atlas-review/manifest.json'));assert.equal(review.revision,revision);
const inputs=['app/body-content.ts','lib/suprascapular-vessel-ultrasound.ts','content/suprascapular-vessel-ultrasound.ts','content/suprascapular-vessel-ultrasound-pins.json'];
for(const name of ['head-neck','shoulder','female-pelvis','lower-limb']){
 const base='public/atlas-runtime/'+name+'/',manifest=JSON.parse(readFileSync(base+'manifest.json'));
 assert.equal(manifest.sourceCommit,revision);assert.equal(manifest.patientDataIncluded,false);assert.equal(manifest.clinicalApproved,false);
 for(const file of manifest.files){const bytes=readFileSync(base+file.path);assert.equal(bytes.length,file.bytes);assert.equal(hash(bytes),file.sha256);}
 if(['head-neck','shoulder'].includes(name)){
  const sourceInputs=JSON.parse(readFileSync(base+'source-inputs.json'));
  for(const path of inputs){const exported=sourceInputs.find(f=>f.path===path),imported=review.files.find(f=>f.path===path);assert(exported&&imported);assert.equal(exported.sha256,imported.sourceSha256);}
 }
 if(name==='head-neck'){
  const emitted=emittedTeaching(base,manifest.files,true,readFileSync);
  for(const family of Object.values(now.suprascapularVesselUltrasoundTeaching)){assert(emitted.includes(family.body));for(const bullet of family.bullets)assert(emitted.includes(bullet));}
  assert(emitted.includes(now.suprascapularVesselUltrasoundNote));
  for(const reference of Object.values(now.suprascapularVesselUltrasoundReferences))assert(emitted.includes(reference));
 }
}
console.log(JSON.stringify({baseline,revision,changed,preserved,sourceMutationRefusals:refusals,malformedPacketsRefused:malformed,staleFingerprintsIndependentlyRefused:stale,storageCalls,changedTeachingWorksheets:worksheetChanges,bundlesUnchanged:catalog.bundles.length,clinicalApproval:false,websiteIntegrated:true}));
