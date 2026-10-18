import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import * as links from '../lib/head-atlas-links.ts';
import {HEAD_TEACHING_REVISION,headTeachingPacket} from '../lib/head-atlas-teaching.ts';
import {HEAD_LEARNING_REVISION,headLearningPacket} from '../lib/head-atlas-learning.ts';
import {headTeachingDraftContext} from '../lib/head-teaching-review-contract.ts';
import {HEAD_MRI_COMPARISON_REVISION,headMriComparisonPacket,verifiedHeadMriComparisonPacket} from '../lib/head-mri-comparison-review.ts';
import {HEAD_MRI_ONLY_TEACHING_REVISION} from '../lib/head-mri-only-teaching.ts';
import * as mriLearning from '../lib/head-mri-learning.ts';
import * as learning from '../lib/head-atlas-learning.ts';
import {headReviewImageLinkModule} from './head-review-image-link-loader.ts';

const require=createRequire(import.meta.url);
const ids=['limbic-left-amygdala','limbic-right-amygdala','commissure-corpus-callosum','endocrine-pituitary-gland'];
const source=readFileSync(new URL('../lib/head-mri-comparison-review.ts',import.meta.url),'utf8');

function isolated(overrides:Partial<typeof links>){
  const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{} as typeof import('../lib/head-mri-comparison-review.ts')};
  new Function('require','module','exports',compiled)((name:string)=>name==='./head-atlas-links.ts'?{...links,...overrides}:require(name),mod,mod.exports);
  return mod.exports;
}

