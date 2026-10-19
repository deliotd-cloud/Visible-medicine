import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {dirname,relative} from 'node:path';
import {build,emittedTeaching,readFileSync} from './atlas-pre-hand-tour-history.ts';

// Preserve the exact completed hand-CT milestone; the arterial-tour test checks
// current delivery and all unchanged CT/other topics independently.

const baseline='5c1e040f4456b35a53950fdcd6b248d92551441a';
const parentSource='946700cc8c5162076cd5e5d9f79a00ba72c6fda1';
const additions=['content/hand-arterial-ct-pins.json','content/hand-arterial-ct.ts','lib/hand-arterial-ct.ts'];
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const sha=(bytes:Buffer|string)=>createHash('sha256').update(bytes).digest('hex');
const old=(path:string)=>execFileSync('git',['show',`${baseline}:${path}`],{maxBuffer:32e6});
const sameText=(path:string)=>assert.equal(readFileSync(path,'utf8').replaceAll('\r\n','\n'),
 old(path).toString().replaceAll('\r\n','\n'),path);

async function load(previous=false){
 const frozen=new Set(['atlas-review/app/body-content.ts','atlas-review/content/body-renderer-revision.json',
  'atlas-review/content/body-review-display-pins.json']);
 const result=await build({stdin:{contents:`export * from './atlas-review/app/body-content';
 export * from './atlas-review/lib/hand-arterial-ct';
 export * from './atlas-review/lib/content-types';
 export * from './atlas-review/lib/body-review-material';
 export * from './atlas-review/lib/body-review-context';
 export * from './atlas-review/lib/body-review-response';
 export * from './atlas-review/lib/body-review-api';
 export * from './atlas-review/lib/body-review-decisions';
 export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';`,resolveDir:process.cwd(),loader:'ts'},
 bundle:true,write:false,platform:'node',format:'esm',plugins:previous?[{name:'pre-hand-ct-import',
  setup(plugin:import('esbuild').PluginBuild){plugin.onLoad({filter:/\.(?:ts|json)$/},args=>{
   const path=relative(process.cwd(),args.path).replaceAll('\\','/');
   if(!frozen.has(path))return;
   return {contents:old(path),loader:path.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)};
  });}}]:[]});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}

test('26 exact hand vessel CT drafts reach the shared learner and protected Review from bound source',async()=>{
 const api=await load(),previous=await load(true);
 const pins=json('atlas-review/content/hand-arterial-ct-pins.json');
 const catalog=api.bodyDisplayCatalog(json('public/atlas-runtime/head-neck/models/bodyparts3d/full-body/catalog.json'));
 const priorCatalog=previous.bodyDisplayCatalog(JSON.parse(old('public/atlas-runtime/head-neck/models/bodyparts3d/full-body/catalog.json').toString()));
 assert.equal(pins.parentCommit,parentSource);
 assert.equal(pins.entries.length,26);
 assert.equal(new Set(pins.entries.map((entry:any)=>entry.identity.id)).size,26);
 assert.deepEqual(Object.fromEntries([...new Set(pins.entries.map((entry:any)=>entry.group))].map(group=>
  [group,pins.entries.filter((entry:any)=>entry.group===group).length])),
  {deepArch:2,metacarpal:2,princeps:2,radialis:2,commonDigital:8,properDigital:10});
 assert.deepEqual(pins.coordinateSystem,catalog.coordinateSystem);
 assert.deepEqual(catalog.structures,priorCatalog.structures,'all source selections stay unchanged');
 assert.deepEqual(catalog.bundles,priorCatalog.bundles,'all source bundles stay unchanged');
 assert.equal(catalog.structures.length,1104);
 for(const bundle of pins.bundles){
  assert.deepEqual(catalog.bundles.find((row:any)=>row.id===bundle.id),bundle);
  const bytes=readFileSync('public/atlas-runtime/head-neck'+bundle.url.split('?')[0]);
  assert.equal(bytes.length,bundle.bytes);assert.equal(sha(bytes),bundle.sha256);
 }

 const review=json('atlas-review/manifest.json'),oldReview=JSON.parse(old('atlas-review/manifest.json').toString());
 assert.match(review.revision,/^[a-f0-9]{40}$/);
 assert.notEqual(review.revision,parentSource,'the imported source must advance the parent');
 assert.deepEqual(review.packages,oldReview.packages);
 assert.deepEqual(review.files.filter((row:any)=>!oldReview.files.some((before:any)=>before.path===row.path))
  .map((row:any)=>row.path).sort(),additions);
 for(const path of additions){const record=review.files.find((row:any)=>row.path===path);
  assert(record,path);assert.equal(sha(readFileSync('atlas-review/'+path)),record.importedSha256,path);
 }
 for(const path of ['LICENSES/THIRD_PARTY_NOTICES.md','package.json','package-lock.json',
  'lib/atlas-delivery-access.ts','lib/lecture-repository.ts','atlas-review/LICENSES/THIRD_PARTY_NOTICES.md'])sameText(path);
 assert.deepEqual(json('lib/atlas-model-inventory.json').models,JSON.parse(old('lib/atlas-model-inventory.json').toString()).models);
 assert.equal(json('lib/atlas-model-inventory.json').models.length,137);

 let learnerCode='';
 for(const name of ['head-neck','shoulder','female-pelvis','lower-limb']){
  const base=`public/atlas-runtime/${name}/`,manifest=json(base+'manifest.json');
  const before=JSON.parse(old(base+'manifest.json').toString());
  assert.equal(manifest.sourceCommit,review.revision,`${name} source binding`);
  assert.equal(manifest.patientDataIncluded,false);
  assert.deepEqual(manifest.files.filter((row:any)=>row.path.startsWith('models/')),
   before.files.filter((row:any)=>row.path.startsWith('models/')),`${name} model records`);
  for(const file of manifest.files)assert.equal(sha(readFileSync(base+file.path)),file.sha256,base+file.path);
  if(name==='head-neck'){
   const inputs=json(base+'source-inputs.json');
   for(const path of additions)assert.equal(inputs.find((row:any)=>row.path===path)?.sha256,
    review.files.find((row:any)=>row.path===path)?.sourceSha256,path);
   learnerCode=emittedTeaching(base,manifest.files,true);
  }
 }
 const viewerBase='public/atlas-review-viewer/',viewer=json(viewerBase+'manifest.json');
 assert.equal(viewer.sourceCommit,review.revision);
 assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 assert.equal(viewer.personalRecordsIncluded,false);
 for(const file of viewer.files)assert.equal(sha(readFileSync(viewerBase+file.path)),file.sha256,viewerBase+file.path);
 const reviewCode=emittedTeaching(viewerBase,viewer.files,true);
 const disconnected=Buffer.from('<!doctype html><title>Disconnected Review entry</title>');
 const disconnectedFiles=viewer.files.map((file:any)=>file.path==='index.html'?{...file,sha256:sha(disconnected)}:file);
 assert.throws(()=>emittedTeaching(viewerBase,disconnectedFiles,true,
  path=>path===viewerBase+'index.html'?disconnected:readFileSync(path)),/Teaching is reachable through emitted entry imports/);

 const targets=new Map(pins.entries.map((entry:any)=>[entry.identity.id,entry]));
 let changed=0,preserved=0;
 for(const structure of catalog.structures){
  const entry=targets.get(structure.id) as any;
  if(entry){
   assert.deepEqual(structure,entry.identity,structure.id+' source identity');
   assert.equal(structure.region,'hand');assert.equal(structure.system,'vessels');
   assert.equal(structure.validation.anatomicalReview,false);
   assert.deepEqual(entry.topics,['ct']);
  }
  for(const tab of api.contentTabs){
   const before=previous.bodyLesson(structure,tab),after=api.bodyLesson(structure,tab);
   if(!entry||tab!=='ct'){
    assert.deepEqual(after,before,structure.id+'|'+tab);preserved++;continue;
   }
   changed++;assert.deepEqual(before,entry.previous.ct);
   assert.equal(before.readiness,'pending');assert.equal(after.readiness,'draft');
   assert.deepEqual(after,api.handArterialCtLesson(structure,tab));
   assert(after.bullets.includes(`Source limit: ${structure.coverageNote}`));
   assert.match(after.bullets[0],/routine CT is not an arterial map/);
   assert.match(after.note,/No patient images, registration or clinical approval/);
   assert.match(after.note,/access remain independent/);
   assert.equal(after.citations.length,2);
   assert(after.citations.every((url:string)=>new URL(url).protocol==='https:'));
   // The source-limit bullet is computed from the independently verified
   // selected catalogue record, not emitted as one concatenated string.
   for(const code of [learnerCode,reviewCode])assert(code.includes('Source limit: '));
   for(const value of [after.body,...after.bullets.filter((b:string)=>!b.startsWith('Source limit: ')),...after.citations,after.note])
    for(const code of [learnerCode,reviewCode])
     assert(code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1)),structure.id+' reachable '+value);
  }
 }
 assert.deepEqual({changed,preserved},{changed:26,preserved:9910});
});

