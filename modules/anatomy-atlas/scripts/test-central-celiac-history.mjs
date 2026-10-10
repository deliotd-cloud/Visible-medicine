// Offline source-history regression. This never changes learner or Review content.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {authoringBeforeCentralVesselImaging} from './central-vessel-imaging-history.mjs';
import {beforeCeliacDisplay} from './celiac-display-history.mjs';
import pins from '../content/central-vessel-imaging-pins.json' with {type:'json'};
import record from '../content/celiac-display-transition.json' with {type:'json'};

const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const shown=lesson=>{const {readiness:_readiness,...content}=lesson;return content;};
assert.equal(hash(record),'04fe1aeaba2bc1c5960b8bf5637d0f4ec498c49c63dd9997beddd06023c2c08e');
const celiac=pins.entries.find(entry=>entry.identity.id===record.original.id);
assert(celiac,'Pinned central-vessel celiac entry');
assert.deepEqual(celiac.identity,record.original);
assert.deepEqual(celiac.topics,['ct','mri','ultrasound']);
assert.equal(record.replacement.id,record.original.id);

const context=await contentContext();
const raw=context.catalog;
const display=context.api.bodyDisplayCatalog(raw);
assert.equal(hash(display),record.afterCatalog,'Exact current corrected display catalog');
assert.deepEqual(display.structures.filter(s=>s.id===celiac.identity.id),[record.replacement]);
const rawHistory=authoringBeforeCentralVesselImaging(context);
const displayHistory=authoringBeforeCentralVesselImaging({...context,catalog:display});
const beforeCorrection=authoringBeforeCentralVesselImaging({
  ...context,api:beforeCeliacDisplay(context.api,raw),
});

let accepted=0,refused=0;
for(const tab of celiac.topics){
  const expected=celiac.previous[tab];
  const fromRaw=rawHistory.bodyLesson(record.original,tab);
  const fromDisplay=displayHistory.bodyLesson(record.replacement,tab);
  assert.deepEqual(fromRaw,expected);
  assert.deepEqual(fromDisplay,expected);
  assert.deepEqual(rawHistory.bodyLesson(record.replacement,tab),expected,
    'Raw source catalog normalizes to the exact corrected display');
  // Existing pin checks legitimately pass the raw identity under a displayed catalog.
  assert.deepEqual(displayHistory.bodyLesson(record.original,tab),expected);
  assert.deepEqual(rawHistory.bodyContent(record.original,tab),shown(expected));
  assert.deepEqual(rawHistory.bodyContent(record.replacement,tab),shown(expected));
  assert.deepEqual(displayHistory.bodyContent(record.replacement,tab),shown(expected));
  assert.deepEqual(displayHistory.bodyContent(record.original,tab),shown(expected));
  fromRaw.body='mutated';
  if(fromRaw.bullets)fromRaw.bullets.push('mutated');
  if(fromRaw.citations)fromRaw.citations.push('https://foreign.example/');
  fromDisplay.body='mutated';
  if(fromDisplay.bullets)fromDisplay.bullets.push('mutated');
  if(fromDisplay.citations)fromDisplay.citations.push('https://foreign.example/');
  assert.deepEqual(rawHistory.bodyLesson(record.original,tab),expected,'Raw predecessor is detached');
  assert.deepEqual(displayHistory.bodyLesson(record.replacement,tab),expected,'Displayed predecessor is detached');
  accepted+=4;
}
for(const entry of pins.entries.filter(entry=>entry.identity.id!==celiac.identity.id)){
  for(const tab of entry.topics){
    assert.deepEqual(rawHistory.bodyLesson(entry.identity,tab),entry.previous[tab]);
    assert.deepEqual(displayHistory.bodyLesson(entry.identity,tab),entry.previous[tab]);
    assert.deepEqual(displayHistory.bodyContent(entry.identity,tab),shown(entry.previous[tab]));
  }
}

for(const mutate of [
  s=>{s.bundle='abdomen-vessels-recovery';s.anchor[0]+=.01;},
  s=>{s.bundle='foreign';},
  s=>{s.sources[0].sha256='0'.repeat(64);},
  s=>{s.sources.reverse();},
  s=>{s.anchor[0]+=.01;},
  s=>{s.bounds.min[0]+=.01;},
  s=>{s.fmaId='FMA0';},
  s=>{s.extra='foreign';},
]){
  const bad=structuredClone(record.replacement);mutate(bad);
  for(const tab of celiac.topics){
    assert.throws(()=>displayHistory.bodyLesson(bad,tab));
    assert.throws(()=>displayHistory.bodyContent(bad,tab));
    refused+=2;
  }
}
for(const tab of celiac.topics){
  assert.deepEqual(beforeCorrection.bodyLesson(record.original,tab),celiac.previous[tab]);
  assert.throws(()=>beforeCorrection.bodyLesson(record.replacement,tab),
    'Displayed identity under genuine pre-correction display');
  refused++;
}
// Construction alone must not authorize a later changed display catalogue.
const deferredCatalog=structuredClone(display);
const deferredHistory=authoringBeforeCentralVesselImaging({...context,catalog:deferredCatalog});
assert.deepEqual(deferredHistory.bodyLesson(record.replacement,'ct'),celiac.previous.ct);
deferredCatalog.bundles.find(b=>b.id===record.bundle.id).sha256='0'.repeat(64);
assert.deepEqual(deferredHistory.bodyLesson(record.original,'ct'),celiac.previous.ct,
  'Detached exact raw pin remains a legitimate historical lookup');
assert.throws(()=>deferredHistory.bodyLesson(record.replacement,'ct'),
  'Changed catalogue after construction must revoke displayed identity');
assert.throws(()=>deferredHistory.bodyContent(record.replacement,'ct'));
refused+=2;
const unrelatedCatalog=structuredClone(display);
const unrelatedHistory=authoringBeforeCentralVesselImaging({...context,catalog:unrelatedCatalog});
const unrelated=unrelatedCatalog.structures.find(s=>s.id!==record.original.id);
assert(unrelated,'Unrelated source identity required');
unrelated.anchor[0]+=.01;
for(const tab of celiac.topics){
  assert.deepEqual(unrelatedHistory.bodyLesson(record.original,tab),celiac.previous[tab],
    'Exact raw pin stays available for historical lookup');
  assert.throws(()=>unrelatedHistory.bodyLesson(record.replacement,tab),
    'Changed unrelated identity revokes corrected-display lookup');
  assert.throws(()=>unrelatedHistory.bodyContent(record.replacement,tab));
  refused+=2;
}

for(const mutate of [
  c=>{c.structures.push(structuredClone(record.replacement));},
  c=>{c.structures.find(s=>s.id===record.original.id).bundle=record.original.bundle;},
  c=>{c.bundles=c.bundles.filter(b=>b.id!==record.bundle.id);},
  c=>{c.bundles.find(b=>b.id===record.bundle.id).sha256='0'.repeat(64);},
  c=>{c.structures.find(s=>s.id!==record.original.id).anchor[0]+=.01;},
]){
  const bad=structuredClone(display);mutate(bad);
  assert.notEqual(hash(bad),record.afterCatalog);
  assert.throws(()=>authoringBeforeCentralVesselImaging({...context,catalog:bad}),
    'Foreign or mixed corrected catalog must refuse construction');
  refused++;
}
console.log(JSON.stringify({acceptedCeliacEpochs:accepted,otherCentralEntries:pins.entries.length-1,
  malformedIdentitiesAndCatalogsRefused:refused,sourceFixturesUnchanged:true,clinicalApproval:false}));
