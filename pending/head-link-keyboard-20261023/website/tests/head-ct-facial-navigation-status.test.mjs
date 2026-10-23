import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {HEAD_LINK_REVISION,headAtlasConceptOptions,headConceptById} from '../lib/head-atlas-links.ts';
import {headImageHref} from '../lib/head-atlas-navigation.ts';
import {relatedLectureHref} from '../lib/lecture-related-links.ts';
import * as keyboard from '../lib/head-disclosure-keyboard.ts';

const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/HeadAtlasComparisonNavigation.tsx',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exports={};
const imports={
  'next/navigation':{useRouter:()=>({push(){throw Error('Unexpected navigation')}})},
  '../lib/head-disclosure-keyboard.ts':keyboard,
  '../lib/head-link-availability.ts':{headLinksCurrent:()=>true,HEAD_LINK_REVISION_NOTICE:'Source changed'},
  '../lib/head-atlas-links':{HEAD_LINK_REVISION,headAtlasConceptOptions,headConceptById},
  '../lib/head-atlas-navigation.ts':{headImageHref},
  '../lib/lecture-related-links':{relatedLectureHref},
  './HeadAtlasLearningPicker':{HeadAtlasLearningPicker:()=>null},
  './LearningResourceStatus.ts':{
    LearningResourceStatus:({status})=>React.createElement('span',{'data-resource-status':status},status),
    LearningStatusKey:()=>null,
  },
  'react/jsx-runtime':require('react/jsx-runtime'),
};
new Function('require','module','exports',js)(id=>{assert(Object.hasOwn(imports,id),'Unexpected navigation import: '+id);return imports[id];},{exports},exports);
const {HeadAtlasComparisonNavigation}=exports;

test('facial selection keeps exact CT and model access while teaching verification is pending',()=>{
  for(const id of ['bone-left-zygomatic','bone-right-zygomatic','bone-mandible']){
    const concept=headConceptById(id);assert(concept?.ctHref);assert(!concept.mriHref);
    const html=renderToStaticMarkup(React.createElement(HeadAtlasComparisonNavigation,{conceptId:id,liveState:'ready'}));
    assert(html.includes(`aria-label="Compare ${concept.label} on CT"`));
    assert(html.includes(`href="${headImageHref('CT',id,null,HEAD_LINK_REVISION).replaceAll('&','&amp;')}"`));
    assert.match(html,/Open in model/);
    assert.match(html,/No exact MRI comparison mapped/);
    assert.match(html,/No linked reference teaching note is available/);
    assert.match(html,/data-resource-status="unavailable"/);
    const heading=html.match(/<div class="structure-learning-heading">[\s\S]*?<\/div>/)?.[0];
    assert(heading);assert.doesNotMatch(heading,/Draft|data-resource-status="draft"/);
    assert.doesNotMatch(html,/Anatomy, clinical notes &amp; quick check · Draft/);
  }
});

test('verified teaching remains a distinct Draft resource within the same CT and model selection',()=>{
  const html=renderToStaticMarkup(React.createElement(HeadAtlasComparisonNavigation,{conceptId:'bone-mandible',liveState:'ready',teaching:React.createElement('span',null,'Verified draft material')}));
  assert.match(html,/Open in model/);
  assert.match(html,/Compare Mandible on CT/);
  assert.match(html,/Anatomy, clinical notes &amp; quick check · Draft/);
  assert.match(html,/Verified draft material/);
  assert.doesNotMatch(html,/No linked reference teaching note is available/);
});
