import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import * as packet from '../lib/head-ct-bone-comparison-review.ts';
import * as links from '../lib/head-atlas-links.ts';
import * as teaching from '../lib/head-atlas-teaching.ts';
import * as learning from '../lib/head-atlas-learning.ts';
import * as boneTeaching from '../lib/head-ct-bone-teaching.ts';
import {headReviewImageLinkModule} from './head-review-image-link-loader.ts';

const require=createRequire(import.meta.url);
const load=(path:string,imports:Record<string,unknown>,transform=(s:string)=>s)=>{
  const source=transform(readFileSync(new URL('../'+path,import.meta.url),'utf8'));
  const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{} as any};new Function('require','module','exports',code)((id:string)=>imports[id]??require(id),mod,mod.exports);return mod.exports;
};
const Panel=load('components/HeadCtBoneDecisionPanel.tsx',{'../lib/head-ct-bone-decision-contract':{},'./HeadCtBoneDecisionForm':{}}).HeadCtBoneDecisionPanel;
const TeachingPanel=load('components/HeadCtBoneTeachingDecisionPanel.tsx',{'../lib/head-ct-bone-teaching-decision-contract':{},'./HeadCtBoneTeachingDecisionForm':{}}).HeadCtBoneTeachingDecisionPanel;
const Review=load('components/HeadCtBoneComparisonReview.tsx',{'../lib/head-ct-bone-comparison-review':packet,'../lib/head-ct-bone-teaching':boneTeaching,'./HeadAtlasTeaching':{HeadAtlasTeaching:()=>null},'./HeadCtBoneDecisionPanel':{HeadCtBoneDecisionPanel:Panel},'./HeadCtBoneTeachingDecisionPanel':{HeadCtBoneTeachingDecisionPanel:TeachingPanel},'./HeadCtBoneLearningReview':{HeadCtBoneLearningReview:()=>null},'./HeadReviewImageLink':headReviewImageLinkModule}).HeadCtBoneComparisonReview;
const navigatorModule=load('components/HeadTeachingReviewNavigator.tsx',{});
const Shell=load('components/HeadAtlasTeachingReview.tsx',{'../lib/head-atlas-teaching':teaching,'../lib/head-atlas-learning':learning,'./HeadTeachingReviewNavigator':navigatorModule,'./HeadReviewImageLink':headReviewImageLinkModule}).HeadAtlasTeachingReview;

test('independent six-binding packet verifies its exact digest and refuses stale or altered sources',async()=>{
  const current=packet.headCtBoneComparisonPacket();assert.equal(current.items.length,6);
  assert.equal(current.clinicalApproval,false);assert.equal(current.publicationApproval,false);assert.equal(current.patientRegistration,false);
  assert.equal(createHash('sha256').update(JSON.stringify(current)).digest('hex'),packet.HEAD_CT_BONE_COMPARISON_REVISION);
  assert.deepEqual(await packet.verifiedHeadCtBoneComparisonPacket(links.HEAD_LINK_REVISION),current);
  assert.equal(await packet.verifiedHeadCtBoneComparisonPacket('stale'),null);
  for(const change of [
    (s:string)=>s.replace('Every CT mask is partial','Every CT mask is complete'),
    (s:string)=>s.replace('cth.skl.parietal_bone.left','cth.skl.parietal_bone.right'),
    (s:string)=>s.replace("sourceHash='c1b950", "sourceHash='a1b950"),
  ]){
    const altered=load('lib/head-ct-bone-comparison-review.ts',{'./head-atlas-links.ts':links},change);
    assert.equal(await altered.verifiedHeadCtBoneComparisonPacket(links.HEAD_LINK_REVISION),null);
  }
  for(const change of [
    (binding:any)=>({...binding,mriHref:'/atlas/mri-head?concept=bone-occipital'}),
    (binding:any)=>({...binding,ctHref:'/atlas/ct-head?concept=wrong'}),
    (binding:any)=>({...binding,atlasHref:'/atlas/head-neck-3d?study=1'}),
  ]){
    const altered=load('lib/head-ct-bone-comparison-review.ts',{'./head-atlas-links.ts':{...links,headConceptById:(id:string)=>change(links.headConceptById(id))}});
    assert.equal(await altered.verifiedHeadCtBoneComparisonPacket(links.HEAD_LINK_REVISION),null);
  }
});

test('collapsed evidence reaches all six targets and lazy review buttons, without eager forms or MRI links',()=>{
  const current=packet.headCtBoneComparisonPacket();
  const additionalTargets=current.items.map(item=>({id:'head-ct-bone-comparison-'+item.conceptId,label:item.binding!.label+' · CT-only bone evidence'}));
  const html=renderToStaticMarkup(React.createElement(Shell,{revision:links.HEAD_LINK_REVISION,ctBoneReview:React.createElement(Review,{packet:current}),additionalTargets}));
  assert(html.includes('href="#ct-bone-comparisons"'));assert(html.includes(packet.HEAD_CT_BONE_COMPARISON_REVISION));
  for(const [index,item] of current.items.entries()){
    const id=additionalTargets[index].id;
    assert(html.includes(`<option value="${id}">${additionalTargets[index].label}</option>`));
    assert.equal((html.match(new RegExp(`<details id="${id}">`,'g'))??[]).length,1);
    for(const href of [item.binding!.ctHref!,item.binding!.atlasHref])assert(html.includes(href.replaceAll('&','&amp;')));
    assert(html.includes(item.ct.id));assert(html.includes(item.atlas.sourceHash));
  }
  const evidence=renderToStaticMarkup(React.createElement(Review,{packet:current}));
  assert.doesNotMatch(evidence,/<details[^>]+open|<form|href="[^\"]*mri-head/);
  assert.equal((evidence.match(/<button/g)??[]).length,6);
  assert.match(evidence,/Review Occipital bone comparison/);
  const withTeaching=renderToStaticMarkup(React.createElement(Review,{packet:current,teachingRevision:boneTeaching.HEAD_CT_BONE_TEACHING_REVISION}));
  assert.equal((withTeaching.match(/<button/g)??[]).length,12);
  for(const item of current.items)assert(withTeaching.includes(`Review ${item.binding!.label} teaching`));
  assert.doesNotMatch(withTeaching,/<form|<input/,'Teaching forms and histories are not eagerly loaded');
  const unavailable=renderToStaticMarkup(React.createElement(Review,{packet:null}));
  assert.match(unavailable,/role="alert"/);assert.doesNotMatch(unavailable,/href=|head-ct-bone-comparison-bone/);
});
