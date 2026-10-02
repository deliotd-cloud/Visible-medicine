import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {dirname} from 'node:path';
import {build} from 'esbuild';
import {withoutPelvicRingNotice} from './atlas-pelvic-notice-history.ts';
import {desktopLayoutImportMilestone,desktopLayoutMilestoneBytes} from './atlas-cubital-ultrasound-history.ts';
const source='49db4337ad84bee7d1823050f5b90ed43cf647c1',before='443896f4f141266c4579fb4e1001c0097bb25479';
const prior=(path:string)=>execFileSync('git',['show',before+':'+path],{maxBuffer:32e6});
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
async function load(previous=false){
 const result=await build({stdin:{contents:`export * from './atlas-review/lib/regional-tours';
 export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-response';
 export * from './atlas-review/lib/body-review-context';export * from './atlas-review/lib/body-review-decisions';
 export * from './atlas-review/lib/body-review-api';import raw from './public/atlas-runtime/head-neck/models/bodyparts3d/full-body/catalog.json';
 import {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);`,
 resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',
 plugins:previous?[{name:'exact-pelvic-website-baseline',setup(api){
  for(const path of ['lib/regional-tours.ts','content/body-review-display-pins.json','content/body-renderer-revision.json'])
   api.onLoad({filter:new RegExp(path.replaceAll('/','[\\\\/]')+'$')},args=>({contents:Buffer.from(prior('atlas-review/'+path)).toString('utf8'),loader:path.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)}));
 }}]:[]});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}

test('complete pelvic-ring tour and notices reach learners and protected review with original models',async()=>{
 const api=await load(),tour=api.pelvicRingTour,review=json('atlas-review/manifest.json');
 assert.equal(review.revision,source);assert.equal(review.files.length,957);
 const old=jsonFrom(prior('atlas-review/manifest.json'));
 assert.deepEqual(review.packages,old.packages);
 const milestone=desktopLayoutImportMilestone();
 assert.deepEqual(milestone.files.filter((f:any)=>!old.files.some((p:any)=>p.path===f.path)).map((f:any)=>f.path).sort(),['content/nested-ct-orientation.ts','content/nested-guided-learning-bindings.v1.json','lib/eye-layer-guide.ts','lib/nested-guided-learning.ts','lib/nested-review-queue.ts','lib/pelvic-ring-tour.ts']);
 const changed=milestone.files.filter((f:any)=>old.files.find((p:any)=>p.path===f.path)?.sourceSha256!==f.sourceSha256).map((f:any)=>f.path).sort();
 assert.deepEqual(changed,['LICENSES/THIRD_PARTY_NOTICES.md','app/atlas-workspace.css','app/eye-layers.css','app/eye-layers.tsx','app/review/nested/nested-review.css','app/review/nested/page.tsx','app/review/nested/workspace.tsx','app/whole-body-guided-learning.css','app/whole-body-guided-learning.tsx','content/body-renderer-revision.json','content/body-review-display-pins.json','content/nested-ct-orientation.ts','content/nested-guided-learning-bindings.v1.json','content/nested-teaching.ts','lib/eye-layer-guide.ts','lib/nested-guided-learning.ts','lib/nested-review-material.ts','lib/nested-review-queue.ts','lib/nested-review.ts','lib/pelvic-ring-tour.ts','lib/regional-tours.ts']);
 for(const f of review.files)assert.equal(sha(readFileSync('atlas-review/'+f.path)),f.importedSha256,f.path);
 const notice=readFileSync('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md','utf8').replaceAll('\r','');
 assert.equal(withoutPelvicRingNotice(notice),Buffer.from(prior('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md')).toString('utf8').replaceAll('\r',''));
 assert.throws(()=>withoutPelvicRingNotice(notice.replace('Six original brief orientation','Altered original orientation')));
 for(const [folder,protectedViewer]of [['public/atlas-runtime/head-neck/',false],['public/atlas-review-viewer/',true]]as const){
  const manifest=json(folder+'manifest.json');assert.equal(manifest.sourceCommit,source);
  assert.equal(manifest[protectedViewer?'personalRecordsIncluded':'patientDataIncluded'],false);
  if(protectedViewer)assert.equal(manifest.mode,'production');else{
   for(const flag of ['clinicalApproved','imagingConnection','standaloneReviewConnection'])assert.equal(manifest[flag],false);
   const previous=jsonFrom(prior(folder+'manifest.json'));
   assert.deepEqual(manifest.modelBundles,previous.modelBundles);
   assert.deepEqual(manifest.files.filter((f:any)=>f.path.startsWith('models/')),previous.files.filter((f:any)=>f.path.startsWith('models/')));
  }
  for(const f of manifest.files)assert.equal(sha(readFileSync(folder+f.path)),f.sha256,f.path);
  const bundled=manifest.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>readFileSync(folder+f.path,'utf8')).join('\n');
  for(const text of [tour.id,tour.revision,tour.limitations,...tour.steps.flatMap((s:any)=>[s.title,s.caption,...s.references])])
   assert(bundled.includes(text)||bundled.includes(JSON.stringify(text).slice(1,-1)),text+' missing from delivered bundle');
  const credits=readFileSync(folder+(protectedViewer?'THIRD_PARTY_NOTICES.txt':'LICENSES/THIRD_PARTY_NOTICES.md'),'utf8');
  assert(credits.includes('Pelvic-ring guided orientation'));assert(credits.includes('Thomas R. Gest and Jaye'));
 }
 assert.equal(tour.status,'draft');assert.equal(tour.steps.length,6);
 assert.equal(new Set(tour.steps.map((s:any)=>s.id)).size,6);
 assert.equal(new Set(tour.steps.map((s:any)=>s.selectedId)).size,5);
 assert.equal(api.regionalTours.length,25);assert.equal(api.regionalTours.reduce((n:number,t:any)=>n+t.steps.length,0),146);
 assert.equal(api.regionalToursFor('pelvis').length,3);
 const oldApi=await load(true);assert.deepEqual(api.regionalTours.filter((t:any)=>t.id!==tour.id&&t.id!==api.circleWillisTour.id),oldApi.regionalTours);
 assert.equal(api.regionalTourFor('pelvis').id,oldApi.regionalTourFor('pelvis').id);
 assert.deepEqual(json('lib/atlas-model-inventory.json').models,jsonFrom(prior('lib/atlas-model-inventory.json')).models);
});

