import assert from 'node:assert/strict';
import {access,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {build} from './workspace-test-build.mjs';

const built=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog'; export {bodyLesson} from './app/body-content'; export {structures} from './app/anatomy-data'; export {contentTabs} from './lib/content-types'; export {dissectionProfiles} from './app/dissection-data';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const raw=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json')),catalog=api.bodyDisplayCatalog(raw);
const targets=new Map([
  ['FMA7198','pancreas'],['FMA7148','stomach'],['FMA7200','smallIntestine'],['FMA7201','largeIntestine'],['FMA7202','gallbladder'],
  ['FMA7204','kidney'],['FMA7205','kidney'],['FMA15900','bladder'],['FMA7131','esophagus'],['FMA7394','trachea'],['FMA7196','spleen'],
  ['FMA15629','adrenal'],['FMA15630','adrenal'],
]);
const topics=['function'];
const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const entries=catalog.structures.flatMap(identity=>targets.has(identity.fmaId)?[{identity,concept:targets.get(identity.fmaId),region:identity.region,side:identity.laterality,topics}]:[]);
assert.equal(entries.length,13);assert.deepEqual(entries.map(e=>e.identity.fmaId).sort(),[...targets.keys()].sort());
for(const e of entries){assert.equal(e.identity.system,'organs');assert.equal(e.identity.category,'organ');assert.equal(e.identity.laterality,e.side);assert(e.identity.regions.includes(e.region));assert.equal(e.identity.region,e.region);}
const bundles=catalog.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));
assert.equal(new Set(entries.map(e=>e.identity.bundle)).size,bundles.length);
for(const b of bundles)assert.equal(createHash('sha256').update(await readFile('public'+b.url.split('?')[0])).digest('hex'),b.sha256);
const path='content/major-organ-function-pins.json',sourceCommit='f5e08f2f4bc465fb90d0a51d19f0ccc6e31b81b9';
const base={sourceCommit,sourceVersion:catalog.sourceVersion,license:catalog.license,coordinateSystem:catalog.coordinateSystem,bundles};
if(process.argv.includes('--check')){
  const saved=JSON.parse(await readFile(path));assert.deepEqual(saved.entries.map(({previous,...entry})=>entry),entries);for(const key of Object.keys(base))assert.deepEqual(saved[key],base[key]);
}else{
  assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceCommit);await assert.rejects(access(path));
  const previousAllLessonsAndRecipesHash=sha({body:catalog.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});
  await writeFile(path,JSON.stringify({...base,previousAllLessonsAndRecipesHash,entries:entries.map(entry=>({...entry,previous:Object.fromEntries(entry.topics.map(topic=>{const lesson=api.bodyLesson(entry.identity,topic);assert.equal(lesson.readiness,'draft');return[topic,lesson];}))}))},null,2)+'\n',{flag:'wx'});
}
console.log(JSON.stringify({selections:entries.length,placements:entries.length,bundles:bundles.length}));
