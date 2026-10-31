import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from './workspace-component-test-build.mjs';
import {buildExactComponentHistory} from './exact-component-history.mjs';
import {nestedCTOrientation} from '../content/nested-ct-orientation.ts';
import {superiorTemporalMRI,superiorTemporalMRIReferences} from '../content/superior-temporal-mri.ts';
import {cerebralDetailSections} from './cerebral-detail-ultrasound-history.mjs';

const beforeCommit='0ede9422e6e9ce7e190cbe48d3cd3fe3714c7828';
const afterCommit='08ef3834b790763917fd45ad5a3e404da3cdf2f0';
const root=fileURLToPath(new URL('../',import.meta.url));
const require=createRequire(import.meta.url);
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const clone=value=>JSON.parse(JSON.stringify(value));
const git=(commit,path)=>execFileSync('git',['show',`${commit}:${path}`],{
 cwd:root,encoding:'utf8',maxBuffer:16e6,windowsHide:true,
 env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},
});
const currentBindings=JSON.parse(readFileSync(resolve(root,'content/nested-teaching-bindings.v1.json'),'utf8'));
const currentReviewBindings=JSON.parse(readFileSync(resolve(root,'content/nested-review-bindings.json'),'utf8'));
const entry=`export * from './content/nested-teaching';
export * from './lib/nested-teaching';
export * from './lib/nested-review-material';
export {cerebralCatalog as catalog} from './lib/cerebral';
export {NestedTeaching} from './app/nested-teaching';`;
function evaluate(bundle){
 const module={exports:{}};
 runInNewContext(bundle.outputFiles[0].text,{
  module,exports:module.exports,require,crypto,TextEncoder,URLSearchParams,structuredClone,
 });
 return module.exports;
}
async function loadCurrent(){
 return evaluate(await build({stdin:{contents:entry,resolveDir:root,loader:'tsx'},
  bundle:true,write:false,platform:'node',format:'cjs'}));
}
async function loadHistory(commit,withMRI=false){
 const source=entry+(withMRI?"\nexport {superiorTemporalMRI} from './content/superior-temporal-mri';":'');
 return evaluate(await buildExactComponentHistory(commit,source));
}

// Compare the exact before and after application graphs, never an old file with live imports.
const before=await loadHistory(beforeCommit);
const after=await loadHistory(afterCommit,true);
const beforeConcepts=new Map(before.nestedConcepts.map(c=>[c.id,c]));
const keys=['superiorTemporalLandmarks','temporalMultiplanarMRI'];
for(const key of keys){
 assert.equal(before.nestedTeachingReferences[key],undefined);
 assert.deepEqual(clone(after.nestedTeachingReferences[key]),clone(superiorTemporalMRIReferences[key]));
}
const inverse=clone(after.nestedConcepts).map(concept=>{
 if(!['cerebral-superior-temporal-anterior','cerebral-superior-temporal-posterior'].includes(concept.id))return concept;
 const prior=clone(beforeConcepts.get(concept.id));
 assert(prior,`Missing historical concept ${concept.id}`);
 const suffix=concept.id.endsWith('anterior')?'anterior':'posterior';
 assert.deepEqual(concept.imaging.mri,clone(after.superiorTemporalMRI[suffix]));
 const reverted=clone(concept);
 if(prior.imaging)reverted.imaging.mri=prior.imaging.mri;
 else delete reverted.imaging;
 return reverted;
});
assert.deepEqual(inverse,clone(before.nestedConcepts),'Historical concept inverse');
assert.deepEqual(
 Object.fromEntries(Object.entries(clone(after.nestedTeachingReferences)).filter(([key])=>!keys.includes(key))),
 clone(before.nestedTeachingReferences),'Historical reference inverse');
for(const path of ['content/nested-teaching-bindings.v1.json','content/nested-review-bindings.json'])
 assert.equal(git(beforeCommit,path),git(afterCommit,path),`Historical ${path} changed`);

