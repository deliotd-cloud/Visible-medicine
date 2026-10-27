import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {build} from './workspace-test-build.mjs';
import {restoreRegionalTourResolution} from './regional-tour-resolution-test-inverse.mjs';
const baseline='6ce2153ec403e2abdd41a1cce897dc08f5caf338';
const registryText=readFileSync('lib/regional-tours.ts','utf8');
assert(restoreRegionalTourResolution(registryText));
assert.throws(()=>restoreRegionalTourResolution(registryText+'\n'), 'Unexpected registry bytes cannot enter historical tests');
const before=await exactSourceHistoryApi(baseline,'display-review');
const {api,catalog:raw}=await contentContext();
const catalog=api.bodyDisplayCatalog(raw);
assert.deepEqual(catalog,before.bodyDisplayCatalog(raw));
const result=await build({stdin:{contents:"export * from './lib/regional-tours';export * from './lib/regional-tour-entry';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const current=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const tour=current.coccygeusTour;
assert.equal(current.regionalTours.length,before.regionalTours.length+1);
assert.deepEqual(current.regionalTours.slice(0,-1),before.regionalTours,'All prior tours and their ordering are unchanged');
assert.equal(current.regionalTours.at(-1),tour);
const roots=current.regionalTourStructures(catalog,tour);
assert.equal(roots.length,5);assert.equal(new Set(roots.map(s=>s.id)).size,5);
for(let i=0;i<4;i++){
  const frame=current.regionalTourFrame(catalog,tour,i);assert(frame);
  const evidence=current.regionalTourEvidence(catalog,tour.steps[i].selectedId).find(e=>e.tour.id===tour.id);
  assert(evidence);assert.equal(evidence.separation,0);assert.equal(evidence.transition,'quintic-orbit');
  assert.deepEqual(evidence.tour,tour);assert.equal(evidence.stepFrames.length,4);
}
assert(current.regionalToursFor('pelvis').includes(tour));
for(const region of ['pelvis','whole-body'])assert.equal(current.resolveRegionalTourEntry(catalog,region,baseline,{status:'requested',id:tour.id,revision:tour.revision,sourceRevision:baseline}).status,'ready');
assert.equal(current.resolveRegionalTourEntry(catalog,'pelvis','0'.repeat(40),{status:'requested',id:tour.id,revision:tour.revision,sourceRevision:baseline}).status,'rejected');
const altered=structuredClone(tour);altered.steps[0].caption+=' altered';
assert.throws(()=>current.regionalTourStructures(catalog,altered));
let placements=0;
for(const s of catalog.structures)for(const tab of before.contentTabs){
  assert.deepEqual(api.bodyLesson(s,tab),before.bodyLesson(s,tab),s.id+'/'+tab);placements++;
}
const priorPins=JSON.parse(readFileSync('content/body-review-display-pins.json'));
assert(priorPins.pins.length===catalog.structures.length);
console.log(JSON.stringify({priorTours:before.regionalTours.length,currentTours:current.regionalTours.length,priorToursExact:true,rootLessonsUnchanged:placements,sourceRecords:5,newStops:4,entryAndReviewEvidenceChecked:true}));
