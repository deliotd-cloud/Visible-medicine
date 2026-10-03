import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dirname,relative} from 'node:path';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';

const baseline='bee7d759305803ade07ecd26fc877099b7008ff1';
const source='946700cc8c5162076cd5e5d9f79a00ba72c6fda1';
const sourceHashes:Record<string,string>={
 'lib/hepatobiliary-tour.ts':'0c405e8b10f99886262c68ed5957ceffec908206b312a81016f92f59ab897831',
 'lib/regional-tours.ts':'391d4118979b1bcdb5c8a3a4552d4caead84d812fd3b30a514601c28c63a5e85',
 'content/body-review-display-pins.json':'29cfef117576b5257914f0b90f13d8b0280be23d2332f9c124c452d35d12280e',
 'content/body-renderer-revision.json':'747d8211197fe5c034b8d6be851609fd38d446f59b6d007f225ff8bde0e38eb3',
};
const ids=[
 'vm:anatomy:body:abdomen:unpaired:organ:liver',
 'vm:anatomy:body:pelvis:unpaired:organ:gallbladder',
 'vm:anatomy:body:abdomen:unpaired:organ:cystic-duct',
 'vm:anatomy:body:abdomen:unpaired:organ:common-hepatic-duct',
];
const bundles=['abdomen-organs','pelvis-organs','abdomen-organs-inventory','abdomen-organs-inventory'];
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const sha=(bytes:Buffer|string)=>createHash('sha256').update(bytes).digest('hex');
const old=(path:string)=>execFileSync('git',['show',`${baseline}:${path}`],{maxBuffer:32e6});
const unchanged=(path:string)=>assert.equal(readFileSync(path,'utf8').replaceAll('\r\n','\n'),
 old(path).toString().replaceAll('\r\n','\n'),path);
async function load(previous=false){
 const frozen=new Set(['atlas-review/lib/regional-tours.ts','atlas-review/content/body-review-display-pins.json',
  'atlas-review/content/body-renderer-revision.json']);
 const result=await build({stdin:{contents:`export * from './atlas-review/lib/regional-tours';
 export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-context';
 export * from './atlas-review/lib/body-review-response';export * from './atlas-review/lib/body-review-api';
 export * from './atlas-review/lib/body-review-decisions';
 import raw from './atlas-review/public/models/bodyparts3d/full-body/catalog.json';
 import {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';
 export const catalog=bodyDisplayCatalog(raw as any);`,resolveDir:process.cwd(),loader:'ts'},
  bundle:true,write:false,platform:'node',format:'esm',plugins:previous?[{name:'exact-pre-hepatobiliary-import',
   setup(plugin:import('esbuild').PluginBuild){plugin.onLoad({filter:/\.(?:ts|json)$/},args=>{
    const path=relative(process.cwd(),args.path).replaceAll('\\','/');
    if(!frozen.has(path))return;
    return {contents:old(path),loader:path.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)};
   });}}]:[]});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}

