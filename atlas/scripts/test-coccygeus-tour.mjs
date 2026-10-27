import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {coccygeusTour,coccygeusTourMatches} from '../lib/coccygeus-tour.ts';

const flag=process.argv.find(arg=>arg.startsWith('--atlas-root='));
const root=resolve(flag?.slice('--atlas-root='.length)??process.cwd());
const {bodyDisplayCatalog}=await import(pathToFileURL(join(root,'lib/body-display-catalog.ts')).href);
const catalog=bodyDisplayCatalog(JSON.parse(readFileSync(join(root,'public/models/bodyparts3d/full-body/catalog.json'))));
const pins=JSON.parse(readFileSync(new URL('../content/coccygeus-tour-pins.json',import.meta.url)));
const tour=coccygeusTour;
assert.equal(coccygeusTourMatches(catalog,tour),true);
assert.equal(tour.region,'pelvis');assert.equal(tour.revision,pins.tourRevision);
assert.equal(tour.status,'draft');assert.equal(tour.steps.length,4);
assert.deepEqual(tour.contextIds,pins.contextEntries.map(entry=>entry.id));
assert.deepEqual(tour.steps.map(step=>step.selectedId),[
  pins.contextEntries[0].id,pins.entries[0].id,pins.entries[1].id,pins.contextEntries[2].id,
]);
assert.deepEqual(tour.steps.map(step=>step.view),['anterior','superior','superior','posterior']);
assert.deepEqual(tour.steps.map(step=>step.frameIds),[
  [pins.contextEntries[0].id,pins.contextEntries[2].id],
  [pins.entries[0].id],
  pins.entries.map(entry=>entry.id),
  [pins.contextEntries[2].id,...pins.entries.map(entry=>entry.id)],
]);
assert.deepEqual(tour.requiredDisplayBundles,Object.fromEntries([...pins.entries,...pins.contextEntries].map(entry=>[entry.id,entry.bundle])));
const records=[...pins.entries,...pins.contextEntries],byId=new Map(records.map(entry=>[entry.id,entry]));
const bounds=ids=>({min:[0,1,2].map(axis=>Math.min(...ids.map(id=>byId.get(id).bounds.min[axis]))),
  max:[0,1,2].map(axis=>Math.max(...ids.map(id=>byId.get(id).bounds.max[axis])))});
for(const step of tour.steps){
  assert.equal(step.durationMs,14000);assert.equal(step.fadeOthers,true);
  assert.deepEqual(step.references,['https://anatomy.ttuhscep.edu/reproductive_system/pelvicwall_tables.html']);
  assert(step.caption.trim().length>80);assert(step.frameIds.includes(step.selectedId));
  const frame=bounds(step.frameIds),selected=byId.get(step.selectedId);assert(selected);
  assert(selected.bounds.min.every((n,axis)=>n>=frame.min[axis]&&selected.bounds.max[axis]<=frame.max[axis]));
  assert(frame.min.every((n,axis)=>Number.isFinite(n)&&n<frame.max[axis]));
}
const muscleWidth=bounds(tour.steps[1].frameIds).max[0]-bounds(tour.steps[1].frameIds).min[0];
const boneWidth=bounds(tour.steps[0].frameIds).max[0]-bounds(tour.steps[0].frameIds).min[0];
assert(muscleWidth<boneWidth/2,'Right-muscle camera window is a source-bounds close-up.');
assert.match(tour.limitations,/unvalidated/i);assert.match(tour.limitations,/coccyx/i);
assert.match(tour.limitations,/levator ani/i);assert.match(tour.limitations,/registration/i);

let refusals=0;
const refuse=(candidateCatalog=catalog,candidateTour=tour)=>{assert.equal(coccygeusTourMatches(candidateCatalog,candidateTour),false);refusals++;};
for(const record of records){
  refuse({...catalog,structures:catalog.structures.filter(entry=>entry.id!==record.id)});
  refuse({...catalog,structures:[...catalog.structures,record]});
  refuse({...catalog,structures:[...catalog.structures,{...record,id:record.id+'-alias'}]});
  for(const patch of [{id:'foreign'},{fmaId:'FMA0'},{laterality:'foreign'},
    {regions:['foreign']},{bundle:'foreign'},{name:'Changed label'},
    {sources:[]},{bounds:{min:[0,0,0],max:[1,1,1]}},
    {validation:{status:'unvalidated',anatomicalReview:true}}])
    refuse({...catalog,structures:catalog.structures.map(entry=>entry.id===record.id?{...entry,...patch}:entry)});
}
for(const bundle of pins.bundles){
  refuse({...catalog,bundles:catalog.bundles.filter(entry=>entry.id!==bundle.id)});
  refuse({...catalog,bundles:[...catalog.bundles,bundle]});
  refuse({...catalog,bundles:catalog.bundles.map(entry=>entry.id===bundle.id?{...entry,sha256:'0'.repeat(64)}:entry)});
}
for(const patch of [{sourceVersion:'foreign'},{license:'foreign'},{coordinateSystem:{}}])refuse({...catalog,...patch});
for(const mutate of [candidate=>candidate.steps.reverse(),candidate=>{candidate.title+=' altered';},
  candidate=>{candidate.steps[0].caption+=' altered';},candidate=>{candidate.steps[0].references=['https://example.invalid/'];},
  candidate=>{candidate.steps[1].view='posterior';},candidate=>{candidate.steps[1].frameIds=[pins.contextEntries[0].id];},
  candidate=>{candidate.steps[2].selectedId=pins.entries[0].id;},candidate=>{candidate.steps[2].durationMs=1;},
  candidate=>{candidate.contextIds=[];},candidate=>{candidate.requiredDisplayBundles[pins.entries[0].id]='foreign';},
  candidate=>{candidate.revision+='-forged';},candidate=>{candidate.limitations='';}]){
  const altered=structuredClone(tour);mutate(altered);refuse(catalog,altered);
}
console.log(JSON.stringify({mode:'focused-proposal',steps:tour.steps.length,records:records.length,bundles:pins.bundles.length,refusals}));
