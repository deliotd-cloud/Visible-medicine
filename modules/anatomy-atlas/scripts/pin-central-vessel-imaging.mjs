import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {build} from './workspace-test-build.mjs';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const checking=process.argv.includes('--check');
const sourceCommit='6d8c900b4f80843ca7568e4222ffb49d0d22e1f1';
const transitionCommit='270ef68dc7499672549ee3967b485f61eecf3139';
const gitBytes=(commit,path)=>execFileSync('git',['show',commit+':'+path],{windowsHide:true,maxBuffer:16e6});
const context=await contentContext();
// Verify the original 29/79 epoch from its immutable Git tree. Current
// teaching is checked independently below, without unrelated history adapters.
const api=checking?await exactSourceHistoryApi(transitionCommit,'central-vessel-epoch'):context.api;
const raw=checking?JSON.parse(gitBytes(sourceCommit,'public/models/bodyparts3d/full-body/catalog.json')):context.catalog;
let source;
if(!checking){
 const compiled=await build({stdin:{contents:"export * from './content/central-vessel-imaging.ts';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 source=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
}
const groups=checking?api.centralVesselImagingGroups:source.centralVesselImagingGroups;
const catalog=api.bodyDisplayCatalog(raw);
const entries=catalog.structures.flatMap(identity=>{const group=Object.entries(groups).find(([,g])=>g.fmaId===identity.fmaId)?.[0];return group?[{identity,group,topics:Object.keys(groups[group].focus)}]:[];});
assert.equal(entries.length,29);assert.equal(Object.keys(groups).length,29);
for(const e of entries){const g=groups[e.group];assert.equal(e.identity.system,'vessels');assert.equal(e.identity.category,'vessel');assert(e.identity.regions.includes(g.region));assert.equal(e.identity.laterality,g.laterality);}
assert.equal(entries.reduce((n,e)=>n+e.topics.length,0),79);
const bundles=catalog.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));
for(const b of bundles)assert.equal(createHash('sha256').update(await readFile('public'+b.url.split('?')[0])).digest('hex'),b.sha256);
const path='content/central-vessel-imaging-pins.json';
const base={sourceCommit,sourceVersion:catalog.sourceVersion,license:catalog.license,coordinateSystem:catalog.coordinateSystem,bundles};
if(checking){
 const saved=JSON.parse(await readFile(path));assert.deepEqual(saved.entries.map(({previous:_previous,anatomy:_anatomy,...e})=>e),entries);
 for(const k of Object.keys(base))assert.deepEqual(saved[k],base[k]);
 for(const e of saved.entries)assert.deepEqual(e.anatomy,api.bodyLesson(e.identity,'anatomy'));
 const historicalBefore=await exactSourceHistoryApi(sourceCommit);
 assert.deepEqual(historicalBefore.bodyDisplayCatalog(raw),catalog);
 assert.deepEqual(JSON.parse(gitBytes(transitionCommit,'public/models/bodyparts3d/full-body/catalog.json')),raw);
 const current=context.api.bodyDisplayCatalog(context.catalog);
 const celiac=JSON.parse(await readFile('content/celiac-display-transition.json'));
 assert.equal(hash(celiac),'04fe1aeaba2bc1c5960b8bf5637d0f4ec498c49c63dd9997beddd06023c2c08e');
 assert.deepEqual(saved.entries.find(e=>e.identity.id===celiac.original.id)?.identity,celiac.original);
 for(const e of saved.entries){
  const currentIdentity=current.structures.find(s=>s.id===e.identity.id);
  assert.deepEqual(currentIdentity,e.identity.id===celiac.original.id?celiac.replacement:e.identity,'Current central source identity');
 }
 for(const b of saved.bundles)assert.deepEqual(current.bundles.find(candidate=>candidate.id===b.id),b);
}else{
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceCommit);
 await assert.rejects(access(path),'Never overwrite pins');
 const previousAllLessonsAndRecipesHash=hash({body:catalog.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});
 await writeFile(path,JSON.stringify({...base,previousAllLessonsAndRecipesHash,entries:entries.map(e=>({...e,anatomy:api.bodyLesson(e.identity,'anatomy'),previous:Object.fromEntries(e.topics.map(t=>{const l=api.bodyLesson(e.identity,t);assert.equal(l.readiness,'pending');return[t,l];}))}))},null,2)+'\n',{flag:'wx'});
}
console.log(JSON.stringify({selections:entries.length,placements:79,bundles:bundles.length}));