test('protected Review refuses altered CT packets and stale synthetic decisions before storage',async()=>{
 const api=await load(),previous=await load(true);
 const pins=json('atlas-review/content/hand-arterial-ct-pins.json');
 const storage=new Proxy({},{get(){throw Error('Stale decision reached storage');}});
 let stale=0;
 for(const entry of pins.entries){
  const id=entry.identity.id;
  const before=await previous.bodyReviewMaterial(id),after=await api.bodyReviewMaterial(id);
  assert.deepEqual(after.source,before.source);assert.deepEqual(after.reasoning,before.reasoning);
  assert.deepEqual(after.guidedTours,before.guidedTours);
  assert.equal(after.fingerprints.source,before.fingerprints.source);
  assert.notEqual(after.fingerprints.teaching,before.fingerprints.teaching);
  assert.equal(after.approval,false);assert.equal(after.status,'worksheet-not-submitted');
  assert.deepEqual(after.topics.filter((topic:any)=>topic.tab!=='ct'),before.topics.filter((topic:any)=>topic.tab!=='ct'));
  assert.equal(after.topics.find((topic:any)=>topic.tab==='ct').readiness,'draft');
  assert(await api.parseBodyReviewResponse(after,id));
  const altered=structuredClone(after);
  altered.topics.find((topic:any)=>topic.tab==='ct').body+=' Foreign source';
  assert.equal(await api.parseBodyReviewResponse(altered,id),null);
  const context=await api.bodyReviewContext(id),prior=await previous.bodyReviewContext(id);
  assert.equal(context.sourceHash,prior.sourceHash);
  assert.notEqual(context.revisions.teaching,prior.revisions.teaching);
  assert.equal(context.revisions.imaging,null);
  for(const delta of [{materialHash:before.materialHash},{revisionHash:prior.revisions.teaching}]){
   const request=new Request('https://review.test/api/atlas-review/body-review/decisions',{method:'POST',
    headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_HAND_CT_REVIEW'},
    body:JSON.stringify({catalogScope:context.catalogScope,structureId:id,track:'teaching',expectedVersion:0,
     materialHash:context.materialHash,revisionHash:context.revisions.teaching,
     checklistVersion:context.checklistVersion,draft:api.blankBodyReview(context,'teaching'),...delta})});
   assert.equal((await api.postBodyDecision(request,storage)).status,409);stale++;
  }
 }
 assert.equal(stale,52);
});
