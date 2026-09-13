import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {build} from './workspace-test-build.mjs';
import {contentContext} from './content-contract-tools.mjs';
const compiled=await build({stdin:{contents:"export * from './content/orbital-neck-muscle-imaging.ts';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {orbitalNeckMuscleImagingGroups:groups,orbitalNeckMuscleImagingModes:modes}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const {api,catalog:raw}=await contentContext(),catalog=api.bodyDisplayCatalog(raw);
const entries=catalog.structures.flatMap(identity=>{const group=Object.entries(groups).find(([,g])=>g.fmaIds.includes(identity.fmaId))?.[0];return group?[{identity,group,topics:Object.keys(groups[group].focus)}]:[];});
assert.equal(entries.length,42);assert(entries.every(e=>e.identity.system==='muscles'&&e.identity.category==='muscle'&&e.identity.regions.includes('head-neck')));
assert.equal(Object.keys(groups).length,21);assert(Object.values(groups).every(g=>Object.keys(g.focus).length===(g.family==='orbital'?2:3)));
for(const e of entries){const ids=groups[e.group].fmaIds;assert.equal(e.identity.laterality,ids.length===1?'midline':ids.indexOf(e.identity.fmaId)===0?'left':'right');}
const bundles=catalog.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));
for(const b of bundles)assert.equal(createHash('sha256').update(await readFile('public'+b.url.split('?')[0])).digest('hex'),b.sha256);
const path='content/orbital-neck-muscle-imaging-pins.json',sourceCommit='d709e70a6678b7846053f39b4e7ebae8efb79f55';
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
console.log(JSON.stringify({selections:entries.length,placements:112,bundles:bundles.length}));