test('the source-bound four-stop tour reaches the regional learner and protected Review',async()=>{
 const api=await load(),before=await load(true),tour=api.hepatobiliaryTour;
 assert(tour);assert.equal(tour.id,'hepatobiliary-surface-orientation');
 assert.equal(tour.revision,'hepatobiliary-surface-orientation-v1');
 assert.equal(tour.region,'abdomen');assert.equal(tour.status,'draft');
 assert.deepEqual(tour.contextIds,[]);
 assert.deepEqual(tour.steps.map((step:any)=>step.selectedId),ids);
 assert.deepEqual(tour.steps.map((step:any)=>step.view),['anterior','inferior','anterior','anterior']);
 assert.deepEqual(tour.requiredDisplayBundles,Object.fromEntries(ids.map((id,i)=>[id,bundles[i]])));
 assert.equal(api.regionalTours.length,26);assert.equal(api.regionalTours.reduce((n:number,t:any)=>n+t.steps.length,0),150);
 assert.equal(before.regionalTours.length,25);assert.equal(before.regionalTours.reduce((n:number,t:any)=>n+t.steps.length,0),146);
 assert.deepEqual(api.regionalTours.filter((t:any)=>t.id!==tour.id),before.regionalTours,'25 prior definitions remain exact');
 assert(api.regionalToursFor('abdomen').some((t:any)=>t.id===tour.id));
 assert.equal(api.regionalTourFor('abdomen')?.id,before.regionalTourFor('abdomen')?.id);

 const review=json('atlas-review/manifest.json'),priorReview=JSON.parse(old('atlas-review/manifest.json').toString());
 assert.equal(review.revision,source);assert.deepEqual(review.packages,priorReview.packages);
 for(const [path,hash] of Object.entries(sourceHashes)){
  const record=review.files.find((f:any)=>f.path===path);assert(record,path+' in imported Review');
  assert.equal(record.sourceSha256,hash,path+' source hash');
  assert.equal(sha(readFileSync('atlas-review/'+path)),record.importedSha256,path+' imported hash');
 }
 for(const path of ['LICENSES/THIRD_PARTY_NOTICES.md','package.json','package-lock.json',
  'atlas-review/LICENSES/THIRD_PARTY_NOTICES.md','atlas-review/lib/body-display-catalog.ts'])unchanged(path);
 assert.deepEqual(json('lib/atlas-model-inventory.json').models,JSON.parse(old('lib/atlas-model-inventory.json').toString()).models);
 assert.equal(json('lib/atlas-model-inventory.json').models.length,137);
 assert.deepEqual(api.catalog.structures,before.catalog.structures);
 assert.deepEqual(api.catalog.bundles,before.catalog.bundles);
 assert.deepEqual(api.catalog.coordinateSystem,before.catalog.coordinateSystem);

 let learnerCode='';
 for(const name of ['head-neck','shoulder','female-pelvis','lower-limb']){
  const base=`public/atlas-runtime/${name}/`,manifest=json(base+'manifest.json');
  const prior=JSON.parse(old(base+'manifest.json').toString());
  assert.equal(manifest.sourceCommit,source,`${name} source binding`);
  assert.equal(manifest.patientDataIncluded,false);
  assert.deepEqual(manifest.files.filter((f:any)=>f.path.startsWith('models/')),
   prior.files.filter((f:any)=>f.path.startsWith('models/')),`${name} model bytes`);
  for(const file of manifest.files)assert.equal(sha(readFileSync(base+file.path)),file.sha256,base+file.path);
  const inputs=json(base+'source-inputs.json');
  for(const [path,hash] of Object.entries(sourceHashes)){
   const entry=inputs.find((f:any)=>f.path===path);
   if(entry)assert.equal(entry.sha256,hash,`${name}: ${path}`);
  }
  if(name==='head-neck'){
   for(const path of ['lib/hepatobiliary-tour.ts','lib/regional-tours.ts'])
    assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,sourceHashes[path]);
   learnerCode=emittedTeaching(base,manifest.files,true);
  }
 }
 const viewerBase='public/atlas-review-viewer/',viewer=json(viewerBase+'manifest.json');
 assert.equal(viewer.sourceCommit,source);assert.equal(viewer.personalRecordsIncluded,false);
 for(const file of viewer.files)assert.equal(sha(readFileSync(viewerBase+file.path)),file.sha256,viewerBase+file.path);
 const reviewCode=emittedTeaching(viewerBase,viewer.files,true);
 const disconnected=Buffer.from('<!doctype html><title>Disconnected Review entry</title>');
 const disconnectedFiles=viewer.files.map((f:any)=>f.path==='index.html'?{...f,sha256:sha(disconnected)}:f);
 assert.throws(()=>emittedTeaching(viewerBase,disconnectedFiles,true,
  path=>path===viewerBase+'index.html'?disconnected:readFileSync(path)),/Teaching is reachable through emitted entry imports/);
 for(const step of tour.steps){
  assert.equal(step.durationMs,14000);assert.equal(step.fadeOthers,true);
  assert(step.frameIds.includes(step.selectedId));
  assert.equal(new Set(step.frameIds).size,step.frameIds.length);
  assert.deepEqual(step.references,['https://anatomy.ttuhscep.edu/schemes/liver_tables.html']);
  for(const code of [learnerCode,reviewCode])
   assert(code.includes(step.caption)||code.includes(JSON.stringify(step.caption).slice(1,-1)),step.id+' reachable caption');
 }
 const selected=api.regionalTourStructures(api.catalog,tour);
 assert.deepEqual(selected.map((s:any)=>s.id),ids);
 assert.deepEqual(selected.map((s:any)=>s.bundle),bundles);
 assert(selected.every((s:any)=>s.region==='abdomen'&&s.regions.length===1&&s.regions[0]==='abdomen'));
 for(let i=0;i<tour.steps.length;i++){
  const frame=api.regionalTourFrame(api.catalog,tour,i);
  assert.deepEqual(frame,api.regionalTourStepFrames(api.catalog,tour)[i]);
  for(const id of tour.steps[i].frameIds){const bounds=selected.find((s:any)=>s.id===id).bounds;
   assert(bounds.min.every((v:number,j:number)=>v>=frame.min[j]&&bounds.max[j]<=frame.max[j]));}
 }
 assert(!tour.steps[2].frameIds.includes(ids[0])&&!tour.steps[3].frameIds.includes(ids[0]));
});

