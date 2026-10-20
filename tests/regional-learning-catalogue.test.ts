import assert from 'node:assert/strict';
import test from 'node:test';
import {build} from 'esbuild';
import {historicalRegionalCatalogue,historical408RegionalCatalogue,assertCurrentRegionalSource,assertHistoricalRegionalSource,pinned408WebsiteRead} from './regional-learning-catalogue-history.ts';

const api=await historical408RegionalCatalogue();
const binding=api.binding,atlasBodyRegions=api.atlasBodyRegions;

test('408 Website closure refuses altered bytes and undeclared dependencies',()=>{
  const path='lib/regional-learning-catalogue.ts';
  const original=pinned408WebsiteRead(path);
  assert.throws(()=>pinned408WebsiteRead(path,()=>Buffer.concat([original,Buffer.from('altered')])));
  assert.throws(()=>pinned408WebsiteRead('../private.json',()=>original));
});

test('the separate current imported catalogue admits the current Atlas graph',async()=>{
  assertCurrentRegionalSource();
  const built=await build({stdin:{contents:`
    export * from './lib/regional-learning-catalogue';
    export {regionalTours,regionalTourStructures,regionalTourFrame} from './atlas-review/lib/regional-tours';
    import raw from './atlas-review/public/models/bodyparts3d/full-body/catalog.json';
    import {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';
    export const catalog=bodyDisplayCatalog(raw as any);
  `,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
  const current=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
  const actual=current.regionalLearningCatalogue();
  assert.equal(actual.sourceRevision,'87ed7e343260c7df48a40d53503f25bbfd34cfa5');
  assert.equal(actual.available,true);assert.equal(actual.unavailableTours,0);
  assert.equal(actual.tours.length,current.regionalTours.length);
  assert.equal(actual.tours.reduce((n:number,t:any)=>n+t.steps.length,0),current.regionalTours.reduce((n:number,t:any)=>n+t.steps.length,0));
  for(const tour of current.regionalTours)for(const [index,step] of tour.steps.entries()){
    assert(current.regionalTourStructures(current.catalog,tour).some((s:any)=>s.id===step.selectedId));
    assert(current.regionalTourFrame(current.catalog,tour,index));
  }
});

test('complete saved Atlas graphs retain47 legacy tours/282 stops and48 portal-era tours/290 stops',async()=>{
  const legacy=await historicalRegionalCatalogue('legacy'),portal=await historicalRegionalCatalogue('portal');
  assert.equal(legacy.regionalTours.length,47);assert.equal(portal.regionalTours.length,48);
  assert.equal(legacy.regionalTours.reduce((sum:number,t:any)=>sum+t.steps.length,0),282);
  assert.equal(portal.regionalTours.reduce((sum:number,t:any)=>sum+t.steps.length,0),290);
  assert.deepEqual(portal.regionalTours.filter((t:any)=>t.id!=='portal-hepatic-venous-relationships'),legacy.regionalTours);
  for(const epoch of [legacy,portal])for(const tour of epoch.regionalTours){
    const admitted=new Set(epoch.regionalTourStructures(epoch.catalog,tour).map((s:any)=>s.id));
    for(const [index,step]of tour.steps.entries()){
      assert(admitted.has(step.selectedId));assert(epoch.regionalTourFrame(epoch.catalog,tour,index));
    }
  }
});

test('current51 tours/309 stops have exactly three additions and the separately revised lower-venous sequence',async()=>{
  assertHistoricalRegionalSource();
  const portal=await historicalRegionalCatalogue('portal');
  const priorIds=new Set(portal.regionalTours.map((t:any)=>t.id));
  assert.deepEqual(api.regionalTours.filter((t:any)=>!priorIds.has(t.id)).map((t:any)=>[t.id,t.revision,t.region,t.steps.length]),[
    ['cervical-whole-discs-orientation','cervical-whole-discs-20261014-r1','spine',6],
    ['right-medial-thigh-orientation','right-medial-thigh-20261015-r1','thigh',5],
    ['right-posterior-calf-achilles-orientation','right-posterior-calf-20261015-r1','whole-body',5],
  ]);
  const venous='right-lower-limb-venous-orientation';
  assert.deepEqual(api.regionalTours.filter((t:any)=>priorIds.has(t.id)&&t.id!==venous),portal.regionalTours.filter((t:any)=>t.id!==venous));
  const old=portal.regionalTours.find((t:any)=>t.id===venous),now=api.regionalTours.find((t:any)=>t.id===venous);
  assert.equal(old.revision,'right-lower-limb-venous-orientation-v1');assert.equal(now.revision,'right-lower-limb-venous-orientation-v2');
  assert.deepEqual(old.steps.map((s:any)=>s.id),['small','popliteal','femoral','great','external','common']);
  assert.deepEqual(now.steps.map((s:any)=>s.id),['small','popliteal','anterior','posterior','femoral','deep','great','external','common']);
  for(const step of old.steps)assert.equal(now.steps.find((s:any)=>s.id===step.id).selectedId,step.selectedId);
  assert.equal(290+6+5+5+(9-6),309);
});

test('regional discovery projects51 current tours and309 ordered stops without assets or launch claims',()=>{
  const actual=api.regionalLearningCatalogue();
  assert.equal(actual.available,true);assert.equal(actual.unavailableTours,0);
  assert.equal(actual.sourceRevision,'408759d57644b05402e98a937e7cf6338b5509cf');
  assert.equal(actual.tours.length,51);
  assert.equal(actual.tours.reduce((count:number,tour:any)=>count+tour.steps.length,0),309);
  assert.deepEqual(actual.tours.map((tour:any)=>tour.id),api.regionalTours.map((tour:any)=>tour.id));
  for(const [index,projected]of actual.tours.entries()){
    const original=api.regionalTours[index];
    assert.deepEqual(Object.keys(projected).sort(),['id','title','description','revision','regionId','regionLabel','href','limitations','steps'].sort());
    assert.equal(projected.title,original.title);assert.equal(projected.description,original.description);
    assert.equal(projected.revision,original.revision);assert.equal(projected.regionId,original.region);
    assert.equal(projected.href,atlasBodyRegions.find(region=>region.id===original.region)?.href);
    const names=new Map(api.regionalTourStructures(api.catalog,original).map((s:any)=>[s.id,s.name]));
    assert.deepEqual(projected.steps,original.steps.map((step:any)=>({title:step.title,structureName:names.get(step.selectedId)})));
    assert(projected.limitations.length>0);
    const url=new URL(projected.href,'https://example.invalid');
    assert.equal(url.origin,'https://example.invalid');
    assert(!url.searchParams.has('tour'));assert(!url.searchParams.has('autoplay'));assert(!url.searchParams.has('headTour'));
  }
  const serialized=JSON.stringify(actual);
  for(const field of ['nodeName','sources','bounds','anchor','mask','positions_file','credential','reviewer'])
    assert(!serialized.includes('"'+field+'":'),field+' must not be transported');
  assert.deepEqual(actual.regions,atlasBodyRegions.filter(region=>actual.tours.some((tour:any)=>tour.regionId===region.id)).map(region=>({id:region.id,label:region.label})));
});

test('stale or malformed learner/review/viewer bindings fail closed before discovery',()=>{
  for(const patch of [{reviewRevision:'f'.repeat(40)},{learnerRevision:'f'.repeat(40)},
    {viewerRevision:'f'.repeat(40)},{reviewRevision:null},{reviewRevision:'not-a-source'},
    {reviewIntegration:'f'.repeat(64)},{viewerIntegration:'f'.repeat(64)},{reviewIntegration:null}]){
    const actual=api.buildRegionalLearningCatalogue(api.catalog,api.regionalTours,{...binding,...patch});
    assert.deepEqual(actual,{available:false,sourceRevision:null,unavailableTours:0,regions:[],tours:[]});
  }
});

test('altered caption, step order or unknown identity withholds that exact tour and retains every other tour',()=>{
  const original=api.regionalLearningCatalogue();
  for(const mutate of [(tour:any)=>{tour.steps[0].caption+=' altered';},
    (tour:any)=>{tour.steps.reverse();},(tour:any)=>{tour.id='foreign-tour';},
    (tour:any)=>{tour.revision+=' altered';},(tour:any)=>{tour.region='foreign-region';}]){
    const tours=structuredClone(api.regionalTours);mutate(tours[0]);
    const actual=api.buildRegionalLearningCatalogue(api.catalog,tours,binding);
    assert.equal(actual.available,true);assert.equal(actual.unavailableTours,1);
    assert.deepEqual(actual.tours,original.tours.slice(1));
  }
  const duplicate=api.buildRegionalLearningCatalogue(api.catalog,[...api.regionalTours,api.regionalTours[0]],binding);
  assert.equal(duplicate.available,false);assert.deepEqual(duplicate.tours,[]);
});

test('changed exact source target withholds pinned tours instead of substituting similarly named surfaces',()=>{
  const target='vm:anatomy:body:head-neck:midline:bone:frontal-bone';
  const catalog=structuredClone(api.catalog);
  const selected=catalog.structures.find((structure:any)=>structure.id===target);assert(selected);
  selected.sources[0].sha256='f'.repeat(64);
  const actual=api.buildRegionalLearningCatalogue(catalog,api.regionalTours,binding);
  assert.equal(actual.available,true);assert(actual.unavailableTours>0);
  assert(!actual.tours.some((tour:any)=>tour.id==='cranial-vault-orientation'));
  assert(actual.tours.some((tour:any)=>tour.id==='thoracic-airways-vessels'));
  assert.equal(actual.tours.length+actual.unavailableTours,51);
});

test('each newly admitted or revised sequence refuses changed source bytes without moving to a namesake',()=>{
  for(const id of ['cervical-whole-discs-orientation','right-medial-thigh-orientation',
    'right-posterior-calf-achilles-orientation','right-lower-limb-venous-orientation']){
    const tour=api.regionalTours.find((t:any)=>t.id===id);assert(tour,id);
    const catalog=structuredClone(api.catalog),selected=catalog.structures.find((s:any)=>s.id===tour.steps[0].selectedId);assert(selected,id);
    selected.sources[0].sha256='f'.repeat(64);
    const actual=api.buildRegionalLearningCatalogue(catalog,api.regionalTours,binding);
    assert.equal(actual.available,true);assert(actual.unavailableTours>0);
    assert(!actual.tours.some((t:any)=>t.id===id),id);
    assert.equal(actual.tours.length+actual.unavailableTours,51);
  }
});
