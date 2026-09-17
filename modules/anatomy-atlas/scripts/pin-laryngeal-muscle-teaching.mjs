import assert from 'node:assert/strict';
import {access,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {build} from './workspace-test-build.mjs';

const compiled=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog'; export {bodyLesson} from './app/body-content'; export {structures} from './app/anatomy-data'; export {contentTabs} from './lib/content-types'; export {dissectionProfiles} from './app/dissection-data';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const raw=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json')),catalog=api.bodyDisplayCatalog(raw);
const specifications=[
  ['FMA46577','posterior'],['FMA46578','posterior'],
  ['FMA46580','lateral'],['FMA46581','lateral'],
  ['FMA46582','transverse'],
  ['FMA46584','oblique'],['FMA46585','oblique'],
];
const topics=['anatomy','function'],entries=specifications.map(([fmaId,family])=>{const matches=catalog.structures.filter(s=>s.fmaId===fmaId);assert.equal(matches.length,1);const identity=matches[0];assert.equal(identity.bundle,'head-neck-muscles');assert.equal(identity.system,'muscles');assert.equal(identity.category,'muscle');assert.deepEqual(identity.regions,['head-neck']);return{identity,family,topics,previous:Object.fromEntries(topics.map(topic=>{const lesson=api.bodyLesson(identity,topic);assert.equal(lesson.readiness,'draft');return[topic,lesson];}))};});
assert.equal(new Set(entries.map(entry=>entry.identity.id)).size,7);
const bundleIds=[...new Set(entries.map(entry=>entry.identity.bundle))],bundles=bundleIds.map(id=>{const matches=catalog.bundles.filter(bundle=>bundle.id===id);assert.equal(matches.length,1);return matches[0];});
for(const bundle of bundles)assert.equal(createHash('sha256').update(await readFile('public'+bundle.url.split('?')[0])).digest('hex'),bundle.sha256);
const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const sourceCommit='b81918d007e6ebb49350144455597145097507d8',path='content/laryngeal-muscle-teaching-pins.json';
const base={sourceCommit,sourceVersion:catalog.sourceVersion,license:catalog.license,coordinateSystem:catalog.coordinateSystem,bundles};
if(process.argv.includes('--check')){
  const saved=JSON.parse(await readFile(path));for(const key of Object.keys(base))assert.deepEqual(saved[key],base[key]);assert.deepEqual(saved.entries.map(({previous,...entry})=>entry),entries.map(({previous,...entry})=>entry));for(const entry of saved.entries)for(const topic of topics)assert.equal(entry.previous[topic].readiness,'draft');assert.equal(saved.previousAllLessonsAndRecipesHash,'ee280e8b68a66d5abef0b5f530b9c9969be3e5c58d747001a577a0f06d93bc86');console.log(JSON.stringify({sourceCommit,selections:entries.length,placements:entries.length*topics.length,bundles:bundles.length,previousAllLessonsAndRecipesHash:saved.previousAllLessonsAndRecipesHash,pinsHash:sha(saved)}));
}else{
  assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceCommit);await assert.rejects(access(path));const snapshot={body:catalog.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles};const result={...base,previousAllLessonsAndRecipesHash:sha(snapshot),entries};assert.equal(result.previousAllLessonsAndRecipesHash,'ee280e8b68a66d5abef0b5f530b9c9969be3e5c58d747001a577a0f06d93bc86');await writeFile(path,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({sourceCommit,selections:entries.length,placements:entries.length*topics.length,bundles:bundles.length,previousAllLessonsAndRecipesHash:result.previousAllLessonsAndRecipesHash,pinsHash:sha(result)}));
}
