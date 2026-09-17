import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {context,hash,snapshot} from './pin-pica-clinical.mjs';
export {context,hash,snapshot};
if(process.argv[1]?.replaceAll('\\','/').endsWith('/pin-cranial-boundary-clinical.mjs')){
 const {api,display}=await context(),checking=process.argv.includes('--check');
 const targets=[['FMA83966','right','tentorium-partial','connective','membrane',['FJ1843'],['clinical','pathology']],['FMA61975','midline','limbic-landmarks','nerves','organ',['FJ1764','FJ1812'],['clinical']]];
 const entries=targets.map(([fma,side,bundle,system,category,files,topics])=>{
  const matches=display.structures.filter(s=>s.fmaId===fma);assert.equal(matches.length,1);const identity=matches[0];
  assert.equal(identity.bundle,bundle);assert.equal(identity.laterality,side);assert.equal(identity.system,system);assert.equal(identity.category,category);assert.deepEqual(identity.regions,['head-neck']);assert.equal(identity.sourceTree,'isa');assert.deepEqual(identity.sources.map(s=>s.file),files);
  return {identity,topics,previous:Object.fromEntries(topics.map(t=>{const lesson=api.bodyLesson(identity,t);if(!checking)assert.equal(lesson.readiness,'pending');return[t,lesson];}))};
 });
 const bundles=display.bundles.filter(b=>targets.some(t=>t[2]===b.id));assert.equal(bundles.length,2);
 for(const b of bundles){const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
 const base={sourceCommit:'a8a711c40fe20ebacf880e028354ab4e71cb8651',sourceVersion:display.sourceVersion,license:display.license,coordinateSystem:display.coordinateSystem,bundles},file='content/cranial-boundary-clinical-pins.json';
 if(checking){const saved=JSON.parse(await readFile(file));for(const key of Object.keys(base))assert.deepEqual(saved[key],base[key]);assert.deepEqual(saved.entries.map(({previous,...e})=>e),entries.map(({previous,...e})=>e));for(const e of saved.entries)for(const t of e.topics)assert.equal(e.previous[t].readiness,'pending');console.log(JSON.stringify({checked:true,pinsHash:hash(saved)}));}
 else{assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),base.sourceCommit);await assert.rejects(access(file));const pins={...base,previousAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries};await writeFile(file,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({selections:entries.length,pinsHash:hash(pins),beforeHash:pins.previousAllLessonsAndRecipesHash}));}
}
