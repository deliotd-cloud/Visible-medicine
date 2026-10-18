import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
// Replay the immutable completed US milestone; live lower-venous delivery has
// independent whole-topic preservation and Review guards.
import {readFileSync,build,emittedTeaching} from './atlas-pre-lower-venous-history.ts';
import {dirname,relative} from 'node:path';

const source='2063af41c4207ea841a123bf942ef03962644a26';
const parent='6e134825dd189873d60846cacdc98a11983d6d16';
const baseline='89a0e8338703f757254c8953788b806e1e8cea7e';
const additions=['content/hand-arterial-ultrasound-pins.json','content/hand-arterial-ultrasound.ts','lib/hand-arterial-ultrasound.ts'];
const sha=(bytes:Buffer|string)=>createHash('sha256').update(bytes).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const old=(path:string)=>execFileSync('git',['show',`${baseline}:${path}`],{maxBuffer:32e6,windowsHide:true});
const oldJson=(path:string)=>JSON.parse(old(path).toString());
const sameText=(path:string)=>assert.equal(readFileSync(path,'utf8').replaceAll('\r\n','\n'),old(path).toString().replaceAll('\r\n','\n'),path);

async function load(previous=false){
 const frozen=new Set(['atlas-review/app/body-content.ts','atlas-review/content/body-renderer-revision.json',
  'atlas-review/content/body-review-display-pins.json']);
 const result=await build({stdin:{contents:`export * from './atlas-review/app/body-content';
 export * from './atlas-review/lib/hand-arterial-ultrasound';
 export * from './atlas-review/content/hand-arterial-ultrasound';
 export * from './atlas-review/lib/content-types';
 export * from './atlas-review/lib/body-review-material';
 export * from './atlas-review/lib/body-review-context';
 export * from './atlas-review/lib/body-review-response';
 export * from './atlas-review/lib/body-review-api';
 export * from './atlas-review/lib/body-review-decisions';
 export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';`,resolveDir:process.cwd(),loader:'ts'},
  bundle:true,write:false,platform:'node',format:'esm',plugins:previous?[{name:'pre-hand-ultrasound',
   setup(plugin){plugin.onLoad({filter:/\.(?:ts|json)$/},args=>{
    const path=relative(process.cwd(),args.path).replaceAll('\\','/');
    if(!frozen.has(path))return;
    return {contents:old(path),loader:path.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)};
   });}}]:[]});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}

