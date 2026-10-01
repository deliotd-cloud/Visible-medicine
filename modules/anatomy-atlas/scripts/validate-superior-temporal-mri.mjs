import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {resolve} from 'node:path';
import {readFileSync} from 'node:fs';
import {build} from './workspace-component-test-build.mjs';
import {nestedBeforeSuperiorTemporalMRI} from './superior-temporal-mri-history.mjs';
import {nestedBeforeCTOrientation} from './nested-ct-orientation-history.mjs';
import {nestedBeforeEyeCrossSectional} from './eye-cross-sectional-history.mjs';
import {nestedCTOrientation} from '../content/nested-ct-orientation.ts';
const base='0ede9422e6e9ce7e190cbe48d3cd3fe3714c7828',require=createRequire(import.meta.url);
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const clone=v=>JSON.parse(JSON.stringify(v));
const old=p=>execFileSync('git',['show',base+':'+p],{encoding:'utf8'});
async function load(contents,resolveDir=process.cwd()){
 const b=await build({stdin:{contents,resolveDir,loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs'});
 const m={exports:{}};runInNewContext(b.outputFiles[0].text,{module:m,exports:m.exports,require,crypto,TextEncoder,URLSearchParams,structuredClone});return m.exports;
}
const api=await load(`export * from './content/nested-teaching';export * from './lib/nested-teaching';export * from './lib/nested-review-material';export {cerebralCatalog as catalog} from './lib/cerebral';export {NestedTeaching} from './app/nested-teaching';`);
const previous=await load(old('content/nested-teaching.ts'),resolve('content'));
const restored=nestedBeforeSuperiorTemporalMRI(nestedBeforeEyeCrossSectional(nestedBeforeCTOrientation(api)));
assert.deepEqual(clone(restored.nestedConcepts),clone(previous.nestedConcepts));
assert.deepEqual(clone(restored.nestedTeachingReferences),clone(previous.nestedTeachingReferences));
for(const p of ['content/nested-teaching-bindings.v1.json','content/nested-review-bindings.json'])assert.equal(readFileSync(p,'utf8'),old(p));
const parent=api.catalog.parent,group=api.nestedReviewRows.find(g=>g.study==='cerebral');let selections=0;
for(const suffix of ['anterior','posterior']){
 const expected=api.nestedConcepts.find(c=>c.id==='cerebral-superior-temporal-'+suffix);
 const parts=api.catalog.structures.filter(s=>expected.fmaIds.includes(s.fmaId));assert.equal(parts.length,2);
 for(const selected of parts){
  selections++;const concept=api.nestedTeachingFor(parent,'cerebral',selected);assert.equal(concept.id,expected.id);
  const lesson=api.nestedTopicLesson(concept,'mri');assert.equal(lesson.readiness,'draft');
  assert.match(lesson.body,/Sylvian fissure/);assert.match(lesson.body,/superior temporal sulcus/);
  assert(lesson.citations.includes(api.nestedTeachingReferences.superiorTemporalLandmarks.url));
  if(suffix==='posterior'){assert.match(lesson.body,/not a complete Wernicke area/);assert.match(lesson.body,/No MRI signal or registered scan/);}
  const html=renderToStaticMarkup(React.createElement(api.NestedTeaching,{parent,study:'cerebral',selected,initialTopic:'mri'}));
  assert(html.includes('Sylvian fissure'));for(const url of lesson.citations)assert(html.includes(url));
  assert.deepEqual(clone(concept.imaging.ct),clone(nestedCTOrientation[concept.id]));
  assert.equal(api.nestedTopicLesson(concept,'ct').readiness,'draft');
  for(const topic of ['xray','ultrasound'])assert.equal(api.nestedTopicLesson(concept,topic).readiness,'pending');
  const packet=await api.nestedReviewMaterial(group.key,selected.id);
  assert.equal(packet.teaching.topics.find(t=>t.tab==='mri').body,lesson.body);
  assert.equal(packet.context.revisions.imaging,null);assert(packet.context.blockers.imaging.length);
  assert.equal(await api.nestedReviewSelection(group.key,selected.id,'0'.repeat(64)),null);
  for(const change of [s=>s.fmaId='FMA0',s=>s.laterality='unknown',s=>s.sources[0].sha256='0'.repeat(64)]){const stale=clone(selected);change(stale);assert.equal(api.nestedTeachingFor(parent,'cerebral',stale),null);}
 }
}
assert.equal(selections,4);
console.log(JSON.stringify({passed:true,selections,newDraftPlacements:2,improvedDraftPlacements:2,priorContentPreserved:true,clinicalApproval:false}));