async function selections(api,historical){
 const parent=api.catalog.parent;
 const group=api.nestedReviewRows.find(row=>row.study==='cerebral'&&row.parentId===parent.id);
 assert(group,'Cerebral review group required');
 let count=0;
 for(const suffix of ['anterior','posterior']){
  const id=`cerebral-superior-temporal-${suffix}`;
  const concept=api.nestedConcepts.find(item=>item.id===id);
  assert(concept,`Missing ${id}`);
  const parts=api.catalog.structures.filter(s=>concept.fmaIds.includes(s.fmaId));
  assert.equal(parts.length,2);
  assert.deepEqual(clone(parts.map(s=>s.laterality).sort()),['left','right']);
  const authored=historical?after.superiorTemporalMRI[suffix]:superiorTemporalMRI[suffix];
  assert.deepEqual(clone(concept.imaging.mri),clone(authored));
  for(const selected of parts){
   count++;
   assert.equal(selected.studyParentId,parent.id);
   assert.equal(selected.group,`superior-temporal-${suffix}`);
   assert(selected.sources?.[0]?.sha256,'Source-bound target required');
   if(!historical){
    const binding=currentBindings.bindings.filter(b=>b.conceptId===id&&b.study==='cerebral'&&b.structure.id===selected.id);
    assert.equal(binding.length,1,'One current teaching binding per target');
    assert.equal(binding[0].parentId,parent.id);
    assert.deepEqual(clone(binding[0].structure),clone(selected),'Current source identity matches teaching binding');
    const reviewGroup=currentReviewBindings.groups.find(g=>g.key===group.key);
    assert.equal(reviewGroup?.parent.id,parent.id);
    assert(reviewGroup.selections.some(s=>s.id===selected.id&&/^[a-f0-9]{64}$/.test(s.sourceToken)));
   }
   const resolved=api.nestedTeachingFor(parent,'cerebral',selected);
   assert.equal(resolved?.id,id);
   const lesson=api.nestedTopicLesson(resolved,'mri');
   assert.equal(lesson.readiness,'draft');
   assert.equal(lesson.body,authored.body);
   assert.match(lesson.body,/Sylvian fissure/);
   assert.match(lesson.body,/superior temporal sulcus/);
   if(suffix==='posterior'){
    assert.match(lesson.body,/not a complete Wernicke area/);
    assert.match(lesson.body,/No MRI signal or registered scan/);
   }
   const citations=authored.references.map(ref=>api.nestedTeachingReferences[ref].url);
   assert.deepEqual(clone(lesson.citations),clone(citations));
   assert(citations.includes(api.nestedTeachingReferences.superiorTemporalLandmarks.url));
   const html=renderToStaticMarkup(React.createElement(api.NestedTeaching,{
    parent,study:'cerebral',selected,initialTopic:'mri'}));
   assert(html.includes('Sylvian fissure'));
   for(const url of citations)assert(html.includes(url));
   const packet=await api.nestedReviewMaterial(group.key,selected.id);
   assert.equal(packet.teaching.topics.find(t=>t.tab==='mri').body,lesson.body);
   assert.equal(packet.context.revisions.imaging,null);
   assert(packet.context.blockers.imaging.length);
   assert.equal(await api.nestedReviewSelection(group.key,selected.id,'0'.repeat(64)),null);
   for(const change of [s=>s.fmaId='FMA0',s=>s.laterality='unknown',s=>s.sources[0].sha256='0'.repeat(64),s=>s.sources[0].file='FOREIGN']){
    const stale=clone(selected);change(stale);
    assert.equal(api.nestedTeachingFor(parent,'cerebral',stale),null);
   }
   if(historical){
    for(const topic of ['ct','xray','ultrasound'])
     assert.equal(api.nestedTopicLesson(resolved,topic).readiness,'pending');
   }else{
    assert.deepEqual(clone(resolved.imaging.ct),clone(nestedCTOrientation[id]));
    const ct=api.nestedTopicLesson(resolved,'ct');
    assert.equal(ct.readiness,'draft');
    assert.equal(ct.body,nestedCTOrientation[id].body);
    assert.deepEqual(clone(ct.citations),nestedCTOrientation[id].references.map(ref=>api.nestedTeachingReferences[ref].url));
    assert.equal(api.nestedTopicLesson(resolved,'xray').readiness,'pending');
    assert.deepEqual(clone(resolved.imaging.ultrasound),clone(cerebralDetailSections[id]));
    const ultrasound=api.nestedTopicLesson(resolved,'ultrasound');
    assert.equal(ultrasound.readiness,'draft');
    assert.equal(ultrasound.body,cerebralDetailSections[id].body);
    assert.deepEqual(clone(ultrasound.citations),cerebralDetailSections[id].references.map(ref=>api.nestedTeachingReferences[ref].url));
   }
  }
 }
 assert.equal(count,4);
 return count;
}
const historicalSelections=await selections(after,true);
const current=await loadCurrent();
const currentSelections=await selections(current,false);
assert.equal(currentBindings.schemaVersion,1);
assert.equal(currentReviewBindings.schema,'vm-nested-review-links-1');
console.log(JSON.stringify({passed:true,historicalSelections,currentSelections,
 newDraftPlacements:2,improvedDraftPlacements:2,clinicalApproval:false}));
