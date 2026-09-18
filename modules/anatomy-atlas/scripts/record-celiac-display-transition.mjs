// Independent exact Git replay; no retrospective alteration of old golden data.
import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
const sourceCommit='6b96e836942a7c124e6caf947e3920dc898687fd';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const compiled=await build({stdin:{contents:"export {bodyDisplayCatalog,celiacDisplayCorrection} from './lib/body-display-catalog';export {bodyLesson} from './app/body-content';export {structures} from './app/anatomy-data';export {contentTabs} from './lib/content-types';export {dissectionProfiles} from './app/dissection-data';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const saved=await exactSourceHistoryApi(sourceCommit),raw=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
const display=api.bodyDisplayCatalog(raw),prior=saved.bodyDisplayCatalog(raw),correction=api.celiacDisplayCorrection;
const restore={...display,structures:display.structures.map(s=>s.id===correction.replacement.id?correction.original:s),bundles:display.bundles.filter(b=>b.id!==correction.bundle.id)};
assert.deepEqual(restore,prior,'Every unrelated record and bundle must be preserved');
assert.deepEqual(display.structures.filter(s=>s.id===correction.original.id),[correction.replacement]);
assert.deepEqual(display.bundles.filter(b=>b.id===correction.bundle.id),[correction.bundle]);
assert.deepEqual(api.structures,saved.structures);
assert.deepEqual(api.dissectionProfiles,saved.dissectionProfiles);
let unchangedTopics=0;
const allTopics=[];
for(const s of display.structures) {
 const old=prior.structures.find(p=>p.id===s.id);assert(old);
 for(const t of api.contentTabs){const lesson=api.bodyLesson(s,t);assert.deepEqual(lesson,saved.bodyLesson(old,t),`Changed ${s.fmaId}/${t}`);unchangedTopics++;allTopics.push([s.id,t,lesson]);}
}
assert.equal(unchangedTopics,9936);
const transition={sourceCommit,beforeCatalog:hash(prior),afterCatalog:hash(display),correctionHash:hash(correction),unchangedTopics,allTopicsHash:hash(allTopics),profilesHash:hash(api.dissectionProfiles),shoulderHash:hash(api.structures),original:correction.original,replacement:correction.replacement,bundle:correction.bundle};
const file='content/celiac-display-transition.json';
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(await readFile(file)),transition);
else {assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceCommit);await assert.rejects(access(file));await writeFile(file,JSON.stringify(transition,null,2)+'\n',{flag:'wx'});}
console.log(JSON.stringify({transitionHash:hash(transition),beforeCatalog:transition.beforeCatalog,afterCatalog:transition.afterCatalog,unchangedTopics,rawCatalogChanged:false,approvalMigrated:false}));
