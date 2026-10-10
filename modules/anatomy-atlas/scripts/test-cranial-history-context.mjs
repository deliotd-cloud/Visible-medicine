import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {contentContext} from './content-contract-tools.mjs';
import {cranialHistoryContext} from './cranial-history-context.mjs';
import {authoringBeforeCostalCartilageImaging} from './costal-cartilage-imaging-history.mjs';
import {hash,snapshot} from './pin-pica-clinical.mjs';
import {exactCranialEpochContext} from './exact-cranial-epoch-context.mjs';
const {api,catalog}=await contentContext(),display=api.bodyDisplayCatalog(catalog);
const original=hash(snapshot(api,display));
const historical=cranialHistoryContext(api,catalog);
assert.equal(cranialHistoryContext(historical,catalog),historical,'Composition must be idempotent');
// Full 2026 snapshot hashes must be compared with their exact source trees.
// Keep the current composition above and its mutation cases below independent.
const epoch=await exactCranialEpochContext('costal-after');
assert.equal(hash(snapshot(epoch.api,epoch.display)),'cbef6b8958238b4a645147ece26fae0ec600e929954095f4d8952d3eccc4527d');
const restored=authoringBeforeCostalCartilageImaging(epoch);
assert.equal(hash(snapshot(restored,restored.bodyDisplayCatalog(epoch.catalog))),'35a15b92b0d0135ec46e2f4a45d73302b8e4afd44ef60affcd7e0aaeb97cb871');
const json=async name=>JSON.parse(await readFile('content/'+name+'.json'));
// The live composition applies its recorded reversals; it is deliberately not
// a whole-tree time machine. The original live API must remain unchanged.
assert.notEqual(hash(snapshot(historical,historical.bodyDisplayCatalog(catalog))),'cbef6b8958238b4a645147ece26fae0ec600e929954095f4d8952d3eccc4527d','Live composition must not silently substitute the old epoch');
const cases=[
 [(await json('mediastinal-xray.before')).entries[0].identity.id,'xray'],
 [(await json('spine-ultrasound-pins')).entries[0].id,'ultrasound'],
 [(await json('lacrimal-drainage-imaging-pins')).entries[0].identity.id,'ct'],
 [(await json('forearm-venous-imaging-pins')).entries[0].identity.id,'mri'],
 ['vm:anatomy:body:abdomen:unpaired:organ:liver','anatomy'],
];
let rejected=0;
for(const [id,tab]of cases){
 assert(display.structures.some(s=>s.id===id));
 const bodyLesson=(s,t)=>{const value=api.bodyLesson(s,t);return s.id===id&&t===tab?{...value,body:value.body+' foreign'}:value;};
 const changed={...api,bodyLesson,bodyContent(s,t){const {readiness:_r,...shown}=bodyLesson(s,t);return shown;}};
 assert.throws(()=>cranialHistoryContext(changed,catalog),/Unrecorded/);rejected++;
}
assert.equal(hash(snapshot(api,display)),original,'Live teaching must not be changed by historical tests');
console.log(JSON.stringify({originalHistoricalHashPreserved:true,idempotent:true,rejectedNewerBranchMutations:rejected,liveCompositionDistinctFromExactEpoch:true,liveTeachingUnchanged:true}));
