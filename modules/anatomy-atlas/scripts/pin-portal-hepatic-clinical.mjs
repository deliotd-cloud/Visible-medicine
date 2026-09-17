import assert from 'node:assert/strict';
import {access,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {build} from './workspace-test-build.mjs';

const compiled=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog'; export {bodyLesson} from './app/body-content'; export {structures} from './app/anatomy-data'; export {contentTabs} from './lib/content-types'; export {dissectionProfiles} from './app/dissection-data';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const raw=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json')),catalog=api.bodyDisplayCatalog(raw);
const checking=process.argv.includes('--check');
const specifications=[
  ['FMA14331','splenic','portal-veins'],
  ['FMA15390','gastroLeft','portal-veins'],
  ['FMA15397','gastroRight','portal-veins'],
  ['FMA15399','gastricLeft','portal-veins'],
  ['FMA15400','gastricRight','portal-veins'],
  ['FMA14340','hepaticMiddle','hepatic-veins'],
  ['FMA15791','hepaticRight','hepatic-veins'],
  ['FMA15794','hepaticLeft','hepatic-veins'],
];
const topics=['clinical','pathology'],entries=specifications.map(([fmaId,family,bundle])=>{const matches=catalog.structures.filter(s=>s.fmaId===fmaId);assert.equal(matches.length,1);const identity=matches[0];assert.equal(identity.bundle,bundle);assert.equal(identity.system,'vessels');assert.equal(identity.category,'vessel');return{identity,family,topics,previous:Object.fromEntries(topics.map(topic=>{const lesson=api.bodyLesson(identity,topic);if(!checking)assert.equal(lesson.readiness,'pending');return[topic,lesson];}))};});
assert.equal(new Set(entries.map(entry=>entry.identity.id)).size,8);
const bundleIds=[...new Set(entries.map(entry=>entry.identity.bundle))],bundles=bundleIds.map(id=>{const matches=catalog.bundles.filter(bundle=>bundle.id===id);assert.equal(matches.length,1);return matches[0];});
assert.equal(bundles.length,2);assert.deepEqual(bundles.map(bundle=>bundle.structures),[5,3]);
for(const bundle of bundles)assert.equal(createHash('sha256').update(await readFile('public'+bundle.url.split('?')[0])).digest('hex'),bundle.sha256);
const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const sourceCommit='b1240f9c9a47ab641ffe0f5297cf99a59c84f7af',path='content/portal-hepatic-clinical-pins.json';
const base={sourceCommit,sourceVersion:catalog.sourceVersion,license:catalog.license,coordinateSystem:catalog.coordinateSystem,bundles};
if(checking){
  const saved=JSON.parse(await readFile(path));for(const key of Object.keys(base))assert.deepEqual(saved[key],base[key]);assert.deepEqual(saved.entries.map(({previous,...entry})=>entry),entries.map(({previous,...entry})=>entry));for(const entry of saved.entries)for(const topic of topics)assert.equal(entry.previous[topic].readiness,'pending');assert.equal(saved.previousAllLessonsAndRecipesHash,'6bb9dbc2ea42453a7c90abd5fe257107d28a3d28dbd011153e6446d3ae7ea137');console.log(JSON.stringify({sourceCommit,selections:entries.length,placements:entries.length*topics.length,bundles:bundles.length,previousAllLessonsAndRecipesHash:saved.previousAllLessonsAndRecipesHash,pinsHash:sha(saved)}));
}else{
  assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceCommit);await assert.rejects(access(path));const snapshot={body:catalog.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles};const result={...base,previousAllLessonsAndRecipesHash:sha(snapshot),entries};assert.equal(result.previousAllLessonsAndRecipesHash,'6bb9dbc2ea42453a7c90abd5fe257107d28a3d28dbd011153e6446d3ae7ea137');await writeFile(path,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({sourceCommit,selections:entries.length,placements:entries.length*topics.length,bundles:bundles.length,previousAllLessonsAndRecipesHash:result.previousAllLessonsAndRecipesHash,pinsHash:sha(result)}));
}
