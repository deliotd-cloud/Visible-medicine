import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import * as availability from '../lib/head-link-availability.ts';
import * as links from '../lib/head-atlas-links.ts';
import * as navigation from '../lib/head-atlas-navigation.ts';
import * as lectures from '../lib/lecture-related-links.ts';
import * as status from '../components/LearningResourceStatus.ts';
import * as keyboard from '../lib/head-disclosure-keyboard.ts';

const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/HeadAtlasComparisonNavigation.tsx',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exports={};
const sourceRevision={current:true};
const imports={
  'next/navigation':{useRouter:()=>({push:()=>assert.fail('status-only state navigated')})},
  '../lib/head-link-availability.ts':{...availability,headLinksCurrent:()=>sourceRevision.current&&availability.headLinksCurrent()},
  '../lib/head-atlas-links':links,
  '../lib/head-atlas-navigation.ts':navigation,
  '../lib/lecture-related-links':lectures,
  './HeadAtlasLearningPicker':{HeadAtlasLearningPicker:()=>React.createElement('details',null,React.createElement('summary',null,'Linked tours'))},
  './LearningResourceStatus.ts':status,
  '../lib/head-disclosure-keyboard.ts':keyboard,
  'react/jsx-runtime':require('react/jsx-runtime'),
};
new Function('require','module','exports',js)(id=>{assert(Object.hasOwn(imports,id),id);return imports[id];},{exports},exports);
const {HeadAtlasComparisonNavigation:Comparison}=exports;
const html=(state,props={})=>renderToStaticMarkup(React.createElement(Comparison,{conceptId:'brainstem-pons',liveState:state,...props}));

test('only practice and guided status rows opt into compact desktop layout',()=>{
  for(const [state,scope] of [
    ['practice','Comparison controls are hidden during practice.'],
    ['guided','Finish the in-model guided sequence to compare selections.'],
  ]){
    const markup=html(state);
    assert.match(markup,/class="head-atlas-tour head-atlas-comparison head-atlas-comparison-paused"/);
    assert.match(markup,/Learn this structure/);
    assert(markup.includes(scope));
    assert.match(markup,/CT\/MRI are separate, unregistered subjects/);
    assert.match(markup,/<p class="head-atlas-tour-scope" role="status">/);
    assert.doesNotMatch(markup,/<nav|<form|<button|head-comparison-actions|<a\b/);
  }

  const css=readFileSync(new URL('../app/atlas/head-neck-3d/head-learning.css',import.meta.url),'utf8');
  const desktop=css.match(/@media \(min-width:1000px\)\s*\{([\s\S]*?)\n\}/)?.[1];
  assert(desktop,'desktop-only paused layout exists');
  assert.match(desktop,/\.head-atlas-comparison-paused\s*\{[^}]*min-height:36px;[^}]*padding:5px 16px;/);
  assert.match(desktop,/\.head-atlas-comparison-paused \.head-atlas-tour-context\s*\{[^}]*display:flex;[^}]*flex-wrap:wrap;/);
  assert.match(desktop,/\.head-atlas-comparison-paused \.head-atlas-tour-scope\s*\{[^}]*min-width:0;[^}]*margin:0;[^}]*overflow-wrap:anywhere;/);
  assert.doesNotMatch(desktop,/ellipsis|white-space:nowrap|overflow:hidden|display:none/);
});

test('ready actions, recovery controls and stale-source refusal never use the paused row',()=>{
  const ready=html('ready');
  assert.doesNotMatch(ready,/head-atlas-comparison-paused/);
  assert.match(ready,/Compare Pons on CT/);
  assert.match(ready,/Compare Pons on MRI/);
  assert.match(ready,/<summary>Change structure<\/summary>/);
  assert.match(ready,/<summary>More learning<\/summary>/);

  const unavailable=html('unavailable',{onRetry:()=>{},onRetryOpeningModel:()=>{}});
  assert.doesNotMatch(unavailable,/head-atlas-comparison-paused/);
  assert.match(unavailable,/Retry comparison/);
  assert.match(unavailable,/Retry opening model/);
  assert.match(unavailable,/role="status"/);
  const denied=html('access-denied',{onRetry:()=>{}});
  assert.doesNotMatch(denied,/head-atlas-comparison-paused/);
  assert.match(denied,/Check model access again/);
  assert.match(denied,/Access details/);

  try{
    sourceRevision.current=false;
    const stale=html('practice');
    assert.doesNotMatch(stale,/head-atlas-comparison-paused|head-comparison-actions|<form|<nav/);
    assert.match(stale,/role="status"/);
    assert.match(stale,new RegExp(availability.HEAD_LINK_REVISION_NOTICE.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  }finally{sourceRevision.current=true;}
});
