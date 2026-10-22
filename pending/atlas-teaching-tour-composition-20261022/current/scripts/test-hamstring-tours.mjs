import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import test from 'node:test';

const source=resolve(import.meta.dirname,'..');
const {build}=createRequire(resolve(source,'package.json'))('esbuild');
const sha=b=>createHash('sha256').update(b).digest('hex');
const raw=p=>readFileSync(resolve(source,p));
const original=execFileSync('git',['show','2381efe43b75f8a7fb768a069eecd7268c508dac:lib/regional-tours.ts'],{cwd:source,windowsHide:true,maxBuffer:16e6});
const proposed=raw('lib/regional-tours.ts');
let inverse=proposed.toString('utf8');
const removeOnce=part=>{assert.equal(inverse.split(part).length,2,'Patch inverse must be unique');inverse=inverse.replace(part,'');};
removeOnce("import {hamstringTours,hamstringTourMatches} from './hamstring-tours';\nexport {hamstringTours} from './hamstring-tours';\n");
removeOnce(',...hamstringTours');
removeOnce("  if(hamstringTours.some(candidate=>candidate.id===tour.id)&&!hamstringTourMatches(catalog,tour))\n    throw Error('The hamstring guided tour does not match the available anatomy source.');\n");
assert.deepEqual(Buffer.from(inverse),original);