test('28 hand arterial ultrasound drafts reach learner and Review from the pinned source',async()=>{
 const api=await load(),previous=await load(true);
 const pins=json('atlas-review/content/hand-arterial-ultrasound-pins.json');
 const raw=json('public/atlas-runtime/head-neck/models/bodyparts3d/full-body/catalog.json');
 const catalog=api.bodyDisplayCatalog(raw);
 assert.equal(pins.parentCommit,parent);
 assert.equal(pins.entries.length,28);
 assert.equal(new Set(pins.entries.map((entry:any)=>entry.identity.id)).size,28);
 assert.deepEqual(Object.fromEntries([...new Set(pins.entries.map((entry:any)=>entry.group))].map(group=>
  [group,pins.entries.filter((entry:any)=>entry.group===group).length])),
  {superficialArch:2,deepArch:2,metacarpal:2,princeps:2,radialis:2,commonDigital:8,properDigital:10});
 assert.equal(Object.keys(api.handArterialUltrasoundTopics).length,7);
 assert.deepEqual(pins.coordinateSystem,catalog.coordinateSystem);
 assert.deepEqual(catalog,api.bodyDisplayCatalog(oldJson('public/atlas-runtime/head-neck/models/bodyparts3d/full-body/catalog.json')));
 assert.equal(catalog.structures.length,1104);
 for(const bundle of pins.bundles){
  assert.deepEqual(catalog.bundles.find((row:any)=>row.id===bundle.id),bundle);
  const bytes=readFileSync('public/atlas-runtime/head-neck'+bundle.url.split('?')[0]);
  assert.equal(bytes.length,bundle.bytes);assert.equal(sha(bytes),bundle.sha256);
 }

 const review=json('atlas-review/manifest.json'),priorReview=oldJson('atlas-review/manifest.json');
 assert.equal(review.revision,source);
 assert.deepEqual(review.packages,priorReview.packages);
 assert.deepEqual(review.files.filter((row:any)=>!priorReview.files.some((before:any)=>before.path===row.path))
  .map((row:any)=>row.path).sort(),additions);
 for(const path of additions){
  const record=review.files.find((row:any)=>row.path===path);
  assert(record,path);assert.equal(sha(readFileSync('atlas-review/'+path)),record.importedSha256,path);
 }
 const renderer=json('atlas-review/content/body-renderer-revision.json');
 const priorRenderer=oldJson('atlas-review/content/body-renderer-revision.json');
 assert.deepEqual(renderer.entrypoints,priorRenderer.entrypoints);
 const priorDependencies=new Map(priorRenderer.dependencies.map((row:any)=>[row.path,row.sha256]));
 assert.deepEqual(renderer.dependencies.filter((row:any)=>!priorDependencies.has(row.path)).map((row:any)=>row.path).sort(),additions);
 for(const row of renderer.dependencies){
  if(row.path==='app/body-content.ts'||additions.includes(row.path))continue;
  if(row.path==='package.json'){
   // Source2063 adds only hand-arterial-ultrasound:test; website packages and
   // lockfile stay exact. Pin both hashes, not an unrestricted exception.
   assert.equal(priorDependencies.get(row.path),'0b638cb3d82b0b13d1c836a814c25e6b2b978f244cc49fe0000fca640bdf731e');
   assert.equal(row.sha256,'2ca5113dcc70f58c98663884f720e8ddef66f8a08f8ab1a939330d227254bc90');
   continue;
  }
  assert.equal(row.sha256,priorDependencies.get(row.path),row.path+' renderer/camera dependency');
 }
 for(const path of ['LICENSES/THIRD_PARTY_NOTICES.md','package.json','package-lock.json',
  'lib/atlas-delivery-access.ts','lib/lecture-repository.ts','atlas-review/LICENSES/THIRD_PARTY_NOTICES.md',
  'atlas-review/app/whole-body-guided-learning.tsx','atlas-review/app/regional-guided-learning.tsx',
  'atlas-review/app/tour-imaging-notes.tsx','atlas-review/lib/tour-camera.ts',
  'atlas-review/lib/regional-tours.ts','atlas-review/lib/learning-resources.ts'])sameText(path);
 const inventory=json('lib/atlas-model-inventory.json');
 assert.deepEqual(inventory.models,oldJson('lib/atlas-model-inventory.json').models);
 assert.equal(inventory.models.length,137);

 let learnerCode='';
 for(const name of ['head-neck','shoulder','female-pelvis','lower-limb']){
  const base=`public/atlas-runtime/${name}/`,manifest=json(base+'manifest.json'),before=oldJson(base+'manifest.json');
  assert.equal(manifest.sourceCommit,source,`${name} source binding`);
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection'])assert.equal(manifest[flag],false);
  assert.equal(manifest.imagingConnection,before.imagingConnection);
  assert.deepEqual(manifest.files.filter((row:any)=>row.path.startsWith('models/')),
   before.files.filter((row:any)=>row.path.startsWith('models/')),`${name} model inventory`);
  for(const file of manifest.files)assert.equal(sha(readFileSync(base+file.path)),file.sha256,base+file.path);
  const inputs=json(base+'source-inputs.json');
  // The dedicated shoulder also imports shared body-content; closure inclusion
  // does not grant additional hand selections in its nine-structure pilot.
  for(const path of additions)assert.equal(inputs.some((row:any)=>row.path===path),name==='head-neck'||name==='shoulder',`${name} ${path}`);
  if(name==='head-neck'){
   for(const path of additions)assert.equal(inputs.find((row:any)=>row.path===path)?.sha256,
    review.files.find((row:any)=>row.path===path)?.sourceSha256,path);
   learnerCode=emittedTeaching(base,manifest.files,true);
  }
 }
 const viewerBase='public/atlas-review-viewer/',viewer=json(viewerBase+'manifest.json');
 assert.equal(viewer.sourceCommit,source);assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 assert.equal(viewer.personalRecordsIncluded,false);
 for(const file of viewer.files)assert.equal(sha(readFileSync(viewerBase+file.path)),file.sha256,viewerBase+file.path);
 const reviewCode=emittedTeaching(viewerBase,viewer.files,true);

 const targets=new Map(pins.entries.map((entry:any)=>[entry.identity.id,entry]));
 let changed=0,preserved=0;
 for(const structure of catalog.structures){
  const entry=targets.get(structure.id) as any;
  if(entry){
   assert.deepEqual(structure,entry.identity,structure.id+' source identity');
   assert.equal(structure.region,'hand');assert.equal(structure.system,'vessels');
   assert.equal(structure.validation.anatomicalReview,false);
   assert.deepEqual(entry.topics,['ultrasound']);
  }
  for(const tab of api.contentTabs){
   const before=previous.bodyLesson(structure,tab),after=api.bodyLesson(structure,tab);
   if(!entry||tab!=='ultrasound'){
    assert.deepEqual(after,before,structure.id+'|'+tab);preserved++;continue;
   }
   changed++;assert.deepEqual(before,entry.previous.ultrasound);
   assert.equal(before.readiness,'pending');assert.equal(after.readiness,'draft');
   assert.deepEqual(after,api.handArterialUltrasoundLesson(structure,tab));
   assert.equal(after.body,api.handArterialUltrasoundTopics[entry.group].body);
   assert(after.bullets.includes(`Source limit: ${structure.coverageNote}`));
   assert.match(after.bullets[0],/no patient ultrasound/i);
   assert.match(after.note,/revision-bound radiologist review/);
   assert.match(after.note,/No patient images, registration or clinical approval/);
   assert.match(after.note,/access remain independent/);
   assert(after.citations.length>0&&after.citations.every((url:string)=>new URL(url).protocol==='https:'));
   for(const code of [learnerCode,reviewCode]){
    assert(code.includes(structure.id)||code.includes(JSON.stringify(structure.id).slice(1,-1)),structure.id+' emitted ID');
    assert(code.includes('Source limit: '));
    for(const value of [after.body,...after.bullets.filter((b:string)=>!b.startsWith('Source limit: ')),...after.citations,after.note])
     assert(code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1)),structure.id+' reachable '+value);
   }
  }
 }
 assert.deepEqual({changed,preserved},{changed:28,preserved:9908});
});

