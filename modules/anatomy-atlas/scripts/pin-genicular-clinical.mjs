import assert from 'node:assert/strict';
import {access,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {build} from './workspace-test-build.mjs';

const compiled=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog'; export {bodyLesson} from './app/body-content'; export {structures} from './app/anatomy-data'; export {contentTabs} from './lib/content-types'; export {dissectionProfiles} from './app/dissection-data';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const raw=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json')),catalog=api.bodyDisplayCatalog(raw),checking=process.argv.includes('--check');
const specifications=[
  ['FMA22562','middle'],['FMA22563','middle'],
  ['FMA22586','medialSuperior'],['FMA22587','medialSuperior'],
  ['FMA22588','lateralSuperior'],['FMA22589','lateralSuperior'],
  ['FMA43890','medialInferior'],['FMA43891','medialInferior'],
  ['FMA43892','lateralInferior'],['FMA43893','lateralInferior'],
];
const draftTopics=['clinical','pathology'],pendingCopyTopics=['ct','mri','xray','ultrasound'],topics=[...draftTopics,...pendingCopyTopics];
const entries=specifications.map(([fmaId,family])=>{const matches=catalog.structures.filter(s=>s.fmaId===fmaId);assert.equal(matches.length,1);const identity=matches[0];assert.equal(identity.bundle,'genicular-arteries');assert.equal(identity.system,'vessels');assert.equal(identity.category,'vessel');assert.deepEqual(identity.regions,['leg','thigh']);return{identity,family,draftTopics,pendingCopyTopics,topics,previous:Object.fromEntries(topics.map(topic=>{const lesson=api.bodyLesson(identity,topic);if(!checking)assert.equal(lesson.readiness,'pending');return[topic,lesson];}))};});
assert.equal(new Set(entries.map(entry=>entry.identity.id)).size,10);assert.equal(new Set(entries.map(entry=>entry.family)).size,5);
const bundles=catalog.bundles.filter(bundle=>bundle.id==='genicular-arteries');assert.equal(bundles.length,1);assert.equal(bundles[0].structures,10);for(const bundle of bundles){const bytes=await readFile('public'+bundle.url.split('?')[0]);assert.equal(bytes.length,bundle.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);}
const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex'),sourceCommit='52aa75e8711d4663dcd854dd429bbdb65199f981',path='content/genicular-clinical-pins.json';
const base={sourceCommit,sourceVersion:catalog.sourceVersion,license:catalog.license,coordinateSystem:catalog.coordinateSystem,bundles};
if(checking){const saved=JSON.parse(await readFile(path));for(const key of Object.keys(base))assert.deepEqual(saved[key],base[key]);assert.deepEqual(saved.entries.map(({previous,...entry})=>entry),entries.map(({previous,...entry})=>entry));for(const entry of saved.entries)for(const topic of topics)assert.equal(entry.previous[topic].readiness,'pending');console.log(JSON.stringify({sourceCommit,selections:entries.length,changedPlacements:entries.length*topics.length,draftPlacements:entries.length*draftTopics.length,pendingCopyPlacements:entries.length*pendingCopyTopics.length,bundle:bundles[0],previousAllLessonsAndRecipesHash:saved.previousAllLessonsAndRecipesHash,pinsHash:sha(saved)}));}
else{assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceCommit);await assert.rejects(access(path));const snapshot={body:catalog.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles};const result={...base,previousAllLessonsAndRecipesHash:sha(snapshot),entries};await writeFile(path,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({sourceCommit,selections:entries.length,changedPlacements:entries.length*topics.length,draftPlacements:entries.length*draftTopics.length,pendingCopyPlacements:entries.length*pendingCopyTopics.length,bundle:bundles[0],previousAllLessonsAndRecipesHash:result.previousAllLessonsAndRecipesHash,pinsHash:sha(result)}));}