test('five pelvic teaching revisions change, source pins stay exact and stale or altered approvals fail closed',async()=>{
 const api=await load(),previous=await load(true),tour=api.pelvicRingTour;
 const ids=[...new Set<string>(tour.steps.map((s:any)=>s.selectedId))];
 const pins=jsonFrom(desktopLayoutMilestoneBytes('atlas-review/content/body-review-display-pins.json')),oldPins=jsonFrom(prior('atlas-review/content/body-review-display-pins.json'));
 assert.deepEqual({...pins,pins:[]},{...oldPins,pins:[]});assert.equal(pins.pins.length,oldPins.pins.length);
 assert.deepEqual(pins.pins.map((p:any)=>p.structureId),oldPins.pins.map((p:any)=>p.structureId));
 assert.deepEqual(pins.pins.filter((p:any)=>oldPins.pins.find((s:any)=>s.structureId===p.structureId).sha256!==p.sha256).map((p:any)=>p.structureId).sort(),[...ids].sort());
 const storage=new Proxy({},{get(){throw Error('Stale request reached storage');}});let stale=0,altered=0;
 assert.equal(api.catalog.structures.length,1104);
 for(const s of api.catalog.structures)
  assert.deepEqual(api.regionalTourEvidence(api.catalog,s.id).filter((e:any)=>e.tour.id!==tour.id&&e.tour.id!==api.circleWillisTour.id),previous.regionalTourEvidence(previous.catalog,s.id));
 const bounds=ids.map(id=>api.catalog.structures.find((s:any)=>s.id===id).bounds);
 assert.deepEqual(api.regionalTourFrame(api.catalog,tour),{min:[0,1,2].map(a=>Math.min(...bounds.map(b=>b.min[a]))),max:[0,1,2].map(a=>Math.max(...bounds.map(b=>b.max[a])))});
 for(const id of ids){
  const now=await api.bodyReviewMaterial(id),old=await previous.bodyReviewMaterial(id);
  assert.equal(now.approval,false);assert.deepEqual(now.source,old.source);assert.deepEqual(now.topics,old.topics);assert.deepEqual(now.reasoning,old.reasoning);
  assert.equal(now.fingerprints.source,old.fingerprints.source);assert.notEqual(now.fingerprints.teaching,old.fingerprints.teaching);
  assert(await api.parseBodyReviewResponse(now,id));const i=now.guidedTours.findIndex((e:any)=>e.tour.id===tour.id);assert(i>=0);
  const e=now.guidedTours[i];assert.deepEqual(e.tour,tour);assert.equal(e.transition,'quintic-orbit');assert.equal(e.transitionMs,1800);assert.equal(e.separation,0);
  assert.deepEqual(e.stepFrames,tour.steps.map((_:any,index:number)=>api.regionalTourFrame(api.catalog,tour,index)));
  for(const mutate of [(p:any)=>p.guidedTours.splice(i,1),(p:any)=>p.guidedTours.push(structuredClone(p.guidedTours[i])),
   (p:any)=>p.guidedTours[i].tour.steps.reverse(),(p:any)=>p.guidedTours[i].tour.steps[0].caption+=' altered',
   (p:any)=>p.guidedTours[i].tour.revision+='-foreign',(p:any)=>p.guidedTours[i].structures[0].sources[0].sha256='0'.repeat(64),
   (p:any)=>p.guidedTours[i].stepFrames[0].min[0]-=1,(p:any)=>p.guidedTours[i].transition='linear',(p:any)=>p.guidedTours[i].separation=1]){
   const packet=structuredClone(now);mutate(packet);assert.equal(await api.parseBodyReviewResponse(packet,id),null);altered++;
  }
  const c=await api.bodyReviewContext(id),oldC=await previous.bodyReviewContext(id);
  assert.equal(c.sourceHash,oldC.sourceHash);assert.equal(c.revisions.imaging,null);assert.deepEqual(c.blockers,oldC.blockers);
  for(const delta of [{materialHash:oldC.materialHash},{revisionHash:oldC.revisions.teaching},{revisionHash:'0'.repeat(64)}]){
   const response=await api.postBodyDecision(new Request('https://review.test/api/atlas-review/body-review/decisions',{method:'POST',
    headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_PELVIC_REVIEW'},
    body:JSON.stringify({catalogScope:c.catalogScope,structureId:id,track:'teaching',expectedVersion:0,materialHash:c.materialHash,
     revisionHash:c.revisions.teaching,checklistVersion:c.checklistVersion,draft:api.blankBodyReview(c,'teaching'),...delta})}),storage);
   assert.equal(response.status,409);stale++;
  }
 }
 assert.deepEqual({stale,altered},{stale:15,altered:45});
});
function jsonFrom(bytes:Uint8Array){return JSON.parse(Buffer.from(bytes).toString('utf8'));}
