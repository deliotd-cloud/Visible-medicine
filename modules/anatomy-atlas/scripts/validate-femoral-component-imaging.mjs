import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {resolve} from 'node:path';
import {build} from './workspace-component-test-build.mjs';
const base='bcc8bd03ab29f87a85a5d4c4da684617ac87fe29';
const require=createRequire(import.meta.url),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const clone=v=>JSON.parse(JSON.stringify(v));
const old=path=>execFileSync('git',['show',base+':'+path],{encoding:'utf8',maxBuffer:8e6});
async function load(contents,resolveDir=process.cwd()) {
  const built=await build({stdin:{contents,resolveDir,loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false});
  const module={exports:{}};
  runInNewContext(built.outputFiles[0].text,{module,exports:module.exports,require,crypto,TextEncoder,URLSearchParams,structuredClone});
  return module.exports;
}
const api=await load(`export * from './content/femoral-component-teaching'; export * from './lib/nested-teaching'; export * from './lib/nested-review-material'; export * from './lib/femoral-components'; export {NestedTeaching} from './app/nested-teaching';`);
const previous=await load(old('content/femoral-component-teaching.ts'),resolve('content'));
const before=clone(api.femoralComponentConcepts);
delete before.find(c=>c.id==='femoral-lateral-source').imaging;
assert.deepEqual(before,clone(previous.femoralComponentConcepts),'Every prior lesson/identity/quiz/limit unchanged');
const references={ct:'femoralComponentCTA',mri:'femoralComponentMRA',ultrasound:'femoralComponentDoppler'};
const pmids={ct:'36512153',mri:'27446322',ultrasound:'29481406'};
assert.deepEqual(Object.fromEntries(Object.entries(clone(api.femoralComponentReferences)).filter(([key])=>!Object.values(references).includes(key))),clone(previous.femoralComponentReferences));
const catalog=api.femoralComponentCatalog;
let placements=0;
for(const parent of catalog.parents) {
  const group=api.nestedReviewRows.find(g=>g.study==='femoral-components'&&g.parentId===parent.id);
  assert(group);
  for(const selected of api.femoralComponentsFor(parent)) {
    const concept=api.nestedTeachingFor(parent,'femoral-components',selected);
    for(const [topic,ref] of Object.entries(references)) {
      const lesson=api.nestedTopicLesson(concept,topic);
      if(selected.role==='remainder') {assert.equal(lesson.readiness,'pending');continue;}
      placements++;
      assert.equal(lesson.readiness,'draft');
      assert.deepEqual(clone(concept.imaging[topic].references),[ref]);
      assert.equal(api.femoralComponentReferences[ref].url,`https://pubmed.ncbi.nlm.nih.gov/${pmids[topic]}/`);
      assert(lesson.body.split(/\s+/).length<150);
      assert.match(lesson.note,/specialist review pending/);
      assert.match(lesson.note,/No scan access or synchronization/);
      const html=renderToStaticMarkup(React.createElement(api.NestedTeaching,{parent,study:'femoral-components',selected,initialTopic:topic}));
      assert(html.includes(lesson.body));assert(html.includes(api.femoralComponentReferences[ref].url));
    }
    assert.equal(api.nestedTopicLesson(concept,'xray').readiness,'pending');
    const packet=await api.nestedReviewMaterial(group.key,selected.id);
    assert.deepEqual(clone(packet.teaching.concept),clone(concept));
    assert.equal(packet.context.revisions.imaging,null);
    assert(packet.context.blockers.imaging.length>0);
    for(const mutate of [s=>s.fmaId='FMA0',s=>s.laterality='unspecified',s=>s.sources[0].sha256='0'.repeat(64),s=>s.parentId='foreign']) {
      const stale=clone(selected);mutate(stale);
      assert.equal(api.nestedTeachingFor(parent,'femoral-components',stale),null);
    }
  }
}
assert.equal(placements,6);
for(const path of ['content/femoral-component-teaching-bindings.v1.json','content/nested-teaching-bindings.v1.json','content/nested-review-bindings.json','public/models/bodyparts3d/femoral-components/catalog.json'])assert.equal(await readFile(path,'utf8'),old(path),path+' unchanged');
console.log(JSON.stringify({passed:true,selections:2,modalityPlacements:placements,remainderImaging:'pending',clinicalApproval:false,patientImages:false}));
