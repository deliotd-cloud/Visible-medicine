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
  ['FMA22712','inferiorUlnarCollateral'],['FMA22713','inferiorUlnarCollateral'],
  ['FMA22707','superiorUlnarCollateral'],['FMA22708','superiorUlnarCollateral'],
  ['FMA23126','radialCollateral'],['FMA23127','radialCollateral'],
  ['FMA23124','middleCollateral'],['FMA23125','middleCollateral'],
  ['FMA22764','radialRecurrent'],['FMA22766','radialRecurrent'],
  ['FMA22801','anteriorUlnarRecurrent'],['FMA22802','anteriorUlnarRecurrent'],
  ['FMA22804','posteriorUlnarRecurrent'],['FMA22805','posteriorUlnarRecurrent'],
];
const draftTopics=['clinical','pathology'],pendingCopyTopics=['ct','mri','xray','ultrasound'],topics=[...draftTopics,...pendingCopyTopics];
const entries=specifications.map(([fmaId,family])=>{const matches=catalog.structures.filter(s=>s.fmaId===fmaId);assert.equal(matches.length,1);const identity=matches[0];assert.equal(identity.bundle,'elbow-arteries');assert.equal(identity.system,'vessels');assert.equal(identity.category,'vessel');return{identity,family,draftTopics,pendingCopyTopics,topics,previous:Object.fromEntries(topics.map(topic=>{const lesson=api.bodyLesson(identity,topic);if(!checking)assert.equal(lesson.readiness,'pending');return[topic,lesson];}))};});
assert.equal(new Set(entries.map(entry=>entry.identity.id)).size,14);assert.equal(new Set(entries.map(entry=>entry.family)).size,7);
const bundles=catalog.bundles.filter(bundle=>bundle.id==='elbow-arteries');assert.equal(bundles.length,1);assert.equal(bundles[0].bytes,353176);assert.equal(bundles[0].sha256,'f8c7361dd6d9f089937df2d879c9851cc2346353bafe2600da871a04f8a0060d');assert.equal(bundles[0].structures,14);
for(const bundle of bundles){const bytes=await readFile('public'+bundle.url.split('?')[0]);assert.equal(bytes.length,bundle.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);}
const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const sourceCommit='b921502e0a62f8e343cc4cd0628acf362f8f2daf',path='content/elbow-clinical-pins.json';
const base={sourceCommit:sourceCommit,sourceVersion:catalog.sourceVersion,license:catalog.license,coordinateSystem:catalog.coordinateSystem,bundles};
if(checking){
  const saved=JSON.parse(await readFile(path));for(const key of Object.keys(base))assert.deepEqual(saved[key],base[key]);assert.deepEqual(saved.entries.map(({previous,...entry})=>entry),entries.map(({previous,...entry})=>entry));for(const entry of saved.entries){for(const topic of topics)assert.equal(entry.previous[topic].readiness,'pending');assert.equal(entry.draftTopics.length,2);assert.equal(entry.pendingCopyTopics.length,4);}console.log(JSON.stringify({sourceCommit,selections:entries.length,changedPlacements:entries.length*topics.length,draftPlacements:entries.length*draftTopics.length,pendingCopyPlacements:entries.length*pendingCopyTopics.length,bundles:bundles.length,previousAllLessonsAndRecipesHash:saved.previousAllLessonsAndRecipesHash,pinsHash:sha(saved)}));
}else{
  assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceCommit);await assert.rejects(access(path));const snapshot={body:catalog.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles};const result={...base,previousAllLessonsAndRecipesHash:sha(snapshot),entries};await writeFile(path,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({sourceCommit,selections:entries.length,changedPlacements:entries.length*topics.length,draftPlacements:entries.length*draftTopics.length,pendingCopyPlacements:entries.length*pendingCopyTopics.length,bundles:bundles.length,previousAllLessonsAndRecipesHash:result.previousAllLessonsAndRecipesHash,pinsHash:sha(result)}));
}
