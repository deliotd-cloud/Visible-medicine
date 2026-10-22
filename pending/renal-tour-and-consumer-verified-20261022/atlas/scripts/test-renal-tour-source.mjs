import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';

const baseline='389bd0ca846a42c7f21055f55904bcf5df81a09f';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const pins=JSON.parse(readFileSync('content/renal-tour-pins.json'));
assert.equal(pins.baseline,baseline);
assert.equal(sha(JSON.stringify(pins)),'98c92256a3890541e186bbdc6a173d6206dd50b97f78a3e5ec896a6b4870d66e');
const compile=async contents=>{
  const result=await build({stdin:{contents,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
};
const api=await compile("export {renalTour,renalTourMatches} from './lib/renal-tour';import raw from './public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);");
const oldSource=execFileSync('git',['show',baseline+':lib/renal-tour.ts'],{encoding:'utf8'});
const prior=await compile(oldSource.replaceAll("from './","from './lib/")+"\nexport const originalRenalTour=renalTour;");
const tour=api.renalTour,original=prior.originalRenalTour;
assert.equal(tour.revision,pins.tourRevision);
assert.equal(original.revision,'renal-organs-arteries-orientation-v1');
assert.deepEqual({...tour,revision:original.revision},original,'Only the source-bound revision may change.');
assert.deepEqual(tour.steps.map(s=>s.selectedId),pins.entries.map(s=>s.id));
assert.deepEqual(tour.contextIds,pins.contextEntries.map(s=>s.id));
assert.deepEqual(new Set([...tour.steps.flatMap(s=>s.frameIds),...tour.contextIds]),
  new Set([...pins.entries.map(s=>s.id),...pins.contextEntries.map(s=>s.id)]));
assert.deepEqual(Object.keys(tour.requiredDisplayBundles).sort(),
  [...pins.entries,...pins.contextEntries].map(s=>s.id).sort());
for(const s of [...pins.entries,...pins.contextEntries]){
  assert.equal(tour.requiredDisplayBundles[s.id],s.bundle);
  assert.equal(s.validation.anatomicalReview,false);
}
const rawPath='public/models/bodyparts3d/full-body/catalog.json';
assert.equal(execFileSync('git',['hash-object',rawPath],{encoding:'utf8'}).trim(),
  execFileSync('git',['rev-parse',baseline+':'+rawPath],{encoding:'utf8'}).trim());
for(const bundle of pins.bundles){
  const path='public'+bundle.url.split('?')[0],actual=readFileSync(path);
  assert.equal(actual.length,bundle.bytes);
  assert.equal(sha(actual),bundle.sha256);
  assert(actual.equals(execFileSync('git',['show',baseline+':'+path],{maxBuffer:32e6})));
}
assert.equal(api.renalTourMatches(api.catalog,tour),true);
let sourceRefusals=0,tourRefusals=0;
const rejectSource=catalog=>{assert.equal(api.renalTourMatches(catalog,tour),false);sourceRefusals++;};
const rejectTour=changed=>{assert.equal(api.renalTourMatches(api.catalog,changed),false);tourRefusals++;};
const structures=api.catalog.structures,bundles=api.catalog.bundles;
for(const s of [...pins.entries,...pins.contextEntries]){
  rejectSource({...api.catalog,structures:structures.filter(x=>x.id!==s.id)});
  rejectSource({...api.catalog,structures:[...structures,s]});
  rejectSource({...api.catalog,structures:[...structures,{...s,id:s.id+'-alias',fmaId:s.fmaId+'-alias'}]});
  for(const patch of [
    {id:'foreign'},{fmaId:'foreign'},{laterality:'foreign'},{bundle:'foreign'},
    {nodeName:'foreign'},{sources:[]},{regions:['thorax']},
    {bounds:{min:[0,0,0],max:[1,1,1]}},{center:[0,0,0]},
    {validation:{...s.validation,anatomicalReview:true}},
  ])rejectSource({...api.catalog,structures:structures.map(x=>x.id===s.id?{...x,...patch}:x)});
}
const right=pins.entries[0],left=pins.entries[2];
rejectSource({...api.catalog,structures:structures.map(x=>x.id===right.id?{...x,fmaId:left.fmaId}:x)});
for(const bundle of pins.bundles){
  rejectSource({...api.catalog,bundles:bundles.filter(b=>b.id!==bundle.id)});
  rejectSource({...api.catalog,bundles:[...bundles,bundle]});
  rejectSource({...api.catalog,bundles:[...bundles,{...bundle,id:bundle.id+'-alias'}]});
  for(const patch of [{sha256:'foreign'},{bytes:1},{url:'/foreign.glb'},{structures:1}])
    rejectSource({...api.catalog,bundles:bundles.map(b=>b.id===bundle.id?{...b,...patch}:b)});
}
for(const patch of [{license:'foreign'},{credit:'foreign'},{sourceVersion:'foreign'},{coordinateSystem:{}}])
  rejectSource({...api.catalog,...patch});
// Mutation sweep covers every authored scalar/array leaf, including all captions,
// references, frames, duration, status, descriptions and bundle mappings.
function leafPaths(value,path=[]){
  if(value&&typeof value==='object')return Object.keys(value).flatMap(key=>leafPaths(value[key],[...path,key]));
  return [path];
}
for(const path of leafPaths(tour)){
  const changed=structuredClone(tour);
  let at=changed;for(const key of path.slice(0,-1))at=at[key];
  const key=path.at(-1),value=at[key];
  at[key]=typeof value==='string'?value+' altered':typeof value==='number'?value+1:!value;
  rejectTour(changed);
}
for(const key of Object.keys(tour)){
  const changed=structuredClone(tour);delete changed[key];rejectTour(changed);
}
for(let i=0;i<tour.steps.length;i++)for(const key of Object.keys(tour.steps[i])){
  const changed=structuredClone(tour);delete changed.steps[i][key];rejectTour(changed);
}
for(const mutate of [t=>t.steps.reverse(),t=>t.steps.push(structuredClone(t.steps[0])),
  t=>t.contextIds.push('foreign'),t=>t.steps[0].frameIds.reverse()]){
  const changed=structuredClone(tour);mutate(changed);rejectTour(changed);
}
console.log(JSON.stringify({baseline,targets:pins.entries.length,context:pins.contextEntries.length,
  bundles:pins.bundles.length,sourceRefusals,tourRefusals,originalTourPreservedExceptRevision:true,
  clinicalApproval:false}));
