import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { contentContext } from './content-contract-tools.mjs';
import { footMuscleImagingGroups, footMuscleImagingModes } from '../content/foot-muscle-imaging.ts';
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const {api,catalog:raw}=await contentContext(),catalog=api.bodyDisplayCatalog(raw);
const entries=catalog.structures.flatMap(identity=>{
  const group=Object.entries(footMuscleImagingGroups).find(([,g])=>g.fmaIds.includes(identity.fmaId))?.[0];
  return group?[{identity,group,topics:Object.keys(footMuscleImagingModes)}]:[];
});
assert.equal(entries.length,36);
assert.equal(new Set(entries.map(e=>e.identity.fmaId)).size,36);
assert(entries.every(e=>e.identity.system==='muscles'&&e.identity.regions.includes('foot')));
const bundles=catalog.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));
for(const b of bundles) assert.equal(createHash('sha256').update(await readFile('public'+b.url.split('?')[0])).digest('hex'),b.sha256);
const path='content/foot-muscle-imaging-pins.json';
const base={sourceCommit:'441ce856955f71b145420330fff3e37649d7ad4e',sourceVersion:catalog.sourceVersion,license:catalog.license,coordinateSystem:catalog.coordinateSystem,bundles,entries};
if(process.argv.includes('--check')) {
  const saved=JSON.parse(await readFile(path));
  assert.deepEqual(saved.entries.map(({previous,...e})=>e),entries);
  for(const key of ['sourceCommit','sourceVersion','license','coordinateSystem','bundles'])assert.deepEqual(saved[key],base[key]);
}else{
  await assert.rejects(access(path),'Never overwrite source pins');
  const previousAllLessonsAndRecipesHash=hash({body:catalog.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});
  await writeFile(path,JSON.stringify({...base,previousAllLessonsAndRecipesHash,entries:entries.map(e=>({...e,previous:Object.fromEntries(e.topics.map(t=>{const lesson=api.bodyLesson(e.identity,t);assert.equal(lesson.readiness,'pending');return[t,lesson];}))}))},null,2)+'\n',{flag:'wx'});
}
console.log(JSON.stringify({selections:entries.length,placements:144,bundles:bundles.length}));
