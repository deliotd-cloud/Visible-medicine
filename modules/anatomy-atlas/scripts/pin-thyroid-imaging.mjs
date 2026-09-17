import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {context,hash,snapshot} from './pin-pica-clinical.mjs';
export {context,hash,snapshot};
if(process.argv[1]?.replaceAll('\\','/').endsWith('/pin-thyroid-imaging.mjs')){
 const {api,display}=await context(),checking=process.argv.includes('--check');
 const entries=[['FMA10697','right','FJ2209'],['FMA10680','left','FJ2210']].map(([fma,side,file])=>{
  const matches=display.structures.filter(s=>s.fmaId===fma);assert.equal(matches.length,1);const identity=matches[0];
  assert.equal(identity.bundle,'inferior-thyroid-arteries');assert.equal(identity.laterality,side);assert.equal(identity.system,'vessels');assert.equal(identity.category,'vessel');assert.deepEqual(identity.regions,['head-neck','shoulder-arm','thorax']);assert.equal(identity.sourceTree,'isa');assert.deepEqual(identity.sources.map(s=>s.file),[file]);
  const topics=['ct','ultrasound'];return {identity,topics,previous:Object.fromEntries(topics.map(t=>{const lesson=api.bodyLesson(identity,t);if(!checking)assert.equal(lesson.readiness,'pending');return[t,lesson];}))};
 });
 const bundles=display.bundles.filter(b=>b.id==='inferior-thyroid-arteries');assert.equal(bundles.length,1);
 for(const b of bundles){const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
 const base={sourceCommit:'548656bfd321605db7e82fd8f431c19b7489307b',sourceVersion:display.sourceVersion,license:display.license,coordinateSystem:display.coordinateSystem,bundles},file='content/thyroid-imaging-pins.json';
 if(checking){const saved=JSON.parse(await readFile(file));for(const key of Object.keys(base))assert.deepEqual(saved[key],base[key]);assert.deepEqual(saved.entries.map(({previous,...e})=>e),entries.map(({previous,...e})=>e));for(const e of saved.entries)for(const t of e.topics)assert.equal(e.previous[t].readiness,'pending');console.log(JSON.stringify({checked:true,pinsHash:hash(saved)}));}
 else{assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),base.sourceCommit);await assert.rejects(access(file));const pins={...base,previousAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries};await writeFile(file,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({selections:entries.length,pinsHash:hash(pins),beforeHash:pins.previousAllLessonsAndRecipesHash}));}
}
