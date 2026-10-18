import assert from 'node:assert/strict';
import {headAnatomyCheckModule} from './head-anatomy-check-loader.ts';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {facialAwareRequire} from './head-facial-hook-loader.ts';
import * as teaching from '../lib/head-ct-bone-teaching.ts';
import {HEAD_LINK_REVISION as revision} from '../lib/head-atlas-links.ts';
import {headCtBoneComparisonPacket} from '../lib/head-ct-bone-comparison-review.ts';
import {headReviewImageLinkModule} from './head-review-image-link-loader.ts';

const require=facialAwareRequire(createRequire(import.meta.url));
function compile(path:string,imports:Record<string,unknown>={}){
  const code=ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
  const mod={exports:{} as any};
  new Function('require','module','exports',code)((id:string)=>imports[id]??(id.startsWith('../lib/')?require(id.endsWith('.ts')?id:id+'.ts'):id==='./HeadAnatomyCheck'?headAnatomyCheckModule:require(id)),mod,mod.exports);
  return mod.exports;
}
const native=compile('../components/HeadAtlasTeaching.tsx');
const reference=compile('../components/HeadAtlasReferenceTeaching.tsx');
const render=(Component:any,props:any)=>renderToStaticMarkup(React.createElement(Component,props));

test('six CT notes reach the real native and generic components without MRI or scan-task leakage',()=>{
  for(const note of teaching.headCtBoneTeachingContent.notes){
    const html=render(native.HeadAtlasTeaching,{conceptId:note.conceptId,modality:'CT',revision});
    for(const text of [note.anatomy.text,note.function.text,note.task,teaching.headCtBoneTeachingContent.imaging.CT.text,teaching.HEAD_CT_BONE_TEACHING_REVISION])assert(html.includes(text));
    assert.doesNotMatch(html,/<details[^>]*open/);
    assert.equal(render(native.HeadAtlasTeaching,{conceptId:note.conceptId,modality:'MRI',revision}),'');
    assert.equal(render(native.HeadAtlasTeaching,{conceptId:note.conceptId,modality:'CT',revision:'stale'}),'');
    const generic=render(reference.HeadAtlasReferenceTeaching,{conceptId:note.conceptId,revision});
    assert(generic.includes(note.anatomy.text));assert(generic.includes(note.function.text));
    assert(!generic.includes(note.task));assert(!generic.includes(teaching.headCtBoneTeachingContent.imaging.CT.text));
    assert.equal(render(reference.HeadAtlasReferenceTeaching,{conceptId:note.conceptId,revision:'stale'}),'');
  }
});

test('protected review keeps independent comparisons available but withholds unverified teaching',()=>{
  const {HeadCtBoneComparisonReview}=compile('../components/HeadCtBoneComparisonReview.tsx',{
    './HeadAtlasTeaching':native,'./HeadCtBoneDecisionPanel':{HeadCtBoneDecisionPanel:()=>null},'./HeadCtBoneTeachingDecisionPanel':{HeadCtBoneTeachingDecisionPanel:()=>null},'./HeadCtBoneLearningReview':{HeadCtBoneLearningReview:()=>null},'./HeadReviewImageLink':headReviewImageLinkModule,
  });
  for(const teachingRevision of [undefined,null,'stale',teaching.HEAD_CT_BONE_TEACHING_REVISION]){
    const html=render(HeadCtBoneComparisonReview,{packet:headCtBoneComparisonPacket(),teachingRevision});
    for(const note of teaching.headCtBoneTeachingContent.notes)assert.equal(html.includes(note.anatomy.text),teachingRevision===teaching.HEAD_CT_BONE_TEACHING_REVISION);
    assert(html.includes('Inspect Occipital bone in CT'));
    assert.doesNotMatch(html,/<details[^>]*open|href="[^\"]*mri-head/);
    if(teachingRevision===teaching.HEAD_CT_BONE_TEACHING_REVISION)assert(html.includes('decisions do not approve this teaching'));
  }
  assert(!render(HeadCtBoneComparisonReview,{packet:null,teachingRevision:teaching.HEAD_CT_BONE_TEACHING_REVISION}).includes(teaching.headCtBoneTeachingContent.notes[0].anatomy.text));
});

test('review route authorizes before verifying or rendering the teaching evidence',async()=>{
  const source=readFileSync(new URL('../app/workspace/atlas-review/head-learning/page.tsx',import.meta.url),'utf8');
  const imports:Record<string,unknown>={};
  for(const [,id] of source.matchAll(/from '([^']+)'/g))imports[id]=new Proxy({},{get:()=>()=>{throw Error('evidence accessed before authorization');}});
  imports['@/lib/clinical-review-server']={authorizeClinicalReview:async()=>{throw Error('unauthorized');}};
  const route=compile('../app/workspace/atlas-review/head-learning/page.tsx',imports);
  const html=renderToStaticMarkup(await route.default());assert.match(html,/authorized administrator/);
  assert(!html.includes(teaching.HEAD_CT_BONE_TEACHING_REVISION));
  assert.match(source,/teachingRevision=\{ctBoneTeachingRevision\}/);
});
