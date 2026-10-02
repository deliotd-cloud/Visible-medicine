import assert from 'node:assert/strict';
import {preMCAImportBytes} from './atlas-mca-history.ts';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname} from 'node:path';
import {build} from 'esbuild';
import {wristUltrasoundMilestoneBytes,withoutCircleWillisNotice} from './atlas-circle-willis-history.ts';
import {circleWillisMilestoneBytes} from './atlas-carpal-bone-quiz-history.ts';
const revision='6c156e8b4cead4a24cc19ea2cc5a53e77ba8e06e';
const json=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
async function load(previous=false){
 const result=await build({stdin:{contents:`export * from './atlas-review/lib/regional-tours';
 export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-context';
 export * from './atlas-review/lib/body-review-response';export * from './atlas-review/lib/body-review-decisions';export * from './atlas-review/lib/body-review-api';
 export * from './atlas-review/lib/nested-review-material';
 import raw from './atlas-review/public/models/bodyparts3d/full-body/catalog.json';
 import {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);`,
 resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins:previous?[{name:'exact-pre-circle-willis-host',setup(api){
 for(const file of ['lib/regional-tours.ts','content/body-renderer-revision.json','content/body-review-display-pins.json']){
  const escaped=file.replaceAll('.','\\.').replaceAll('/','[\\\\/]');
  api.onLoad({filter:new RegExp(escaped+'$')},args=>({contents:wristUltrasoundMilestoneBytes('atlas-review/'+file).toString(),loader:file.endsWith('.ts')?'ts':'json',resolveDir:dirname(args.path)}));
 }
 }}]:[]});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
test('Circle of Willis tour reaches contained learner and protected review without new anatomy or access',async()=>{
 const api=await load(),tour=api.circleWillisTour,review=json('atlas-review/manifest.json');
 const prior=JSON.parse(wristUltrasoundMilestoneBytes('atlas-review/manifest.json').toString());
 assert.equal(review.revision,revision);assert.equal(review.files.length,966);assert.deepEqual(review.packages,prior.packages);
 const preMCA=JSON.parse(preMCAImportBytes('atlas-review/manifest.json').toString());
 assert.deepEqual(preMCA.files.filter((f:any)=>!prior.files.some((p:any)=>p.path===f.path)).map((f:any)=>f.path).sort(),['content/carpal-bone-quiz-pins.json','content/carpal-bone-quiz.ts','lib/carpal-bone-quiz.ts','lib/circle-willis-tour.ts','content/thoracic-bone-quiz-pins.json','content/thoracic-bone-quiz.ts','lib/thoracic-bone-quiz.ts'].sort());
 for(const f of review.files)assert.equal(sha(readFileSync('atlas-review/'+f.path)),f.importedSha256,f.path);
 assert.equal(tour.status,'draft');assert.equal(tour.steps.length,10);assert.equal(api.regionalTours.length,25);
 assert.equal(api.regionalTours.reduce((n:number,t:any)=>n+t.steps.length,0),146);
 assert.equal(api.regionalToursFor('head-neck').length,5);assert.equal(api.regionalTourFor('head-neck').id,'laryngeal-framework-orientation');
 assert.equal(new Set(tour.steps.map((s:any)=>s.selectedId)).size,10);
 assert.deepEqual(api.regionalTourStructures(api.catalog,tour).map((s:any)=>s.fmaId),['FMA3949','FMA4062','FMA50029','FMA50030','FMA50169','FMA50085','FMA50086','FMA50542','FMA50584','FMA50585']);
 for(const [folder,protectedViewer]of [['public/atlas-runtime/head-neck/',false],['public/atlas-review-viewer/',true]]as const){
  const manifest=json(folder+'manifest.json');assert.equal(manifest.sourceCommit,revision);
  assert.equal(manifest[protectedViewer?'personalRecordsIncluded':'patientDataIncluded'],false);
  const previous=JSON.parse(wristUltrasoundMilestoneBytes(folder+'manifest.json').toString());
  if(!protectedViewer){assert.equal(manifest.clinicalApproved,false);assert.equal(manifest.imagingConnection,false);
   assert.deepEqual(manifest.files.filter((f:any)=>f.path.startsWith('models/')),previous.files.filter((f:any)=>f.path.startsWith('models/')));}
  const code=manifest.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>{const b=readFileSync(folder+f.path);assert.equal(sha(b),f.sha256);return b.toString();}).join('\n');
  for(const text of [tour.id,tour.revision,tour.limitations,...tour.steps.flatMap((s:any)=>[s.title,s.caption,...s.references])])
   assert(code.includes(text)||code.includes(JSON.stringify(text).slice(1,-1)),text+' missing from delivered guide');
 }
 for(const name of ['head-neck','shoulder','lower-limb']){
  const folder='public/atlas-runtime/'+name+'/';assert.equal(json(folder+'manifest.json').sourceCommit,revision);
  assert.equal(json(folder+'source-inputs.json').length,({'head-neck':939,shoulder:619,'lower-limb':100} as Record<string,number>)[name]);
  assert.equal(withoutCircleWillisNotice(readFileSync(folder+'LICENSES/THIRD_PARTY_NOTICES.md','utf8')),wristUltrasoundMilestoneBytes(folder+'LICENSES/THIRD_PARTY_NOTICES.md').toString());
 }
 assert.deepEqual(json('lib/atlas-model-inventory.json').models,JSON.parse(wristUltrasoundMilestoneBytes('lib/atlas-model-inventory.json').toString()).models);
});
test('only ten tour teaching identities change; all topics/nested drafts remain and stale approvals fail closed',async()=>{
 const api=await load(),before=await load(true),tour=api.circleWillisTour,ids=new Set<string>(tour.steps.map((s:any)=>s.selectedId));
 assert.deepEqual(api.regionalTours.filter((t:any)=>t.id!==tour.id),before.regionalTours);
 assert.deepEqual(api.catalog,before.catalog);let preserved=0,topics=0,rejected=0,altered=0,nested=0;
 const storage=new Proxy({},{get(){throw Error('Stale request reached storage');}});
 const request=(payload:any)=>new Request('https://review.test/api/review',{method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_CIRCLE_TOUR_TEST'},body:JSON.stringify(payload)});
 for(const row of api.bodyReviewSummaries){
  const now=api.bodyReviewSnapshot(row.id),prior=before.bodyReviewSnapshot(row.id);
  assert.deepEqual(now.source,prior.source);assert.deepEqual(now.topics,prior.topics);assert.deepEqual(now.reasoning,prior.reasoning);
  assert.deepEqual(now.guidedTours.filter((e:any)=>e.tour.id!==tour.id),prior.guidedTours);topics+=now.topics.length;preserved++;
  const c=await api.bodyReviewContext(row.id),old=await before.bodyReviewContext(row.id);
  assert.equal(c.sourceHash,old.sourceHash);assert.equal(c.revisions.imaging,null);assert.deepEqual(c.blockers,old.blockers);
  if(ids.has(row.id))assert.notEqual(c.revisions.teaching,old.revisions.teaching);else assert.equal(c.revisions.teaching,old.revisions.teaching);
  const payload={catalogScope:c.catalogScope,structureId:row.id,track:'geometry',expectedVersion:0,materialHash:c.materialHash,
   revisionHash:old.revisions.geometry,checklistVersion:c.checklistVersion,draft:api.blankBodyReview(c,'geometry')};
  assert.equal((await api.postBodyDecision(request(payload),storage)).status,409);rejected++;
  if(!ids.has(row.id))continue;
  const packet=await api.bodyReviewMaterial(row.id);assert.equal(packet.approval,false);assert(await api.parseBodyReviewResponse(packet,row.id));
  const index=packet.guidedTours.findIndex((e:any)=>e.tour.id===tour.id),e=packet.guidedTours[index];
  assert.equal(e.transition,'quintic-orbit');assert.equal(e.transitionMs,1800);assert.equal(e.separation,0);assert.equal(e.stepFrames.length,10);
  for(const mutate of [(p:any)=>p.guidedTours.splice(index,1),(p:any)=>p.guidedTours.push(structuredClone(p.guidedTours[index])),
   (p:any)=>p.guidedTours[index].tour.steps.reverse(),(p:any)=>p.guidedTours[index].tour.steps[0].caption+=' foreign',
   (p:any)=>p.guidedTours[index].transition='linear',(p:any)=>p.guidedTours[index].separation=1]){
   const bad=structuredClone(packet);mutate(bad);assert.equal(await api.parseBodyReviewResponse(bad,row.id),null);altered++;
  }
  payload.track='teaching';payload.revisionHash=old.revisions.teaching;payload.draft=api.blankBodyReview(c,'teaching');
  assert.equal((await api.postBodyDecision(request(payload),storage)).status,409);rejected++;
 }
 for(const group of api.nestedReviewRows)for(const row of group.surfaces){
  const now=await api.nestedReviewMaterial(group.key,row.id),prior=await before.nestedReviewMaterial(group.key,row.id);
  assert.deepEqual(now.teaching,prior.teaching);assert.deepEqual(now.source,prior.source);nested++;
 }
 assert.equal(preserved,1104);assert.equal(topics,9936);assert.equal(rejected,1114);assert.equal(altered,60);assert.equal(nested,108);
 const oldPins=JSON.parse(wristUltrasoundMilestoneBytes('atlas-review/content/body-review-display-pins.json').toString()),pins=JSON.parse(circleWillisMilestoneBytes('atlas-review/content/body-review-display-pins.json').toString());
 const oldMap=new Map(oldPins.pins.map((p:any)=>[p.structureId,p.sha256]));assert.equal(pins.pins.length,oldPins.pins.length);
 assert.deepEqual(pins.pins.filter((p:any)=>p.sha256!==oldMap.get(p.structureId)).map((p:any)=>p.structureId).sort(),[...ids].sort());
});
test('historical replay removes only the exact Circle of Willis notice',()=>{
 const current=readFileSync('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md','utf8'),before=wristUltrasoundMilestoneBytes('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md').toString();
 assert.equal(withoutCircleWillisNotice(current),before);assert.equal(withoutCircleWillisNotice(before),before);
 const suffix='\nAdditional dependency notice\n';assert.equal(withoutCircleWillisNotice(current+suffix),before+suffix);
 const prefix='# Clinical Review third-party notices\n\nAtlas source: '+revision+'\n\n';
 assert.equal(withoutCircleWillisNotice(prefix+current+suffix),prefix+before+suffix);
 assert.throws(()=>withoutCircleWillisNotice('Foreign prefix\n'+current));
 assert.throws(()=>withoutCircleWillisNotice(prefix.replace(revision,'0'.repeat(40))+current));
 assert.throws(()=>withoutCircleWillisNotice(current.replace('Ten original draft captions','Altered original draft captions')));
 assert.throws(()=>withoutCircleWillisNotice(current+'\n## Circle of Willis guided orientation (2 October 2026)\n'));
});
