import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {context,hash,snapshot} from './pin-pica-clinical.mjs';
import {tractPlantarSelections} from '../content/tract-plantar-imaging.ts';
const {api,display}=await context({current:true}),checking=process.argv.includes('--check');
const files={FMA58776:['FJ1423'],FMA58777:['FJ1423M'],FMA44249:['FJ1424'],FMA44250:['FJ1424M']};
const entries=tractPlantarSelections.flatMap(spec=>spec.fmas.map((fma,i)=>{
 const matches=display.structures.filter(s=>s.fmaId===fma);assert.equal(matches.length,1);const identity=matches[0];
 assert.equal(identity.laterality,i===0?'right':'left');assert.equal(identity.sourceTree,'isa');assert.equal(identity.system,'connective');assert.equal(identity.category,spec.group==='iliotibial'?'fascia':'ligament');assert.deepEqual(identity.sources.map(s=>s.file),files[fma]);
 const topics=spec.topics;return {identity,group:spec.group,topics,previous:Object.fromEntries(topics.map(t=>{const lesson=api.bodyLesson(identity,t);if(!checking)assert.equal(lesson.readiness,'pending');return[t,lesson];}))};
}));
assert.equal(entries.length,4);assert.equal(new Set(entries.map(e=>e.identity.id)).size,4);
const bundles=display.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));assert.equal(bundles.length,2);
for(const b of bundles){const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
const base={sourceCommit:'db16e7d92fd1a123dac748ba3ee82adb34aa0a27',sourceVersion:display.sourceVersion,license:display.license,coordinateSystem:display.coordinateSystem,bundles},file='content/tract-plantar-imaging-pins.json';
if(checking){const saved=JSON.parse(await readFile(file));for(const key of Object.keys(base))assert.deepEqual(saved[key],base[key]);assert.deepEqual(saved.entries.map(({previous,...e})=>e),entries.map(({previous,...e})=>e));for(const e of saved.entries)for(const t of e.topics)assert.equal(e.previous[t].readiness,'pending');console.log(JSON.stringify({checked:true,pinsHash:hash(saved)}));}
else{assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),base.sourceCommit);await assert.rejects(access(file));const pins={...base,previousAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries};await writeFile(file,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({selections:4,placements:6,pinsHash:hash(pins),beforeHash:pins.previousAllLessonsAndRecipesHash}));}
