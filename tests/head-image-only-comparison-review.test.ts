import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import * as review from '../lib/head-image-only-comparison-review.ts';
import * as links from '../lib/head-image-only-links.ts';
import * as teaching from '../lib/head-cerebellar-teaching.ts';
import {headReviewImageLinkModule} from './head-review-image-link-loader.ts';
const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/HeadImageOnlyComparisonReview.tsx',import.meta.url),'utf8');
const mod={exports:{} as {HeadImageOnlyComparisonReview:React.ComponentType<any>}};
const imports:Record<string,unknown>={
 '../lib/head-image-only-comparison-review':review,'../lib/head-image-only-links':links,
 '../lib/head-cerebellar-teaching':teaching,'./HeadAtlasTeaching':{HeadAtlasTeaching:()=>null},
 './HeadPairedDecisionPanel':{HeadPairedDecisionPanel:({conceptId}:{conceptId:string})=>React.createElement('button',{'data-concept':conceptId},'Review comparison')},
 './HeadReviewImageLink':headReviewImageLinkModule,
};
new Function('require','module','exports',ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText)((name:string)=>imports[name]??require(name),mod,mod.exports);

test('exact comparison packet verifies independently and stale head revision is refused',async()=>{
 assert.deepEqual(await review.verifiedHeadImageOnlyComparisonPacket(HEAD_LINK_REVISION),links.headImageOnlyComparisonPacket());
 assert.equal(await review.verifiedHeadImageOnlyComparisonPacket('stale'),null);
});
test('all three review cards render exact CT/MRI identities, partial scope and individual decision entry',async()=>{
 const packet=await review.verifiedHeadImageOnlyComparisonPacket(HEAD_LINK_REVISION);assert(packet);
 const html=renderToStaticMarkup(React.createElement(mod.exports.HeadImageOnlyComparisonReview,{packet}));
 assert(html.includes(review.HEAD_IMAGE_ONLY_COMPARISON_REVISION));assert(html.includes(HEAD_LINK_REVISION));
 assert.match(html,/different, unregistered subjects/);assert.match(html,/MRI partial coverage/);
 assert.match(html,/not mask geometry, teaching, clinical use or publication/);
 for(const item of packet.bindings){
  for(const native of [item.ct,item.mri]){assert(html.includes(native.id));assert(html.includes(native.representation));}
  assert(html.includes(`id="head-image-only-comparison-${item.conceptId}"`));
  assert(html.includes(`data-concept="${item.conceptId}"`));
  for(const modality of ['ct','mri'])assert(html.includes(`/atlas/${modality}-head?concept=${item.conceptId}`));
 }
 assert(!html.includes('/atlas/head-neck-3d'));assert(!html.includes('<input')); // No automatic acceptance checkbox.
});
test('unverified packet renders only an unavailable warning, never inspection links or a review button',()=>{
 const html=renderToStaticMarkup(React.createElement(mod.exports.HeadImageOnlyComparisonReview,{packet:null}));
 assert.match(html,/role="alert"/);assert.match(html,/No targets have been substituted/);
 assert(!html.includes('href='));assert(!html.includes('<button'));
});

test('packet verifier refuses altered identities, flags and reordered evidence',async()=>{
 const verifierSource=readFileSync(new URL('../lib/head-image-only-comparison-review.ts',import.meta.url),'utf8');
 const original=links.headImageOnlyComparisonPacket();
 for(const change of [
  (p:any)=>{p.bindings[0].ct.laterality='right';},
  (p:any)=>{p.bindings[2].mri.representation='mask';},
  (p:any)=>{p.clinicalApproval=true;},
  (p:any)=>{p.patientRegistration=true;},
  (p:any)=>{p.bindings.reverse();},
  (p:any)=>{p.bindings.pop();},
 ]){
  const packet=JSON.parse(JSON.stringify(original));change(packet);
  const mock={exports:{} as {verifiedHeadImageOnlyComparisonPacket:(r:string)=>Promise<unknown>}};
  new Function('require','module','exports',ts.transpileModule(verifierSource,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(
   (name:string)=>name==='./head-image-only-links.ts'?{...links,headImageOnlyComparisonPacket:()=>packet}:require('../lib/head-atlas-links.ts'),mock,mock.exports);
  assert.equal(await mock.exports.verifiedHeadImageOnlyComparisonPacket(HEAD_LINK_REVISION),null);
 }
});
