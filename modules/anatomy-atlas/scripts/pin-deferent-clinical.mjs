import assert from 'node:assert/strict';
import {access,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {build} from './workspace-test-build.mjs';

const built=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog'; export {bodyLesson} from './app/body-content'; export {structures} from './app/anatomy-data'; export {contentTabs} from './lib/content-types'; export {dissectionProfiles} from './app/dissection-data';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const raw=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json')),catalog=api.bodyDisplayCatalog(raw);
const targets=new Map([['FMA19236','left'],['FMA19235','right']]);
const topics=['clinical','pathology'];
const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const entries=catalog.structures.flatMap(identity=>targets.has(identity.fmaId)?[{identity,side:targets.get(identity.fmaId),topics}]:[]);
assert.equal(entries.length,2);
assert.deepEqual(entries.map(e=>e.identity.fmaId).sort(),[...targets.keys()].sort());
for(const e of entries){assert.equal(e.identity.system,'organs');assert.equal(e.identity.category,'organ');assert.equal(e.identity.laterality,e.side);assert.deepEqual(e.identity.regions,['pelvis']);}
const bundles=catalog.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));
assert.equal(bundles.length,1);
for(const b of bundles)assert.equal(createHash('sha256').update(await readFile('public'+b.url.split('?')[0])).digest('hex'),b.sha256);
const path='content/deferent-clinical-pins.json',sourceCommit='62f15bb1c1e20b0cb0bfad1e8484893f577240cb';
const base={sourceCommit,sourceVersion:catalog.sourceVersion,license:catalog.license,coordinateSystem:catalog.coordinateSystem,bundles};
if(process.argv.includes('--check')){
  const saved=JSON.parse(await readFile(path));assert.deepEqual(saved.entries.map(({previous,anatomy,...entry})=>entry),entries);
  for(const key of Object.keys(base))assert.deepEqual(saved[key],base[key]);
  for(const entry of saved.entries)assert.deepEqual(entry.anatomy,api.bodyLesson(entry.identity,'anatomy'));
}else{
  assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceCommit);await assert.rejects(access(path));
  const previousAllLessonsAndRecipesHash=sha({body:catalog.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});
  await writeFile(path,JSON.stringify({...base,previousAllLessonsAndRecipesHash,entries:entries.map(entry=>({...entry,anatomy:api.bodyLesson(entry.identity,'anatomy'),previous:Object.fromEntries(entry.topics.map(topic=>{const lesson=api.bodyLesson(entry.identity,topic);assert.equal(lesson.readiness,'pending');return[topic,lesson];}))}))},null,2)+'\n',{flag:'wx'});
}
console.log(JSON.stringify({selections:entries.length,placements:entries.length*topics.length,bundles:bundles.length}));
