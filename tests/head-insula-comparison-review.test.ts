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
import {HEAD_MRI_COMPARISON_REVISION,headMriComparisonPacket} from '../lib/head-mri-comparison-review.ts';
import {HEAD_MRI_ONLY_TEACHING_REVISION,headMriOnlyTeachingPacket} from '../lib/head-mri-only-teaching.ts';
import {HEAD_MRI_LEARNING_REVISION,headMriLearningPacket} from '../lib/head-mri-learning.ts';
import {HEAD_INSULA_COMPARISON_REVISION,headInsulaComparisonPacket,verifiedHeadInsulaComparisonPacket} from '../lib/head-insula-comparison-review.ts';
import {HEAD_INSULA_TEACHING_REVISION,headInsulaTeachingContent} from '../lib/head-insula-teaching.ts';
import * as insulaLearning from '../lib/head-insula-learning.ts';
import * as learning from '../lib/head-atlas-learning.ts';
import {headReviewImageLinkModule} from './head-review-image-link-loader.ts';

const require=createRequire(import.meta.url);
const panelSource=readFileSync(new URL('../components/HeadPairedDecisionPanel.tsx',import.meta.url),'utf8');
const panelModule={exports:{} as {HeadPairedDecisionPanel:React.ComponentType<any>}};
new Function('require','module','exports',ts.transpileModule(panelSource,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText)((name:string)=>name==='../lib/head-paired-decision-contract'||name==='./HeadPairedDecisionForm'?{}:require(name),panelModule,panelModule.exports);
const Panel=panelModule.exports.HeadPairedDecisionPanel;
const source=readFileSync(new URL('../lib/head-insula-comparison-review.ts',import.meta.url),'utf8');
const root='vm:anatomy:body:head-neck:';
const parent=`${root}midline:organ:brain`;
const parentSource='f68b34d46c0c6273b687e3c8c890541a34cb2c66cbb383a5a9783e4a5990d335';
const partSource='7a62de7b68d7fe823b299ad5dfc9eb628db7a105d120f571789eacf7b3314410';
const cases=(['left','right'] as const).map(side=>({
  side,conceptId:`cortex-${side}-insula`,label:`${side==='left'?'Left':'Right'} insula — regional mask`,
  part:`${root}${side}:organ:${side}-insula`,
  ctId:`cth.ctx.insula.${side}`,mriId:`mrb.ctx.insula.${side}`,
}));

function isolated(overrides:Partial<typeof links>){
  const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{} as typeof import('../lib/head-insula-comparison-review.ts')};
  new Function('require','module','exports',compiled)((name:string)=>name==='./head-atlas-links.ts'?{...links,...overrides}:require(name),mod,mod.exports);
  return mod.exports;
}

