import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {dirname,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {readFileSync} from './atlas-pre-lower-venous-reasoning-history.ts';
import {build} from './atlas-pre-lower-venous-reasoning-history.ts';
import {emittedTeaching} from './atlas-pre-lower-venous-reasoning-history.ts';
const source='182a60bd8942998f808fff87f8a6aa4d8c49f39a',baseline='8157257d82a074694682f7fdf3c68ae5046d1002';
const sha=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
const json=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const old=(p:string)=>execFileSync('git',['show',baseline+':'+p],{maxBuffer:32e6,windowsHide:true});
const oldJson=(p:string)=>JSON.parse(old(p).toString());
const ids=['vm:anatomy:body:leg:right:vessel:right-small-saphenous-vein','vm:anatomy:body:leg:right:vessel:right-popliteal-vein','vm:anatomy:body:thigh:right:vessel:right-femoral-vein','vm:anatomy:body:thigh:right:vessel:right-great-saphenous-vein','vm:anatomy:body:pelvis:right:vessel:right-external-iliac-vein','vm:anatomy:body:pelvis:right:vessel:right-common-iliac-vein'];
async function load(previous=false){
 const frozen=new Set(['atlas-review/lib/regional-tours.ts','atlas-review/content/body-review-display-pins.json','atlas-review/content/body-renderer-revision.json']);
 const result=await build({stdin:{contents:`export * from './atlas-review/lib/regional-tours';export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-context';export * from './atlas-review/lib/body-review-response';export * from './atlas-review/lib/body-review-api';export * from './atlas-review/lib/body-review-decisions';
 import raw from './atlas-review/public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node',plugins:previous?[{name:'pre-lower-venous-tour',setup(b){b.onLoad({filter:/\.(?:ts|json)$/},args=>{
  const path=relative(process.cwd(),args.path).replaceAll('\\','/');if(!frozen.has(path))return;
  return{contents:old(path),loader:path.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)};
 });}}]:[]});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
test('six lower venous stops reach source-bound whole-body learner and Review without changing anatomy or access',async()=>{
 const api=await load(),prior=await load(true),tour=api.lowerVenousTour;
 assert.equal(tour.id,'right-lower-limb-venous-orientation');assert.equal(tour.revision,tour.id+'-v1');assert.equal(tour.status,'draft');
 assert.equal(tour.region,'whole-body');assert.deepEqual(tour.scopeRegions,['pelvis','abdomen','thigh','leg','foot']);assert.deepEqual(tour.contextIds,[]);
 assert.deepEqual(tour.steps.map((s:any)=>s.selectedId),ids);
 assert.equal(api.regionalTours.length,28);assert.equal(api.regionalTours.reduce((n:number,t:any)=>n+t.steps.length,0),163);
 assert.equal(prior.regionalTours.length,27);assert.equal(prior.regionalTours.reduce((n:number,t:any)=>n+t.steps.length,0),157);
 assert.deepEqual(api.regionalTours.filter((t:any)=>t.id!==tour.id),prior.regionalTours);
 assert.deepEqual(api.regionalToursFor('whole-body').map((t:any)=>t.id),[...prior.regionalToursFor('whole-body').map((t:any)=>t.id),tour.id]);
 assert.deepEqual(api.catalog,prior.catalog);assert.equal(api.catalog.structures.length,1104);
 const selected=api.regionalTourStructures(api.catalog,tour);
 assert.deepEqual(selected.map((s:any)=>s.id),ids);
 assert.deepEqual(selected.map((s:any)=>s.fmaId),['FMA44334','FMA44328','FMA21188','FMA21379','FMA18885','FMA21387']);
 assert(selected.every((s:any)=>s.system==='vessels'&&s.laterality==='right'&&!s.validation.anatomicalReview));
 assert.deepEqual(tour.requiredDisplayBundles,Object.fromEntries(selected.map((s:any)=>[s.id,s.bundle])));
 assert.deepEqual([...new Set(selected.flatMap((s:any)=>s.regions))].sort(),[...tour.scopeRegions].sort());
 for(const [i,step]of tour.steps.entries()){
  assert.equal(step.durationMs,14000);assert.equal(step.fadeOthers,true);assert(step.frameIds.includes(step.selectedId));
  assert.equal(new Set(step.frameIds).size,step.frameIds.length);assert(step.references.length&&step.references.every((url:string)=>new URL(url).protocol==='https:'));
  const frame=api.regionalTourFrame(api.catalog,tour,i);assert.deepEqual(frame,api.regionalTourStepFrames(api.catalog,tour)[i]);
  for(const id of step.frameIds){assert(ids.includes(id));const bounds=selected.find((s:any)=>s.id===id).bounds;assert(bounds.min.every((v:number,j:number)=>v>=frame.min[j]&&bounds.max[j]<=frame.max[j]));}
 }
 const review=json('atlas-review/manifest.json'),previous=oldJson('atlas-review/manifest.json');
 assert.equal(review.revision,source);assert.equal(review.files.length,994);assert.deepEqual(review.packages,previous.packages);
 assert.deepEqual(review.files.filter((f:any)=>!previous.files.some((p:any)=>p.path===f.path)).map((f:any)=>f.path),['lib/lower-venous-tour.ts']);
 for(const f of review.files)assert.equal(sha(readFileSync('atlas-review/'+f.path)),f.importedSha256,f.path);
 assert.deepEqual(json('lib/atlas-model-inventory.json').models,oldJson('lib/atlas-model-inventory.json').models);assert.equal(json('lib/atlas-model-inventory.json').models.length,137);
 for(const name of ['head-neck','shoulder','female-pelvis','lower-limb']){
  const base='public/atlas-runtime/'+name+'/',manifest=json(base+'manifest.json'),previous=oldJson(base+'manifest.json');
  assert.equal(manifest.sourceCommit,source);assert.deepEqual(manifest.files.filter((f:any)=>f.path.startsWith('models/')),previous.files.filter((f:any)=>f.path.startsWith('models/')));
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection'])assert.equal(manifest[flag],false);
  assert.equal(manifest.imagingConnection,previous.imagingConnection);
  for(const f of manifest.files)assert.equal(sha(readFileSync(base+f.path)),f.sha256,f.path);
  const inputs=json(base+'source-inputs.json'),previousInputs=oldJson(base+'source-inputs.json');
  assert.equal(inputs.length,({'head-neck':967,shoulder:643,'female-pelvis':111,'lower-limb':100} as Record<string,number>)[name]);
  assert.deepEqual(inputs.filter((f:any)=>!previousInputs.some((p:any)=>p.path===f.path)).map((f:any)=>f.path),name==='head-neck'?['lib/lower-venous-tour.ts']:[]);
  if(name!=='head-neck')continue; // Dedicated lower-limb pilot has no Guided learning.
  const code=emittedTeaching(base,manifest.files,true);
  for(const value of [tour.id,tour.title,tour.limitations,...tour.steps.flatMap((s:any)=>[s.caption,s.selectedId])])assert(code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1)),value);
 }
 const base='public/atlas-review-viewer/',viewer=json(base+'manifest.json');assert.equal(viewer.sourceCommit,source);assert.equal(viewer.mode,'production');assert.equal(viewer.personalRecordsIncluded,false);
 assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 for(const f of viewer.files)assert.equal(sha(readFileSync(base+f.path)),f.sha256,f.path);
 const code=emittedTeaching(base,viewer.files,true);for(const value of [tour.id,tour.title,tour.limitations,...tour.steps.flatMap((s:any)=>[s.caption,s.selectedId])])assert(code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1)),value);
 for(const path of ['package.json','package-lock.json','LICENSES/THIRD_PARTY_NOTICES.md','lib/atlas-delivery-access.ts','lib/lecture-repository.ts','atlas-review/LICENSES/THIRD_PARTY_NOTICES.md','atlas-review/app/body-content.ts','atlas-review/app/whole-body-guided-learning.tsx','atlas-review/app/regional-guided-learning.tsx','atlas-review/app/tour-imaging-notes.tsx','atlas-review/lib/tour-camera.ts','atlas-review/lib/learning-resources.ts'])assert.equal(readFileSync(path,'utf8').replaceAll('\r\n','\n'),old(path).toString().replaceAll('\r\n','\n'),path);
});
test('all 9936 topics stay exact; only six worksheets advance and altered/stale tour evidence is refused before storage',async()=>{
 const api=await load(),before=await load(true);let topics=0,changed=0,preserved=0,stale=0,refused=0;
 const tour=api.lowerVenousTour,selected=api.regionalTourStructures(api.catalog,tour),storage={prepare(){throw Error('Stale synthetic review reached storage');}};
 for(const s of api.catalog.structures){
  const n=await api.bodyReviewMaterial(s.id),p=await before.bodyReviewMaterial(s.id);assert.equal(n.approval,false);
  assert.deepEqual(n.source,p.source);assert.deepEqual(n.topics,p.topics);assert.deepEqual(n.reasoning,p.reasoning);topics+=n.topics.length;
  assert.deepEqual(n.guidedTours.filter((e:any)=>e.tour.id!==tour.id),p.guidedTours);
  const nc=await api.bodyReviewContext(s.id),pc=await before.bodyReviewContext(s.id);assert.equal(nc.sourceHash,pc.sourceHash);assert.equal(nc.revisions.imaging,null);
  if(!ids.includes(s.id)){assert.deepEqual(n,p);assert.equal(nc.teachingHash,pc.teachingHash);assert.equal(nc.revisions.teaching,pc.revisions.teaching);preserved++;continue;}
  changed++;assert.equal(p.guidedTours.length,0);assert.notEqual(nc.revisions.teaching,pc.revisions.teaching);assert(await api.parseBodyReviewResponse(n,s.id));
  const index=n.guidedTours.findIndex((e:any)=>e.tour.id===tour.id),e=n.guidedTours[index];assert.deepEqual(e.structures,selected);assert.deepEqual(e.tour,tour);assert.equal(e.transition,'quintic-orbit');assert.equal(e.transitionMs,1800);assert.equal(e.separation,0);assert.equal(e.stepFrames.length,6);
  for(const mutate of [(q:any)=>q.guidedTours[index].tour.steps[0].caption+=' altered',(q:any)=>q.guidedTours[index].tour.revision+=' stale',(q:any)=>q.guidedTours[index].stepFrames[0].min[0]-=1,(q:any)=>q.guidedTours[index].structures[0].sources[0].sha256='0'.repeat(64),(q:any)=>q.guidedTours[index].transition='linear',(q:any)=>q.guidedTours[index].separation=1]){
   const q=structuredClone(n);mutate(q);assert.equal(await api.parseBodyReviewResponse(q,s.id),null);refused++;
  }
  const body={catalogScope:nc.catalogScope,structureId:s.id,track:'teaching',expectedVersion:0,materialHash:nc.materialHash,revisionHash:pc.revisions.teaching,checklistVersion:nc.checklistVersion,draft:api.blankBodyReview(nc,'teaching')};
  const response=await api.postBodyDecision(new Request('https://review.test/api/review',{method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_LOWER_VENOUS_TOUR_TEST'},body:JSON.stringify(body)}),storage);assert.equal(response.status,409);stale++;
 }
 assert.deepEqual({topics,changed,preserved,stale,refused},{topics:9936,changed:6,preserved:1098,stale:6,refused:36});
});
