import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {context,hash,snapshot} from './pin-pica-clinical.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {unreconciledLowerArterialHistory} from './lower-arterial-imaging-history.mjs';
import {restoreLowerArterialSourceHistory} from './lower-arterial-source-history.mjs';
import record from '../content/lower-arterial-source-history.json' with {type:'json'};
import pins from '../content/lower-arterial-imaging-pins.json' with {type:'json'};
const c=await context({current:true}),liveHash=hash(snapshot(c.api,c.display));
const historical=unreconciledLowerArterialHistory({api:c.api,catalog:c.display}),display=historical.bodyDisplayCatalog(c.catalog),restored=restoreLowerArterialSourceHistory(historical,c.catalog);
const original=await exactSourceHistoryApi(record.originalCommit),originalDisplay=original.bodyDisplayCatalog(c.catalog);
assert.deepEqual(restored.bodyDisplayCatalog(c.catalog),originalDisplay);
assert.deepEqual(snapshot(restored,originalDisplay),snapshot(original,originalDisplay));
assert.equal(hash(snapshot(restored,originalDisplay)),pins.previousAllLessonsAndRecipesHash);
assert.equal(restoreLowerArterialSourceHistory(restored,c.catalog),restored);
let rejected=0;
const reject=(api,pattern)=>{assert.throws(()=>restoreLowerArterialSourceHistory(api,c.catalog),pattern);rejected++;};
// Wrong geometry/bundle/side and mixed catalogues must not be silently excluded.
for(const mutate of [d=>d.structures[0].bounds.min[0]++,d=>d.structures.pop(),d=>d.bundles[0].sha256='foreign',d=>d.structures.find(s=>record.removedStructures.includes(s.id)).laterality='foreign']){
 const bad=structuredClone(display);mutate(bad);reject({...historical,bodyDisplayCatalog:()=>bad},/Unrecorded source/);
}
const e=record.changes[0],removed=display.structures.find(s=>s.id===record.removedStructures[0]);
for(const [id,tab,lesson] of [[e.identity.id,e.tab,e.previous],[removed.id,'anatomy',{...historical.bodyLesson(removed,'anatomy'),body:'foreign'}],[pins.entries[0].identity.id,'ct',{...historical.bodyLesson(pins.entries[0].identity,'ct'),body:'foreign'}]]){
 reject({...historical,bodyLesson:(s,t)=>s.id===id&&t===tab?structuredClone(lesson):historical.bodyLesson(s,t)},/Unrecorded/);
}
const recipes=structuredClone(historical.dissectionProfiles);recipes['head-neck'].label='foreign';reject({...historical,dissectionProfiles:recipes},/Unrecorded reconstructed/);
const changedOld={...restored,bodyLesson:(s,t)=>s.id===e.identity.id&&t===e.tab?{...restored.bodyLesson(s,t),body:'foreign'}:restored.bodyLesson(s,t)};reject(changedOld,/Unrecorded restored/);
const bad=structuredClone(e.identity);bad.sources[0].sha256='foreign';assert.throws(()=>restored.bodyLesson(bad,e.tab),/Different historical/);rejected++;
const copy=restored.bodyDisplayCatalog(c.catalog);copy.structures.pop();assert.deepEqual(restored.bodyDisplayCatalog(c.catalog),originalDisplay);
const lesson=restored.bodyLesson(e.identity,e.tab);lesson.body='foreign';assert.deepEqual(restored.bodyLesson(e.identity,e.tab),e.previous);
assert.equal(hash(snapshot(c.api,c.display)),liveHash,'Historical test must not mutate current authoring');
assert.deepEqual(JSON.parse(await readFile('content/lower-arterial-imaging-pins.json')),pins);
const report={originalCommit:record.originalCommit,originalFixtureHash:pins.previousAllLessonsAndRecipesHash,originalSourceReplay:true,originalRecords:originalDisplay.structures.length,laterRecordsExcludedOnlyFromHistoricalView:record.removedStructures.length,laterBundlesExcludedOnlyFromHistoricalView:record.removedBundles.length,exactRestoredLessons:record.changes.length,rejectedInvalidStates:rejected,currentTeachingUnchanged:true,immutableFixturesChanged:false,runtimeChanged:false,clinicalApproval:false};
await writeFile('docs/lower-arterial-source-history-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
