import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {resolve} from 'node:path';
import {build} from './workspace-component-test-build.mjs';
import {nestedBeforeCardiacXray,cardiacXrayIds} from './cardiac-xray-history.mjs';
const base='1223e506beaf1ba8ddba1d082c8449e42cb64f72',require=createRequire(import.meta.url);
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const clone=v=>JSON.parse(JSON.stringify(v));
const old=p=>execFileSync('git',['show',base+':'+p],{encoding:'utf8',maxBuffer:8e6});
async function load(contents,resolveDir=process.cwd()){
 const b=await build({stdin:{contents,resolveDir,loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs'});
 const m={exports:{}};runInNewContext(b.outputFiles[0].text,{module:m,exports:m.exports,require,crypto,TextEncoder,URLSearchParams,structuredClone});return m.exports;
}
const api=await load(`export * from './content/nested-teaching';export * from './lib/nested-teaching';export * from './lib/nested-review-material';export {cardiacCatalog} from './lib/cardiac';export {NestedTeaching} from './app/nested-teaching';`);
const previous=await load(old('content/nested-teaching.ts'),resolve('content'));
const restored=nestedBeforeCardiacXray(api);
assert.deepEqual(clone(restored.nestedConcepts),clone(previous.nestedConcepts),'Only four X-ray topics added');
assert.deepEqual(clone(restored.nestedTeachingReferences),clone(previous.nestedTeachingReferences));
assert.equal(nestedBeforeCardiacXray(restored),restored);
const mutated=clone({nestedConcepts:api.nestedConcepts,nestedTeachingReferences:api.nestedTeachingReferences});
mutated.nestedConcepts.find(c=>c.id==='cardiac-right-atrium').imaging.xray.body='foreign';
assert.throws(()=>nestedBeforeCardiacXray(mutated),/Unrecorded/);
for(const p of ['content/nested-teaching-bindings.v1.json','content/nested-review-bindings.json','content/cardiac-teaching.ts','public/models/bodyparts3d/cardiac/catalog.json'])
 assert.equal(await readFile(p,'utf8'),old(p),p+' unchanged');
const parent=api.cardiacCatalog.parent,group=api.nestedReviewRows.find(g=>g.study==='cardiac');
let selections=0;
for(const id of cardiacXrayIds){
 const expected=api.nestedConcepts.find(c=>c.id==='cardiac-'+id);
 const selected=api.cardiacCatalog.structures.find(s=>expected.fmaIds.includes(s.fmaId));assert(selected);selections++;
 const concept=api.nestedTeachingFor(parent,'cardiac',selected);assert.equal(concept.id,expected.id);
 const lesson=api.nestedTopicLesson(concept,'xray');assert.equal(lesson.readiness,'draft');
 assert.match(lesson.note,/No scan access or synchronization/);
 const html=renderToStaticMarkup(React.createElement(api.NestedTeaching,{parent,study:'cardiac',selected,initialTopic:'xray'}));
 assert(html.includes(lesson.body));for(const url of lesson.citations)assert(html.includes(url));
 for(const topic of ['ct','mri','ultrasound'])assert.deepEqual(clone(concept.imaging[topic]),clone(previous.nestedConcepts.find(c=>c.id===concept.id).imaging[topic]));
 const packet=await api.nestedReviewMaterial(group.key,selected.id);
 assert.deepEqual(clone(packet.teaching.concept),clone(concept));assert(packet.context.teachingTabs.includes('xray'));
 assert.equal(packet.context.revisions.imaging,null);assert(packet.context.blockers.imaging.length>0);
 for(const mutate of [s=>s.fmaId='FMA0',s=>s.laterality='unknown',s=>s.sources[0].sha256='0'.repeat(64)]){
  const stale=clone(selected);mutate(stale);assert.equal(api.nestedTeachingFor(parent,'cardiac',stale),null);
 }
}
assert.equal(selections,4);
console.log(JSON.stringify({passed:true,newXrayPlacements:4,priorContentAndGeometryPreserved:true,clinicalApproval:false,patientImages:false}));
