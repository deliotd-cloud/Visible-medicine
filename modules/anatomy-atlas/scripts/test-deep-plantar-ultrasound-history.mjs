import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {snapshot,hash} from './pin-pica-clinical.mjs';
import {beforeDeepPlantarUltrasound as history} from './deep-plantar-ultrasound-history.mjs';
const pins=JSON.parse(readFileSync('content/deep-plantar-ultrasound-pins.json'));
const compiled=await build({stdin:{contents:`export {deepPlantarUltrasoundLesson} from './lib/deep-plantar-ultrasound';
export {bodyLesson,bodyContent} from './app/body-content';export {bodyDisplayCatalog} from './lib/body-display-catalog';
export {contentTabs} from './lib/content-types';export {structures} from './app/anatomy-data';export {dissectionProfiles} from './app/dissection-data';`,
 resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const display=api.bodyDisplayCatalog(JSON.parse(readFileSync('public/models/bodyparts3d/full-body/catalog.json')));
const currentHash=hash(snapshot(api,display)),prior=history(api);
assert.equal(hash(snapshot(prior,display)),pins.previousAllLessonsAndRecipesHash);
assert.equal(history(prior),prior);assert.equal(hash(snapshot(api,display)),currentHash);
for(const entry of pins.entries){
 assert.deepEqual(prior.bodyLesson(entry.identity,'ultrasound'),entry.previous);
 const lesson=prior.bodyLesson(entry.identity,'ultrasound');lesson.body+='foreign';
 assert.deepEqual(prior.bodyLesson(entry.identity,'ultrasound'),entry.previous);
 const foreign=structuredClone(entry.identity);foreign.sources[0].sha256='foreign';
 assert.throws(()=>prior.bodyLesson(foreign,'ultrasound'),/exact source identity/);
 for(const tab of api.contentTabs.filter(t=>t!=='ultrasound'))assert.deepEqual(prior.bodyLesson(entry.identity,tab),api.bodyLesson(entry.identity,tab));
}
const first=pins.entries[0],mixed={...api,bodyLesson(structure,tab){
 return tab==='ultrasound'&&structure.id===first.identity.id?structuredClone(first.previous):api.bodyLesson(structure,tab);
}};
assert.throws(()=>history(mixed),/Mixed deep plantar ultrasound history/);
assert.throws(()=>history({...api,bodyLesson(structure,tab){
 const lesson=api.bodyLesson(structure,tab);if(structure.id===first.identity.id&&tab==='ultrasound')lesson.body+=' foreign';return lesson;
}}),/Unrecorded deep plantar ultrasound/);
assert.throws(()=>history({...api,deepPlantarUltrasoundLesson(){return {body:'foreign'};}}),/Unrecorded deep plantar helper/);
const other=display.structures.find(s=>!pins.entries.some(e=>e.identity.id===s.id));
const altered={...api,bodyLesson(structure,tab){const lesson=api.bodyLesson(structure,tab);if(structure.id===other.id&&tab==='anatomy')return {...lesson,body:'Unrelated change retained'};return lesson;}};
assert.equal(history(altered).bodyLesson(other,'anatomy').body,'Unrelated change retained');
console.log(JSON.stringify({exactBaselineRestored:true,restoredTopics:2,mixedForeignAndForgedRefused:true,unrelatedChangePreserved:true,productionUnchanged:true}));
