import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {contentContext} from './content-contract-tools.mjs';
import {chestWallMuscleImagingGroups as groups,chestWallMuscleImagingModes as modes} from '../content/chest-wall-muscle-imaging.ts';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const {api,catalog:raw}=await contentContext(),catalog=api.bodyDisplayCatalog(raw);
const entries=catalog.structures.flatMap(identity=>{const group=Object.entries(groups).find(([,g])=>g.fmaIds.includes(identity.fmaId))?.[0];return group?[{identity,group,topics:Object.keys(modes)}]:[];});
assert.equal(entries.length,12);assert.equal(new Set(entries.map(e=>e.identity.fmaId)).size,12);
assert(entries.every(e=>e.identity.system==='muscles'&&e.identity.category==='muscle'&&['thorax','abdomen'].includes(e.identity.region)));
const bundles=catalog.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));
for(const b of bundles)assert.equal(createHash('sha256').update(await readFile('public'+b.url.split('?')[0])).digest('hex'),b.sha256);
const path='content/chest-wall-muscle-imaging-pins.json',sourceCommit='83bb1b6cd8bdb3f6b72ed9f8f6d98ee782e52fde';
const base={sourceCommit,sourceVersion:catalog.sourceVersion,license:catalog.license,coordinateSystem:catalog.coordinateSystem,bundles,entries};
if(process.argv.includes('--check')){
 const saved=JSON.parse(await readFile(path));assert.deepEqual(saved.entries.map(({previous,...e})=>e),entries);
 for(const k of ['sourceCommit','sourceVersion','license','coordinateSystem','bundles'])assert.deepEqual(saved[k],base[k]);
}else{
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceCommit);
 await assert.rejects(access(path),'Never overwrite pins');
 const previousAllLessonsAndRecipesHash=hash({body:catalog.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});
 await writeFile(path,JSON.stringify({...base,previousAllLessonsAndRecipesHash,entries:entries.map(e=>({...e,previous:Object.fromEntries(e.topics.map(t=>{const l=api.bodyLesson(e.identity,t);assert.equal(l.readiness,'pending');return[t,l];}))}))},null,2)+'\n',{flag:'wx'});
}
console.log(JSON.stringify({selections:entries.length,placements:48,bundles:bundles.length}));
