import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from './workspace-component-test-build.mjs';
import {buildExactComponentHistory} from './exact-component-history.mjs';
const base='8386fa7e3c17c7a6da67d6a511604e95f31fdebb';
const epoch='c97c2b0b200ab1813a510ef65355fa2b45d05499';
const require=createRequire(import.meta.url),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const clone=v=>JSON.parse(JSON.stringify(v));
const nodes=(node)=>!node||typeof node!=='object'?[]:Array.isArray(node)?node.flatMap(nodes):[node,...nodes(node.props?.children)];
const source=(commit,path)=>execFileSync('git',['show',commit+':'+path],{encoding:'utf8',maxBuffer:8e6});
const historicalEntry=`export * from './content/collicular-brachia-teaching'; export * from './lib/nested-teaching'; export * from './lib/nested-review-material'; export * from './lib/nested-anatomy'; export {NestedTeaching} from './app/nested-teaching'; import raw from './public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);`;
const currentEntry=historicalEntry+`export {nestedCTOrientation} from './content/nested-ct-orientation';`;
function evaluate(result){
  const module={exports:{}};
  runInNewContext(result.outputFiles[0].text,{module,exports:module.exports,require,crypto,TextEncoder,URLSearchParams,structuredClone});
  return module.exports;
}
async function loadHistorical(commit){return evaluate(await buildExactComponentHistory(commit,historicalEntry));}
async function loadCurrent(){return evaluate(await build({stdin:{contents:currentEntry,resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false}));}
const previous=await loadHistorical(base),atEpoch=await loadHistorical(epoch),api=await loadCurrent();
const prior=clone(previous.collicularBrachiaConcepts[0]);
const authored=clone(atEpoch.collicularBrachiaConcepts[0]);
const before=clone(authored);delete before.imaging;
for(const topic of ['clinical','pathology'])before.sections[topic]=prior.sections[topic];
assert.deepEqual(before,prior,'Anatomy/function/quiz/identity/limitations unchanged');
const expected={mri:['auditoryBrachiumMRI','35392412'],clinical:['auditoryBrachiumClinical','7750451'],pathology:['auditoryBrachiumPathology','23349608']};
assert.deepEqual(Object.fromEntries(Object.entries(clone(atEpoch.collicularBrachiaReferences)).filter(([key])=>!Object.values(expected).some(([ref])=>ref===key))),clone(previous.collicularBrachiaReferences));
for(const path of ['content/nested-teaching-bindings.v1.json','content/nested-review-bindings.json','public/models/bodyparts3d/collicular-brachia/catalog.json','public/models/bodyparts3d/brainstem/catalog.json'])
 assert.equal(source(epoch,path),source(base,path),path+' unchanged in the historical transition');
const historicalTargets=atEpoch.nestedStudyTargets(atEpoch.catalog).filter(t=>authored.fmaIds.includes(t.structure.fmaId));
assert.equal(historicalTargets.length,2);
for(const target of historicalTargets){
 const parent=atEpoch.catalog.structures.find(s=>s.id===target.parentId);
 const concept=atEpoch.nestedTeachingFor(parent,target.study,target.structure);
 assert.deepEqual(clone(concept),authored,'Historical after graph resolves exact authored concept');
 for(const [topic,[ref,pmid]] of Object.entries(expected)){
  const lesson=atEpoch.nestedTopicLesson(concept,topic);
  assert.equal(lesson.readiness,'draft');
  assert.equal(lesson.body,topic==='mri'?authored.imaging.mri.body:authored.sections[topic].body);
  assert.deepEqual(clone(lesson.citations),[`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`]);
  assert.equal(atEpoch.collicularBrachiaReferences[ref].url,lesson.citations[0]);
 }
 for(const topic of ['ct','xray','ultrasound'])assert.equal(atEpoch.nestedTopicLesson(concept,topic).readiness,'pending');
}
const current=clone(api.collicularBrachiaConcepts[0]);
assert.deepEqual(current,authored,'Current non-CT collicular teaching remains the exact authored transition');
assert.deepEqual(clone(api.collicularBrachiaReferences),clone(atEpoch.collicularBrachiaReferences));
const targets=api.nestedStudyTargets(api.catalog).filter(t=>current.fmaIds.includes(t.structure.fmaId));
assert.equal(targets.length,2);assert.deepEqual(clone(targets.map(t=>t.structure.laterality).sort()),['left','right']);
const expectedTargets={
 left:{id:'vm:anatomy:body:head-neck:left:organ:brachium-of-left-inferior-colliculus',fmaId:'FMA73464',file:'FJ1761',sha256:'190f6b408b3967c91cfe4aab21672a5998867b4ea5a145567de66df8111da3aa'},
 right:{id:'vm:anatomy:body:head-neck:right:organ:brachium-of-right-inferior-colliculus',fmaId:'FMA73463',file:'FJ1809',sha256:'733feb8590917edc0454661f7027564ae56fe51d4b916f59f82c1e222e0faefc'},
};
const teachingBindings=JSON.parse(readFileSync('content/nested-teaching-bindings.v1.json','utf8'));
const reviewBindings=JSON.parse(readFileSync('content/nested-review-bindings.json','utf8'));
const collicularCatalog=JSON.parse(readFileSync('public/models/bodyparts3d/collicular-brachia/catalog.json','utf8'));
const currentReviewGroup=reviewBindings.groups.find(g=>g.study==='brainstem'&&g.parent.id===collicularCatalog.parent.id);
assert(currentReviewGroup,'Current brainstem review binding exists');
let placements=0;
for(const target of targets){
 const parent=api.catalog.structures.find(s=>s.id===target.parentId),selected=target.structure;
 const pin=expectedTargets[selected.laterality];assert(pin,'Expected side');
 assert.equal(target.parentId,collicularCatalog.parent.id);assert.equal(target.study,'brainstem');
 assert.equal(selected.id,pin.id);assert.equal(selected.fmaId,pin.fmaId);
 assert.deepEqual(clone(selected.sources),[{file:pin.file,sha256:pin.sha256}]);
 assert.deepEqual(clone(selected),clone(collicularCatalog.structures.find(s=>s.id===pin.id)));
 assert.deepEqual(clone(parent),clone(collicularCatalog.parent));
 const binding=teachingBindings.bindings.find(b=>b.structure.id===pin.id);
 assert(binding,'Current teaching binding exists');assert.equal(binding.parentId,parent.id);
 assert.equal(binding.study,target.study);assert.equal(binding.conceptId,current.id);
 assert.deepEqual(clone(binding.structure),clone(selected));
 assert(currentReviewGroup.selections.some(s=>s.id===selected.id),'Current review selection bound');
 const concept=api.nestedTeachingFor(parent,target.study,selected);
 const withoutNewCT=clone(concept);delete withoutNewCT.imaging.ct;
 assert.deepEqual(withoutNewCT,current);
 assert.deepEqual(clone(concept.imaging.ct),clone(api.nestedCTOrientation[concept.id]));
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
 assert.equal(api.nestedTopicLesson(concept,'ct').readiness,'draft');
 for(const topic of ['xray','ultrasound'])assert.equal(api.nestedTopicLesson(concept,topic).readiness,'pending');
 for(const mutate of [s=>s.fmaId='FMA0',s=>s.laterality='unspecified',s=>s.sources[0].sha256='0'.repeat(64)]){
  const stale=clone(selected);mutate(stale);assert.equal(api.nestedTeachingFor(parent,target.study,stale),null);
 }
}
assert.equal(placements,6);
assert.match(current.sections.clinical.body,/combined lesion/);
assert.match(current.sections.pathology.body,/not a typical-disease template/);
assert.match(current.imaging.mri.body,/research streamlines are not routine/);
console.log(JSON.stringify({passed:true,base,epoch,selections:2,draftPlacements:placements,pending:['xray','ultrasound'],clinicalApproval:false,patientImages:false}));
