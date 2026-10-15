import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

const baseline='6b6d9bba99985dfc5ca8deb52ca9e2632b837d25';
const introduced='c26ef4bf570f05e4b0e078a620db49ca67922ed9';
const sourceOnly=process.argv.includes('--source-only');
const old=path=>execFileSync('git',['show',`${baseline}:${path}`],{maxBuffer:64e6,windowsHide:true});
const introducedBytes=path=>execFileSync('git',['show',`${introduced}:${path}`],{maxBuffer:64e6,windowsHide:true});
const git=args=>execFileSync('git',args,{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim();
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
assert.deepEqual(git(['log','--all','--diff-filter=A','--format=%H','--','lib/cervical-disc-tour.ts']).split(/\r?\n/),[introduced]);
assert.equal(git(['rev-list','--parents','-n','1',introduced]),`${introduced} ${baseline}`);
git(['merge-base','--is-ancestor',introduced,'HEAD']);
const pins=JSON.parse(readFileSync('content/cervical-disc-tour-pins.json','utf8'));
const discFmas=['FMA25058','FMA13896','FMA13897','FMA13898','FMA13899','FMA13900'];
const boneFmas=['FMA12520','FMA12521','FMA12522','FMA12523','FMA12524','FMA12525','FMA9165'];
assert.equal(pins.schemaVersion,1);assert.equal(pins.baseline,baseline);
assert.equal(pins.tourRevision,'cervical-whole-discs-20261014-r1');
assert.deepEqual(pins.entries.map(s=>s.fmaId),discFmas);
assert.deepEqual(pins.contextEntries.map(s=>s.fmaId),boneFmas);
assert.deepEqual(pins.bundles.map(b=>b.id).sort(),['spine-connective-gaps','spine-skeleton']);
assert.deepEqual(readFileSync('content/cervical-disc-tour-pins.json'),introducedBytes('content/cervical-disc-tour-pins.json'));
assert.deepEqual(readFileSync('lib/cervical-disc-tour.ts'),introducedBytes('lib/cervical-disc-tour.ts'));

async function load(mode='current'){
  const contents=mode==='source'
    ? "export * from './lib/cervical-disc-tour';import raw from './public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);"
    : "export * from './lib/regional-tours';export {cervicalDiscTourMatches} from './lib/cervical-disc-tour';export * from './lib/body-review-material';export * from './lib/body-review-context';export * from './lib/body-review-response';import raw from './public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);";
  const result=await build({stdin:{contents,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}

const sourceApi=await load('source');
const api=sourceOnly?sourceApi:await exactSourceHistoryApi(introduced,'regional-tour-review');
const tour=api.cervicalDiscTour;
assert(tour,'The cervical disc tour must be exported');
const discs=pins.entries,bones=pins.contextEntries,records=[...bones,...discs];
const ids=records.map(s=>s.id);
const expectedFrames=discs.map((disc,i)=>[disc.id,bones[i].id,bones[i+1].id]);
assert.equal(new Set(ids).size,13);
assert.equal(tour.id,'cervical-whole-discs-orientation');
assert.equal(tour.title,'Cervical spine: whole discs');
assert.equal(tour.region,'spine');assert.equal(tour.revision,pins.tourRevision);
assert.equal(tour.status,'draft');assert.equal(tour.steps.length,6);
assert.deepEqual(tour.contextIds,bones.map(s=>s.id));
assert.deepEqual(tour.steps.map(s=>s.selectedId),discs.map(s=>s.id));
assert.deepEqual(tour.steps.map(s=>s.frameIds),expectedFrames);
assert.equal(new Set(tour.steps.map(s=>s.id)).size,6);
assert.deepEqual(tour.requiredDisplayBundles,Object.fromEntries(records.map(s=>[s.id,s.bundle])));
for(const s of records){assert(s.regions.includes('spine'));assert.equal(s.validation.anatomicalReview,false);}
for(const step of tour.steps){
  assert.equal(step.view,'left');assert.equal(step.durationMs,14000);assert.equal(step.fadeOthers,true);
  assert(step.caption.trim());assert(step.references.length>0);
}
for(const term of [/whole.disc/i,/annulus/i,/nucleus/i,/registration/i,/radiologist sign.off/i])
  assert.match(tour.limitations,term);
assert.equal(sourceApi.cervicalDiscTourMatches(api.catalog,tour),true);

const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
assert.deepEqual(readFileSync(catalogPath),old(catalogPath));
for(const pin of pins.bundles){
  const path='public'+pin.url.split('?')[0],bytes=readFileSync(path);
  assert.equal(bytes.length,pin.bytes);assert.equal(sha(bytes),pin.sha256);
  assert.deepEqual(bytes,old(path));
}
let sourceRefusals=0;
const refuse=(catalog=api.catalog,candidate=tour)=>{
  assert.equal(sourceApi.cervicalDiscTourMatches(catalog,candidate),false);sourceRefusals++;
};
for(const s of records){
  refuse({...api.catalog,structures:api.catalog.structures.filter(x=>x.id!==s.id)});
  refuse({...api.catalog,structures:[...api.catalog.structures,s]});
  refuse({...api.catalog,structures:[...api.catalog.structures,{...s,id:s.id+'-alias'}]});
  for(const patch of [{id:'foreign'},{fmaId:'FMA0'},{laterality:'foreign'},
    {regions:['foreign']},{bundle:'foreign'},
    {sources:[]},{sources:s.sources.map((source,i)=>i?source:{...source,sha256:'0'.repeat(64)})},
    {bounds:{min:[0,0,0],max:[1,1,1]}},{validation:{...s.validation,anatomicalReview:true}}])
    refuse({...api.catalog,structures:api.catalog.structures.map(x=>x.id===s.id?{...x,...patch}:x)});
}
for(const pin of pins.bundles){
  refuse({...api.catalog,bundles:api.catalog.bundles.filter(x=>x.id!==pin.id)});
  refuse({...api.catalog,bundles:[...api.catalog.bundles,pin]});
  refuse({...api.catalog,bundles:api.catalog.bundles.map(x=>x.id===pin.id?{...x,sha256:'0'.repeat(64)}:x)});
}
for(const patch of [{sourceVersion:'foreign'},{license:'foreign'},{coordinateSystem:{}}])refuse({...api.catalog,...patch});
for(const mutate of [t=>t.steps.reverse(),t=>{t.title+=' forged';},
  t=>{t.steps[0].caption+=' forged';},t=>{t.steps[0].references=['https://example.invalid/'];},
  t=>{t.steps[0].view='posterior';},t=>{t.steps[0].durationMs=1;},
  t=>{t.steps[0].frameIds=[discs[0].id];},t=>{t.steps[0].selectedId=bones[0].id;},
  t=>{t.contextIds=[];},t=>{t.requiredDisplayBundles[discs[0].id]='foreign';},
  t=>{t.revision+='-forged';}]){
  const candidate=structuredClone(tour);mutate(candidate);refuse(api.catalog,candidate);
}
if(sourceOnly){
  console.log(JSON.stringify({mode:'source-only',discs:6,bones:7,bundles:2,sourceRefusals}));
  process.exit(0);
}

const before=await exactSourceHistoryApi(baseline,'regional-tour-review');
assert.equal(before.regionalTours.length,48);
assert.equal(before.regionalTours.reduce((n,t)=>n+t.steps.length,0),290);
assert.equal(api.regionalTours.length,49);
assert.equal(api.regionalTours.reduce((n,t)=>n+t.steps.length,0),296);
assert.deepEqual(api.regionalTours.filter(t=>t.id!==tour.id),before.regionalTours);
assert.deepEqual(api.catalog,before.catalog);
assert.deepEqual(api.regionalToursFor('spine').filter(t=>t.id===tour.id),[tour]);
for(const region of api.catalog.regions)
  assert.equal(api.regionalTourFor(region.id)?.id,before.regionalTourFor(region.id)?.id);
assert.deepEqual(api.regionalTourStructures(api.catalog,tour),records);
const frames=api.regionalTourStepFrames(api.catalog,tour);
assert.equal(frames.length,6);
for(const [i,step] of tour.steps.entries())for(const id of step.frameIds){
  const s=records.find(s=>s.id===id);assert(s);
  assert(s.bounds.min.every((v,axis)=>v>=frames[i].min[axis]&&s.bounds.max[axis]<=frames[i].max[axis]));
}
for(const s of records)
  assert.throws(()=>api.regionalTourStructures({...api.catalog,structures:api.catalog.structures.filter(x=>x.id!==s.id)},tour));
assert.throws(()=>api.regionalTourStructures(api.catalog,{...tour,steps:[...tour.steps].reverse()}));

let changed=0,unchanged=0,topics=0,packetRefusals=0;
const participants=new Set(ids);
for(const s of api.catalog.structures){
  const now=await api.bodyReviewMaterial(s.id),prior=await before.bodyReviewMaterial(s.id);
  const current=await api.bodyReviewContext(s.id),previous=await before.bodyReviewContext(s.id);
  assert.deepEqual(now.source,prior.source);assert.deepEqual(now.topics,prior.topics);
  assert.deepEqual(now.reasoning,prior.reasoning);topics+=now.topics.length;
  assert.equal(now.approval,false);
  assert.deepEqual(now.guidedTours,api.regionalTourEvidence(api.catalog,s.id),`Tour evidence: ${s.id}`);
  assert(await api.parseBodyReviewResponse(now,s.id),`Current review packet: ${s.id}`);
  assert.deepEqual(now.guidedTours.filter(g=>g.tour.id!==tour.id),prior.guidedTours);
  assert.equal(current.sourceHash,previous.sourceHash);
  if(!participants.has(s.id)){
    assert.deepEqual(now,prior);assert.equal(current.teachingHash,previous.teachingHash);
    assert.equal(current.revisions.teaching,previous.revisions.teaching);unchanged++;continue;
  }
  changed++;
  assert.notEqual(current.teachingHash,previous.teachingHash);
  assert.notEqual(current.revisions.teaching,previous.revisions.teaching);
  assert.equal(now.guidedTours.length,prior.guidedTours.length+1);
  const at=now.guidedTours.findIndex(g=>g.tour.id===tour.id),evidence=now.guidedTours[at];assert(at>=0);
  assert.deepEqual(evidence.tour,tour);assert.deepEqual(evidence.structures,records);
  assert.deepEqual(evidence.stepFrames,frames);
  assert.deepEqual(Object.fromEntries(evidence.bundles.map(b=>[b.id,b])),
    Object.fromEntries(pins.bundles.map(b=>[b.id,b])));
  assert.equal(evidence.transitionMs,1800);assert.equal(evidence.transition,'quintic-orbit');
  assert.equal(evidence.separation,0);
  for(const mutate of [p=>p.guidedTours.splice(at,1),
    p=>p.guidedTours.push(structuredClone(evidence)),
    p=>p.guidedTours[at].tour.steps.reverse(),
    p=>{p.guidedTours[at].tour.steps[0].frameIds=[discs[0].id];},
    p=>{p.guidedTours[at].structures[0].sources[0].sha256='0'.repeat(64);},
    p=>{p.guidedTours[at].bundles[0].sha256='0'.repeat(64);},
    p=>{p.guidedTours[at].stepFrames[0].min[0]-=1;},
    p=>{p.guidedTours[at].transitionMs=0;}]){
    const forged=structuredClone(now);mutate(forged);
    assert.equal(await api.parseBodyReviewResponse(forged,s.id),null);packetRefusals++;
  }
}
assert.deepEqual({changed,unchanged,topics},{changed:13,unchanged:1091,topics:9936});
const live=await load('current');
assert.deepEqual(live.cervicalDiscTour,tour);
assert.equal(live.cervicalDiscTourMatches(live.catalog,live.cervicalDiscTour),true);
assert.deepEqual(live.regionalTours.filter(t=>t.id===tour.id),[tour]);
assert.deepEqual(live.regionalTourStructures(live.catalog,tour),records);
assert.deepEqual(live.regionalTourStepFrames(live.catalog,tour),frames);
for(const id of ids){
  const fragment=api.regionalTourEvidence(api.catalog,id).find(g=>g.tour.id===tour.id);
  const currentFragment=live.regionalTourEvidence(live.catalog,id).find(g=>g.tour.id===tour.id);
  const expectedCurrent={...fragment,continuousPlayback:{version:1,start:'explicit-play-full-tour',transition:'quintic-orbit',transitionMs:8000,minimumStepMs:24000,captionWordsPerMinute:180,stepDurationsMs:tour.steps.map(s=>Math.max(24000,s.durationMs,8000+Math.ceil(s.caption.trim().split(/\s+/u).filter(Boolean).length*60000/180))),final:'hold',reducedMotion:'no-camera-sweep'}};
  assert.deepEqual(currentFragment,expectedCurrent);
  const packet=await live.bodyReviewMaterial(id);
  assert.deepEqual(packet.guidedTours.find(g=>g.tour.id===tour.id),expectedCurrent);
  assert(await live.parseBodyReviewResponse(packet,id));
}
console.log(JSON.stringify({tours:49,stops:296,preservedTours:48,sourceRefusals,packetRefusals,
  changed,unchanged,unchangedTopics:topics,currentSelectedTour:true,clinicalApproval:false}));
