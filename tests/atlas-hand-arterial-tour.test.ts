import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {dirname,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
const source='6e134825dd189873d60846cacdc98a11983d6d16',baseline='3887690204d123396bfa167188c173545ac3f6b9';
const sha=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
const json=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const old=(p:string)=>execFileSync('git',['show',baseline+':'+p],{maxBuffer:32e6,windowsHide:true});
const ids=['right-superficial-palmar-arterial-arch','right-deep-palmar-arch','right-palmar-metacarpal-artery','right-arteria-princeps-pollicis','right-arteria-radialis-indicis','right-first-common-palmar-digital-artery','medial-proper-palmar-digital-artery-of-right-index-finger'].map(n=>'vm:anatomy:body:hand:right:vessel:'+n);
async function load(previous=false){
 const frozen=new Set(['atlas-review/lib/regional-tours.ts','atlas-review/content/body-review-display-pins.json','atlas-review/content/body-renderer-revision.json']);
 const result=await build({stdin:{contents:`export * from './atlas-review/lib/regional-tours';export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-context';export * from './atlas-review/lib/body-review-response';export * from './atlas-review/lib/body-review-api';export * from './atlas-review/lib/body-review-decisions';
 import raw from './atlas-review/public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node',plugins:previous?[{name:'pre-hand-arterial-tour',setup(b){b.onLoad({filter:/\.(?:ts|json)$/},args=>{
  const path=relative(process.cwd(),args.path).replaceAll('\\','/');if(!frozen.has(path))return;
  return{contents:old(path),loader:path.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)};
 });}}]:[]});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
test('seven hand arterial stops reach source-bound learner/Review without new models, access or licences',async()=>{
 const api=await load(),prior=await load(true),tour=api.handArterialTour;
 assert.deepEqual(tour.steps.map((s:any)=>s.selectedId),ids);assert.equal(tour.status,'draft');
 assert.equal(api.regionalTours.length,27);assert.equal(api.regionalTours.reduce((n:number,t:any)=>n+t.steps.length,0),157);
 assert.equal(prior.regionalTours.length,26);assert.equal(prior.regionalTours.reduce((n:number,t:any)=>n+t.steps.length,0),150);
 assert.deepEqual(api.regionalTours.filter((t:any)=>t.id!==tour.id),prior.regionalTours);
 assert.deepEqual(api.regionalToursFor('hand').map((t:any)=>t.id),['right-hand-muscle-orientation','right-carpal-row-orientation',tour.id]);
 assert.deepEqual(api.catalog,prior.catalog);assert.equal(api.catalog.structures.length,1104);
 const review=json('atlas-review/manifest.json'),oldReview=JSON.parse(old('atlas-review/manifest.json').toString());
 assert.equal(review.revision,source);assert.equal(review.files.length,990);assert.deepEqual(review.packages,oldReview.packages);
 assert.deepEqual(review.files.filter((f:any)=>!oldReview.files.some((p:any)=>p.path===f.path)).map((f:any)=>f.path),['lib/hand-arterial-tour.ts']);
 for(const f of review.files)assert.equal(sha(readFileSync('atlas-review/'+f.path)),f.importedSha256,f.path);
 assert.deepEqual(json('lib/atlas-model-inventory.json').models,JSON.parse(old('lib/atlas-model-inventory.json').toString()).models);
 assert.equal(json('lib/atlas-model-inventory.json').models.length,137);
 for(const name of ['head-neck','shoulder','female-pelvis','lower-limb']){
  const base='public/atlas-runtime/'+name+'/',manifest=json(base+'manifest.json'),previous=JSON.parse(old(base+'manifest.json').toString());
  assert.equal(manifest.sourceCommit,source);
  assert.deepEqual(manifest.files.filter((f:any)=>f.path.startsWith('models/')),previous.files.filter((f:any)=>f.path.startsWith('models/')));
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection'])assert.equal(manifest[flag],false);
  // The dedicated shoulder manifest has never exposed an imaging connection field.
  assert.equal(manifest.imagingConnection,previous.imagingConnection);
  assert.equal(manifest.imagingConnection,name==='shoulder'?undefined:false);
  for(const f of manifest.files)assert.equal(sha(readFileSync(base+f.path)),f.sha256,f.path);
  const inputs=json(base+'source-inputs.json');assert.equal(inputs.length,({'head-neck':963,shoulder:640,'female-pelvis':111,'lower-limb':100} as Record<string,number>)[name]);
  assert.equal(inputs.some((f:any)=>f.path==='lib/hand-arterial-tour.ts'),name==='head-neck');
  // The dedicated nine-structure shoulder pilot has its own shoulder player.
  if(name!=='head-neck')continue;
  const code=emittedTeaching(base,manifest.files,true);
  for(const value of [tour.id,tour.title,tour.limitations,...tour.steps.flatMap((s:any)=>[s.caption,s.selectedId])])assert(code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1)),value);
 }
 const base='public/atlas-review-viewer/',viewer=json(base+'manifest.json');assert.equal(viewer.sourceCommit,source);assert.equal(viewer.mode,'production');assert.equal(viewer.personalRecordsIncluded,false);
 const code=emittedTeaching(base,viewer.files,true);for(const value of [tour.id,tour.title,...tour.steps.map((s:any)=>s.caption)])assert(code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1)),value);
 for(const path of ['package.json','package-lock.json','LICENSES/THIRD_PARTY_NOTICES.md','lib/atlas-delivery-access.ts','lib/lecture-repository.ts','atlas-review/LICENSES/THIRD_PARTY_NOTICES.md','atlas-review/app/body-content.ts','atlas-review/app/whole-body-guided-learning.tsx','atlas-review/app/regional-guided-learning.tsx','atlas-review/app/tour-imaging-notes.tsx','atlas-review/lib/tour-camera.ts','atlas-review/lib/learning-resources.ts'])assert.equal(readFileSync(path,'utf8').replaceAll('\r\n','\n'),old(path).toString().replaceAll('\r\n','\n'),path);
});
test('all topics stay exact; only seven tour worksheets advance and stale/altered evidence is rejected',async()=>{
 const api=await load(),before=await load(true);let topics=0,changed=0,preserved=0,stale=0,refused=0;
 const tour=api.handArterialTour,selected=api.regionalTourStructures(api.catalog,tour);
 const storage={prepare(){throw Error('Stale synthetic review reached storage');}};
 for(const s of api.catalog.structures){
  const n=await api.bodyReviewMaterial(s.id),p=await before.bodyReviewMaterial(s.id);assert.equal(n.approval,false);
  assert.deepEqual(n.source,p.source);assert.deepEqual(n.topics,p.topics);assert.deepEqual(n.reasoning,p.reasoning);topics+=n.topics.length;
  assert.deepEqual(n.guidedTours.filter((e:any)=>e.tour.id!==tour.id),p.guidedTours);
  const nc=await api.bodyReviewContext(s.id),pc=await before.bodyReviewContext(s.id);assert.equal(nc.sourceHash,pc.sourceHash);assert.equal(nc.revisions.imaging,null);
  if(!ids.includes(s.id)){assert.equal(nc.teachingHash,pc.teachingHash);assert.equal(nc.revisions.teaching,pc.revisions.teaching);preserved++;continue;}
  changed++;assert.equal(p.guidedTours.length,0);assert.notEqual(nc.revisions.teaching,pc.revisions.teaching);assert(await api.parseBodyReviewResponse(n,s.id));
  const index=n.guidedTours.findIndex((e:any)=>e.tour.id===tour.id),e=n.guidedTours[index];assert.deepEqual(e.structures,selected);assert.equal(e.transition,'quintic-orbit');assert.equal(e.transitionMs,1800);assert.equal(e.separation,0);assert.equal(e.stepFrames.length,7);
  for(const mutate of [(q:any)=>q.guidedTours[index].tour.steps[0].caption+=' altered',(q:any)=>q.guidedTours[index].tour.revision+=' stale',(q:any)=>q.guidedTours[index].stepFrames[0].min[0]-=1,(q:any)=>q.guidedTours[index].structures[0].sources[0].sha256='0'.repeat(64),(q:any)=>q.guidedTours[index].transition='linear']){
   const q=structuredClone(n);mutate(q);assert.equal(await api.parseBodyReviewResponse(q,s.id),null);refused++;
  }
  const body={catalogScope:nc.catalogScope,structureId:s.id,track:'teaching',expectedVersion:0,materialHash:nc.materialHash,revisionHash:pc.revisions.teaching,checklistVersion:nc.checklistVersion,draft:api.blankBodyReview(nc,'teaching')};
  const response=await api.postBodyDecision(new Request('https://review.test/api/review',{method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_HAND_TOUR_TEST'},body:JSON.stringify(body)}),storage);assert.equal(response.status,409);stale++;
 }
 assert.deepEqual({topics,changed,preserved,stale,refused},{topics:9936,changed:7,preserved:1097,stale:7,refused:35});
});
