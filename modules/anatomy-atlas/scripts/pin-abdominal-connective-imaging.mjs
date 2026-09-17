import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {context,hash,snapshot} from './pin-pica-clinical.mjs';
import {abdominalConnectiveSelections} from '../content/abdominal-connective-imaging.ts';
const {api,display}=await context({current:true}),checking=process.argv.includes('--check');
const files={FMA11336:['FJ1448'],FMA14643:['FJ3396'],FMA14647:['FJ3398']};
const entries=abdominalConnectiveSelections.flatMap(spec=>spec.fmas.map((fma,i)=>{
 const matches=display.structures.filter(s=>s.fmaId===fma);assert.equal(matches.length,1);const identity=matches[0];
 assert.equal(identity.laterality,'midline');assert.equal(identity.sourceTree,'isa');assert.equal(identity.system,'connective');assert.equal(identity.category,spec.group==='linea-alba'?'fascia':'membrane');assert.deepEqual(identity.sources.map(s=>s.file),files[fma]);
 const topics=spec.topics;return {identity,group:spec.group,topics,previous:Object.fromEntries(topics.map(t=>{const lesson=api.bodyLesson(identity,t);if(!checking)assert.equal(lesson.readiness,'pending');return[t,lesson];}))};
}));
assert.equal(entries.length,3);assert.equal(new Set(entries.map(e=>e.identity.id)).size,3);
const bundles=display.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));assert.equal(bundles.length,2);
for(const b of bundles){const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
const base={sourceCommit:'23746f4c4a8648048ce28123520b9ef09059a1c2',sourceVersion:display.sourceVersion,license:display.license,coordinateSystem:display.coordinateSystem,bundles},file='content/abdominal-connective-imaging-pins.json';
if(checking){const saved=JSON.parse(await readFile(file));for(const key of Object.keys(base))assert.deepEqual(saved[key],base[key]);assert.deepEqual(saved.entries.map(({previous,...e})=>e),entries.map(({previous,...e})=>e));for(const e of saved.entries)for(const t of e.topics)assert.equal(e.previous[t].readiness,'pending');console.log(JSON.stringify({checked:true,pinsHash:hash(saved)}));}
else{assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),base.sourceCommit);await assert.rejects(access(file));const pins={...base,previousAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries};await writeFile(file,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({selections:3,placements:4,pinsHash:hash(pins),beforeHash:pins.previousAllLessonsAndRecipesHash}));}
