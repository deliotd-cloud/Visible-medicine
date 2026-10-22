import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from 'esbuild';
import {atlasExactGitApi} from './atlas-exact-git-api.mjs';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
const baseline='452f36b1ca5d86bdac8b7ce4c2bfc42da22fb712',root=process.cwd();
// Replay the completed two-topic epoch; current teaching has its own delta test.
const milestone='67d7d3be152679b7a3f23a745d022a50111d9ebe';
const deliveryEpoch='f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6';
const old=p=>execFileSync('git',['show',baseline+':'+p],{maxBuffer:32e6,windowsHide:true});
const admitted=p=>execFileSync('git',['show',milestone+':'+p],{maxBuffer:32e6,windowsHide:true});
const delivered=p=>execFileSync('git',['show',deliveryEpoch+':'+p],{maxBuffer:32e6,windowsHide:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
const entry="export * from './atlas-review/lib/hyoid-epiglottis-ultrasound';export * from './atlas-review/content/hyoid-epiglottis-ultrasound';export {bodyLesson,bodyContent} from './atlas-review/app/body-content';export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';export {contentTabs} from './atlas-review/lib/content-types';export {structures} from './atlas-review/app/anatomy-data';export {dissectionProfiles} from './atlas-review/app/dissection-data';export {regionalTours} from './atlas-review/lib/regional-tours';export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-context';export * from './atlas-review/lib/body-review-response';export * from './atlas-review/lib/body-review-api';export * from './atlas-review/lib/body-review-decisions';";
async function load(previous=false){
 const common=entry.replace("export * from './atlas-review/lib/hyoid-epiglottis-ultrasound';export * from './atlas-review/content/hyoid-epiglottis-ultrasound';",'');
 return atlasExactGitApi(previous?baseline:milestone,previous?common:entry);
}
const now=await load(),before=await load(true),pins=JSON.parse(admitted('atlas-review/content/hyoid-epiglottis-ultrasound-pins.json'));
assert.equal(pins.baseline,'e7355245ac0d5f92a7a76c6fb2c42f917c3675c3');assert.equal(pins.entries.length,2);
const catalog=now.bodyDisplayCatalog(JSON.parse(admitted('atlas-review/public/models/bodyparts3d/full-body/catalog.json')));
assert.equal(catalog.structures.length,1104);
assert.deepEqual(catalog,before.bodyDisplayCatalog(JSON.parse(old('atlas-review/public/models/bodyparts3d/full-body/catalog.json'))));
assert.deepEqual(now.structures,before.structures);assert.deepEqual(now.dissectionProfiles,before.dissectionProfiles);assert.deepEqual(now.regionalTours,before.regionalTours);
const ids=new Set(pins.entries.map(e=>e.identity.id));assert.equal(ids.size,2);
const snapshot=api=>({catalog,body:catalog.structures.map(s=>({id:s.id,topics:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});
assert.equal(hash(JSON.stringify(snapshot(before))),pins.beforeAllTeachingSnapshotHash);
const reconstructed=snapshot(now);let changed=0,preserved=0,refusals=0,malformed=0,stale=0,storageCalls=0,worksheetChanges=0;
for(const row of reconstructed.body)for(const tab of now.contentTabs){
 const s=catalog.structures.find(s=>s.id===row.id),prior=before.bodyLesson(s,tab),lesson=now.bodyLesson(s,tab);
 if(ids.has(s.id)&&tab==='ultrasound'){
  assert.equal(prior.readiness,'pending');assert.equal(lesson.readiness,'draft');assert.deepEqual(prior,pins.entries.find(e=>e.identity.id===s.id).previous);
  assert.deepEqual(lesson,now.hyoidEpiglottisUltrasoundLesson(s,tab));const {readiness,...shown}=lesson;assert.deepEqual(now.bodyContent(s,tab),shown);
  row.topics[tab]=prior;changed++;
 }else{assert.deepEqual(lesson,prior,s.id+':'+tab);preserved++;}
}
assert.equal(changed,2);assert.equal(preserved,9934);assert.equal(hash(JSON.stringify(reconstructed)),pins.beforeAllTeachingSnapshotHash);
function leaves(value,path=[]){return value===null||typeof value!=='object'?[path]:Object.entries(value).flatMap(([k,v])=>leaves(v,[...path,k]));}
for(const {identity:s,family}of pins.entries){
 assert.deepEqual(catalog.structures.find(r=>r.id===s.id),s);
 for(const path of leaves(s)){
  const foreign=structuredClone(s);let parent=foreign;for(const k of path.slice(0,-1))parent=parent[k];const k=path.at(-1),v=parent[k];parent[k]=typeof v==='string'?v+'-foreign':typeof v==='number'?v+.01:v===null?'foreign':!v;
  assert.equal(now.hyoidEpiglottisUltrasoundLesson(foreign,'ultrasound'),undefined,path.join('.'));refusals++;
 }
 for(const edit of [s=>s.sources=[],s=>s.sources.push(structuredClone(s.sources[0])),s=>s.unexpected=true,s=>s.regions.unshift('foreign')]){const foreign=structuredClone(s);edit(foreign);assert.equal(now.hyoidEpiglottisUltrasoundLesson(foreign,'ultrasound'),undefined);refusals++;}
 for(const t of now.contentTabs.filter(t=>t!=='ultrasound'))assert.equal(now.hyoidEpiglottisUltrasoundLesson(s,t),undefined);
 const lesson=now.hyoidEpiglottisUltrasoundLesson(s,'ultrasound'),original=structuredClone(lesson);
 assert.match(original.note,/revision-bound radiologist/i);assert.match(original.note,/pending/i);
 assert.equal(original.body,now.hyoidEpiglottisUltrasoundTeaching[family].body);
 assert.deepEqual(original.citations,['https://pmc.ncbi.nlm.nih.gov/articles/PMC4126113/']);
 lesson.bullets.push('foreign');lesson.citations.push('https://foreign.example');assert.deepEqual(now.hyoidEpiglottisUltrasoundLesson(s,'ultrasound'),original);
 const material=await now.bodyReviewMaterial(s.id);assert(await now.parseBodyReviewResponse(material,s.id));assert.equal(material.approval,false);assert.deepEqual(material.topics.find(t=>t.tab==='ultrasound'),{tab:'ultrasound',...original});
 for(const edit of [p=>p.topics.find(t=>t.tab==='ultrasound').body+=' foreign',p=>p.topics.find(t=>t.tab==='ultrasound').readiness='approved',p=>p.topics.find(t=>t.tab==='ultrasound').citations=['https://foreign.example'],p=>p.source.structure.sources=[],p=>p.topics.splice(p.topics.findIndex(t=>t.tab==='ultrasound'),1)]){const foreign=structuredClone(material);edit(foreign);assert.equal(await now.parseBodyReviewResponse(foreign,s.id),null);malformed++;}
 const prior=await before.bodyReviewContext(s.id),current=await now.bodyReviewContext(s.id);
 assert.equal(current.sourceHash,prior.sourceHash);assert.notEqual(current.revisions.teaching,prior.revisions.teaching);assert.equal(current.revisions.imaging,null);
 const packet={catalogScope:prior.catalogScope,structureId:s.id,track:'teaching',expectedVersion:0,materialHash:prior.materialHash,revisionHash:prior.revisions.teaching,checklistVersion:prior.checklistVersion,draft:now.blankBodyReview(prior,'teaching')};
 const response=await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions',{method:'POST',headers:{origin:'https://atlas.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_HYOID_EPIGLOTTIS_US'},body:JSON.stringify(packet)}),{prepare(){storageCalls++;throw Error('Stale review reached storage');}});
 assert.equal(response.status,409);stale++;
}
for(const s of catalog.structures){
 if(!ids.has(s.id))assert.equal(now.hyoidEpiglottisUltrasoundLesson(s,'ultrasound'),undefined);
 const prior=await before.bodyReviewMaterial(s.id),current=await now.bodyReviewMaterial(s.id);
 assert.deepEqual(current.source,prior.source);assert.deepEqual(current.reasoning,prior.reasoning);assert.deepEqual(current.guidedTours,prior.guidedTours);assert.equal(current.approval,false);
 if(ids.has(s.id)){assert.notEqual(current.fingerprints.teaching,prior.fingerprints.teaching);worksheetChanges++;}
 else{assert.deepEqual(current.topics,prior.topics);assert.equal(current.fingerprints.teaching,prior.fingerprints.teaching);}
}
assert.equal(worksheetChanges,2);assert.equal(malformed,10);assert.equal(stale,2);assert.equal(storageCalls,0);
for(const bundle of pins.bundles){const p='public/atlas-runtime/head-neck'+bundle.url.split('?')[0],bytes=admitted(p);assert.equal(hash(bytes),bundle.sha256);assert.deepEqual(bytes,old(p));}
// Review imports reachable source files, not the source checkout's audit-only
// reports. Check the actual delivered model notice and locked dependency graph.
for(const p of ['package-lock.json','public/atlas-runtime/head-neck/LICENSES/BODYPARTS3D_FULL_BODY.md','atlas-review/app/body-explorer.tsx','atlas-review/lib/imaging-sync.ts','atlas-review/lib/didanix-atlas-adapter.ts','atlas-review/lib/independent-study-links.ts']){
 assert.equal(admitted(p).toString().replaceAll('\r\n','\n'),old(p).toString().replaceAll('\r\n','\n'),p);
}
assert.equal(execFileSync('git',['diff','--name-only',baseline,milestone,'--','public/atlas-runtime/head-neck/models'],{encoding:'utf8'}).trim(),'');
console.log(JSON.stringify({baseline,changed,preserved,sourceMutationRefusals:refusals,malformedPacketsRefused:malformed,staleRefusalsBeforeStorage:stale,storageCalls,changedTeachingWorksheets:worksheetChanges,clinicalApproval:false,websiteIntegrated:true}));

const revision="88cea927d48729769b96ad8fe680b0872b7e6687",review=JSON.parse(delivered("atlas-review/manifest.json"));assert.equal(review.revision,revision);
const inputs=["app/body-content.ts","lib/hyoid-epiglottis-ultrasound.ts","content/hyoid-epiglottis-ultrasound.ts","content/hyoid-epiglottis-ultrasound-pins.json"];
for(const name of ["head-neck","shoulder","female-pelvis","lower-limb"]){
 const base="public/atlas-runtime/"+name+"/",manifest=JSON.parse(delivered(base+"manifest.json"));
 assert.equal(manifest.sourceCommit,revision);assert.equal(manifest.patientDataIncluded,false);assert.equal(manifest.clinicalApproved,false);
 for(const file of manifest.files)assert.equal(hash(delivered(base+file.path)),file.sha256);
 if(["head-neck","shoulder"].includes(name)){
  const sourceInputs=JSON.parse(delivered(base+"source-inputs.json"));
  for(const path of inputs){const actual=sourceInputs.find(f=>f.path===path),imported=review.files.find(f=>f.path===path);assert(actual&&imported);assert.equal(actual.sha256,imported.sourceSha256);}
 }
 // Only the shared regional entry offers hyoid/epiglottis selection. The
 // dedicated shoulder entry retains its separate shoulder teaching surface.
 if(name==='head-neck'){
  const emitted=emittedTeaching(base,manifest.files,true,delivered);
  for(const family of Object.values(now.hyoidEpiglottisUltrasoundTeaching)){assert(emitted.includes(family.body));for(const bullet of family.bullets)assert(emitted.includes(bullet));}
  assert(emitted.includes(now.hyoidEpiglottisUltrasoundReferences.upperAirwaySonoanatomy));
 }
}

// The current admission must still bind the original hyoid source and draft teaching.
const atlas=currentAtlasDeliveryRoot(),currentPin=validateCurrentAtlasDelivery(),currentReview=JSON.parse(readFileSync('atlas-review/manifest.json'));
assert.equal(currentReview.revision,CURRENT_ATLAS_REVISION);
assert.equal(currentPin.source,CURRENT_ATLAS_REVISION);
const featureRevision='c78e383a37976e2e459fd41504eac6281241af1d';
const featureReview=JSON.parse(admitted('atlas-review/manifest.json'));
assert.equal(featureReview.revision,featureRevision);
for(const [site,sourceRevision,manifest] of [[admitted,featureRevision,featureReview],[delivered,revision,review]]){
 for(const path of inputs.slice(1)){
  const source=execFileSync('git',['show',`${sourceRevision}:${path}`],{cwd:atlas,maxBuffer:32e6,windowsHide:true});
  const file=manifest.files.find(file=>file.path===path);assert(file,`${sourceRevision}:${path}`);
  assert.equal(file.sourceSha256,hash(source),`Saved source: ${sourceRevision}:${path}`);
  assert.equal(file.importedSha256,hash(site('atlas-review/'+path)),`Saved import: ${sourceRevision}:${path}`);
 }
}
for(const path of inputs.slice(1)){
 const source=execFileSync('git',['show',`${CURRENT_ATLAS_REVISION}:${path}`],{cwd:atlas,maxBuffer:32e6,windowsHide:true});
 const file=currentReview.files.find(file=>file.path===path);assert(file,path);
 assert.deepEqual(source,execFileSync('git',['show',`${revision}:${path}`],{cwd:atlas,maxBuffer:32e6,windowsHide:true}),`Retained hyoid source: ${path}`);
 assert.equal(file.sourceSha256,hash(source),`Current source: ${path}`);
 assert.equal(file.importedSha256,hash(readFileSync('atlas-review/'+path)),`Current import: ${path}`);
}
const compiled=await build({stdin:{contents:entry,resolveDir:root,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const current=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
for(const {identity} of pins.entries){
 const expected=now.bodyLesson(identity,'ultrasound');
 assert.deepEqual(current.bodyLesson(identity,'ultrasound'),expected,`Current hyoid lesson: ${identity.id}`);
 const foreign=structuredClone(identity);foreign.id+='-foreign';
 assert.equal(current.hyoidEpiglottisUltrasoundLesson(foreign,'ultrasound'),undefined,`Current identity refusal: ${identity.id}`);
 const material=await current.bodyReviewMaterial(identity.id);
 assert.equal(material.approval,false);
 assert.deepEqual(material.topics.find(topic=>topic.tab==='ultrasound'),{tab:'ultrasound',...expected});
 assert(await current.parseBodyReviewResponse(material,identity.id));
 const forged=structuredClone(material);forged.topics.find(topic=>topic.tab==='ultrasound').body+=' foreign';
 assert.equal(await current.parseBodyReviewResponse(forged,identity.id),null,`Current forged material refusal: ${identity.id}`);
}
for(const name of ['head-neck','shoulder']){
 const base=`public/atlas-runtime/${name}/`,manifest=JSON.parse(readFileSync(base+'manifest.json'));
 const familySource=currentPin.runtimeSources[name];
 assert.equal(manifest.sourceCommit,familySource);
 const sourceInputs=JSON.parse(readFileSync(base+'source-inputs.json'));
 for(const path of inputs.slice(1)){
  const source=execFileSync('git',['show',`${familySource}:${path}`],{cwd:atlas,maxBuffer:32e6,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
  const imported=currentReview.files.find(file=>file.path===path);assert(imported,`Review source: ${path}`);
  assert.equal(sourceInputs.find(file=>file.path===path)?.sha256,hash(source),`${name}: exact family source: ${path}`);
  assert.equal(hash(source),imported.sourceSha256,`${name}: source retained in Review: ${path}`);
 }
 if(name==='head-neck'){
  const emitted=emittedTeaching(base,manifest.files,true);
  for(const family of Object.values(now.hyoidEpiglottisUltrasoundTeaching)){
   assert(emitted.includes(family.body));for(const bullet of family.bullets)assert(emitted.includes(bullet));
  }
 }
}
console.log(JSON.stringify({milestone,deliveryEpoch,currentRevision:CURRENT_ATLAS_REVISION,currentIdentityRefusals:2,currentForgedMaterialRefusals:2}));