test('only 28 teaching revisions advance; protected Review rejects altered, stale and unsupported imaging evidence',async()=>{
 const api=await load(),previous=await load(true);
 const pins=json('atlas-review/content/hand-arterial-ultrasound-pins.json');
 const catalog=api.bodyDisplayCatalog(json('public/atlas-runtime/head-neck/models/bodyparts3d/full-body/catalog.json'));
 const targets=new Set(pins.entries.map((entry:any)=>entry.identity.id));
 const storage=new Proxy({},{get(){throw Error('Invalid synthetic decision reached private storage');}});
 let changed=0,unchanged=0,stale=0,imagingRefusals=0;
 for(const structure of catalog.structures){
  const id=structure.id;
  const before=await previous.bodyReviewMaterial(id),after=await api.bodyReviewMaterial(id);
  assert.deepEqual(after.source,before.source);assert.deepEqual(after.reasoning,before.reasoning);
  assert.deepEqual(after.guidedTours,before.guidedTours);
  assert.equal(after.fingerprints.source,before.fingerprints.source);
  assert.equal(after.approval,false);
  const context=await api.bodyReviewContext(id),prior=await previous.bodyReviewContext(id);
  assert.equal(context.sourceHash,prior.sourceHash);assert.equal(context.revisions.imaging,null);
  if(!targets.has(id)){
   assert.deepEqual(after,before,id+' unrelated worksheet');
   assert.equal(context.revisions.teaching,prior.revisions.teaching);unchanged++;continue;
  }
  changed++;
  assert.equal(after.status,'worksheet-not-submitted');
  assert.notEqual(after.fingerprints.teaching,before.fingerprints.teaching);
  assert.equal(after.fingerprints.checklist,before.fingerprints.checklist);
  assert.deepEqual(after.topics.filter((topic:any)=>topic.tab!=='ultrasound'),before.topics.filter((topic:any)=>topic.tab!=='ultrasound'));
  assert.equal(after.topics.find((topic:any)=>topic.tab==='ultrasound').readiness,'draft');
  assert.notEqual(context.revisions.teaching,prior.revisions.teaching);
  assert(await api.parseBodyReviewResponse(after,id));
  const altered=structuredClone(after);
  altered.topics.find((topic:any)=>topic.tab==='ultrasound').body+=' Foreign source';
  assert.equal(await api.parseBodyReviewResponse(altered,id),null);
  for(const delta of [{materialHash:before.materialHash},{revisionHash:prior.revisions.teaching}]){
   const request=new Request('https://review.test/api/atlas-review/body-review/decisions',{method:'POST',
    headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_HAND_US_REVIEW'},
    body:JSON.stringify({catalogScope:context.catalogScope,structureId:id,track:'teaching',expectedVersion:0,
     materialHash:context.materialHash,revisionHash:context.revisions.teaching,
     checklistVersion:context.checklistVersion,draft:api.blankBodyReview(context,'teaching'),...delta})});
   assert.equal((await api.postBodyDecision(request,storage)).status,409);stale++;
  }
  const draft=api.blankBodyReview(context,'imaging');
  draft.status='approved';draft.reviewer='SYNTHETIC_REVIEWER';draft.qualification='Synthetic test only';
  draft.scope='Synthetic image approval refusal';draft.attested=true;
  for(const key of Object.keys(draft.checks))draft.checks[key]=true;
  const request=new Request('https://review.test/api/atlas-review/body-review/decisions',{method:'POST',
   headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_HAND_US_REVIEW'},
   body:JSON.stringify({catalogScope:context.catalogScope,structureId:id,track:'imaging',expectedVersion:0,
    materialHash:context.materialHash,revisionHash:context.revisions.imaging,
    checklistVersion:context.checklistVersion,draft})});
  const response=await api.postBodyDecision(request,storage);
  assert.equal(response.status,422);assert.match((await response.json()).error,/No validated acquired-image/);
  imagingRefusals++;
 }
 assert.deepEqual({changed,unchanged,stale,imagingRefusals},{changed:28,unchanged:1076,stale:56,imagingRefusals:28});
});