const sourcePlugin={name:'source-guards',setup(api){
  api.onLoad({filter:/\.(glb|gltf|obj|png|jpg|jpeg|webp|nii|dcm)$/i},()=>{throw Error('Binary/model import refused');});
}};
async function load(entry,resolveDir=source){
  const result=await build({stdin:{contents:entry,resolveDir,loader:'ts'},bundle:true,write:false,
    platform:'node',format:'esm',tsconfigRaw:{},plugins:[sourcePlugin]});
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const current=await load("export * from './lib/regional-tours';export {hamstringTourMatches} from './lib/hamstring-tours';export * from './lib/guided-playback';import raw from './public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);");
const baselineCatalog=execFileSync('git',['show','2381efe43b75f8a7fb768a069eecd7268c508dac:public/models/bodyparts3d/full-body/catalog.json'],{cwd:source,windowsHide:true,maxBuffer:64e6});
assert.deepEqual(raw('public/models/bodyparts3d/full-body/catalog.json'),baselineCatalog);
const before=await load(original.toString('utf8')+"\nimport {bodyDisplayCatalog} from './body-display-catalog';export const catalog=bodyDisplayCatalog("+baselineCatalog.toString('utf8')+" as any);",resolve(source,'lib'));
const pins=JSON.parse(raw('content/hamstring-tour-pins.json'));
await test('baseline inverse and all 51 regional tours/defaults survive',()=>{
assert.deepEqual(current.catalog,before.catalog);
assert.equal(before.regionalTours.length,51);
assert.equal(current.regionalTours.length,53);
assert.deepEqual(current.regionalTours.slice(0,-2),before.regionalTours);
assert.deepEqual(current.regionalTours.slice(-2),current.hamstringTours);
assert.deepEqual(current.regionalTourFor('thigh'),before.regionalTourFor('thigh'));
for(const region of current.catalog.regions)assert.deepEqual(current.regionalTourFor(region.id),before.regionalTourFor(region.id));
assert.equal(new Set(current.regionalTours.map(t=>t.id)).size,53);
});

const all=[...pins.entries,...pins.contextEntries],sides=['right','left'];
await test('ten source identities, three bundles and catalog provenance are exact',()=>{
for(const pin of all){
  const matches=current.catalog.structures.filter(s=>s.id===pin.id||s.fmaId===pin.fmaId);
  assert.equal(matches.length,1);assert.deepEqual(matches[0],pin);
  assert(pin.regions.includes('thigh'));assert.equal(pin.validation.anatomicalReview,false);
}
for(const pin of pins.bundles){
  const matches=current.catalog.bundles.filter(b=>b.id===pin.id);assert.equal(matches.length,1);assert.deepEqual(matches[0],pin);
  assert.equal(typeof pin.bytes,'number');assert.match(pin.sha256,/^[a-f0-9]{64}$/);
}
assert.equal(current.catalog.sourceVersion,pins.sourceVersion);assert.equal(current.catalog.license,pins.license);
assert.deepEqual(current.catalog.coordinateSystem,pins.coordinateSystem);
});
const refs=['https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html','https://pubmed.ncbi.nlm.nih.gov/17200309/','https://pubs.rsna.org/doi/10.1148/rg.240061'];
let tourRefusals=0,sourceRefusals=0,leafRefusals=0;
const refuseTour=(catalog,tour)=>{assert.equal(current.hamstringTourMatches(catalog,tour),false);assert.throws(()=>current.regionalTourStructures(catalog,tour));tourRefusals++;};
await test('bilateral stops, playback and Review evidence',()=>{
assert.deepEqual(current.GUIDED_PLAYBACK_RATES,[0.5,1,1.5,2,3]);
for(const [sideIndex,side] of sides.entries()){
  const tour=current.hamstringTours[sideIndex],muscles=pins.entries.slice(sideIndex*4,sideIndex*4+4),bone=pins.contextEntries[sideIndex];
  assert.equal(tour.id,`${side}-hamstring-orientation`);assert.equal(tour.region,'thigh');assert.equal(tour.status,'draft');
  assert.equal(tour.revision,pins.revision);assert.equal(tour.steps.length,4);
  assert(tour.limitations.includes('not independently segmented or validated'));
  assert(tour.limitations.includes('no registration or patient matching'));
  assert.deepEqual(tour.contextIds,[bone.id]);
  assert.deepEqual(tour.steps.map(s=>s.selectedId),muscles.map(s=>s.id));
  assert.deepEqual(tour.steps.map(s=>s.frameIds),muscles.map(s=>[s.id]));
  assert.deepEqual(tour.requiredDisplayBundles,Object.fromEntries([...muscles,bone].map(s=>[s.id,s.bundle])));
  assert.equal(current.hamstringTourMatches(current.catalog,tour),true);
  assert.deepEqual(current.regionalTourStructures(current.catalog,tour),[bone,...muscles]);
  assert.deepEqual(current.regionalToursFor('thigh').at(-2+sideIndex),tour);
  const frames=current.regionalTourStepFrames(current.catalog,tour);assert.equal(frames.length,4);
  const playback=current.guidedPlaybackEvidence(tour.steps);
  assert.equal(playback.start,'explicit-play-full-tour');
  assert.equal(playback.transition,'quintic-orbit');assert.equal(playback.transitionMs,8000);
  assert.equal(playback.minimumStepMs,24000);assert.equal(playback.final,'hold');
  assert.equal(playback.reducedMotion,'no-camera-sweep');
  assert.deepEqual(playback.stepDurationsMs,[24000,24000,24000,24000]);
  for(const rate of current.GUIDED_PLAYBACK_RATES){
    assert.equal(current.guidedSweepDuration(rate),Math.ceil(8000/rate));
    for(const step of tour.steps)assert.equal(current.guidedPlaybackDuration(step.caption,step.durationMs,rate),Math.ceil(24000/rate));
  }
  for(const [i,step] of tour.steps.entries()){
    assert.equal(step.durationMs,14000);assert.equal(step.fadeOthers,true);assert(step.caption.trim());
    assert(step.references.every(ref=>refs.includes(ref)));
    assert(muscles[i].bounds.min.every((v,axis)=>v>=frames[i].min[axis]&&muscles[i].bounds.max[axis]<=frames[i].max[axis]));
    const evidence=current.regionalTourEvidence(current.catalog,step.selectedId).filter(e=>e.tour.id===tour.id);
    assert.equal(evidence.length,1);assert.deepEqual(evidence[0].tour,tour);
    assert.deepEqual(evidence[0].continuousPlayback,playback);
    assert.deepEqual(evidence[0].stepFrames,frames);
    assert.deepEqual(evidence[0].structures,[bone,...muscles]);
    assert.deepEqual(evidence[0].coordinateSystem,pins.coordinateSystem);
    assert.equal(evidence[0].sourceVersion,pins.sourceVersion);
  }
  for(const mutate of [t=>t.title+=' forged',t=>t.steps.reverse(),t=>t.steps[0].caption+=' forged',
    t=>t.steps[0].selectedId=pins.entries[(sideIndex?0:4)].id,t=>t.steps[0].view='anterior',
    t=>t.steps[0].frameIds=[bone.id],t=>t.steps[0].durationMs=1,t=>t.steps[0].fadeOthers=false,
    t=>t.steps[0].references=['https://example.invalid'],t=>t.contextIds=[],
    t=>t.requiredDisplayBundles[muscles[0].id]='foreign',t=>t.revision+=' forged']){
    const changed=structuredClone(tour);mutate(changed);refuseTour(current.catalog,changed);
  }
}
const wordCount=current.hamstringTours[0].steps.reduce((n,s)=>n+s.caption.trim().split(/\s+/u).length,0);
assert(wordCount>=120&&wordCount<=180,wordCount);
});
await test('all source and changed-leaf refusal scenarios',()=>{
for(const pin of all){
  for(const tour of current.hamstringTours){
    refuseTour({...current.catalog,structures:current.catalog.structures.filter(s=>s.id!==pin.id)},tour);sourceRefusals++;
    refuseTour({...current.catalog,structures:[...current.catalog.structures,pin]},tour);sourceRefusals++;
    refuseTour({...current.catalog,structures:[...current.catalog.structures,{...pin,id:pin.id+'-foreign'}]},tour);sourceRefusals++;
  }
  function scalarLeaves(value,path=[]){
    if(value&&typeof value==='object')return Object.entries(value).flatMap(([key,v])=>scalarLeaves(v,[...path,key]));
    return [[path,value]];
  }
  for(const [path,value] of scalarLeaves(pin)){
    const changed=structuredClone(pin);let node=changed;
    for(const key of path.slice(0,-1))node=node[key];
    node[path.at(-1)]=typeof value==='number'?value+1:typeof value==='boolean'?!value:String(value)+'-foreign';
    const catalog={...current.catalog,structures:current.catalog.structures.map(s=>s.id===pin.id?changed:s)};
    assert.equal(current.hamstringTourMatches(catalog,current.hamstringTours[0]),false,`${pin.id}:${path.join('.')}`);
    assert.equal(current.hamstringTourMatches(catalog,current.hamstringTours[1]),false,`${pin.id}:${path.join('.')}`);
    leafRefusals++;
  }
}
for(const pin of pins.bundles){
  for(const tour of current.hamstringTours){
    refuseTour({...current.catalog,bundles:current.catalog.bundles.filter(b=>b.id!==pin.id)},tour);sourceRefusals++;
    refuseTour({...current.catalog,bundles:[...current.catalog.bundles,pin]},tour);sourceRefusals++;
  }
  function leaves(v,path=[]){return v&&typeof v==='object'?Object.entries(v).flatMap(([k,x])=>leaves(x,[...path,k])):[[path,v]];}
  for(const [path,value] of leaves(pin)){
    const changed=structuredClone(pin);let node=changed;for(const key of path.slice(0,-1))node=node[key];
    node[path.at(-1)]=typeof value==='number'?value+1:typeof value==='boolean'?!value:String(value)+'-foreign';
    const catalog={...current.catalog,bundles:current.catalog.bundles.map(b=>b.id===pin.id?changed:b)};
    assert.equal(current.hamstringTourMatches(catalog,current.hamstringTours[0]),false,`${pin.id}:${path.join('.')}`);
    assert.equal(current.hamstringTourMatches(catalog,current.hamstringTours[1]),false,`${pin.id}:${path.join('.')}`);
    leafRefusals++;
  }
}
for(const patch of [{sourceVersion:'foreign'},{license:'foreign'},{coordinateSystem:{}}])
  for(const tour of current.hamstringTours){refuseTour({...current.catalog,...patch},tour);sourceRefusals++;}
});
const wordCount=current.hamstringTours[0].steps.reduce((n,s)=>n+s.caption.trim().split(/\s+/u).length,0);
console.log(JSON.stringify({originalTours:before.regionalTours.length,proposedTours:current.regionalTours.length,
  preserved:before.regionalTours.length,stops:8,captionWords:wordCount,sourceRefusals,tourRefusals,leafRefusals,
  continuousPlaybackRates:current.GUIDED_PLAYBACK_RATES,continuous1xStepMs:24000,continuous1xSweepMs:8000,
  reviewEvidenceChecks:8,browserGpuVerified:false,
  registryPreimageSha256:sha(original),registryProposedSha256:sha(proposed),pinsSha256:sha(raw('content/hamstring-tour-pins.json'))}));
