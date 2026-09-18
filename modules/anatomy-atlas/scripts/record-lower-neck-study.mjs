// Exact Git replay, independent of mutable editorial-history adapters.
import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {beforeCeliacDisplay} from './celiac-display-history.mjs';
const sourceCommit='2d68ad0aa45aa270f2b0a114be82003ea6d1b9c8';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const compiled=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog';export {bodyLesson,bodyContent} from './app/body-content';export {structures} from './app/anatomy-data';export {contentTabs} from './lib/content-types';export {dissectionProfiles} from './app/dissection-data';export {lowerNeckStudy} from './content/lower-neck-study';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const live=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const saved=await exactSourceHistoryApi(sourceCommit),raw=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
const api=beforeCeliacDisplay(live,raw);
const display=api.bodyDisplayCatalog(raw);assert.deepEqual(display,saved.bodyDisplayCatalog(raw));assert.deepEqual(api.structures,saved.structures);
let unchangedTopics=0;
for(const s of display.structures)for(const t of api.contentTabs){assert.deepEqual(api.bodyLesson(s,t),saved.bodyLesson(s,t));unchangedTopics++;}
assert.equal(unchangedTopics,9936);
assert.equal(api.lowerNeckStudy.id,'lower-neck-vessels-scalenes');
assert.deepEqual(api.lowerNeckStudy.regions,['head-neck','whole-body']);
const before=structuredClone(api.dissectionProfiles),added={};
for(const region of api.lowerNeckStudy.regions){
 const focuses=before[region].focuses.filter(f=>f.id===api.lowerNeckStudy.id);assert.equal(focuses.length,1);
 assert.deepEqual(before[region].focuses.at(-1),focuses[0]);added[region]=focuses;
 before[region].focuses=before[region].focuses.filter(f=>f.id!==api.lowerNeckStudy.id);
}
assert.deepEqual(before,saved.dissectionProfiles,'All previous recipes/references must remain exact');
const transition={sourceCommit,before:hash(before),after:hash(api.dissectionProfiles),added,unchangedTopics,catalogHash:hash(display),shoulderHash:hash(api.structures)};
const path='content/lower-neck-study-transition.json';
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(await readFile(path)),transition);
else{assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceCommit);await assert.rejects(access(path));await writeFile(path,JSON.stringify(transition,null,2)+'\n',{flag:'wx'});}
console.log(JSON.stringify({transitionHash:hash(transition),before:transition.before,after:transition.after,unchangedTopics,geometryChanged:false}));
