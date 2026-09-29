import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {resolve} from 'node:path';
import {build} from './workspace-component-test-build.mjs';
import {nestedBeforeVentricularUltrasound,ventricularUltrasoundIds} from './ventricular-ultrasound-history.mjs';
const base='1c3dca274a958a88d583989b769d4b05296622d8';
const require=createRequire(import.meta.url), React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const clone=v=>JSON.parse(JSON.stringify(v));
const old=p=>execFileSync('git',['show',base+':'+p],{encoding:'utf8',maxBuffer:8e6});
async function load(contents,resolveDir=process.cwd()) {
  const b=await build({stdin:{contents,resolveDir,loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs'});
  const m={exports:{}};runInNewContext(b.outputFiles[0].text,{module:m,exports:m.exports,require,crypto,TextEncoder,URLSearchParams,structuredClone});return m.exports;
}
const api=await load(`export * from './content/nested-teaching';export * from './lib/nested-teaching';export * from './lib/nested-review-material';export {ventricleCatalog} from './lib/ventricles';export {NestedTeaching} from './app/nested-teaching';`);
const previous=await load(old('content/nested-teaching.ts'),resolve('content'));
const restored=nestedBeforeVentricularUltrasound(api);
assert.deepEqual(clone(restored.nestedConcepts),clone(previous.nestedConcepts),'Only three new ultrasound topics; all other content unchanged');
assert.deepEqual(clone(restored.nestedTeachingReferences),clone(previous.nestedTeachingReferences));
for(const p of ['content/nested-teaching-bindings.v1.json','content/nested-review-bindings.json','public/models/bodyparts3d/ventricles/catalog.json'])
  assert.equal(await readFile(p,'utf8'),old(p),p+' unchanged');
const parent=api.ventricleCatalog.parent,group=api.nestedReviewRows.find(g=>g.study==='ventricles');
let selections=0;
for(const id of ventricularUltrasoundIds) {
  const expected=api.nestedConcepts.find(c=>c.id==='ventricular-'+id);
  const structures=api.ventricleCatalog.structures.filter(s=>expected.fmaIds.includes(s.fmaId));
  assert.equal(structures.length,id==='lateral'?2:1);
  for(const selected of structures) {
    selections++;
    const concept=api.nestedTeachingFor(parent,'ventricles',selected);assert.equal(concept.id,expected.id);
    const lesson=api.nestedTopicLesson(concept,'ultrasound');assert.equal(lesson.readiness,'draft');
    assert.match(lesson.body,/Neonatal|neonatal/);assert.match(lesson.body,/adult/);
    assert.match(lesson.note,/No scan access or synchronization/);
    const html=renderToStaticMarkup(React.createElement(api.NestedTeaching,{parent,study:'ventricles',selected,initialTopic:'ultrasound'}));
    assert(html.includes(lesson.body));for(const url of lesson.citations)assert(html.includes(url));
    assert.equal(api.nestedTopicLesson(concept,'xray').readiness,'pending');
    for(const topic of ['ct','mri'])assert.deepEqual(clone(concept.imaging[topic]),clone(previous.nestedConcepts.find(c=>c.id===concept.id).imaging[topic]));
    const packet=await api.nestedReviewMaterial(group.key,selected.id);
    assert.deepEqual(clone(packet.teaching.concept),clone(concept));
    assert.equal(packet.context.revisions.imaging,null);assert(packet.context.blockers.imaging.length>0);
    for(const mutate of [s=>s.fmaId='FMA0',s=>s.laterality='unknown',s=>s.sources[0].sha256='0'.repeat(64)]) {
      const stale=clone(selected);mutate(stale);assert.equal(api.nestedTeachingFor(parent,'ventricles',stale),null);
    }
  }
}
assert.equal(selections,4);
console.log(JSON.stringify({passed:true,concepts:3,newUltrasoundPlacements:4,allPriorContentPreserved:true,clinicalApproval:false,patientImages:false}));
