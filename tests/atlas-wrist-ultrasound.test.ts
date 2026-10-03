import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname} from 'node:path';
import {build} from 'esbuild';
import {lumbarSacralMilestoneBytes,withoutWristUltrasoundNotice} from './atlas-wrist-ultrasound-history.ts';
import {wristUltrasoundMilestoneBytes} from './atlas-circle-willis-history.ts';
const revision='2413ff790069d5bfa6c2c507d67ebfa2a5b3fe51';
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
async function api(previous=false,wristMilestone=false){
 const result=await build({stdin:{contents:`export * from './atlas-review/app/body-content';
 export * from './atlas-review/content/wrist-ultrasound';export * from './atlas-review/lib/wrist-ultrasound';
 export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-context';
 export * from './atlas-review/lib/body-review-response';export * from './atlas-review/lib/body-review-decisions';export * from './atlas-review/lib/body-review-api';
 export * from './atlas-review/lib/nested-review-material';export * from './atlas-review/lib/nested-review';export * from './atlas-review/lib/nested-review-api';`,
 resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',
 plugins:previous||wristMilestone?[{name:'exact-wrist-ultrasound-website-history',setup(p){
  const milestone=previous?lumbarSacralMilestoneBytes:wristUltrasoundMilestoneBytes;
  for(const file of ['app/body-content.ts','content/body-renderer-revision.json'])p.onLoad({filter:file.endsWith('.ts')?/[\\/]app[\\/]body-content\.ts$/:/[\\/]content[\\/]body-renderer-revision\.json$/},args=>({contents:milestone('atlas-review/'+file).toString(),loader:file.endsWith('.ts')?'ts':'json',resolveDir:dirname(args.path)}));
 }}]:[]});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}

test('eight exact wrist Ultrasound drafts reach lazy learner teaching and protected unsigned review',async()=>{
 const review=json('atlas-review/manifest.json'),prior=JSON.parse(lumbarSacralMilestoneBytes('atlas-review/manifest.json').toString());
 assert.equal(review.revision,revision);assert.equal(review.files.length,989);assert.deepEqual(review.packages,prior.packages);
 const wristDelivery=JSON.parse(wristUltrasoundMilestoneBytes('atlas-review/manifest.json').toString());
 assert.deepEqual(wristDelivery.files.filter((f:any)=>!prior.files.some((p:any)=>p.path===f.path)).map((f:any)=>f.path).sort(),['content/wrist-ultrasound-pins.json','content/wrist-ultrasound.ts','lib/wrist-ultrasound.ts']);
 for(const file of review.files)assert.equal(sha(readFileSync('atlas-review/'+file.path)),file.importedSha256,file.path);
 const pins=json('atlas-review/content/wrist-ultrasound-pins.json');assert.equal(pins.parentCommit,'ac88a3c72de1e69971321e00a883e4b88fc356ce');assert.equal(pins.entries.length,8);
 assert.deepEqual(pins.entries.map((e:any)=>e.identity.fmaId),['FMA24436','FMA24435','FMA24438','FMA24437','FMA24442','FMA24441','FMA24449','FMA24448']);
 const now=await api(),runtime=json('public/atlas-runtime/head-neck/manifest.json');
 const lazy=runtime.files.filter((f:any)=>/^assets\/body-content-[\w-]+\.js$/.test(f.path));assert.equal(lazy.length,1);
 const bytes=readFileSync('public/atlas-runtime/head-neck/'+lazy[0].path);assert.equal(sha(bytes),lazy[0].sha256);const text=bytes.toString();
 for(const entry of pins.entries){
  const lesson=now.bodyLesson(entry.identity,'ultrasound'),topic=now.wristUltrasoundTopics[entry.group];
  assert.equal(entry.identity.validation.status,'unvalidated');assert.equal(entry.identity.validation.anatomicalReview,false);
  assert.equal(lesson.readiness,'draft');assert.equal(lesson.body,topic.body);assert.equal(lesson.bullets[0],topic.landmark);
  assert(text.includes(topic.body));assert(text.includes(topic.landmark));assert.deepEqual(lesson.citations,now.wristUltrasoundReferences);
  for(const url of lesson.citations)assert(text.includes(url));assert.match(lesson.note,/Radiologist review pending/);assert.match(lesson.note,/access remain independent/);
  assert.match(lesson.bullets.join(' '),/cannot exclude a fracture/);
  const {readiness:_readiness,...shown}=lesson;assert.deepEqual(now.bodyContent(entry.identity,'ultrasound'),shown);
  const packet=await now.bodyReviewMaterial(entry.identity.id);assert.equal(packet.approval,false);assert.deepEqual(packet.source.structure,entry.identity);
  assert.deepEqual(packet.topics.find((t:any)=>t.tab==='ultrasound'),{tab:'ultrasound',...lesson});assert.deepEqual(await now.parseBodyReviewResponse(packet,entry.identity.id),packet);
  for(const field of ['body','note']){const altered=structuredClone(packet);altered.topics.find((t:any)=>t.tab==='ultrasound')[field]+=' foreign';assert.equal(await now.parseBodyReviewResponse(altered,entry.identity.id),null);}
  const altered=structuredClone(packet);altered.topics.find((t:any)=>t.tab==='ultrasound').citations.push('https://foreign.test');assert.equal(await now.parseBodyReviewResponse(altered,entry.identity.id),null);
  const context=await now.bodyReviewContext(entry.identity.id);assert(context.teachingTabs.includes('ultrasound'));assert.equal(context.revisions.imaging,null);assert(context.blockers.imaging.length);
  assert.equal(now.wristUltrasoundLesson({...entry.identity,nodeName:'foreign'},'ultrasound'),undefined);
 }
 const oldPins=JSON.parse(lumbarSacralMilestoneBytes('atlas-review/content/body-review-display-pins.json').toString()),newPins=JSON.parse(wristUltrasoundMilestoneBytes('atlas-review/content/body-review-display-pins.json').toString());
 const oldMap=new Map(oldPins.pins.map((p:any)=>[p.structureId,p.sha256]));assert.equal(newPins.pins.length,oldPins.pins.length);
 assert.deepEqual(newPins.pins.filter((p:any)=>p.sha256!==oldMap.get(p.structureId)).map((p:any)=>p.structureId).sort(),pins.entries.map((e:any)=>e.identity.id).sort());
 assert.deepEqual(json('lib/atlas-model-inventory.json').models,JSON.parse(lumbarSacralMilestoneBytes('lib/atlas-model-inventory.json').toString()).models);
 for(const name of ['head-neck','shoulder','lower-limb']){
  const base='public/atlas-runtime/'+name+'/',manifest=json(base+'manifest.json'),old=JSON.parse(lumbarSacralMilestoneBytes(base+'manifest.json').toString());
  assert.equal(manifest.sourceCommit,revision);assert.equal(json(base+'source-inputs.json').length,({'head-neck':962,shoulder:640,'lower-limb':100} as Record<string,number>)[name]);
  assert.deepEqual(manifest.files.filter((f:any)=>f.path.startsWith('models/')),old.files.filter((f:any)=>f.path.startsWith('models/')));
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection','imagingConnection'])assert.deepEqual(manifest[flag],old[flag]);
  assert.equal(withoutWristUltrasoundNotice(readFileSync(base+'LICENSES/THIRD_PARTY_NOTICES.md','utf8')),lumbarSacralMilestoneBytes(base+'LICENSES/THIRD_PARTY_NOTICES.md').toString());
  assert.deepEqual(readFileSync(base+'bundled-dependencies.json'),lumbarSacralMilestoneBytes(base+'bundled-dependencies.json'));
 }
 const viewer=json('public/atlas-review-viewer/manifest.json');assert.equal(viewer.sourceCommit,revision);assert.equal(viewer.personalRecordsIncluded,false);assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
});

test('only eight Ultrasound topics change; all other root/nested packets and stale submission gates retained',async()=>{
 // Freeze this original eight-topic delta at its exact saved delivery epoch.
 // Current delivery is exercised above and the later carpal delta has its own full proof.
 const now=await api(false,true),before=await api(true),targets=new Set(json('atlas-review/content/wrist-ultrasound-pins.json').entries.map((e:any)=>e.identity.id));
 assert.deepEqual(now.bodyReviewSummaries,before.bodyReviewSummaries);assert.equal(now.bodyReviewSummaries.length,1104);
 const storage=new Proxy({},{get(){throw Error('Stale request reached storage');}});
 const request=(body:any)=>new Request('https://review.test/api/review',{method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_WRIST_US_TEST'},body:JSON.stringify(body)});
 let changed=0,unchanged=0,rejected=0,nested=0;
 for(const row of now.bodyReviewSummaries){
  const n=now.bodyReviewSnapshot(row.id),b=before.bodyReviewSnapshot(row.id),target=targets.has(row.id);assert.deepEqual(n.source,b.source);assert.deepEqual(n.reasoning,b.reasoning);assert.deepEqual(n.guidedTours,b.guidedTours);
  for(const topic of n.topics){const prior=b.topics.find((t:any)=>t.tab===topic.tab);if(target&&topic.tab==='ultrasound'){assert.equal(prior.readiness,'pending');assert.equal(topic.readiness,'draft');changed++;}else{assert.deepEqual(topic,prior);unchanged++;}}
  const nc=await now.bodyReviewContext(row.id),bc=await before.bodyReviewContext(row.id);assert.equal(nc.sourceHash,bc.sourceHash);assert.equal(nc.revisions.imaging,null);assert.deepEqual(nc.checklists,bc.checklists);assert.deepEqual(nc.blockers,bc.blockers);assert.notEqual(nc.revisions.geometry,bc.revisions.geometry);
  if(!target){assert.equal(nc.teachingHash,bc.teachingHash);assert.equal(nc.revisions.teaching,bc.revisions.teaching);}else{assert.notEqual(nc.teachingHash,bc.teachingHash);assert.notEqual(nc.revisions.teaching,bc.revisions.teaching);}
  for(const track of target?['geometry','teaching']:['geometry']){
   const body={catalogScope:nc.catalogScope,structureId:row.id,track,expectedVersion:0,materialHash:nc.materialHash,revisionHash:bc.revisions[track],checklistVersion:nc.checklistVersion,draft:now.blankBodyReview(nc,track)};
   assert.equal((await now.postBodyDecision(request(body),storage)).status,409);rejected++;
  }
 }
 assert.deepEqual(now.nestedReviewRows,before.nestedReviewRows);
 for(const group of now.nestedReviewRows)for(const row of group.surfaces){const n=await now.nestedReviewMaterial(group.key,row.id),b=await before.nestedReviewMaterial(group.key,row.id),c=n.context,p=b.context;
  assert.deepEqual(n.source,b.source);assert.deepEqual(n.teaching,b.teaching);assert.equal(n.atlasLink,b.atlasLink);assert.equal(c.teachingHash,p.teachingHash);assert.equal(c.sourceHash,p.sourceHash);assert.equal(c.revisions.teaching,p.revisions.teaching);assert.equal(c.revisions.imaging,null);
  for(const[track,delta]of [['teaching',{materialHash:p.materialHash}],['geometry',{materialHash:p.materialHash}],['geometry',{revisionHash:p.revisions.geometry}]] as const){
   const body={catalogScope:c.catalogScope,nestedKey:c.nestedKey,structureId:c.structureId,sourceFrame:c.sourceFrame,materialHash:c.materialHash,revisionHash:c.revisions[track],checklistVersion:c.checklistVersion,track,expectedVersion:0,draft:now.blankNestedReview(c,track),...(delta as Record<string,string>)};
   assert.equal((await now.postNestedReview(request(body),storage)).status,409);rejected++;
  }nested++;
 }
 assert.deepEqual({changed,unchanged,nested,rejected},{changed:8,unchanged:9928,nested:108,rejected:1436});
});

test('notice history refuses altered or duplicate wrist additions and preserves suffixes',()=>{
 const current=readFileSync('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md','utf8'),previous=lumbarSacralMilestoneBytes('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md').toString();
 assert.equal(withoutWristUltrasoundNotice(current),previous);assert.equal(withoutWristUltrasoundNotice(current+'DEPENDENCY LICENCE SUFFIX'),previous+'DEPENDENCY LICENCE SUFFIX');
 assert.throws(()=>withoutWristUltrasoundNotice(current.replace('Original four draft lessons','Modified four draft lessons')),/Altered/);
 assert.throws(()=>withoutWristUltrasoundNotice(current+'\n## Wrist ultrasound orientation — 2 October 2026\n'),/Duplicate/);
});