test('four Review packets advance teaching only; stale synthetic decisions stop before storage',async()=>{
 const api=await load(),before=await load(true),tour=api.hepatobiliaryTour;
 const storage=new Proxy({},{get(){throw Error('Stale decision reached storage');}});
 let refused=0;
 for(const id of ids){
  const after=await api.bodyReviewMaterial(id),prior=await before.bodyReviewMaterial(id);
  assert.deepEqual(after.source,prior.source);assert.deepEqual(after.topics,prior.topics);
  assert.deepEqual(after.reasoning,prior.reasoning);assert.equal(after.approval,false);
  assert.deepEqual(after.guidedTours.filter((e:any)=>e.tour.id!==tour.id),prior.guidedTours);
  assert.equal(after.guidedTours.length,prior.guidedTours.length+1);
  assert.equal(after.fingerprints.source,prior.fingerprints.source);
  assert.notEqual(after.fingerprints.teaching,prior.fingerprints.teaching);
  assert(await api.parseBodyReviewResponse(after,id));
  const index=after.guidedTours.findIndex((e:any)=>e.tour.id===tour.id),evidence=after.guidedTours[index];
  assert(index>=0);assert.deepEqual(evidence.tour,tour);
  assert.deepEqual(evidence.structures,api.regionalTourStructures(api.catalog,tour));
  assert.equal(evidence.stepFrames.length,4);
  assert.equal(evidence.transitionMs,1800);assert.equal(evidence.transition,'quintic-orbit');
  assert.equal(evidence.separation,0);
  for(const mutate of [(p:any)=>p.guidedTours.splice(index,1),
   (p:any)=>p.guidedTours[index].tour.steps[0].caption+=' altered',
   (p:any)=>p.guidedTours[index].tour.revision+='-stale',
   (p:any)=>p.guidedTours[index].structures[0].sources[0].sha256='0'.repeat(64),
   (p:any)=>p.guidedTours[index].stepFrames[0].min[0]-=1,
   (p:any)=>p.guidedTours[index].transition='linear',
   (p:any)=>p.guidedTours[index].transitionMs=0,
   (p:any)=>p.guidedTours[index].separation=1]){
   const changed=structuredClone(after);mutate(changed);
   assert.equal(await api.parseBodyReviewResponse(changed,id),null);
  }
  const current=await api.bodyReviewContext(id),previous=await before.bodyReviewContext(id);
  assert.equal(current.sourceHash,previous.sourceHash);
  assert.notEqual(current.revisions.teaching,previous.revisions.teaching);
  for(const delta of [{materialHash:previous.materialHash},{revisionHash:previous.revisions.teaching}]){
   const request=new Request('https://review.test/api/atlas-review/body-review/decisions',{method:'POST',
    headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_HEPATOBILIARY_REVIEW'},
    body:JSON.stringify({catalogScope:current.catalogScope,structureId:id,track:'teaching',expectedVersion:0,
     materialHash:current.materialHash,revisionHash:current.revisions.teaching,
     checklistVersion:current.checklistVersion,draft:api.blankBodyReview(current,'teaching'),...delta})});
   assert.equal((await api.postBodyDecision(request,storage)).status,409);refused++;
  }
 }
 assert.equal(refused,8);
});
