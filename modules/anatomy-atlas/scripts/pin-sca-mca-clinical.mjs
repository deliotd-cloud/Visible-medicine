import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {context,hash,snapshot} from './pin-pica-clinical.mjs';
export {context,hash,snapshot};
if(process.argv[1]?.replaceAll('\\','/').endsWith('/pin-sca-mca-clinical.mjs')){
 const {api,display}=await context(),checking=process.argv.includes('--check');
 const specifications=[['FMA50574','right','sca','isa',['FJ1726']],['FMA50575','left','sca','isa',['FJ1726M']],['FMA50082','right','mca','partof',['FJ1662','FJ1663','FJ1692']]];
 const entries=specifications.map(([fma,side,family,tree,files])=>{
  const matches=display.structures.filter(s=>s.fmaId===fma);assert.equal(matches.length,1);const identity=matches[0];
  assert.equal(identity.bundle,'cranial-arteries');assert.equal(identity.laterality,side);assert.equal(identity.system,'vessels');assert.equal(identity.category,'vessel');assert.deepEqual(identity.regions,['head-neck']);assert.equal(identity.sourceTree,tree);assert.deepEqual(identity.sources.map(s=>s.file),files);
  const topics=['clinical','pathology'];return {identity,family,topics,previous:Object.fromEntries(topics.map(t=>{const lesson=api.bodyLesson(identity,t);if(!checking)assert.equal(lesson.readiness,'pending');return[t,lesson];}))};
 });
 const bundles=display.bundles.filter(b=>b.id==='cranial-arteries');assert.equal(bundles.length,1);
 for(const bundle of bundles){const b=await readFile('public'+bundle.url.split('?')[0]);assert.equal(b.length,bundle.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),bundle.sha256);}
 const base={sourceCommit:'2793f3f58e7feac113cfbfe482456b571e4e58b8',sourceVersion:display.sourceVersion,license:display.license,coordinateSystem:display.coordinateSystem,bundles},file='content/sca-mca-clinical-pins.json';
 if(checking){const saved=JSON.parse(await readFile(file));for(const key of Object.keys(base))assert.deepEqual(saved[key],base[key]);assert.deepEqual(saved.entries.map(({previous,...e})=>e),entries.map(({previous,...e})=>e));for(const e of saved.entries)for(const t of e.topics)assert.equal(e.previous[t].readiness,'pending');console.log(JSON.stringify({checked:true,pinsHash:hash(saved)}));}
 else{assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),base.sourceCommit);await assert.rejects(access(file));const pins={...base,previousAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries};await writeFile(file,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({selections:entries.length,pinsHash:hash(pins),beforeHash:pins.previousAllLessonsAndRecipesHash}));}
}
