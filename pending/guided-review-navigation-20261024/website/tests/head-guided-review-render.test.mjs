import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {createRequire} from 'node:module';import {createHash} from 'node:crypto';
import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import ts from 'typescript';
const require=createRequire(import.meta.url),read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const libraries=new Map();
for(const name of ['head-atlas-links','head-atlas-teaching','head-atlas-learning','head-brainstem-clinical','head-ventricular-clinical','head-mri-comparison-review','head-mri-only-teaching','head-mri-learning','head-insula-comparison-review','head-insula-teaching','head-insula-learning','head-orbital-comparison-review','head-orbital-teaching','head-orbital-learning','head-ct-bone-learning','head-image-only-comparison-review','head-image-only-links','head-cerebellar-teaching','head-cerebellar-learning'])libraries.set(name,await import('../lib/'+name+'.ts'));
const library=name=>libraries.get(name);
function component(name){
 const source=read('components/'+name+'.tsx');
 const module={exports:{}};new Function('require','module','exports',ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText)(specifier=>{
  if(specifier.startsWith('../lib/')){const key=specifier.slice(7).replace(/\.ts$/,'');assert(libraries.has(key),specifier);return library(key);}
  if(specifier==='./HeadTeachingReviewNavigator')return {HeadTeachingReviewNavigator:component('HeadTeachingReviewNavigator')};
  // Unchanged decision/teaching/link children are not under test here. This is
  // actual sequence-renderer coverage, not a signed-in/private-form replay.
  const child=specifier.replace('./','');if(['HeadPairedDecisionPanel','HeadAtlasTeaching','HeadReviewImageLink'].includes(child))return {[child]:()=>null};
  return require(specifier);
 },module,module.exports);return module.exports[name];
}
const base=library('head-atlas-learning'),mri=library('head-mri-learning'),insula=library('head-insula-learning'),orbital=library('head-orbital-learning'),bone=library('head-ct-bone-learning'),cerebellar=library('head-cerebellar-learning'),revision=library('head-atlas-links').HEAD_LINK_REVISION;
const cases=[
 ['base','HeadAtlasTeachingReview',base.headLearningSequences,{revision},base.HEAD_LEARNING_REVISION],
 ['MRI','HeadMriComparisonReview',mri.headMriLearningSequences,{packet:library('head-mri-comparison-review').headMriComparisonPacket()},mri.HEAD_MRI_LEARNING_REVISION],
 ['insula','HeadInsulaComparisonReview',insula.headInsulaLearningSequences,{packet:library('head-insula-comparison-review').headInsulaComparisonPacket()},insula.HEAD_INSULA_LEARNING_REVISION],
 ['orbital','HeadOrbitalComparisonReview',orbital.headOrbitalLearningSequences,{packet:library('head-orbital-comparison-review').headOrbitalComparisonPacket()},orbital.HEAD_ORBITAL_LEARNING_REVISION],
 ['CT bone','HeadCtBoneLearningReview',bone.headCtBoneLearningSequences,{manifestRevision:revision},bone.HEAD_CT_BONE_LEARNING_REVISION],
 ['cerebellar','HeadImageOnlyComparisonReview',cerebellar.headCerebellarLearningSequences,{packet:library('head-image-only-links').headImageOnlyComparisonPacket()},cerebellar.HEAD_CEREBELLAR_LEARNING_REVISION],
];
const escape=value=>value.replaceAll('&','&amp;').replaceAll('"','&quot;');
for(const[label,name,sequences,props,learningRevision]of cases)test(label+': actual renderer exposes exactly one anchor and exact available links for each sequence',async()=>{
 const View=component(name),output=renderToStaticMarkup(await View({...props,learningRevision}));
 assert.equal((output.match(/id="head-guided-sequence-/g)??[]).length,sequences.length);
 for(const sequence of sequences){
  assert.equal(output.split('id="head-guided-sequence-'+sequence.id+'"').length-1,1);
  for(const conceptId of sequence.concepts){const links=base.headLearningLinks({sequenceId:sequence.id,conceptId});assert(links);for(const key of ['atlasHref','ctHref','mriHref'])if(links[key])assert(output.includes(escape(links[key])),sequence.id+': '+key);}
 }
 const stale={...props,learningRevision:'0'.repeat(64)};if(label==='base')stale.revision='stale';if(label==='CT bone')stale.manifestRevision='stale';
 const hidden=renderToStaticMarkup(await View(stale));assert(!hidden.includes('id="head-guided-sequence-'),'Stale sequence is not given a destination');
 if(label!=='base'&&label!=='CT bone')assert(!renderToStaticMarkup(await View({...props,packet:null,learningRevision})).includes('id="head-guided-sequence-'));
});
test('all packet anchors are globally unique and every rendered source is in the exact Review binding',()=>{
 const ids=cases.flatMap(([, ,sequences])=>sequences.map(s=>'head-guided-sequence-'+s.id));assert.equal(new Set(ids).size,ids.length);
 const binding=JSON.parse(read('atlas-review/integration-inputs.json'));
 for(const path of [...cases.map(([,name])=>'components/'+name+'.tsx'),...['head-mri','head-insula','head-orbital','head-ct-bone','head-cerebellar'].map(n=>'lib/'+n+'-learning.ts')]){
  const rows=binding.inputs.filter(r=>r.path===path);assert.equal(rows.length,1,path);assert.equal(rows[0].sha256,createHash('sha256').update(read(path)).digest('hex'),path);
 }
});
