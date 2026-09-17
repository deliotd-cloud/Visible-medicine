import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {isDeepStrictEqual} from 'node:util';
import {execFileSync} from 'node:child_process';
import {context,hash,snapshot} from './pin-pica-clinical.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {unreconciledLowerArterialHistory} from './lower-arterial-imaging-history.mjs';
import pins from '../content/lower-arterial-imaging-pins.json' with {type:'json'};
const c=await context({current:true}),old=await exactSourceHistoryApi(pins.sourceCommit);
const original=old.bodyDisplayCatalog(c.catalog),expected=snapshot(old,original);
assert.equal(hash(expected),pins.previousAllLessonsAndRecipesHash,'Original source replay must prove the existing fixture');
const reconstructed=unreconciledLowerArterialHistory({api:c.api,catalog:c.display}),display=reconstructed.bodyDisplayCatalog(c.catalog),actual=snapshot(reconstructed,display);
assert.deepEqual(actual.shoulder,expected.shoulder);assert.deepEqual(actual.recipes,expected.recipes);
const originals=new Map(original.structures.map(s=>[s.id,s]));
for(const s of original.structures)assert.deepEqual(display.structures.find(x=>x.id===s.id),s,'Earlier source record changed');
const removedStructures=display.structures.filter(s=>!originals.has(s.id)).map(s=>s.id),removedBundles=display.bundles.filter(b=>!original.bundles.some(o=>o.id===b.id)).map(b=>b.id);
const restored={...display,structures:display.structures.filter(s=>!removedStructures.includes(s.id)),bundles:display.bundles.filter(b=>!removedBundles.includes(b.id))};assert.deepEqual(restored,original);
const changes=[];
for(const s of original.structures)for(const tab of c.api.contentTabs){const previous=old.bodyLesson(s,tab),current=reconstructed.bodyLesson(s,tab);if(!isDeepStrictEqual(previous,current))changes.push({identity:s,tab,previous,current});}
assert.equal(removedStructures.length,24);assert(changes.length>0);
const record={schemaVersion:1,purpose:'Offline historical reconstruction only; no runtime, geometry or approval migration',originalCommit:pins.sourceCommit,recordedAtSource:'9182953ac5e8ad37c2ab253db44279d8b26edf4d',originalCatalogHash:hash(original),reconstructedCatalogHash:hash(display),originalSnapshotHash:hash(expected),reconstructedSnapshotHash:hash(actual),removedStructures,removedBundles,changes};
const path='content/lower-arterial-source-history.json';
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(await readFile(path)),record);
else {assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),record.recordedAtSource);await writeFile(path,JSON.stringify(record,null,2)+'\n',{flag:'wx'});}
console.log(JSON.stringify({recordHash:hash(record),removedStructures:removedStructures.length,removedBundles:removedBundles.length,restoredLessons:changes.length,originalSnapshotHash:hash(expected),reconstructedSnapshotHash:hash(actual)}));
