import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from './workspace-component-test-build.mjs';
import {pulmonaryXrayApi,pulmonaryXrayBase,pulmonaryXrayKeys} from './pulmonary-xray-tools.mjs';
import {nestedBeforePulmonaryXray} from './pulmonary-xray-history.mjs';

const current=await pulmonaryXrayApi(),saved=await pulmonaryXrayApi({saved:true}),before=nestedBeforePulmonaryXray(current);
assert.deepEqual(before.nestedConcepts,saved.nestedConcepts,'Historical concepts must match exact Git baseline');
assert.deepEqual(before.nestedTeachingReferences,saved.nestedTeachingReferences,'Historical references must match exact Git baseline');
assert.equal(nestedBeforePulmonaryXray(before),before);
for(const path of ['content/nested-teaching-bindings.v1.json','content/femoral-component-teaching-bindings.v1.json','public/models/bodyparts3d/pulmonary/catalog.json']){
 assert.deepEqual(await readFile(path),execFileSync('git',['show',pulmonaryXrayBase+':'+path],{maxBuffer:16e6}),`Source pin changed: ${path}`);
}
const raw=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
const catalog=current.bodyDisplayCatalog(raw);
assert.deepEqual(catalog,saved.bodyDisplayCatalog(raw));
const targets=current.nestedStudyTargets(catalog),priorTargets=saved.nestedStudyTargets(catalog);
assert.deepEqual(targets,priorTargets);
const compiled=await build({stdin:{contents:"export {NestedTeaching} from './app/nested-teaching';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs'});
const require=createRequire(import.meta.url),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const scope={exports:{}};
runInNewContext(compiled.outputFiles[0].text,{URLSearchParams,module:scope,exports:scope.exports,require});
let changed=0,unchanged=0,rendered=0,sourceRejections=0;
const conceptIds=new Set();
for(const target of targets){
 const parent=catalog.structures.find(s=>s.id===target.parentId);
 const concept=current.nestedTeachingFor(parent,target.study,target.structure);
 const prior=saved.nestedTeachingFor(parent,target.study,target.structure);
 assert.equal(Boolean(concept),Boolean(prior));
 if(!concept)continue;
 for(const topic of ['anatomy','function','clinical','pathology','ct','mri','ultrasound','xray','quiz']){
  const now=current.nestedTopicLesson(concept,topic),old=saved.nestedTopicLesson(prior,topic);
  if(target.study==='pulmonary'&&topic==='xray'){
   changed++;conceptIds.add(concept.id);
   assert.equal(old.readiness,'pending');assert.equal(now.readiness,'draft');
   assert.equal(now.body,concept.imaging.xray.body);
   assert.deepEqual(now.citations,concept.imaging.xray.references.map(k=>current.nestedTeachingReferences[k].url));
   assert(now.citations.length>0);
   assert.match(now.note,/specialist review pending/);assert.match(now.note,/No scan access or synchronization/);
   const html=renderToStaticMarkup(React.createElement(scope.exports.NestedTeaching,{parent,study:target.study,selected:target.structure,initialTopic:'xray'}));
   assert(html.includes('X-ray · teaching draft'));
   assert(html.includes(renderToStaticMarkup(React.createElement('p',null,now.body))));
   assert(html.includes('Teaching references'));
   assert(html.includes('specialist review pending'));
   assert(!html.includes('X-ray · pending'));
   for(const url of now.citations)assert(html.includes(url.replaceAll('&','&amp;')));
   rendered++;
   for(const mutate of [
    s=>{s.id+='-wrong';},s=>{s.fmaId='FMA0';},s=>{s.file='wrong.glb';},
    s=>{s.sources[0].file='wrong.glb';},s=>{s.sources[0].sha256='0'.repeat(64);},
    s=>{s.center[0]+=.001;},
   ]){const altered=structuredClone(target.structure);mutate(altered);assert.equal(current.nestedTeachingFor(parent,target.study,altered),null);sourceRejections++;}
   const changedParent=structuredClone(parent);changedParent.id+='-wrong';
   assert.equal(current.nestedTeachingFor(changedParent,target.study,target.structure),null);sourceRejections++;
  }else{assert.deepEqual(now,old,`Changed unrelated ${target.study}/${concept.id}/${topic}`);unchanged++;}
 }
}
assert.equal(changed,5);assert.equal(rendered,5);assert.equal(conceptIds.size,3);
assert.deepEqual([...conceptIds].sort(),['pulmonary-lower-branches','pulmonary-middle-branches','pulmonary-upper-branches']);
const bad=structuredClone(current.nestedConcepts);bad.find(c=>c.study==='pulmonary').imaging.xray.body+=' tampered';
assert.throws(()=>nestedBeforePulmonaryXray({...current,nestedConcepts:bad}),/Unrecorded pulmonary X-ray/);
const partial=structuredClone(current.nestedConcepts);delete partial.find(c=>c.study==='pulmonary').imaging.xray;
assert.throws(()=>nestedBeforePulmonaryXray({...current,nestedConcepts:partial}),/Unrecorded pulmonary X-ray/);
const wrongRefs={...current.nestedTeachingReferences,[pulmonaryXrayKeys[0]]:{...current.nestedTeachingReferences[pulmonaryXrayKeys[0]],url:'https://example.org/wrong'}};
assert.throws(()=>nestedBeforePulmonaryXray({...current,nestedTeachingReferences:wrongRefs}),/Mixed pulmonary X-ray references/);
const mixedRefs={...current.nestedTeachingReferences};delete mixedRefs[pulmonaryXrayKeys[0]];
assert.throws(()=>nestedBeforePulmonaryXray({...current,nestedTeachingReferences:mixedRefs}),/Mixed pulmonary X-ray references/);
const partialPrior={...before,nestedTeachingReferences:{...before.nestedTeachingReferences,[pulmonaryXrayKeys[0]]:current.nestedTeachingReferences[pulmonaryXrayKeys[0]]}};
assert.throws(()=>nestedBeforePulmonaryXray(partialPrior),/Mixed pulmonary X-ray references/);
console.log(JSON.stringify({sourceCommit:pulmonaryXrayBase,newConceptTopics:3,draftPlacements:changed,unchangedNestedTopics:unchanged,actualNestedTeachingRenders:rendered,sourcePinRejections:sourceRejections,negativeHistoryCases:5,clinicalApproval:false,browserAcceptance:false}));
