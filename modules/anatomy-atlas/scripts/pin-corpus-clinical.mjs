import assert from 'node:assert/strict';
import {access,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {build} from './workspace-test-build.mjs';

const compiled=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog'; export {bodyLesson} from './app/body-content'; export {structures} from './app/anatomy-data'; export {contentTabs} from './lib/content-types'; export {dissectionProfiles} from './app/dissection-data';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const raw=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json')),catalog=api.bodyDisplayCatalog(raw);
const matches=catalog.structures.filter(s=>s.fmaId==='FMA19617');assert.equal(matches.length,1);
const identity=matches[0],topics=['clinical','pathology','ct','mri','xray','ultrasound'];
assert.equal(identity.id,'vm:anatomy:body:pelvis:midline:organ:corpus-spongiosum-of-penis');
assert.equal(identity.system,'organs');assert.equal(identity.category,'organ');assert.equal(identity.laterality,'midline');assert.deepEqual(identity.regions,['pelvis']);assert.equal(identity.bundle,'corpus-spongiosum');
const bundles=catalog.bundles.filter(b=>b.id===identity.bundle);assert.equal(bundles.length,1);
for(const bundle of bundles)assert.equal(createHash('sha256').update(await readFile('public'+bundle.url.split('?')[0])).digest('hex'),bundle.sha256);
const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const sourceCommit='c1fa092997ba87e71f082af393aa8944e4e9afdb',path='content/corpus-clinical-pins.json';
const base={sourceCommit,sourceVersion:catalog.sourceVersion,license:catalog.license,coordinateSystem:catalog.coordinateSystem,bundles};
if(process.argv.includes('--check')){
  const saved=JSON.parse(await readFile(path));for(const key of Object.keys(base))assert.deepEqual(saved[key],base[key]);assert.deepEqual(saved.entries.map(({anatomy,previous,...entry})=>entry),[{identity,side:'midline',topics}]);assert.deepEqual(saved.entries[0].anatomy,api.bodyLesson(identity,'anatomy'));for(const topic of topics)assert.equal(saved.entries[0].previous[topic].readiness,'pending');assert.equal(saved.previousAllLessonsAndRecipesHash,'8f15dd9f3f53aea60ccfec6036ae78d4581f8f41fd33090121fa429567e63f7e');console.log(JSON.stringify({sourceCommit,selections:1,placements:topics.length,bundles:1,previousAllLessonsAndRecipesHash:saved.previousAllLessonsAndRecipesHash,pinsHash:sha(saved)}));
}else{
  assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceCommit);await assert.rejects(access(path));const snapshot={body:catalog.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles};const result={...base,previousAllLessonsAndRecipesHash:sha(snapshot),entries:[{identity,side:'midline',topics,anatomy:api.bodyLesson(identity,'anatomy'),previous:Object.fromEntries(topics.map(topic=>{const lesson=api.bodyLesson(identity,topic);assert.equal(lesson.readiness,'pending');return[topic,lesson];}))}]};await writeFile(path,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({sourceCommit,selections:1,placements:topics.length,bundles:1,previousAllLessonsAndRecipesHash:result.previousAllLessonsAndRecipesHash,pinsHash:sha(result)}));
}
