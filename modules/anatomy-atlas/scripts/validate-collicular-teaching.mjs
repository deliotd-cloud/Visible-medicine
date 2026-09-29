import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {resolve} from 'node:path';
import {build} from './workspace-component-test-build.mjs';
const base='8386fa7e3c17c7a6da67d6a511604e95f31fdebb';
const require=createRequire(import.meta.url),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const clone=v=>JSON.parse(JSON.stringify(v));
const nodes=(node)=>!node||typeof node!=='object'?[]:Array.isArray(node)?node.flatMap(nodes):[node,...nodes(node.props?.children)];
const old=path=>execFileSync('git',['show',base+':'+path],{encoding:'utf8',maxBuffer:8e6});
async function load(contents,resolveDir=process.cwd()) {
  const result=await build({stdin:{contents,resolveDir,loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false});
  const module={exports:{}};
  runInNewContext(result.outputFiles[0].text,{module,exports:module.exports,require,crypto,TextEncoder,URLSearchParams,structuredClone});
  return module.exports;
}
const api=await load(`export * from './content/collicular-brachia-teaching'; export * from './lib/nested-teaching'; export * from './lib/nested-review-material'; export * from './lib/nested-anatomy'; export {NestedTeaching} from './app/nested-teaching'; import raw from './public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);`);
const previous=await load(old('content/collicular-brachia-teaching.ts'),resolve('content'));
const prior=clone(previous.collicularBrachiaConcepts[0]);
const current=clone(api.collicularBrachiaConcepts[0]);
const before=clone(current);delete before.imaging;
for(const topic of ['clinical','pathology'])before.sections[topic]=prior.sections[topic];
assert.deepEqual(before,prior,'Anatomy/function/quiz/identity/limitations unchanged');
const expected={mri:['auditoryBrachiumMRI','35392412'],clinical:['auditoryBrachiumClinical','7750451'],pathology:['auditoryBrachiumPathology','23349608']};
assert.deepEqual(Object.fromEntries(Object.entries(clone(api.collicularBrachiaReferences)).filter(([key])=>!Object.values(expected).some(([ref])=>ref===key))),clone(previous.collicularBrachiaReferences));
const targets=api.nestedStudyTargets(api.catalog).filter(t=>current.fmaIds.includes(t.structure.fmaId));
assert.equal(targets.length,2);assert.deepEqual(clone(targets.map(t=>t.structure.laterality).sort()),['left','right']);
let placements=0;
for(const target of targets){
 const parent=api.catalog.structures.find(s=>s.id===target.parentId),selected=target.structure;
 const concept=api.nestedTeachingFor(parent,target.study,selected);
 assert.deepEqual(clone(concept),current);
 const group=api.nestedReviewRows.find(g=>g.study===target.study&&g.parentId===parent.id);
 const packet=await api.nestedReviewMaterial(group.key,selected.id);
 assert.equal(packet.context.revisions.imaging,null);assert(packet.context.blockers.imaging.length);
 assert.equal(await api.nestedReviewSelection(group.key,selected.id,'0'.repeat(64)),null);
 for(const [topic,[ref,pmid]] of Object.entries(expected)){
  const lesson=api.nestedTopicLesson(concept,topic);const url=`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
  assert.equal(lesson.readiness,'draft');assert.deepEqual(clone(lesson.citations),[url]);
  assert.equal(api.collicularBrachiaReferences[ref].url,url);assert(lesson.body.split(/\s+/).length<100);
  const props={parent,study:target.study,selected,...(topic==='mri'?{initialTopic:'mri'}:{})};
  const section=nodes(api.NestedTeaching(props)).find(n=>n.props?.['aria-label']===lesson.title);
  assert(section,'Authored section present in actual component');
  const rendered=renderToStaticMarkup(section);
  assert(rendered.includes(lesson.body));assert(rendered.includes(url));
  const panel=renderToStaticMarkup(React.createElement(api.NestedTeaching,props));
  assert(panel.includes('specialist review pending'));
  if(topic==='mri')assert(panel.includes(lesson.body),'MRI deep link renders selected tab');
  const review=packet.teaching.topics.find(t=>t.tab===topic);assert.equal(review.body,lesson.body);assert.equal(review.readiness,'draft');
  placements++;
 }
 for(const topic of ['ct','xray','ultrasound'])assert.equal(api.nestedTopicLesson(concept,topic).readiness,'pending');
 for(const mutate of [s=>s.fmaId='FMA0',s=>s.laterality='unspecified',s=>s.sources[0].sha256='0'.repeat(64)]){
  const stale=clone(selected);mutate(stale);assert.equal(api.nestedTeachingFor(parent,target.study,stale),null);
 }
}
assert.equal(placements,6);
assert.match(current.sections.clinical.body,/combined lesion/);
assert.match(current.sections.pathology.body,/not a typical-disease template/);
assert.match(current.imaging.mri.body,/research streamlines are not routine/);
for(const path of ['content/nested-teaching-bindings.v1.json','content/nested-review-bindings.json','public/models/bodyparts3d/collicular-brachia/catalog.json','public/models/bodyparts3d/brainstem/catalog.json'])assert.equal(readFileSync(path,'utf8'),old(path),path+' unchanged');
console.log(JSON.stringify({passed:true,selections:2,draftPlacements:placements,pending:['ct','xray','ultrasound'],clinicalApproval:false,patientImages:false}));
