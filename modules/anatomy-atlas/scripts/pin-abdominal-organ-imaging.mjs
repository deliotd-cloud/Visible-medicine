import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {abdominalOrganImagingGroups,abdominalOrganImagingTopics} from '../content/abdominal-organ-imaging.ts';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const {api,catalog:raw}=await contentContext(),catalog=api.bodyDisplayCatalog(raw);
const requested=Object.values(abdominalOrganImagingGroups).flat();
assert.equal(requested.length,8);assert.equal(new Set(requested).size,8);
const entries=catalog.structures.flatMap(identity=>{
  const group=Object.entries(abdominalOrganImagingGroups).find(([,ids])=>ids.includes(identity.fmaId))?.[0];
  return group?[{identity,group,topics:Object.keys(abdominalOrganImagingTopics[group])}]:[];
});
assert.equal(entries.length,8);assert(entries.every(e=>e.identity.system==='organs'&&e.identity.regions.includes('abdomen')));
const bundles=catalog.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));
for(const b of bundles)assert.equal(createHash('sha256').update(await readFile('public'+b.url.split('?')[0])).digest('hex'),b.sha256);
const path='content/abdominal-organ-imaging-pins.json';
const base={sourceCommit:'fb1566736ab1169da48bc7bff3dc4d0bb228dc2a',sourceVersion:catalog.sourceVersion,coordinateSystem:catalog.coordinateSystem,bundles,entries};
if(process.argv.includes('--check')) {
  const p=JSON.parse(await readFile(path));
  assert.deepEqual(p.entries.map(({previous,...e})=>e),entries);
  for(const key of ['sourceCommit','sourceVersion','coordinateSystem','bundles'])assert.deepEqual(p[key],base[key]);
} else {
  await assert.rejects(access(path),'Never overwrite the source admission');
  const previousAllLessonsAndRecipesHash=hash({body:catalog.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});
  const record={...base,previousAllLessonsAndRecipesHash,entries:entries.map(e=>({...e,previous:Object.fromEntries(e.topics.map(t=>{const v=api.bodyLesson(e.identity,t);assert.equal(v.readiness,'pending');return[t,v];}))}))};
  await writeFile(path,JSON.stringify(record,null,2)+'\n',{flag:'wx'});
}
console.log(JSON.stringify({selections:entries.length,placements:32,bundles:bundles.length}));
