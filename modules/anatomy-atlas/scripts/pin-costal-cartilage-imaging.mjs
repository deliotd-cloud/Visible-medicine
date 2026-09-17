import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {context,hash,snapshot} from './pin-pica-clinical.mjs';
export {context,hash,snapshot};
if(process.argv[1]?.replaceAll('\\','/').endsWith('/pin-costal-cartilage-imaging.mjs')){
 const {api,display}=await context(),checking=process.argv.includes('--check');
 const targets=[['FMA7875','right','FJ3333'],['FMA8005','left','FJ3239'],['FMA7886','right','FJ3335'],['FMA8031','left','FJ3242'],['FMA7913','right','FJ3337'],['FMA8058','left','FJ3245'],['FMA7976','right','FJ3339'],['FMA8167','left','FJ3248'],['FMA8070','right','FJ3341'],['FMA8112','left','FJ3251'],['FMA8194','right','FJ3343'],['FMA8221','left','FJ3254'],['FMA8248','right','FJ3345'],['FMA8275','left','FJ3255']];
 const entries=targets.map(([fma,side,file])=>{
  const matches=display.structures.filter(s=>s.fmaId===fma);assert.equal(matches.length,1);const identity=matches[0];
  assert.equal(identity.bundle,'thorax-connective-recovery');assert.equal(identity.laterality,side);assert.equal(identity.system,'connective');assert.deepEqual(identity.regions,['thorax']);assert.equal(identity.sourceTree,'isa');assert.deepEqual(identity.sources.map(s=>s.file),[file]);
  const topics=['ct','mri','ultrasound','xray'];return {identity,topics,previous:Object.fromEntries(topics.map(t=>{const lesson=api.bodyLesson(identity,t);if(!checking)assert.equal(lesson.readiness,'pending');return[t,lesson];}))};
 });
 const bundles=display.bundles.filter(b=>b.id==='thorax-connective-recovery');assert.equal(bundles.length,1);
 for(const b of bundles){const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
 const base={sourceCommit:'8e26f15e2664d3b3aaa2cbff33d2ee28f2d113a0',sourceVersion:display.sourceVersion,license:display.license,coordinateSystem:display.coordinateSystem,bundles},file='content/costal-cartilage-imaging-pins.json';
 if(checking){const saved=JSON.parse(await readFile(file));for(const key of Object.keys(base))assert.deepEqual(saved[key],base[key]);assert.deepEqual(saved.entries.map(({previous,...e})=>e),entries.map(({previous,...e})=>e));for(const e of saved.entries)for(const t of e.topics)assert.equal(e.previous[t].readiness,'pending');console.log(JSON.stringify({checked:true,pinsHash:hash(saved)}));}
 else{assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),base.sourceCommit);await assert.rejects(access(file));const pins={...base,previousAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries};await writeFile(file,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({selections:entries.length,pinsHash:hash(pins),beforeHash:pins.previousAllLessonsAndRecipesHash}));}
}
