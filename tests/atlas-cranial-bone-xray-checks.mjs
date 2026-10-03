import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {atlasExactGitApi} from './atlas-exact-git-api.mjs';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
const baseline='67d7d3be152679b7a3f23a745d022a50111d9ebe',root=process.cwd();
// Immutable completed eight-topic epoch; the current ultrasound test proves
// all older lessons survive in today's imported and emitted runtime.
const milestone='26e9377202d04ad6a250cc6fc394b37655f5ec94';
const old=p=>execFileSync('git',['show',baseline+':'+p],{maxBuffer:32e6,windowsHide:true});
const readFileSync=p=>execFileSync('git',['show',milestone+':'+p],{maxBuffer:32e6,windowsHide:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
const entry="export * from './atlas-review/lib/cranial-bone-xray';export * from './atlas-review/content/cranial-bone-xray';export {bodyLesson,bodyContent} from './atlas-review/app/body-content';export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';export {contentTabs} from './atlas-review/lib/content-types';export {structures} from './atlas-review/app/anatomy-data';export {dissectionProfiles} from './atlas-review/app/dissection-data';export {regionalTours} from './atlas-review/lib/regional-tours';export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-context';export * from './atlas-review/lib/body-review-response';export * from './atlas-review/lib/body-review-api';export * from './atlas-review/lib/body-review-decisions';";
async function load(previous=false){
 const common=entry.replace("export * from './atlas-review/lib/cranial-bone-xray';export * from './atlas-review/content/cranial-bone-xray';",'');
 return atlasExactGitApi(previous?baseline:milestone,previous?common:entry);
}
const now=await load(),before=await load(true),pins=JSON.parse(readFileSync('atlas-review/content/cranial-bone-xray-pins.json'));
assert.equal(pins.baseline,'c78e383a37976e2e459fd41504eac6281241af1d');assert.equal(pins.entries.length,8);
const catalog=now.bodyDisplayCatalog(JSON.parse(readFileSync('atlas-review/public/models/bodyparts3d/full-body/catalog.json')));
assert.equal(catalog.structures.length,1104);
assert.deepEqual(catalog,before.bodyDisplayCatalog(JSON.parse(old('atlas-review/public/models/bodyparts3d/full-body/catalog.json'))));
assert.deepEqual(now.structures,before.structures);assert.deepEqual(now.dissectionProfiles,before.dissectionProfiles);assert.deepEqual(now.regionalTours,before.regionalTours);
const ids=new Set(pins.entries.map(e=>e.identity.id));assert.equal(ids.size,8);
const snapshot=api=>({catalog,body:catalog.structures.map(s=>({id:s.id,topics:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});
assert.equal(hash(JSON.stringify(snapshot(before))),pins.beforeAllTeachingSnapshotHash);
const reconstructed=snapshot(now);let changed=0,preserved=0,refusals=0,malformed=0,stale=0,storageCalls=0,worksheetChanges=0;
for(const row of reconstructed.body)for(const tab of now.contentTabs){
 const s=catalog.structures.find(s=>s.id===row.id),prior=before.bodyLesson(s,tab),lesson=now.bodyLesson(s,tab);
 if(ids.has(s.id)&&tab==='xray'){
  assert.equal(prior.readiness,'pending');assert.equal(lesson.readiness,'draft');assert.deepEqual(prior,pins.entries.find(e=>e.identity.id===s.id).previous);
  assert.deepEqual(lesson,now.cranialBoneXrayLesson(s,tab));const {readiness,...shown}=lesson;assert.deepEqual(now.bodyContent(s,tab),shown);
  row.topics[tab]=prior;changed++;
 }else{assert.deepEqual(lesson,prior,s.id+':'+tab);preserved++;}
}
assert.equal(changed,8);assert.equal(preserved,9928);assert.equal(hash(JSON.stringify(reconstructed)),pins.beforeAllTeachingSnapshotHash);
function leaves(value,path=[]){return value===null||typeof value!=='object'?[path]:Object.entries(value).flatMap(([k,v])=>leaves(v,[...path,k]));}
for(const {identity:s,family}of pins.entries){
 assert.deepEqual(catalog.structures.find(r=>r.id===s.id),s);
 for(const path of leaves(s)){
  const foreign=structuredClone(s);let parent=foreign;for(const k of path.slice(0,-1))parent=parent[k];const k=path.at(-1),v=parent[k];parent[k]=typeof v==='string'?v+'-foreign':typeof v==='number'?v+.01:v===null?'foreign':!v;
  assert.equal(now.cranialBoneXrayLesson(foreign,'xray'),undefined,path.join('.'));refusals++;
 }
 for(const edit of [s=>s.sources=[],s=>s.sources.push(structuredClone(s.sources[0])),s=>s.unexpected=true,s=>s.regions.unshift('foreign')]){const foreign=structuredClone(s);edit(foreign);assert.equal(now.cranialBoneXrayLesson(foreign,'xray'),undefined);refusals++;}
 for(const t of now.contentTabs.filter(t=>t!=='xray'))assert.equal(now.cranialBoneXrayLesson(s,t),undefined);
 const lesson=now.cranialBoneXrayLesson(s,'xray'),original=structuredClone(lesson);
 assert.match(original.note,/revision-bound radiologist/i);assert.match(original.note,/pending/i);
 assert.match(original.note,/not an X-ray image, patient registration or proof of radiographic visibility/);
 assert.match(original.note,/historical projection reference, not current acquisition or diagnostic advice/);
 assert.match(original.note,/Atlas, case and paid-lecture access remain independent/);
 assert.equal(original.body,now.cranialBoneXrayTeaching[family].body);
 assert.deepEqual(original.citations,now.cranialBoneXrayTeaching[family].citations.map(key=>now.cranialBoneXrayReferences[key]));
 lesson.bullets.push('foreign');lesson.citations.push('https://foreign.example');assert.deepEqual(now.cranialBoneXrayLesson(s,'xray'),original);
 const material=await now.bodyReviewMaterial(s.id);assert(await now.parseBodyReviewResponse(material,s.id));assert.equal(material.approval,false);assert.deepEqual(material.topics.find(t=>t.tab==='xray'),{tab:'xray',...original});
 for(const edit of [p=>p.topics.find(t=>t.tab==='xray').body+=' foreign',p=>p.topics.find(t=>t.tab==='xray').readiness='approved',p=>p.topics.find(t=>t.tab==='xray').citations=['https://foreign.example'],p=>p.source.structure.sources=[],p=>p.topics.splice(p.topics.findIndex(t=>t.tab==='xray'),1)]){const foreign=structuredClone(material);edit(foreign);assert.equal(await now.parseBodyReviewResponse(foreign,s.id),null);malformed++;}
 const prior=await before.bodyReviewContext(s.id),current=await now.bodyReviewContext(s.id);
 assert.equal(current.sourceHash,prior.sourceHash);assert.notEqual(current.revisions.teaching,prior.revisions.teaching);assert.equal(current.revisions.imaging,null);
 const packet={catalogScope:prior.catalogScope,structureId:s.id,track:'teaching',expectedVersion:0,materialHash:prior.materialHash,revisionHash:prior.revisions.teaching,checklistVersion:prior.checklistVersion,draft:now.blankBodyReview(prior,'teaching')};
 const response=await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions',{method:'POST',headers:{origin:'https://atlas.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_CRANIAL_BONE_XRAY'},body:JSON.stringify(packet)}),{prepare(){storageCalls++;throw Error('Stale review reached storage');}});
 assert.equal(response.status,409);stale++;
 // Hold every other current field valid: each stale fingerprint must fail alone.
 for(const delta of [{materialHash:prior.materialHash},{revisionHash:prior.revisions.teaching}]){
  const isolated={...packet,materialHash:current.materialHash,revisionHash:current.revisions.teaching,checklistVersion:current.checklistVersion,draft:now.blankBodyReview(current,'teaching'),...delta};
  const refused=await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions',{method:'POST',headers:{origin:'https://atlas.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_CRANIAL_BONE_XRAY'},body:JSON.stringify(isolated)}),{prepare(){storageCalls++;throw Error('Isolated stale fingerprint reached storage');}});
  assert.equal(refused.status,409);stale++;
 }
}
for(const s of catalog.structures){
 if(!ids.has(s.id))assert.equal(now.cranialBoneXrayLesson(s,'xray'),undefined);
 const prior=await before.bodyReviewMaterial(s.id),current=await now.bodyReviewMaterial(s.id);
 assert.deepEqual(current.source,prior.source);assert.deepEqual(current.reasoning,prior.reasoning);assert.deepEqual(current.guidedTours,prior.guidedTours);assert.equal(current.approval,false);
 if(ids.has(s.id)){assert.notEqual(current.fingerprints.teaching,prior.fingerprints.teaching);worksheetChanges++;}
 else{assert.deepEqual(current.topics,prior.topics);assert.equal(current.fingerprints.teaching,prior.fingerprints.teaching);}
}
assert.equal(worksheetChanges,8);assert.equal(malformed,40);assert.equal(stale,24);assert.equal(storageCalls,0);
for(const bundle of pins.bundles){const p='public/atlas-runtime/head-neck'+bundle.url.split('?')[0],bytes=readFileSync(p);assert.equal(hash(bytes),bundle.sha256);assert.deepEqual(bytes,old(p));}
for(const p of ['package-lock.json','public/atlas-runtime/head-neck/LICENSES/BODYPARTS3D_FULL_BODY.md','atlas-review/app/body-explorer.tsx','atlas-review/lib/imaging-sync.ts','atlas-review/lib/didanix-atlas-adapter.ts','atlas-review/lib/independent-study-links.ts']){
 assert.equal(readFileSync(p).toString().replaceAll('\r\n','\n'),old(p).toString().replaceAll('\r\n','\n'),p);
}
assert.equal(execFileSync('git',['diff','--name-only',baseline,milestone,'--','public/atlas-runtime/head-neck/models'],{encoding:'utf8'}).trim(),'');
console.log(JSON.stringify({baseline,changed,preserved,sourceMutationRefusals:refusals,malformedPacketsRefused:malformed,staleRefusalsBeforeStorage:stale,storageCalls,changedTeachingWorksheets:worksheetChanges,clinicalApproval:false,websiteIntegrated:true}));

const revision="da1c7f692fcaf318a9c059aa5cb4ef0db8bbd6e8",review=JSON.parse(readFileSync("atlas-review/manifest.json"));assert.equal(review.revision,revision);
const inputs=["app/body-content.ts","lib/cranial-bone-xray.ts","content/cranial-bone-xray.ts","content/cranial-bone-xray-pins.json"];
for(const name of ["head-neck","shoulder","female-pelvis","lower-limb"]){
 const base="public/atlas-runtime/"+name+"/",manifest=JSON.parse(readFileSync(base+"manifest.json"));
 assert.equal(manifest.sourceCommit,revision);assert.equal(manifest.patientDataIncluded,false);assert.equal(manifest.clinicalApproved,false);
 for(const file of manifest.files)assert.equal(hash(readFileSync(base+file.path)),file.sha256);
 if(["head-neck","shoulder"].includes(name)){
  const sourceInputs=JSON.parse(readFileSync(base+"source-inputs.json"));
  for(const path of inputs){const actual=sourceInputs.find(f=>f.path===path),imported=review.files.find(f=>f.path===path);assert(actual&&imported);assert.equal(actual.sha256,imported.sourceSha256);}
 }
 // Only the shared regional entry offers cranial-bone selection. The
 // dedicated shoulder entry retains its separate shoulder teaching surface.
 if(name==='head-neck'){
  const emitted=emittedTeaching(base,manifest.files,true,readFileSync);
  for(const family of Object.values(now.cranialBoneXrayTeaching)){assert(emitted.includes(family.body));for(const bullet of family.bullets)assert(emitted.includes(bullet));}
  for(const reference of Object.values(now.cranialBoneXrayReferences))assert(emitted.includes(reference));
 }
}