test('independent packet pins four exact MRI identities, standalone sources and a canonical draft hash',async()=>{
  const packet=headMriComparisonPacket();
  assert.equal(packet.schema,'vm-head-mri-comparison-review-1');
  assert.equal(packet.packetId,'head-mri-only-comparisons');
  assert.equal(packet.status,'draft');
  assert.equal(packet.headRevision,links.HEAD_LINK_REVISION);
  assert.equal(packet.patientRegistration,false);
  assert.equal(packet.clinicalApproval,false);
  assert.equal(packet.publicationApproval,false);
  assert.match(packet.scope,/unregistered|no patient-space registration/);
  assert.match(packet.scope,/No exact whole-concept CT binding/);
  assert.equal(packet.reviewChecks.length,5);
  assert.deepEqual(packet.items.map(item=>item.conceptId),ids);
  assert.equal(new Set(packet.items.map(item=>item.nativeId)).size,4);
  const expected=[
    ['mrb.dgm.amygdala.left','Left amygdala — regional mask','left','mask','left:organ:left-amygdala','head-neck-nerves-deep-brain','6046dacb923f5103acb3b86dadf2817b5f0c133af88e0d225170cf331fbd0e3c'],
    ['mrb.dgm.amygdala.right','Right amygdala — regional mask','right','mask','right:organ:right-amygdala','head-neck-nerves-deep-brain','6046dacb923f5103acb3b86dadf2817b5f0c133af88e0d225170cf331fbd0e3c'],
    ['mrb.wmt.corpus_callosum','Corpus callosum — regional mask','midline_or_unpaired','partial-mask','midline:organ:corpus-callosum','head-neck-nerves-deep-brain','6046dacb923f5103acb3b86dadf2817b5f0c133af88e0d225170cf331fbd0e3c'],
    ['mrb.orb.pituitary_gland','Pituitary gland — regional mask','midline_or_unpaired','mask','unpaired:organ:pituitary-gland','head-neck-organs-recovery','7fe91d4bfe3a5aa96bc77b83d10ab07775892328acc081dab6fb92b0c0c40915'],
  ];
  for(const [index,item] of packet.items.entries()){
    const [nativeId,rawLabel,laterality,representation,atlasTail,bundle,sourceHash]=expected[index];
    assert.deepEqual([item.nativeId,item.rawLabel,item.laterality,item.representation,item.atlasId,item.atlasBundle,item.atlasSource],
      [nativeId,rawLabel,laterality,representation,`vm:anatomy:body:head-neck:${atlasTail}`,bundle,sourceHash]);
    assert.deepEqual(item.binding,links.headConceptById(item.conceptId));
    assert.equal(item.binding?.ctHref,undefined);
    assert.equal(Object.hasOwn(item.binding!,'ctHref'),false);
    assert.equal(item.binding?.mriHref,`/atlas/mri-head?concept=${item.conceptId}`);
    const atlas=new URL(item.binding!.atlasHref,'https://example.invalid').searchParams;
    assert.deepEqual(Object.fromEntries(atlas),{study:'1',structure:item.atlasId,
      side:item.laterality==='midline_or_unpaired'?'both':item.laterality,source:item.atlasSource,concept:item.conceptId});
  }
  assert.equal(HEAD_MRI_COMPARISON_REVISION,'599dcb6159ba58b16bd26d67810238155911c4d011dd03f7172faa554f6b531f');
  assert.equal(createHash('sha256').update(JSON.stringify(packet)).digest('hex'),HEAD_MRI_COMPARISON_REVISION);
  assert.deepEqual(await verifiedHeadMriComparisonPacket(links.HEAD_LINK_REVISION),packet);
  assert.equal(await verifiedHeadMriComparisonPacket('stale'),null);
  assert.equal(await verifiedHeadMriComparisonPacket(links.HEAD_LINK_REVISION+'0'),null);
  assert(!/patientId|scanId|filename|filePath|pixels|coordinates|localStorage|sessionStorage|fetch\(/i.test(JSON.stringify(packet)));
});

test('verification fails closed on altered native identity, invented CT href, MRI href or Atlas source',async()=>{
  const native=isolated({headAtlasConcept:()=>null});
  assert.equal(await native.verifiedHeadMriComparisonPacket(links.HEAD_LINK_REVISION),null);
  for(const changed of [
    (item:NonNullable<ReturnType<typeof links.headConceptById>>)=>({...item,ctHref:'/atlas/ct-head?concept='+item.conceptId}),
    (item:NonNullable<ReturnType<typeof links.headConceptById>>)=>({...item,mriHref:'/atlas/mri-head?concept=wrong'}),
    (item:NonNullable<ReturnType<typeof links.headConceptById>>)=>({...item,atlasHref:item.atlasHref.replace('source=','source=stale')}),
  ]){
    const mod=isolated({headConceptById:(id:string)=>{const current=links.headConceptById(id);return current&&id===ids[0]?changed(current):current;}});
    assert.equal(await mod.verifiedHeadMriComparisonPacket(links.HEAD_LINK_REVISION),null);
  }
  const changedScope=(id:string)=>{const current=links.headConceptById(id);return current&&id===ids[0]?{...current,scopeNote:current.scopeNote+' altered'}:current;};
  const digestOnly=isolated({headConceptById:changedScope,headAtlasConcept:(entry,modality)=>{
    const current=links.headAtlasConcept(entry,modality);
    return current&&current.conceptId===ids[0]?{...current,scopeNote:current.scopeNote+' altered'}:current;
  }});
  assert.equal(await digestOnly.verifiedHeadMriComparisonPacket(links.HEAD_LINK_REVISION),null,
    'matching native and packet bindings still fail the canonical digest when scope text changes');
});

test('packet calls return fresh objects and existing teaching and guided identities remain independent',async()=>{
  const first=headMriComparisonPacket();
  (first.items[0] as {rawLabel:string}).rawLabel='Mutated caller copy';
  (first.items[0].binding as {mriHref:string}).mriHref='bad';
  (first.reviewChecks as string[])[0]='Mutated caller checklist';
  const second=headMriComparisonPacket();
  assert.equal(second.items[0].rawLabel,'Left amygdala — regional mask');
  assert.equal(second.items[0].binding?.mriHref,'/atlas/mri-head?concept=limbic-left-amygdala');
  assert.match(second.reviewChecks[0],/native MRI ID/);
  const teaching=headTeachingPacket(),guided=headLearningPacket(),context=await headTeachingDraftContext(links.HEAD_LINK_REVISION);
  assert.equal(teaching.content.notes.length,25);
  assert.equal(guided.sequences.flatMap(sequence=>sequence.concepts).length,25);
  assert.equal(context.conceptIds.length,25);
  assert.equal(HEAD_TEACHING_REVISION,'2d6f59ea907384c10eccad3ebb1367e3118be6fe9c6dec61262e9c43bfcda77a');
  assert.equal(HEAD_LEARNING_REVISION,'47bae289d0e9bf2bf83596cd9bdbdb93e7a968b57507a55e26700af445763052');
  assert.equal(createHash('sha256').update(JSON.stringify(teaching)).digest('hex'),HEAD_TEACHING_REVISION);
  assert.equal(createHash('sha256').update(JSON.stringify(guided)).digest('hex'),HEAD_LEARNING_REVISION);
  for(const id of ids)assert(!context.conceptIds.includes(id));
});

test('actual read-only review renders four collapsed bindings, own limits and no CT or saved decision',()=>{
  const component=readFileSync(new URL('../components/HeadMriComparisonReview.tsx',import.meta.url),'utf8');
  const compiled=ts.transpileModule(component,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{} as {HeadMriComparisonReview:(props:{packet:ReturnType<typeof headMriComparisonPacket>|null;teachingRevision?:string|null;learningRevision?:string|null})=>React.ReactNode}};
  new Function('require','module','exports',compiled)((name:string)=>name==='../lib/head-mri-comparison-review'?{HEAD_MRI_COMPARISON_REVISION}:name==='../lib/head-mri-only-teaching'?{HEAD_MRI_ONLY_TEACHING_REVISION}:name==='../lib/head-mri-learning'?mriLearning:name==='../lib/head-atlas-learning'?learning:name==='./HeadAtlasTeaching'?{HeadAtlasTeaching:()=>React.createElement('span',null,'Verified MRI teaching fixture')}:name==='./HeadReviewImageLink'?headReviewImageLinkModule:require(name),mod,mod.exports);
  const html=renderToStaticMarkup(React.createElement(mod.exports.HeadMriComparisonReview,{packet:headMriComparisonPacket()}));
  assert.equal((html.match(/<details\b/g)??[]).length,5);
  assert.doesNotMatch(html,/<details[^>]*\sopen(?:\s|=|>)/);
  assert(html.includes(HEAD_MRI_COMPARISON_REVISION));
  assert(html.includes(links.HEAD_LINK_REVISION));
  assert.match(html,/read-only packet has no saved decision/);
  assert.match(html,/teaching form and guided-sequence packet do not approve/);
  assert.equal((html.match(/No exact CT comparison mapped/g)??[]).length,4);
  assert.equal((html.match(/Inspect [^<]+ in MRI/g)??[]).length,4);
  assert.equal((html.match(/Inspect [^<]+ in existing 3D Atlas/g)??[]).length,4);
  for(const item of headMriComparisonPacket().items){
    const id=`head-mri-comparison-${item.conceptId}`;
    const detail=html.match(new RegExp(`<details\\b[^>]*\\bid="${id}"[^>]*><summary>([^<]+)</summary>`));
    assert(detail,id);
    assert.equal(detail[1],`${item.binding!.label} · ${item.representation==='partial-mask'?'partial MRI mask':'MRI mask'}`);
    assert(html.includes(item.nativeId));
    assert(html.includes(item.atlasId));
    assert(html.includes(item.atlasSource));
    assert(html.includes(item.representation==='partial-mask'?'partial MRI mask':'MRI mask'));
  }
  assert.doesNotMatch(html,/href="\/atlas\/ct-head|href="undefined"|<form|<button|<input|<iframe|<img/);
  assert.match(html,/separate MRI-only teaching packet is unavailable or changed/);
  const teachingHtml=renderToStaticMarkup(React.createElement(mod.exports.HeadMriComparisonReview,{packet:headMriComparisonPacket(),teachingRevision:HEAD_MRI_ONLY_TEACHING_REVISION}));
  assert.equal((teachingHtml.match(/Verified MRI teaching fixture/g)??[]).length,4);
  assert(teachingHtml.includes(HEAD_MRI_ONLY_TEACHING_REVISION));
  assert(!teachingHtml.includes('separate MRI-only teaching packet is unavailable'));
  const guidedHtml=renderToStaticMarkup(React.createElement(mod.exports.HeadMriComparisonReview,{packet:headMriComparisonPacket(),learningRevision:mriLearning.HEAD_MRI_LEARNING_REVISION}));
  assert(guidedHtml.includes(mriLearning.HEAD_MRI_LEARNING_REVISION));
  assert.match(guidedHtml,/MRI-only guided sequences · separate draft/);
  assert.equal((guidedHtml.match(/Inspect MRI step/g)??[]).length,4);
  assert.equal((guidedHtml.match(/Inspect 3D step/g)??[]).length,4);
  assert.doesNotMatch(guidedHtml,/href="\/atlas\/ct-head|No saved sign-off[^<]*approved/);
  assert.match(html,/MRI-only guided sequence evidence is unavailable or changed/);
  const unavailable=renderToStaticMarkup(React.createElement(mod.exports.HeadMriComparisonReview,{packet:null}));
  assert.match(unavailable,/MRI-only comparisons unavailable/);
  assert.match(unavailable,/No targets have been substituted/);
  assert.doesNotMatch(unavailable,/id="head-mri-comparison-/);
  assert.doesNotMatch(unavailable,/Inspect .* in MRI|Comparison packet SHA-256|<form|<a /);
  assert.doesNotMatch(component,/localStorage|sessionStorage|fetch\(|postMessage|dangerouslySetInnerHTML/);
});
