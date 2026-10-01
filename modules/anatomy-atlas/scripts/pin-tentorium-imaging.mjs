import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

export const parentCommit='d5ebe0712d71f4f352ebac679373f00b8d7d94e1';
export const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export const snapshot=(api,display)=>({body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});

if(process.argv[1]?.replaceAll('\\','/').endsWith('/pin-tentorium-imaging.mjs')){
 const previous=await exactSourceHistoryApi(parentCommit);
 const raw=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
 const display=previous.bodyDisplayCatalog(raw);
 const matches=display.structures.filter(s=>s.fmaId==='FMA83966');assert.equal(matches.length,1);
 const identity=matches[0];
 assert.equal(identity.id,'vm:anatomy:body:head-neck:right:connective:tentorium-source-portion');
 assert.equal(identity.bundle,'tentorium-partial');assert.equal(identity.system,'connective');
 assert.equal(identity.region,'head-neck');assert.equal(identity.laterality,'right');
 assert.equal(identity.representation.coverage,'partial');
 assert.equal(identity.sources.length,1);assert.equal(identity.sources[0].file,'FJ1843');
 const topics=['ct','mri'];
 const prior=Object.fromEntries(topics.map(t=>{const lesson=previous.bodyLesson(identity,t);assert.equal(lesson.readiness,'pending');return[t,lesson];}));
 const entries=[{identity,topics,previous:prior}];
 const bundles=display.bundles.filter(b=>b.id===identity.bundle);assert.equal(bundles.length,1);
 for(const bundle of bundles){const bytes=await readFile('public'+bundle.url.split('?')[0]);assert.equal(bytes.length,bundle.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);}
 const pins={parentCommit,sourceVersion:display.sourceVersion,license:display.license,coordinateSystem:display.coordinateSystem,bundles,previousAllLessonsAndRecipesHash:hash(snapshot(previous,display)),entries};
 const path='content/tentorium-imaging-pins.json';
 if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(await readFile(path)),pins);
 else await writeFile(path,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({targets:entries.length,topics:2,pinsHash:hash(pins)}));
}
