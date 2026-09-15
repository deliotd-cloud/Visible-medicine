import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {build} from './workspace-test-build.mjs';
import {contentContext} from './content-contract-tools.mjs';
const compiled=await build({stdin:{contents:"export * from './content/abdominal-branch-imaging.ts';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {abdominalBranchImagingGroups:groups}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const {api,catalog:raw}=await contentContext(),catalog=api.bodyDisplayCatalog(raw);
const entries=catalog.structures.flatMap(identity=>{const group=Object.entries(groups).find(([,g])=>g.fmaId===identity.fmaId)?.[0];return group?[{identity,group,topics:Object.keys(groups[group].focus)}]:[];});
assert.equal(entries.length,34);assert.equal(Object.keys(groups).length,34);
for(const e of entries){const g=groups[e.group];assert.equal(e.identity.system,'vessels');assert.equal(e.identity.category,'vessel');assert(e.identity.regions.includes(g.region));assert.equal(e.identity.laterality,g.laterality);}
assert.equal(entries.reduce((n,e)=>n+e.topics.length,0),48);
const bundles=catalog.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));
for(const b of bundles)assert.equal(createHash('sha256').update(await readFile('public'+b.url.split('?')[0])).digest('hex'),b.sha256);
const path='content/abdominal-branch-imaging-pins.json',sourceCommit='193de0e4273fee3ae69cf3f4402b74b6cde5e118';
const base={sourceCommit,sourceVersion:catalog.sourceVersion,license:catalog.license,coordinateSystem:catalog.coordinateSystem,bundles};
if(process.argv.includes('--check')){
 const saved=JSON.parse(await readFile(path));assert.deepEqual(saved.entries.map(({previous,anatomy,...e})=>e),entries);
 for(const k of Object.keys(base))assert.deepEqual(saved[k],base[k]);
 for(const e of saved.entries)assert.deepEqual(e.anatomy,api.bodyLesson(e.identity,'anatomy'));
}else{
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceCommit);
 await assert.rejects(access(path),'Never overwrite pins');
 const previousAllLessonsAndRecipesHash=hash({body:catalog.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});
 await writeFile(path,JSON.stringify({...base,previousAllLessonsAndRecipesHash,entries:entries.map(e=>({...e,anatomy:api.bodyLesson(e.identity,'anatomy'),previous:Object.fromEntries(e.topics.map(t=>{const l=api.bodyLesson(e.identity,t);assert.equal(l.readiness,'pending');return[t,l];}))}))},null,2)+'\n',{flag:'wx'});
}
console.log(JSON.stringify({selections:entries.length,placements:48,bundles:bundles.length}));
