import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {admitPreservedClinicalReview} from './clinical-review-current-admission.mjs';
import {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
import type {RegionalTour} from '../atlas-review/lib/regional-tours';

const atlas=currentAtlasDeliveryRoot();
const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const tourEpochs=[
  ['baseline','a70b6f640c5511330f250882f525b63a4a21117b','c199d57ed8a8defdfbdb2a02b3644bc80297091b'],
  ['elbow','7d77c973aab2a7135635ab2e65a2831f3e7d22c4','4da6fbc6a9d386211a60d576f4d58e99ac14fe51'],
  ['portal','47a851db0fb3369ad056fb8a8fcc3f3ba73656ea','753a220221084bfc5dab89b94e0db917719a8ddc'],
  ['cervical','c26ef4bf570f05e4b0e078a620db49ca67922ed9','72c74532612b9f93705a968fbdd2d7bfd944b2b0'],
  ['medial','469b2f6874cc3f8209c2f7b36fd830cae18dce9e','ba18dce64f922757ecc6179aa773dfd9e00ba79c'],
  ['venous','628102945520c98aaca1c9fd9e539839caa1f324','c505b43fe67a1d9b468fadfd40756f3b158ddb58'],
  ['calf','840fcbf73e29a9c146a84ca8c232ca5c762c1672','a9dd6a3a34a391c59e5fc0d4051abb2c2eccec98'],
  ['playback','c978ecee3bdddfeaf2995ecbf62d5178e719c4fb','5b468123c407a2ffc8eeacd88a42b9a56ef7f688'],
] as const;
const baseline='a70b6f640c5511330f250882f525b63a4a21117b';
// Actual empty-DB private inbox captured before this source import; no account history.
const oldIntegration='64c0eee7fbb6eb334364a4afc6fcb383fa218081a6e09f342455e3bcc3184f44';
const oldRenderer='1c622768fe7f6756b265a6c7b784e07f8ac37884f140352d55e15b74b207d92b';
const oldCatalog='0fef6614b18c7ef9619d9906376b83f63f14c8d587882d278791bbab194dacf4';
// Synthetic request headers exercise offline handlers only; they are not clinical or browser authentication proof.
const pinPath='content/elbow-arterial-tour-pins.json';
const sourcePaths=[pinPath,'lib/elbow-arterial-tour.ts','lib/regional-tours.ts'];
const startHint='      {!active&&<p className="regional-tour-start-hint">Choose Play full tour or Start guided tour to open each stop\'s notes. Imaging links and quick checks appear where available.</p>}\n';
const withoutStartHint=(source:Buffer)=>{
  const text=source.toString('utf8');
  assert.equal(Buffer.byteLength(startHint),186,'exact source190 hint bytes');
  assert.equal(text.split(startHint).length,2,'one exact regional start hint');
  return Buffer.from(text.replace(startHint,''));
};
const sourceCatalogPath='public/models/bodyparts3d/full-body/catalog.json';
const expectedArteries=['FMA22712','FMA22801','FMA22707','FMA22804','FMA23126','FMA22764','FMA23124','FMA268667'];
const expectedBones=['FMA23130','FMA23464','FMA23467'];
const expectedBundles=['elbow-arteries','forearm-skeleton','forearm-vessels-forearm-vascular','shoulder-arm-skeleton'];
const expectedStops=['inferior-ulnar-collateral','anterior-ulnar-recurrent','superior-ulnar-collateral','posterior-ulnar-recurrent',
  'radial-collateral','radial-recurrent','middle-collateral','recurrent-interosseous'];
const require=createRequire(import.meta.url);
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const git=(args:string[])=>execFileSync('git',args,{cwd:atlas,windowsHide:true,maxBuffer:32e6,
  env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const committed=(commit:string,path:string)=>git(['show',`${commit}:${path}`]);
const norm=(bytes:Uint8Array)=>Buffer.from(bytes).toString('utf8').replaceAll('\r\n','\n');
type Entry={id:string;name:string;fmaId:string;bundle:string;bounds:{min:number[];max:number[]};validation:{anatomicalReview:boolean}};
type File={path:string;sha256:string;sourceSha256?:string;importedSha256?:string};

async function imported(){
  const built=await build({stdin:{contents:[
    "export {elbowArterialTour,elbowArterialTourMatches} from './atlas-review/lib/elbow-arterial-tour';",
    "export {regionalTours,regionalTourStructures,regionalTourStepFrames} from './atlas-review/lib/regional-tours';",
    "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
    "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
    "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
    "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
    "export {blankBodyReview} from './atlas-review/lib/body-review-decisions';",
    "export {postBodyDecision} from './atlas-review/lib/body-review-api';",
    "export {contentTabs} from './atlas-review/lib/content-types';",
    "export {default as rawCatalog} from './atlas-review/public/models/bodyparts3d/full-body/catalog.json';",
  ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
  return import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
}
async function inbox(){
  const built=await build({stdin:{contents:[
    "export {getClinicalReviewInbox} from './lib/clinical-review-inbox';",
    "export {clinicalReviewEntries} from './atlas-review/lib/clinical-review-index';",
  ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'cjs',platform:'node',packages:'external'});
  const mod={exports:{} as Record<string,any>};
  new Function('require','module','exports',built.outputFiles[0].text)((name:string)=>name==='server-only'?{}:require(name),mod,mod.exports);
  return mod.exports;
}
function database(result:unknown={success:true,results:[]}){
  const reads:{sql:string;args:unknown[]}[]=[];
  return {reads,prepare(sql:string){assert.match(sql,/^\s*SELECT\b/i);let args:unknown[]=[];
    const statement={bind(...values:unknown[]){args=values;return statement;},async all(){reads.push({sql,args});return result;},
      async run(){throw Error('The inbox is read-only.');}};return statement;}};
}
const request=(query='')=>new Request('https://review.invalid/api/atlas-review/inbox'+query,
  {headers:{'oai-authenticated-user-id':'offline-elbow-inbox-fixture'}});

test('right elbow guide binds eleven exact records, four bundles, learner captions and draft Review packets',async()=>{
  const currentRevision=admitPreservedClinicalReview({revision,sourceHashes:{
    'content/elbow-arterial-tour-pins.json':'58bf7f4d248fb2caeb361d6a6b22aac3be7801e820a5e498770ca89681142ab2',
    'lib/elbow-arterial-tour.ts':'b2b232bec61ea9f1b8ecc0266fea2c58f113868079f22928703ba4d80872e466',
    'lib/regional-tours.ts':'88f195fd9dbfcd4033a5012eeb760f358cca16da7f48cbca8671ef92c69bea97',
   },learnerModules:['head-neck']});
  assert.equal(git(['rev-parse','HEAD']).toString().trim(),currentRevision);
  const review=json('atlas-review/manifest.json');assert.equal(review.revision,currentRevision);
  assert.notEqual(review.websiteIntegrationSha256,oldIntegration);
  assert.notEqual(json('atlas-review/content/body-renderer-revision.json').sha256,oldRenderer);
  const viewerBase='public/atlas-review-viewer/',viewer=json(viewerBase+'manifest.json');
  assert.equal(viewer.sourceCommit,currentRevision);assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
  assert.equal(viewer.personalRecordsIncluded,false);
  const learners=['head-neck','shoulder','lower-limb','female-pelvis'].map(name=>({name,base:`public/atlas-runtime/${name}/`,
    manifest:json(`public/atlas-runtime/${name}/manifest.json`)}));
  for(const {name,manifest} of learners){assert.equal(manifest.sourceCommit,currentRevision,name);
    assert.equal(manifest.patientDataIncluded,false,name);assert.equal(manifest.clinicalApproved,false,name);}
  const inputs:File[]=json(learners[0].base+'source-inputs.json');
  for(const path of sourcePaths){
    const source=committed(revision,path),copy=readFileSync('atlas-review/'+path),record:File=review.files.find((f:File)=>f.path===path);
    assert(record,path);assert.equal(record.sourceSha256,sha(source),path);assert.equal(record.importedSha256,sha(copy),path);
    assert.equal(inputs.find(f=>f.path===path)?.sha256,sha(source),`${path}: learner input`);
    assert.equal(norm(copy),norm(source),`${path}: imported source`);
    assert.equal(norm(readFileSync(atlas+'/'+path)),norm(source),`${path}: Atlas source`);
    for(const base of ['public/atlas-review/',viewerBase,...learners.map(item=>item.base)])
      assert.equal(existsSync(base+path),false,`${base+path}: raw source exposed`);
  }
  const pins=json('atlas-review/'+pinPath);
  assert.equal(sha(JSON.stringify(pins)),'d61979a48cee12daf0dfd3468b5683a788ff914cc83a36bd91c1ea776415ade7');
  assert.equal(pins.baseline,baseline);assert.equal(pins.tourRevision,'right-elbow-arterial-pairs-20261012-r1');
  assert.deepEqual(pins.entries.map((e:Entry)=>e.fmaId),expectedArteries);
  assert.deepEqual(pins.contextEntries.map((e:Entry)=>e.fmaId),expectedBones);
  assert.deepEqual(pins.bundles.map((b:{id:string})=>b.id).sort(),expectedBundles);
  const api=await imported(),catalog=api.bodyDisplayCatalog(api.rawCatalog),tour=api.elbowArterialTour;
  const records:Entry[]=[...pins.entries,...pins.contextEntries];
  assert.equal(catalog.structures.length,1104);assert.equal(api.contentTabs.length,9);
  assert.equal(api.elbowArterialTourMatches(catalog,tour),true);
  assert.equal(api.regionalTours.filter((item:{id:string})=>item.id===tour.id).length,1);
  const history=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
  const epochs=new Map<string,any>();
  for(const [name,commit,tree] of tourEpochs){
    assert.equal(git(['rev-parse',`${commit}^{tree}`]).toString().trim(),tree,`${name} genuine Git tree`);
    assert.equal(git(['merge-base',commit,currentRevision]).toString().trim(),commit,
      `${name} ancestor of current delivery`);
    epochs.set(name,await history.exactSourceHistoryApi(commit,'review-security'));
  }
  const tours=(name:string)=>epochs.get(name).regionalTours as RegionalTour[];
  const proveAddition=(earlier:string,later:string,id:string,expectedCount:number)=>{
    const old=tours(earlier),next=tours(later);
    assert.equal(old.length,expectedCount-1,`${earlier} complete predecessor population`);
    assert.equal(next.length,expectedCount,`${later} complete introduction population`);
    assert.deepEqual(next.map(item=>item.id),[...old.map(item=>item.id),id],
      `${later}: exactly one named tour appended`);
    assert.deepEqual(next.slice(0,old.length),old,
      `${later}: every earlier tour and its complete step/camera data unchanged`);
    assert(next.at(-1)?.steps.length,`${later}: new tour has exact source steps`);
  };
  proveAddition('baseline','elbow','right-elbow-arterial-pairs',47);
  proveAddition('elbow','portal','portal-hepatic-venous-relationships',48);
  proveAddition('portal','cervical','cervical-whole-discs-orientation',49);
  proveAddition('cervical','medial','right-medial-thigh-orientation',50);
  const beforeVenous=tours('medial'),afterVenous=tours('venous');
  assert.deepEqual(afterVenous.map(item=>item.id),beforeVenous.map(item=>item.id),
    'venous revision changes one tour, never the population');
  const venousId='right-lower-limb-venous-orientation';
  for(const priorTour of beforeVenous)if(priorTour.id!==venousId)
    assert.deepEqual(afterVenous.find(item=>item.id===priorTour.id),priorTour,
      `${priorTour.id}: unchanged through venous revision`);
  const oldVeins=beforeVenous.find(item=>item.id===venousId),newVeins=afterVenous.find(item=>item.id===venousId);
  assert(oldVeins&&newVeins);
  assert.deepEqual(oldVeins.steps.map(step=>step.id),['small','popliteal','femoral','great','external','common']);
  assert.deepEqual(newVeins.steps.map(step=>step.id),
    ['small','popliteal','anterior','posterior','femoral','deep','great','external','common']);
  assert.deepEqual(newVeins.steps.filter(step=>oldVeins.steps.some(old=>old.id===step.id)).map(step=>step.id),
    oldVeins.steps.map(step=>step.id),'all six earlier venous stop identities retain order');
  for(const old of oldVeins.steps)assert.notDeepEqual(newVeins.steps.find(step=>step.id===old.id),old,
    `${old.id}: documented v2 teaching/camera revision, not falsely unchanged`);
  proveAddition('venous','calf','right-posterior-calf-achilles-orientation',51);
  assert.deepEqual(tours('playback'),tours('calf'),
    'continuous playback adds evidence without changing any tour or stop');
  assert.deepEqual(api.regionalTours,tours('playback'),
    'all 51 current Review tours and their exact source stops match genuine playback epoch');
  const introducedElbow=tours('elbow').find(item=>item.id===tour.id);assert(introducedElbow);
  assert.deepEqual(tour,introducedElbow,
    'original elbow tour is exact genuine introduction through current Review');
  const laterSourcePaths=[
    ['lib/portal-hepatic-tour.ts','portal'],['lib/cervical-disc-tour.ts','cervical'],
    ['lib/medial-thigh-tour.ts','medial'],['lib/lower-venous-tour.ts','venous'],
    ['content/lower-venous-tour-v2-pins.json','venous'],['lib/posterior-calf-tour.ts','calf'],
  ] as const;
  for(const [path,epoch] of laterSourcePaths){
    const commit=tourEpochs.find(row=>row[0]===epoch)![1];
    const source=committed(commit,path),current=committed(currentRevision,path);
    assert.deepEqual(current,source,`${path}: introduction source survives to current Git`);
    assert.deepEqual(readFileSync('atlas-review/'+path),source,`${path}: exact Review import`);
    const record=review.files.find((file:File)=>file.path===path);assert(record,path);
    assert.equal(record.sourceSha256,sha(source),`${path}: current Review source hash`);
    assert.equal(record.importedSha256,sha(source),`${path}: current Review import hash`);
  }
  const portalTours=tours('portal');
  const legacyTours=portalTours.filter((item:{id:string})=>item.id!=='portal-hepatic-venous-relationships');
  assert.equal(legacyTours.length,47);
  assert.equal(legacyTours.reduce((count:number,item:{steps:unknown[]})=>count+item.steps.length,0),282);
  assert.equal(portalTours.length,48);
  assert.equal(portalTours.reduce((count:number,item:{steps:unknown[]})=>count+item.steps.length,0),290);
  assert.deepEqual(api.regionalTourStructures(catalog,tour),[...pins.contextEntries,...pins.entries]);
  assert.equal(tour.id,'right-elbow-arterial-pairs');assert.equal(tour.region,'forearm');
  assert.equal(tour.revision,pins.tourRevision);assert.equal(tour.status,'draft');
  assert.deepEqual(tour.contextIds,pins.contextEntries.map((e:Entry)=>e.id));
  assert.deepEqual(tour.steps.map((s:{id:string})=>s.id),expectedStops);
  assert.deepEqual(tour.steps.map((s:{selectedId:string})=>s.selectedId),pins.entries.map((e:Entry)=>e.id));
  assert.deepEqual(tour.steps.map((s:{title:string})=>s.title),pins.entries.map((e:Entry)=>e.name));
  assert(tour.requiredDisplayBundles,'this exact elbow tour supplies required display bundles');
  assert.deepEqual(Object.keys(tour.requiredDisplayBundles).sort(),records.map(e=>e.id).sort());
  for(const entry of records)assert.equal(tour.requiredDisplayBundles[entry.id],entry.bundle,entry.id);
  const frames=api.regionalTourStepFrames(catalog,tour);assert.equal(frames.length,8);
  for(const [i,step] of tour.steps.entries()){
    const pair=Math.floor(i/2)*2,local=[pins.entries[pair],pins.entries[pair+1]] as Entry[];
    assert.deepEqual(step.frameIds,local.map(e=>e.id),step.id);
    assert.deepEqual(frames[i],{min:[0,1,2].map(a=>Math.min(...local.map(e=>e.bounds.min[a]))),
      max:[0,1,2].map(a=>Math.max(...local.map(e=>e.bounds.max[a])))});
    assert.deepEqual(frames[i],frames[i^1],`${step.id}: paired frame`);
    assert.equal(step.durationMs,14000);assert.equal(step.fadeOthers,true);assert(step.caption.trim());
  }
  const learnerJs=learners[0].manifest.files.filter((f:File)=>f.path.endsWith('.js')).map((f:File)=>{
    const bytes=readFileSync(learners[0].base+f.path);assert.equal(sha(bytes),f.sha256);return bytes.toString();}).join('\n');
  for(const step of tour.steps)assert(learnerJs.includes(step.caption),`${step.id}: actual learner caption`);
  // The shared player keeps the existing reduced-motion branch for this tour.
  // Preserve the original literal assertion at the genuine elbow introduction;
  // continuous playback and adjustable rates are separate proven later changes.
  const playerPath='app/regional-guided-learning.tsx';
  const player=committed(tourEpochs.find(row=>row[0]==='elbow')![1],playerPath).toString();
  assert.match(player,/transitionMs=\{active&&!reduced\?1800:0\}/);
  const continuousSource=committed(tourEpochs.find(row=>row[0]==='playback')![1],playerPath);
  assert.match(continuousSource.toString(),/transitionMs=\{active&&!reduced\?\(continuous\?GUIDED_SWEEP_MS:1800\):0\}/);
  const rateSource=committed(revision,playerPath),source190=committed(currentRevision,playerPath);
  const currentPlayer=readFileSync('atlas-review/'+playerPath);
  assert.deepEqual(withoutStartHint(source190),rateSource,'complete rate-aware player survives by the one exact hint inverse');
  const mutated=Buffer.from(source190.toString().replace('Choose Play full tour','Choose Pause full tour'));
  assert.throws(()=>withoutStartHint(mutated),/one exact regional start hint/);
  assert.equal(currentPlayer.toString(),source190.toString().replaceAll('@/','@/atlas-review/'),
    'current Review player is exactly source with the normal import-only rewrite');
  const playerRecord=review.files.find((file:File)=>file.path===playerPath);assert(playerRecord);
  assert.equal(playerRecord.sourceSha256,sha(source190));assert.equal(playerRecord.importedSha256,sha(currentPlayer));
  assert.match(currentPlayer.toString(),/transitionMs=\{active&&!reduced\?\(continuous\?guidedSweepDuration\(playbackRate\):1800\):0\}/,
    'current rate-aware and legacy camera branches both keep reduced motion at zero');
  const playbackPath='lib/guided-playback.ts',playbackSource=committed(revision,playbackPath);
  assert.deepEqual(committed(currentRevision,playbackPath),playbackSource,'exact rate-aware playback policy retained');
  assert.deepEqual(readFileSync('atlas-review/'+playbackPath),playbackSource,'exact playback policy imported');
  const playbackRecord=review.files.find((file:File)=>file.path===playbackPath);assert(playbackRecord);
  assert.equal(playbackRecord.sourceSha256,sha(playbackSource));assert.equal(playbackRecord.importedSha256,sha(playbackSource));
  const builtPlayback=await build({stdin:{contents:playbackSource.toString(),loader:'ts'},write:false,platform:'node',format:'esm'});
  const playback=await import('data:text/javascript;base64,'+Buffer.from(builtPlayback.outputFiles[0].text).toString('base64'));
  assert.deepEqual(playback.GUIDED_PLAYBACK_RATES,[0.5,1,1.5,2,3]);
  for(const [rate,sweep] of [[0.5,16000],[1,8000],[1.5,5334],[2,4000],[3,2667]]){
    assert.equal(playback.guidedSweepDuration(rate),sweep);
    assert(playback.guidedPlaybackDuration(tour.steps[0].caption,tour.steps[0].durationMs,rate)>=Math.ceil(24000/rate));
  }
  for(const rate of [0,-1,Infinity,NaN,'2'])assert.equal(playback.guidedSweepDuration(rate),8000,'unsupported preference refuses speed override');
  let storageCalls=0;const storage={prepare(){storageCalls++;throw Error('Rejected request reached storage');}};
  for(const entry of records){
    assert.equal(entry.validation.anatomicalReview,false);
    const packet=wire(await api.bodyReviewMaterial(entry.id));
    assert.equal(packet.approval,false);assert.equal(packet.status,'worksheet-not-submitted');assert.equal(packet.topics.length,9);
    assert.deepEqual(packet.source.structure,entry);
    const matching=packet.guidedTours.filter((item:{tour:{id:string}})=>item.tour.id===tour.id);
    assert.equal(matching.length,1,entry.id);
    const evidence=matching[0];assert.deepEqual(evidence.tour,wire(tour));
    assert.deepEqual(evidence.continuousPlayback,playback.guidedPlaybackEvidence(tour.steps),
      'current authored continuous policy is exact; runtime speed is not a changed teaching approval');
    assert.deepEqual(evidence.structures,[...pins.contextEntries,...pins.entries]);
    assert.deepEqual(evidence.stepFrames,frames);assert.deepEqual(evidence.bundles,pins.bundles);
    assert.equal(evidence.transitionMs,1800);assert.equal(evidence.transition,'quintic-orbit');
    assert.equal(evidence.separation,0);assert.equal(evidence.patientRegistered,undefined);
    assert.deepEqual(await api.parseBodyReviewResponse(packet,entry.id),packet);
    for(const change of ['missing','duplicate','caption','context','frame','revision','source','registration','approval']){
      const bad=wire(packet),item=bad.guidedTours.find((g:{tour:{id:string}})=>g.tour.id===tour.id);
      if(change==='missing')bad.guidedTours.splice(bad.guidedTours.indexOf(item),1);
      if(change==='duplicate')bad.guidedTours.push(wire(item));
      if(change==='caption')item.tour.steps[0].caption='Forged caption';
      if(change==='context')item.tour.contextIds=[];
      if(change==='frame')item.stepFrames[0].max[0]+=0.1;
      if(change==='revision')item.tour.revision='foreign';
      if(change==='source')item.structures[0].sources[0].sha256='0'.repeat(64);
      if(change==='registration')item.patientRegistered=true;
      if(change==='approval')bad.approval=true;
      assert.equal(await api.parseBodyReviewResponse(bad,entry.id),null,`${entry.id}: ${change}`);
    }
    const context=await api.bodyReviewContext(entry.id);
    const decision={catalogScope:context.catalogScope,structureId:entry.id,track:'teaching',expectedVersion:0,
      materialHash:context.materialHash,revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,
      draft:api.blankBodyReview(context,'teaching')};
    const save=(input:unknown)=>api.postBodyDecision(new Request('https://review.test/api/body-decisions',{
      method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
        'oai-authenticated-user-id':'offline-synthetic-elbow-reviewer'},body:JSON.stringify(input)}),storage);
    assert.equal((await save({...decision,materialHash:'0'.repeat(64)})).status,409);
    assert.equal((await save({...decision,revisionHash:'0'.repeat(64)})).status,409);
    const forged=wire(decision);forged.draft.checks.foreign=true;
    assert.equal((await save(forged)).status,422);
    const approval=wire(decision);approval.draft.status='approved';
    assert.equal((await save(approval)).status,422);
  }
  assert.equal(storageCalls,0);
});

test('private inbox rejects the old catalogue before reads and binds eleven current teaching worksheets',async()=>{
  const {getClinicalReviewInbox,clinicalReviewEntries}=await inbox(),api=await imported();
  const prior=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
  const before=await prior.exactSourceHistoryApi(baseline,'review-security');
  const pins=json('atlas-review/'+pinPath),ids=new Set<string>([...pins.entries,...pins.contextEntries].map((e:Entry)=>e.id));
  assert.equal(ids.size,11);
  const db=database(),first=await getClinicalReviewInbox(request(),db);
  assert.equal(first.status,200);assert.equal(first.headers.get('Cache-Control'),'private, no-store');
  const catalog=(await first.json()).catalogRevision as string;assert.match(catalog,/^[a-f0-9]{64}$/);
  assert.notEqual(catalog,oldCatalog);
  db.reads.length=0;
  const stale=await getClinicalReviewInbox(request('?page=2&revision='+oldCatalog),db);
  assert.equal(stale.status,409);assert.equal(db.reads.length,0,'stale continuation reached DB reads');
  const selections=clinicalReviewEntries.map((entry:any,index:number)=>({entry,index}))
    .filter(({entry}:any)=>entry.scope==='body'&&ids.has(entry.id));
  assert.equal(selections.length,11);
  const pages=[...new Set<number>(selections.map(({index}:any)=>Math.floor(index/12)+2))];
  const batches:any[]=[];
  for(const page of pages){const response=await getClinicalReviewInbox(request(`?page=${page}&revision=${catalog}`),db);
    assert.equal(response.status,200);batches.push(...(await response.json()).items);}
  for(const {entry} of selections){
    const key=JSON.stringify([entry.key,'teaching']),matches=batches.filter(row=>row.key===key);
    assert.equal(matches.length,1,key);const row=matches[0];
    const previous=await before.bodyReviewContext(entry.id),now=await api.bodyReviewContext(entry.id),packet=await api.bodyReviewMaterial(entry.id);
    assert(previous&&now&&packet,entry.id);assert.equal(row.href,'/workspace/atlas-review/body?structure='+encodeURIComponent(entry.id)+'&t=teaching');
    assert.equal(row.revision,now.revisions.teaching,entry.id);assert.equal(row.status,'not-started',entry.id);
    assert.equal(packet.approval,false);assert.equal(packet.status,'worksheet-not-submitted');
    assert.equal(now.sourceHash,previous.sourceHash);assert.notEqual(now.revisions.teaching,previous.revisions.teaching);
  }
  const failed=await getClinicalReviewInbox(request(`?page=${pages[0]}&revision=${catalog}`),database({success:false,results:[]}));
  assert.equal(failed.status,200);
  assert((await failed.json()).items.every((row:any)=>row.status==='unavailable'));
});
