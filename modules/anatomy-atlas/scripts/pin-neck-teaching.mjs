import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {context,hash,snapshot} from './pin-pica-clinical.mjs';
export {context,hash,snapshot};
if(process.argv[1]?.replaceAll('\\','/').endsWith('/pin-neck-teaching.mjs')){
 const {api,display}=await context(),checking=process.argv.includes('--check');
 const specifications=[['FMA46284','left','superior','longus-colli','FJ1600',['head-neck','spine']],['FMA46286','left','vertical','longus-colli','FJ1601',['head-neck','spine']],['FMA46288','left','inferior','longus-colli','FJ1557',['head-neck','spine']],['FMA10697','right','thyroid','inferior-thyroid-arteries','FJ2209',['head-neck','shoulder-arm','thorax']],['FMA10680','left','thyroid','inferior-thyroid-arteries','FJ2210',['head-neck','shoulder-arm','thorax']]];
 const entries=specifications.map(([fma,side,family,bundle,file,regions])=>{
  const matches=display.structures.filter(s=>s.fmaId===fma);assert.equal(matches.length,1);const identity=matches[0];
  assert.equal(identity.bundle,bundle);assert.equal(identity.laterality,side);assert.equal(identity.system,family==='thyroid'?'vessels':'muscles');assert.equal(identity.category,family==='thyroid'?'vessel':'muscle');assert.deepEqual(identity.regions,regions);assert.equal(identity.sourceTree,'isa');assert.deepEqual(identity.sources.map(s=>s.file),[file]);
  const topics=family==='thyroid'?['clinical','pathology']:['clinical','pathology','ct','mri'];return {identity,family,topics,previous:Object.fromEntries(topics.map(t=>{const lesson=api.bodyLesson(identity,t);if(!checking)assert.equal(lesson.readiness,'pending');return[t,lesson];}))};
 });
 const bundles=display.bundles.filter(b=>['longus-colli','inferior-thyroid-arteries'].includes(b.id));assert.equal(bundles.length,2);
 for(const bundle of bundles){const b=await readFile('public'+bundle.url.split('?')[0]);assert.equal(b.length,bundle.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),bundle.sha256);}
 const base={sourceCommit:'751aae4183306c1465b04c4547aaf6b7d0a76854',sourceVersion:display.sourceVersion,license:display.license,coordinateSystem:display.coordinateSystem,bundles},file='content/neck-teaching-pins.json';
 if(checking){const saved=JSON.parse(await readFile(file));for(const key of Object.keys(base))assert.deepEqual(saved[key],base[key]);assert.deepEqual(saved.entries.map(({previous,...e})=>e),entries.map(({previous,...e})=>e));for(const e of saved.entries)for(const t of e.topics)assert.equal(e.previous[t].readiness,'pending');console.log(JSON.stringify({checked:true,pinsHash:hash(saved)}));}
 else{assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),base.sourceCommit);await assert.rejects(access(file));const pins={...base,previousAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries};await writeFile(file,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({selections:entries.length,pinsHash:hash(pins),beforeHash:pins.previousAllLessonsAndRecipesHash}));}
}