test('own revision pins two exact native CT masks, partial MRI masks and nested cerebral sources',async()=>{
  const packet=headInsulaComparisonPacket();
  assert.equal(packet.schema,'vm-head-insula-comparison-review-1');
  assert.equal(packet.packetId,'head-insula-comparisons');
  assert.equal(packet.status,'draft');
  assert.equal(packet.headRevision,links.HEAD_LINK_REVISION);
  assert.equal(packet.patientRegistration,false);
  assert.equal(packet.clinicalApproval,false);
  assert.equal(packet.publicationApproval,false);
  assert.match(packet.scope,/separate|different|unregistered/i);
  assert.match(packet.scope,/partial MRI|MRI.*partial/i);
  assert(packet.reviewChecks.length>=3);
  assert.deepEqual(packet.items.map(item=>item.conceptId),cases.map(item=>item.conceptId));
  for(const [index,item] of packet.items.entries()){
    const expected=cases[index];
    assert.deepEqual(item.ct,{id:expected.ctId,label:expected.label,laterality:expected.side,representation:'mask'});
    assert.deepEqual(item.mri,{id:expected.mriId,label:expected.label,laterality:expected.side,representation:'partial-mask'});
    assert.deepEqual(item.atlas,{parentId:parent,parentSource,partId:expected.part,partSource,detail:'cerebral'});
    assert.deepEqual(item.binding,links.headConceptById(expected.conceptId));
    assert.equal(item.binding?.ctHref,`/atlas/ct-head?concept=${expected.conceptId}`);
    assert.equal(item.binding?.mriHref,`/atlas/mri-head?concept=${expected.conceptId}`);
    assert.deepEqual(Object.fromEntries(new URL(item.binding!.atlasHref,'https://example.invalid').searchParams),{
      study:'2',structure:parent,side:expected.side,source:parentSource,
      detail:'cerebral',part:expected.part,partSource,concept:expected.conceptId,
    });
  }
  assert.equal(HEAD_INSULA_COMPARISON_REVISION,'000ef8732b522db2396d7315727c18d7d09b79e5b9916bba381450fe730d11c1');
  assert.equal(createHash('sha256').update(JSON.stringify(packet)).digest('hex'),HEAD_INSULA_COMPARISON_REVISION);
  assert.deepEqual(await verifiedHeadInsulaComparisonPacket(links.HEAD_LINK_REVISION),packet);
  assert.equal(await verifiedHeadInsulaComparisonPacket('stale'),null);
  assert.equal(await verifiedHeadInsulaComparisonPacket(links.HEAD_LINK_REVISION+'0'),null);
  assert(!/patientId|scanId|filename|filePath|pixels|coordinates|localStorage|sessionStorage|fetch\(/i.test(JSON.stringify(packet)));
});

test('verification refuses changed native masks, stale source tuple and changed binding text',async()=>{
  const native=isolated({headAtlasConcept:()=>null});
  assert.equal(await native.verifiedHeadInsulaComparisonPacket(links.HEAD_LINK_REVISION),null);
  for(const changed of [
    (item:NonNullable<ReturnType<typeof links.headConceptById>>)=>({...item,ctHref:'/atlas/ct-head?concept=wrong'}),
    (item:NonNullable<ReturnType<typeof links.headConceptById>>)=>({...item,mriHref:'/atlas/mri-head?concept=wrong'}),
    (item:NonNullable<ReturnType<typeof links.headConceptById>>)=>({...item,atlasHref:item.atlasHref.replace('source=','source=stale')}),
    (item:NonNullable<ReturnType<typeof links.headConceptById>>)=>({...item,atlasHref:item.atlasHref.replace('partSource=','partSource=stale')}),
    (item:NonNullable<ReturnType<typeof links.headConceptById>>)=>({...item,atlasHref:item.atlasHref.replace('part=','part=stale')}),
  ]){
    const mod=isolated({headConceptById:(id:string)=>{
      const current=links.headConceptById(id);
      return current&&id===cases[0].conceptId?changed(current):current;
    }});
    assert.equal(await mod.verifiedHeadInsulaComparisonPacket(links.HEAD_LINK_REVISION),null);
  }
  const changedScope=(id:string)=>{
    const current=links.headConceptById(id);
    return current&&id===cases[0].conceptId?{...current,scopeNote:current.scopeNote+' altered'}:current;
  };
  const digestOnly=isolated({headConceptById:changedScope,headAtlasConcept:(entry,modality)=>{
    const current=links.headAtlasConcept(entry,modality);
    return current&&current.conceptId===cases[0].conceptId?{...current,scopeNote:current.scopeNote+' altered'}:current;
  }});
  assert.equal(await digestOnly.verifiedHeadInsulaComparisonPacket(links.HEAD_LINK_REVISION),null);
});

test('packet returns fresh copies without changing original-25 and MRI-four review scopes',()=>{
  const first=headInsulaComparisonPacket();
  (first.items[0].ct as {label:string}).label='mutated';
  (first.items[0].mri as {representation:string}).representation='mask';
  (first.items[0].atlas as {partSource:string}).partSource='stale';
  (first.items[0].binding as {ctHref:string}).ctHref='bad';
  (first.reviewChecks as string[])[0]='mutated';
  const second=headInsulaComparisonPacket();
  assert.equal(second.items[0].ct.label,cases[0].label);
  assert.equal(second.items[0].mri.representation,'partial-mask');
  assert.equal(second.items[0].atlas.partSource,partSource);
  assert.equal(second.items[0].binding?.ctHref,`/atlas/ct-head?concept=${cases[0].conceptId}`);
  assert.notEqual(second.reviewChecks[0],'mutated');

  const existing=[
    [headTeachingPacket(),HEAD_TEACHING_REVISION,25],
    [headLearningPacket(),HEAD_LEARNING_REVISION,5],
    [headMriComparisonPacket(),HEAD_MRI_COMPARISON_REVISION,4],
    [headMriOnlyTeachingPacket(),HEAD_MRI_ONLY_TEACHING_REVISION,4],
    [headMriLearningPacket(),HEAD_MRI_LEARNING_REVISION,2],
  ] as const;
  for(const [packet,revision] of existing){
    assert.equal(createHash('sha256').update(JSON.stringify(packet)).digest('hex'),revision);
    assert.notEqual(HEAD_INSULA_COMPARISON_REVISION,revision);
  }
  assert.equal(headTeachingPacket().content.notes.length,25);
  assert.equal(headLearningPacket().sequences.length,5);
  assert.equal(headMriComparisonPacket().items.length,4);
  assert.equal(headMriOnlyTeachingPacket().content.notes.length,4);
  assert.equal(headMriLearningPacket().sequences.length,2);
  for(const id of cases.map(item=>item.conceptId)){
    assert(!headTeachingPacket().content.notes.some(note=>note.conceptId===id));
    assert(!headLearningPacket().sequences.some(sequence=>sequence.concepts.includes(id)));
    assert(!headMriComparisonPacket().items.some(item=>item.conceptId===id));
    assert(!headMriOnlyTeachingPacket().content.notes.some(note=>note.conceptId===id));
    assert(!headMriLearningPacket().sequences.some(sequence=>sequence.concepts.includes(id)));
  }
});

test('component renders collapsed exact evidence, lazy review actions and an unavailable alert',()=>{
  const component=readFileSync(new URL('../components/HeadInsulaComparisonReview.tsx',import.meta.url),'utf8');
  const compiled=ts.transpileModule(component,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{} as {HeadInsulaComparisonReview:(props:{packet:ReturnType<typeof headInsulaComparisonPacket>|null;teachingRevision?:string|null;learningRevision?:string|null})=>React.ReactNode}};
  new Function('require','module','exports',compiled)((name:string)=>name==='../lib/head-insula-comparison-review'?{HEAD_INSULA_COMPARISON_REVISION}:name==='../lib/head-insula-teaching'?{HEAD_INSULA_TEACHING_REVISION}:name==='../lib/head-insula-learning'?insulaLearning:name==='../lib/head-atlas-learning'?learning:name==='./HeadAtlasTeaching'?{HeadAtlasTeaching:({conceptId,modality}:{conceptId:string;modality:string})=>React.createElement('span',null,`Verified insula teaching ${conceptId} ${modality}`)}:name==='./HeadPairedDecisionPanel'?{HeadPairedDecisionPanel:Panel}:name==='./HeadReviewImageLink'?headReviewImageLinkModule:require(name),mod,mod.exports);
  const html=renderToStaticMarkup(React.createElement(mod.exports.HeadInsulaComparisonReview,{packet:headInsulaComparisonPacket()}));
  assert((html.match(/<details\b/g)??[]).length>=2);
  assert.doesNotMatch(html,/<details[^>]*\sopen(?:\s|=|>)/);
  assert(html.includes(HEAD_INSULA_COMPARISON_REVISION));
  assert(html.includes(links.HEAD_LINK_REVISION));
  for(const item of headInsulaComparisonPacket().items){
    const id=`head-insula-comparison-${item.conceptId}`;
    const detail=html.match(new RegExp(`<details\\b[^>]*\\bid="${id}"[^>]*><summary>([^<]+)</summary>`));
    assert(detail,id);
    assert.equal(detail[1],`${item.binding!.label} · CT mask / partial MRI mask`);
    const binding=item.binding;
    assert(binding);
    const {ctHref,mriHref,atlasHref}=binding;
    assert(ctHref);
    assert(mriHref);
    assert(html.includes(item.ct.id));
    assert(html.includes(item.mri.id));
    assert(html.includes(item.atlas.parentId));
    assert(html.includes(item.atlas.partId));
    assert(html.includes(item.atlas.parentSource));
    assert(html.includes(item.atlas.partSource));
    assert(html.includes(ctHref.replaceAll('&','&amp;')));
    assert(html.includes(mriHref.replaceAll('&','&amp;')));
    assert(html.includes(atlasHref.replaceAll('&','&amp;')));
  }
  assert.match(html,/partial.mask|partial MRI/i);
  assert.match(html,/Insula teaching is unavailable or changed/);
  assert.match(html,/Insula guided sequence is unavailable or changed/);
  assert(!html.includes('Verified insula teaching'));
  const taught=renderToStaticMarkup(React.createElement(mod.exports.HeadInsulaComparisonReview,{packet:headInsulaComparisonPacket(),teachingRevision:HEAD_INSULA_TEACHING_REVISION}));
  assert.equal((taught.match(/Verified insula teaching/g)??[]).length,4);
  assert(taught.includes(HEAD_INSULA_TEACHING_REVISION));
  assert.equal((taught.match(/· CT teaching/g)??[]).length,2);
  assert.equal((taught.match(/· MRI teaching/g)??[]).length,2);
  for(const note of headInsulaTeachingContent.notes){assert(taught.includes(note.conceptId));}
  const stale=renderToStaticMarkup(React.createElement(mod.exports.HeadInsulaComparisonReview,{packet:headInsulaComparisonPacket(),teachingRevision:'stale'}));
  assert(stale.includes(HEAD_INSULA_COMPARISON_REVISION));
  assert(!stale.includes('Verified insula teaching'));
  assert.match(stale,/Insula teaching is unavailable or changed/);
  const guided=renderToStaticMarkup(React.createElement(mod.exports.HeadInsulaComparisonReview,{packet:headInsulaComparisonPacket(),learningRevision:insulaLearning.HEAD_INSULA_LEARNING_REVISION}));
  assert(guided.includes(insulaLearning.HEAD_INSULA_LEARNING_REVISION));
  assert.match(guided,/Insula guided sequence · separate draft/);
  for(const conceptId of insulaLearning.headInsulaLearningSequences[0].concepts){
    const hrefs=learning.headLearningLinks({sequenceId:'insulae',conceptId});assert(hrefs);
    for(const href of [hrefs.atlasHref,hrefs.ctHref,hrefs.mriHref])assert(guided.includes(href!.replaceAll('&','&amp;')));
  }
  const staleLearning=renderToStaticMarkup(React.createElement(mod.exports.HeadInsulaComparisonReview,{packet:headInsulaComparisonPacket(),learningRevision:'stale'}));
  assert.match(staleLearning,/Insula guided sequence is unavailable or changed/);
  assert(!staleLearning.includes('Inspect 3D step'));
  assert(!html.includes('Inspect 3D step'));
  assert.doesNotMatch(html,/<form|<input|<iframe|<img|<textarea/);
  assert.equal((html.match(/<button/g)??[]).length,2);
  const unavailable=renderToStaticMarkup(React.createElement(mod.exports.HeadInsulaComparisonReview,{packet:null}));
  assert.match(unavailable,/unavailable/i);
  assert.doesNotMatch(unavailable,/id="head-insula-comparison-/);
  assert.doesNotMatch(unavailable,/<a\b|<form|<button|<input|<iframe|<img/);
  assert.doesNotMatch(unavailable,/cth\.ctx\.insula|mrb\.ctx\.insula|vm:anatomy:body:head-neck/);
  assert.doesNotMatch(component,/localStorage|sessionStorage|fetch\(|postMessage|dangerouslySetInnerHTML/);
});
