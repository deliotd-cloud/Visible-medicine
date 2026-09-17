import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {context,hash,snapshot} from './pin-pica-clinical.mjs';
import {lowerVenousSelections} from '../content/lower-venous-imaging.ts';
const {api,display}=await context({current:true}),checking=process.argv.includes('--check');
const files={FMA21188:['FJ2144'],FMA21189:['FJ2102'],FMA21379:['FJ2145'],FMA21380:['FJ2103'],FMA44328:['FJ2171'],FMA44329:['FJ2117'],FMA44334:['FJ2176'],FMA44335:['FJ2121'],FMA44336:['FJ2132','FJ2193'],FMA44337:['FJ2097','FJ2183'],FMA44338:['FJ2173'],FMA44339:['FJ2118'],FMA51042:['FJ2135'],FMA51043:['FJ2099']};
const entries=lowerVenousSelections.flatMap(spec=>spec.fmas.map((fma,i)=>{
 const matches=display.structures.filter(s=>s.fmaId===fma);assert.equal(matches.length,1);const identity=matches[0];
 assert.equal(identity.laterality,i===0?'right':'left');assert.equal(identity.sourceTree,'isa');assert.equal(identity.system,'vessels');assert.equal(identity.category,'vessel');assert.deepEqual(identity.sources.map(s=>s.file),files[fma]);
 const topics=['ct','mri','ultrasound'];return {identity,group:spec.group,topics,previous:Object.fromEntries(topics.map(t=>{const lesson=api.bodyLesson(identity,t);if(!checking)assert.equal(lesson.readiness,'pending');return[t,lesson];}))};
}));
assert.equal(entries.length,14);assert.equal(new Set(entries.map(e=>e.identity.id)).size,14);
const bundles=display.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));assert.equal(bundles.length,3);
for(const b of bundles){const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
const base={sourceCommit:'2abd41c1c79108f20db703aabfa13f23a99a5655',sourceVersion:display.sourceVersion,license:display.license,coordinateSystem:display.coordinateSystem,bundles},file='content/lower-venous-imaging-pins.json';
if(checking){const saved=JSON.parse(await readFile(file));for(const key of Object.keys(base))assert.deepEqual(saved[key],base[key]);assert.deepEqual(saved.entries.map(({previous,...e})=>e),entries.map(({previous,...e})=>e));for(const e of saved.entries)for(const t of e.topics)assert.equal(e.previous[t].readiness,'pending');console.log(JSON.stringify({checked:true,pinsHash:hash(saved)}));}
else{assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),base.sourceCommit);await assert.rejects(access(file));const pins={...base,previousAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries};await writeFile(file,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({selections:14,placements:42,pinsHash:hash(pins),beforeHash:pins.previousAllLessonsAndRecipesHash}));}
