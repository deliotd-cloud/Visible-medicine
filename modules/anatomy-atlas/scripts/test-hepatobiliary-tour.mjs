import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dirname,relative} from 'node:path';
import {build} from './workspace-test-build.mjs';

const baseline='aa290176f8bfdb02157f7197e4647508c9c41d87';
const old=path=>execFileSync('git',['show',`${baseline}:${path}`],{maxBuffer:32e6});
const entry=`export * from './lib/regional-tours';export * from './lib/body-review-material';
export * from './lib/body-review-response';export * from './lib/body-review-context';
export * from './lib/body-review-decisions';export * from './lib/body-review-api';
import raw from './public/models/bodyparts3d/full-body/catalog.json';
import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);`;
async function load(previous=false){
  const frozen=new Set(['lib/regional-tours.ts','content/body-review-display-pins.json','content/body-renderer-revision.json']);
  const result=await build({stdin:{contents:entry,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',
    plugins:previous?[{name:'exact-pre-hepatobiliary-epoch',setup(builder){builder.onLoad({filter:/.*/,namespace:'workspace-test'},args=>{
      const path=relative(process.cwd(),args.path).replaceAll('\\','/');
      if(!frozen.has(path))return;
      return {contents:old(path).toString('utf8'),loader:path.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)};
    });}}]:[]});
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const api=await load(),before=await load(true),tour=api.hepatobiliaryTour;
assert(tour,'Register and export hepatobiliaryTour before running this test');
const ids=[
  'vm:anatomy:body:abdomen:unpaired:organ:liver',
  'vm:anatomy:body:pelvis:unpaired:organ:gallbladder',
  'vm:anatomy:body:abdomen:unpaired:organ:cystic-duct',
  'vm:anatomy:body:abdomen:unpaired:organ:common-hepatic-duct',
];
const fmas=['FMA7197','FMA7202','FMA14539','FMA14668'];
const bundles=['abdomen-organs','pelvis-organs','abdomen-organs-inventory','abdomen-organs-inventory'];
assert.equal(tour.id,'hepatobiliary-surface-orientation');
assert.equal(tour.revision,`${tour.id}-v1`);
assert.equal(tour.region,'abdomen');assert.equal(tour.status,'draft');
assert.deepEqual(tour.contextIds,[]);
assert.deepEqual(tour.steps.map(step=>step.selectedId),ids);
assert.deepEqual(tour.steps.map(step=>step.view),['anterior','inferior','anterior','anterior']);
assert.deepEqual(tour.requiredDisplayBundles,Object.fromEntries(ids.map((id,i)=>[id,bundles[i]])));
assert.equal(api.regionalTours.length,26);assert.equal(api.regionalTours.reduce((n,t)=>n+t.steps.length,0),150);
assert.equal(before.regionalTours.length,25);assert.equal(before.regionalTours.reduce((n,t)=>n+t.steps.length,0),146);
assert.deepEqual(api.regionalTours.filter(t=>t.id!==tour.id),before.regionalTours,'All 25 prior tour definitions preserved');
for(const region of api.catalog.regions)assert.equal(api.regionalTourFor(region.id)?.id,before.regionalTourFor(region.id)?.id);
assert(api.regionalToursFor('abdomen').includes(tour));

const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
assert.deepEqual(readFileSync(catalogPath),old(catalogPath));
assert.deepEqual(readFileSync('lib/body-display-catalog.ts'),old('lib/body-display-catalog.ts'));
assert.equal(api.catalog.structures.length,1104);
assert.deepEqual(api.catalog.structures,before.catalog.structures,'All displayed identities and source records preserved');
assert.deepEqual(api.catalog.bundles,before.catalog.bundles,'All bundle records preserved');
assert.deepEqual(api.catalog.coordinateSystem,before.catalog.coordinateSystem);
assert.equal(api.catalog.sourceVersion,before.catalog.sourceVersion);
assert.equal(execFileSync('git',['diff','--name-only',baseline,'--','public/models'],{encoding:'utf8'}).trim(),'','No model file changed');
const selected=api.regionalTourStructures(api.catalog,tour);
assert.deepEqual(selected.map(s=>s.id),ids);
assert.deepEqual(selected.map(s=>s.fmaId),fmas);
assert.deepEqual(selected.map(s=>s.bundle),bundles);
assert(selected.every(s=>s.region==='abdomen'&&s.regions.length===1&&s.regions[0]==='abdomen'&&s.laterality==='unpaired'&&s.validation.anatomicalReview===false));
const ownership=new Map();
for(const s of selected)for(const source of s.sources){
  assert(!ownership.has(source.file),`${source.file} is shared by ${ownership.get(source.file)} and ${s.id}`);
  ownership.set(source.file,s.id);
  assert.match(source.sha256,/^[a-f0-9]{64}$/);
}
assert.deepEqual(selected.map(s=>s.sources),ids.map(id=>before.catalog.structures.find(s=>s.id===id).sources),'Full source membership and hashes preserved');
const bundleIds=[...new Set(bundles)];
for(const name of bundleIds){
  const bundle=api.catalog.bundles.find(b=>b.id===name),path='public'+bundle.url.split('?')[0],bytes=readFileSync(path);
  assert.equal(bytes.length,bundle.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);
  assert.deepEqual(bytes,old(path));
  for(const changed of [api.catalog.bundles.filter(b=>b.id!==name),[...api.catalog.bundles,bundle]])
    assert.throws(()=>api.regionalTourStructures({...api.catalog,bundles:changed},tour));
}
let refusedSources=0,refusedPackets=0,stale=0,topics=0,retained=0;
const storage={prepare(){throw Error('Stale synthetic teaching decision reached storage');}};
for(const s of api.catalog.structures){
  const now=await api.bodyReviewMaterial(s.id),prior=await before.bodyReviewMaterial(s.id);
  assert.deepEqual(now.source,prior.source);assert.deepEqual(now.topics,prior.topics);assert.deepEqual(now.reasoning,prior.reasoning);
  topics+=now.topics.length;
  assert.equal(now.approval,false);
  assert.deepEqual(now.guidedTours.filter(e=>e.tour.id!==tour.id),prior.guidedTours,`Previous tour evidence changed for ${s.id}`);
  retained++;
  const target=ids.includes(s.id);
  assert.equal(now.guidedTours.length,prior.guidedTours.length+(target?1:0));
  const current=await api.bodyReviewContext(s.id),previous=await before.bodyReviewContext(s.id);
  assert.equal(current.sourceHash,previous.sourceHash);
  assert.deepEqual(current.blockers,previous.blockers);
  if(target)assert.notEqual(current.revisions.teaching,previous.revisions.teaching);
  else assert.equal(current.revisions.teaching,previous.revisions.teaching);
  if(!target)continue;
  for(const structures of [api.catalog.structures.filter(x=>x.id!==s.id),[...api.catalog.structures,s],
    api.catalog.structures.map(x=>x.id===s.id?{...x,regions:['pelvis']}:x),
    api.catalog.structures.map(x=>x.id===s.id?{...x,bundle:'wrong-bundle'}:x)]){
    assert.throws(()=>api.regionalTourStructures({...api.catalog,structures},tour));refusedSources++;
  }
  assert(await api.parseBodyReviewResponse(now,s.id));
  const index=now.guidedTours.findIndex(e=>e.tour.id===tour.id),evidence=now.guidedTours[index];
  assert(index>=0);assert.deepEqual(evidence.tour,tour);assert.deepEqual(evidence.structures,selected);
  assert.equal(evidence.stepFrames.length,4);assert.equal(evidence.transitionMs,1800);
  assert.equal(evidence.transition,'quintic-orbit');assert.equal(evidence.separation,0);
  for(const mutate of [p=>p.guidedTours.splice(index,1),p=>p.guidedTours.push(structuredClone(p.guidedTours[index])),
    p=>p.guidedTours[index].tour.steps.reverse(),p=>p.guidedTours[index].tour.steps[0].caption+=' altered',
    p=>p.guidedTours[index].tour.revision+='-stale',p=>p.guidedTours[index].tour.steps[2].frameIds=[ids[0]],
    p=>p.guidedTours[index].tour.requiredDisplayBundles={},p=>p.guidedTours[index].structures[0].sources[0].sha256='0'.repeat(64),
    p=>p.guidedTours[index].stepFrames[0].min[0]-=1,p=>p.guidedTours[index].transition='linear',
    p=>p.guidedTours[index].transitionMs=0,p=>p.guidedTours[index].separation=1]){
    const changed=structuredClone(now);mutate(changed);
    assert.equal(await api.parseBodyReviewResponse(changed,s.id),null);refusedPackets++;
  }
  const payload={catalogScope:current.catalogScope,structureId:s.id,track:'teaching',expectedVersion:0,
    materialHash:current.materialHash,revisionHash:previous.revisions.teaching,checklistVersion:current.checklistVersion,
    draft:api.blankBodyReview(current,'teaching')};
  const response=await api.postBodyDecision(new Request('https://atlas.test/api/body-decisions',{method:'POST',
    headers:{origin:'https://atlas.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_HEPATOBILIARY_TEST'},
    body:JSON.stringify(payload)}),storage);
  assert.equal(response.status,409);stale++;
}
assert.equal(retained,1104);assert.equal(topics,9936);assert.equal(stale,4);
for(const path of ['app/regional-guided-learning.tsx','lib/tour-camera.ts','app/fitted-camera.tsx','lib/body-review-api.ts',
  'lib/body-review-response.ts','lib/body-review-material.ts','lib/body-review-context.ts','content/learning-resources.v1.json',
  'app/anatomy-data.ts','app/dissection-data.ts','package.json','package-lock.json'])
  assert.deepEqual(readFileSync(path),old(path),`${path} changed`);
for(const [i,step] of tour.steps.entries()){
  assert.equal(step.durationMs,14000);assert.equal(step.fadeOthers,true);
  assert(step.frameIds.length>0&&step.frameIds.includes(step.selectedId));
  assert.equal(new Set(step.frameIds).size,step.frameIds.length);
  assert(step.frameIds.every(id=>ids.includes(id)));
  assert.deepEqual(step.references,['https://anatomy.ttuhscep.edu/schemes/liver_tables.html']);
  const frame=api.regionalTourFrame(api.catalog,tour,i);
  assert.deepEqual(frame,api.regionalTourStepFrames(api.catalog,tour)[i]);
  for(const id of step.frameIds){const b=selected.find(s=>s.id===id).bounds;
    assert(b.min.every((v,j)=>v>=frame.min[j]&&b.max[j]<=frame.max[j]));}
  for(const bad of [[],['missing'],[step.selectedId,step.selectedId],[ids.find(id=>id!==step.selectedId)]]){
    const changed=structuredClone(tour);changed.steps[i].frameIds=bad;
    assert.throws(()=>api.regionalTourFrame(api.catalog,changed,i));
  }
}
assert(!tour.steps[2].frameIds.includes(ids[0])&&!tour.steps[3].frameIds.includes(ids[0]),'Small ducts must exclude the liver overview from their frames');
const words=tour.steps.map(s=>s.title+' '+s.caption).join(' ').trim().split(/\s+/).length;
assert(words<=200);assert.match(tour.limitations,/revision-bound radiologist sign-off/);
console.log(JSON.stringify({tour:tour.id,priorTours:25,priorStops:146,currentTours:26,currentStops:150,
  sourceSelections:retained,unchangedTopics:topics,sourceBundles:bundleIds.length,refusedSources,refusedPackets,
  staleTeachingRefusedBeforeStorage:stale,referenceWords:words,clinicalApproval:false}));
