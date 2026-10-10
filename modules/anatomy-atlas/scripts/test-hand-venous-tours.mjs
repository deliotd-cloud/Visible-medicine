import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from './pre-genicular-mri-history.mjs';
import {createHash} from 'node:crypto';
import {relative,dirname} from 'node:path';
import {build} from './pre-genicular-mri-history.mjs';
const baseline='1517521a5ee3eed985fff01bcd8608965b693fae',oldCache=new Map();
const old=p=>{if(!oldCache.has(p))oldCache.set(p,execFileSync('git',['show',baseline+':'+p],{maxBuffer:32e6,windowsHide:true}));return oldCache.get(p);};
const sha=b=>createHash('sha256').update(b).digest('hex');
const entry=`export * from './lib/regional-tours';export * from './lib/body-review-material';export * from './lib/body-review-context';export * from './lib/body-review-response';export * from './lib/body-review-decisions';export * from './lib/body-review-api';export {bodyLesson,bodyContent} from './app/body-content';import raw from './public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);`;
async function load(previous=false){
 const paths=new Set(['lib/regional-tours.ts','content/body-renderer-revision.json','content/body-review-display-pins.json']);
 const r=await build({stdin:{contents:entry,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins:previous?[{name:'exact-before-hand-venous-tours',setup(api){api.onLoad({filter:/.*/,namespace:'workspace-test'},args=>{const path=relative(process.cwd(),args.path).replaceAll('\\','/');if(!paths.has(path))return;return{contents:old(path).toString(),loader:path.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)};});}}]:[]});
 return import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'));
}
const now=await load(),before=await load(true),tours=now.handVenousTours,ids=new Set(tours.flatMap(t=>t.steps.map(s=>s.selectedId)));
assert.equal(ids.size,14);assert.equal(tours.length,2);assert.equal(before.regionalTours.length,28);assert.equal(before.regionalTours.reduce((n,t)=>n+t.steps.length,0),163);
assert.equal(now.regionalTours.length,30);assert.equal(now.regionalTours.reduce((n,t)=>n+t.steps.length,0),177);
assert.deepEqual(now.regionalTours.filter(t=>!tours.some(x=>x.id===t.id)),before.regionalTours,'Every earlier definition, caption and frame stays exact');
assert.deepEqual(now.catalog,before.catalog);assert.equal(now.catalog.structures.length,1104);
assert.deepEqual(now.regionalToursFor('hand').map(t=>t.id),[...before.regionalToursFor('hand').map(t=>t.id),...tours.map(t=>t.id)]);
for(const region of now.catalog.regions)assert.equal(now.regionalTourFor(region.id)?.id,before.regionalTourFor(region.id)?.id,'No default tour replaced');
const expectedFmas=[['FMA62506','FMA22915','FMA22912','FMA22920','FMA85096','FMA85098','FMA85100'],['FMA62507','FMA22916','FMA22913','FMA22921','FMA85097','FMA85099','FMA85101']];
let mutations=0,framesRejected=0,packets=0,stale=0,topics=0,changed=0,preserved=0;
function leaves(v,path=[]){return v===null||typeof v!=='object'?[path]:Object.entries(v).flatMap(([k,x])=>leaves(x,[...path,k]));}
function mutate(v,path){const copy=structuredClone(v);let p=copy;for(const k of path.slice(0,-1))p=p[k];const key=path.at(-1),value=p[key];p[key]=typeof value==='string'?value+'-foreign':typeof value==='number'?value+0.01:value===null?'foreign':!value;return copy;}
for(const [index,tour]of tours.entries()){
 const side=index===0?'right':'left',selected=now.regionalTourStructures(now.catalog,tour),targets=selected.map(s=>s.id);
 assert.equal(tour.id,side+'-hand-venous-orientation');assert.equal(tour.revision,tour.id+'-v1');assert.equal(tour.status,'draft');assert.equal(tour.region,'hand');assert.deepEqual(tour.contextIds,[]);
 assert.equal(tour.steps.length,7);assert.deepEqual(selected.map(s=>s.fmaId),expectedFmas[index]);assert.deepEqual(selected.map(s=>s.sources.length),[1,1,1,3,2,2,2]);
 assert(selected.every(s=>s.laterality===side&&s.system==='vessels'&&!s.validation.anatomicalReview));
 assert.deepEqual(tour.requiredDisplayBundles,Object.fromEntries(selected.map(s=>[s.id,s.bundle])));
 for(const s of selected){
  for(const path of leaves(s)){
   const structures=now.catalog.structures.map(x=>x.id===s.id?mutate(s,path):x);assert.throws(()=>now.regionalTourStructures({...now.catalog,structures},tour),path.join('.'));mutations++;
  }
  for(const replacement of [null,{...s,foreign:'unexpected'},{...s,sources:[]},{...s,sources:[...s.sources,...s.sources]},{...s,regions:['foot']}]){
   const structures=now.catalog.structures.flatMap(x=>x.id===s.id?replacement?[replacement]:[]:[x]);assert.throws(()=>now.regionalTourStructures({...now.catalog,structures},tour));mutations++;
  }
  assert.throws(()=>now.regionalTourStructures({...now.catalog,structures:[...now.catalog.structures,s]},tour));mutations++;
 }
 for(const path of leaves(now.catalog.coordinateSystem)){assert.throws(()=>now.regionalTourStructures({...now.catalog,coordinateSystem:mutate(now.catalog.coordinateSystem,path)},tour));mutations++;}
 assert.throws(()=>now.regionalTourStructures({...now.catalog,sourceVersion:'foreign'},tour));mutations++;
 const bundle=now.catalog.bundles.find(b=>b.id===selected[0].bundle),bytes=readFileSync('public'+bundle.url.split('?')[0]);assert.equal(sha(bytes),bundle.sha256);assert.deepEqual(bytes,old('public'+bundle.url.split('?')[0]));
 for(const path of leaves(bundle)){assert.throws(()=>now.regionalTourStructures({...now.catalog,bundles:now.catalog.bundles.map(b=>b.id===bundle.id?mutate(bundle,path):b)},tour));mutations++;}
 for(const bundles of [now.catalog.bundles.filter(b=>b.id!==bundle.id),[...now.catalog.bundles,bundle]]){assert.throws(()=>now.regionalTourStructures({...now.catalog,bundles},tour));mutations++;}
 for(const [i,step]of tour.steps.entries()){
  assert.equal(step.durationMs,14000);assert.equal(step.fadeOthers,true);assert(step.references.length&&step.references.every(url=>new URL(url).protocol==='https:'));
  assert.equal(step.view,i===0?'posterior':'anterior');assert(step.frameIds.includes(step.selectedId));assert.equal(new Set(step.frameIds).size,step.frameIds.length);
  const frame=now.regionalTourFrame(now.catalog,tour,i);assert.deepEqual(frame,now.regionalTourStepFrames(now.catalog,tour)[i]);
  for(const id of step.frameIds){assert(targets.includes(id));const bounds=selected.find(s=>s.id===id).bounds;assert(bounds.min.every((v,j)=>v>=frame.min[j]&&bounds.max[j]<=frame.max[j]));}
  for(const frameIds of [[],['missing'],[step.selectedId,step.selectedId],[targets.find(id=>id!==step.selectedId)]]){const bad=structuredClone(tour);bad.steps[i].frameIds=frameIds;assert.throws(()=>now.regionalTourFrame(now.catalog,bad,i));framesRejected++;}
 }
 for(const term of ['three components','two unnamed','little-finger','never mirrored','independent access','radiologist sign-off','no clinical approval'])assert(tour.limitations.includes(term));
}
let storageCalls=0;const storage={prepare(){storageCalls++;throw Error('Stale decision reached storage');}};
for(const s of now.catalog.structures){
 const current=await now.bodyReviewMaterial(s.id),prior=await before.bodyReviewMaterial(s.id),target=ids.has(s.id);
 assert.deepEqual(current.source,prior.source);assert.deepEqual(current.topics,prior.topics);assert.deepEqual(current.reasoning,prior.reasoning);topics+=current.topics.length;assert.equal(current.approval,false);
 assert.deepEqual(current.guidedTours.filter(e=>!tours.some(t=>t.id===e.tour.id)),prior.guidedTours);
 assert.equal(current.guidedTours.length,prior.guidedTours.length+Number(target));
 for(const topic of current.topics){const{tab,...lesson}=topic;assert.deepEqual(now.bodyLesson(s,tab),lesson,'Actual learner and Review notes match');assert.deepEqual(now.bodyLesson(s,tab),before.bodyLesson(s,tab),'All 9,936 topic placements preserved');}
 const currentContext=await now.bodyReviewContext(s.id),previousContext=await before.bodyReviewContext(s.id);
 assert.equal(currentContext.sourceHash,previousContext.sourceHash);assert.equal(currentContext.revisions.imaging,null);
 if(!target){assert.equal(currentContext.teachingHash,previousContext.teachingHash);assert.equal(currentContext.revisions.teaching,previousContext.revisions.teaching);preserved++;continue;}
 changed++;assert.notEqual(currentContext.teachingHash,previousContext.teachingHash);assert.notEqual(currentContext.revisions.teaching,previousContext.revisions.teaching);assert(await now.parseBodyReviewResponse(current,s.id));
 const tour=tours.find(t=>t.steps.some(x=>x.selectedId===s.id)),index=current.guidedTours.findIndex(e=>e.tour.id===tour.id),evidence=current.guidedTours[index];
 assert.deepEqual(evidence.structures,now.regionalTourStructures(now.catalog,tour));assert.equal(evidence.stepFrames.length,7);assert.equal(evidence.transitionMs,1800);assert.equal(evidence.transition,'quintic-orbit');assert.equal(evidence.separation,0);
 for(const edit of [p=>p.guidedTours.splice(index,1),p=>p.guidedTours.push(structuredClone(evidence)),p=>p.guidedTours[index].tour.steps.reverse(),p=>p.guidedTours[index].tour.steps[0].caption+=' foreign',p=>p.guidedTours[index].tour.revision+=' foreign',p=>p.guidedTours[index].tour.requiredDisplayBundles={},p=>p.guidedTours[index].structures[0].sources[0].sha256='0'.repeat(64),p=>p.guidedTours[index].stepFrames[0].min[0]-=1,p=>p.guidedTours[index].transition='linear',p=>p.guidedTours[index].transitionMs=0,p=>p.guidedTours[index].separation=1]){const packet=structuredClone(current);edit(packet);assert.equal(await now.parseBodyReviewResponse(packet,s.id),null);packets++;}
 const body={catalogScope:previousContext.catalogScope,structureId:s.id,track:'teaching',expectedVersion:0,materialHash:previousContext.materialHash,revisionHash:previousContext.revisions.teaching,checklistVersion:previousContext.checklistVersion,draft:now.blankBodyReview(previousContext,'teaching')};
 const response=await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions',{method:'POST',headers:{origin:'https://atlas.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_HAND_VENOUS_TOUR'},body:JSON.stringify(body)}),storage);assert.equal(response.status,409);stale++;
}
assert.deepEqual({topics,changed,preserved,packets,stale,storageCalls},{topics:9936,changed:14,preserved:1090,packets:154,stale:14,storageCalls:0});assert.equal(framesRejected,56);
for(const path of ['app/regional-guided-learning.tsx','app/whole-body-guided-learning.tsx','lib/tour-camera.ts','app/fitted-camera.tsx','app/body-content.ts','app/anatomy-data.ts','app/dissection-data.ts','lib/body-display-catalog.ts','lib/reasoning-questions.ts','content/learning-resources.v1.json','package.json','package-lock.json','LICENSES/THIRD_PARTY_NOTICES.md','lib/hand-venous-imaging.ts','content/hand-venous-imaging.ts','content/hand-venous-imaging-pins.json'])assert.deepEqual(readFileSync(path),old(path),path);
assert.equal(execFileSync('git',['diff','--name-only',baseline,'--','public/models'],{encoding:'utf8'}).trim(),'');
const report={baseline,teachingEpoch:'2c6d1f3eedc067c48203bed0639f67a9fc7fd3c5',currentTeachingCheckedBy:'scripts/test-genicular-mri.mjs',tours:30,stops:177,newTours:tours.map(t=>t.id),newStops:14,sourceTargets:14,topicsPreserved:topics,changedTeachingWorksheets:changed,preservedTeachingWorksheets:preserved,mutatedSourceRefusals:mutations,malformedTourPackets:packets,staleTeachingRefusedBeforeStorage:stale,invalidFramesRejected:framesRejected,sourceModelsAndFramesUnchanged:true,cameraEngineUnchanged:true,clinicalApproval:false,browserAcceptance:false};
writeFileSync('docs/hand-venous-tours-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
