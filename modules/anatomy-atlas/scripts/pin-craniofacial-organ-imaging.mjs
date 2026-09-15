import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {build} from './workspace-test-build.mjs';
const built=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog'; export {bodyLesson} from './app/body-content'; export {structures} from './app/anatomy-data'; export {contentTabs} from './lib/content-types'; export {dissectionProfiles} from './app/dissection-data'; export * from './content/craniofacial-organ-imaging';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const raw=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json')),catalog=api.bodyDisplayCatalog(raw);
const groups=api.craniofacialOrganImagingGroups,sha=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const entries=catalog.structures.flatMap(identity=>{const group=Object.keys(groups).find(k=>groups[k].fmas.includes(identity.fmaId));return group?[{identity,group,topics:Object.keys(groups[group].focus)}]:[];});
assert.equal(entries.length,9);assert.equal(Object.keys(groups).length,5);
for(const e of entries){assert.equal(e.identity.system,'organs');assert.equal(e.identity.category,'organ');assert.deepEqual(e.identity.regions,['head-neck']);}
const bundles=catalog.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));
for(const b of bundles)assert.equal(createHash('sha256').update(await readFile('public'+b.url.split('?')[0])).digest('hex'),b.sha256);
const path='content/craniofacial-organ-imaging-pins.json',sourceCommit='efc5ed08bd300540861161f8f823aedb359a789d';
const base={sourceCommit,sourceVersion:catalog.sourceVersion,license:catalog.license,coordinateSystem:catalog.coordinateSystem,bundles};
if(process.argv.includes('--check')){
 const saved=JSON.parse(await readFile(path));assert.deepEqual(saved.entries.map(({previous,anatomy,...e})=>e),entries);
 for(const k of Object.keys(base))assert.deepEqual(saved[k],base[k]);
 for(const e of saved.entries)assert.deepEqual(e.anatomy,api.bodyLesson(e.identity,'anatomy'));
}else{
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceCommit);await assert.rejects(access(path));
 const previousAllLessonsAndRecipesHash=sha({body:catalog.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});
 await writeFile(path,JSON.stringify({...base,previousAllLessonsAndRecipesHash,entries:entries.map(e=>({...e,anatomy:api.bodyLesson(e.identity,'anatomy'),previous:Object.fromEntries(e.topics.map(t=>{const l=api.bodyLesson(e.identity,t);assert.equal(l.readiness,'pending');return[t,l];}))}))},null,2)+'\n',{flag:'wx'});
}
console.log(JSON.stringify({selections:entries.length,placements:36,bundles:bundles.length}));
