import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {context,hash,snapshot} from './pin-pica-clinical.mjs';
export {context,hash,snapshot};
if(process.argv[1]?.replaceAll('\\','/').endsWith('/pin-upper-venous-clinical.mjs')){
 const {api,display}=await context(),checking=process.argv.includes('--check');
 const specifications=[['FMA22935','right','brachial','brachial-veins','FJ2341'],['FMA22936','left','brachial','brachial-veins','FJ2313'],['FMA22964','right','cubital','cubital-veins','FJ2287'],['FMA22965','left','cubital','cubital-veins','FJ2235'],['FMA22968','right','antebrachial','cubital-veins','FJ2286'],['FMA22969','left','antebrachial','cubital-veins','FJ2234']];
 const entries=specifications.map(([fma,side,family,bundle,file])=>{
  const matches=display.structures.filter(s=>s.fmaId===fma);assert.equal(matches.length,1);const identity=matches[0];
  assert.equal(identity.bundle,bundle);assert.equal(identity.laterality,side);assert.equal(identity.system,'vessels');assert.equal(identity.category,'vessel');assert.deepEqual(identity.regions,['shoulder-arm','forearm']);assert.equal(identity.sourceTree,'isa');assert.deepEqual(identity.sources.map(s=>s.file),[file]);
  const topics=['clinical','pathology'];return {identity,family,topics,previous:Object.fromEntries(topics.map(t=>{const lesson=api.bodyLesson(identity,t);if(!checking)assert.equal(lesson.readiness,'pending');return[t,lesson];}))};
 });
 const bundles=display.bundles.filter(b=>['brachial-veins','cubital-veins'].includes(b.id));assert.equal(bundles.length,2);
 for(const bundle of bundles){const b=await readFile('public'+bundle.url.split('?')[0]);assert.equal(b.length,bundle.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),bundle.sha256);}
 const base={sourceCommit:'46fbcf88ffdd8d9d9846043754e1b7758be498e1',sourceVersion:display.sourceVersion,license:display.license,coordinateSystem:display.coordinateSystem,bundles},file='content/upper-venous-clinical-pins.json';
 if(checking){const saved=JSON.parse(await readFile(file));for(const key of Object.keys(base))assert.deepEqual(saved[key],base[key]);assert.deepEqual(saved.entries.map(({previous,...e})=>e),entries.map(({previous,...e})=>e));for(const e of saved.entries)for(const t of e.topics)assert.equal(e.previous[t].readiness,'pending');console.log(JSON.stringify({checked:true,pinsHash:hash(saved)}));}
 else{assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),base.sourceCommit);await assert.rejects(access(file));const pins={...base,previousAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries};await writeFile(file,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({selections:entries.length,pinsHash:hash(pins),beforeHash:pins.previousAllLessonsAndRecipesHash}));}
}
