import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {context,hash,snapshot} from './pin-pica-clinical.mjs';
export {context,hash,snapshot};
if(process.argv[1]?.replaceAll('\\','/').endsWith('/pin-regional-vascular-clinical.mjs')){
 const {api,display}=await context(),checking=process.argv.includes('--check');
 const specifications=[['FMA22678','right','subscapular','subscapular-arteries','FJ2298',['shoulder-arm','thorax']],['FMA22679','left','subscapular','subscapular-arteries','FJ2246',['shoulder-arm','thorax']],['FMA21422','right','circumflex','circumflex-femoral','FJ2057',['thigh','leg']],['FMA21423','left','circumflex','circumflex-femoral','FJ2063',['thigh','leg']],['FMA20689','left','epigastric','inferior-epigastric-vessels','FJ3511',['abdomen','pelvis']],['FMA20688','right','epigastric','inferior-epigastric-vessels','FJ3604',['abdomen','pelvis']]];
 const entries=specifications.map(([fma,side,family,bundle,file,regions])=>{
  const matches=display.structures.filter(s=>s.fmaId===fma);assert.equal(matches.length,1);const identity=matches[0];
  assert.equal(identity.bundle,bundle);assert.equal(identity.laterality,side);assert.equal(identity.system,'vessels');assert.equal(identity.category,'vessel');assert.deepEqual(identity.regions,regions);assert.equal(identity.sourceTree,'isa');assert.deepEqual(identity.sources.map(s=>s.file),[file]);
  const topics=family==='epigastric'?['pathology']:['clinical','pathology'];return {identity,family,topics,previous:Object.fromEntries(topics.map(t=>{const lesson=api.bodyLesson(identity,t);if(!checking)assert.equal(lesson.readiness,'pending');return[t,lesson];}))};
 });
 const bundles=display.bundles.filter(b=>['subscapular-arteries','circumflex-femoral','inferior-epigastric-vessels'].includes(b.id));assert.equal(bundles.length,3);
 for(const bundle of bundles){const b=await readFile('public'+bundle.url.split('?')[0]);assert.equal(b.length,bundle.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),bundle.sha256);}
 const base={sourceCommit:'bcefde5f13ff5a6394d8a3dd557aaa94316d98d5',sourceVersion:display.sourceVersion,license:display.license,coordinateSystem:display.coordinateSystem,bundles},file='content/regional-vascular-clinical-pins.json';
 if(checking){const saved=JSON.parse(await readFile(file));for(const key of Object.keys(base))assert.deepEqual(saved[key],base[key]);assert.deepEqual(saved.entries.map(({previous,...e})=>e),entries.map(({previous,...e})=>e));for(const e of saved.entries)for(const t of e.topics)assert.equal(e.previous[t].readiness,'pending');console.log(JSON.stringify({checked:true,pinsHash:hash(saved)}));}
 else{assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),base.sourceCommit);await assert.rejects(access(file));const pins={...base,previousAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries};await writeFile(file,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({selections:entries.length,pinsHash:hash(pins),beforeHash:pins.previousAllLessonsAndRecipesHash}));}
}
