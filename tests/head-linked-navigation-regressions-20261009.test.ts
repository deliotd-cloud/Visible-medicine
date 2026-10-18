import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import * as links from '../lib/head-atlas-links.ts';
import * as lectureRelated from '../lib/lecture-related-links.ts';
import * as resourceStatus from '../components/LearningResourceStatus.ts';

const require=createRequire(import.meta.url);
const pickerConcepts:Array<string|null|undefined>=[];
const source=readFileSync(new URL('../components/HeadAtlasComparisonNavigation.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{} as {HeadAtlasComparisonNavigation:(props:{conceptId:string|null;liveState:'connecting'|'ready'|'practice'|'guided'|'unavailable'})=>React.ReactElement}};
new Function('require','module','exports',compiled)((id:string)=>{
  if(id==='next/navigation')return {useRouter:()=>({push:()=>{}})};
  if(id==='../lib/head-atlas-links')return links;
  if(id==='../lib/lecture-related-links')return lectureRelated;
  if(id==='./HeadAtlasLearningPicker')return {HeadAtlasLearningPicker:({conceptId}:{conceptId?:string|null})=>{pickerConcepts.push(conceptId);return null;}};
  if(id==='./LearningResourceStatus.ts')return resourceStatus;
  return require(id);
},mod,mod.exports);

test('the generic live comparison picker asks for anatomy before opening the model',()=>{
  const html=renderToStaticMarkup(React.createElement(mod.exports.HeadAtlasComparisonNavigation,{conceptId:null,liveState:'ready'}));
  assert.match(html,/<option value="" disabled[^>]*>Choose linked anatomy<\/option>/);
  assert.match(html,/<select\b[^>]*name="head-comparison"[^>]*required/,
    'The empty placeholder must fail native form validation instead of submitting a silent no-op.');
});

test('only a validated ready comparison selection reaches contextual tours',()=>{
  for(const state of ['connecting','practice','guided','unavailable'] as const){
    pickerConcepts.length=0;
    renderToStaticMarkup(React.createElement(mod.exports.HeadAtlasComparisonNavigation,{conceptId:'brainstem-pons',liveState:state}));
    assert.deepEqual(pickerConcepts,[],state);
  }
  pickerConcepts.length=0;
  renderToStaticMarkup(React.createElement(mod.exports.HeadAtlasComparisonNavigation,{conceptId:'brainstem-pons',liveState:'ready'}));
  assert.deepEqual(pickerConcepts,['brainstem-pons']);
  for(const conceptId of [null,'unknown','Pons','javascript:alert(1)']){
    pickerConcepts.length=0;
    renderToStaticMarkup(React.createElement(mod.exports.HeadAtlasComparisonNavigation,{conceptId,liveState:'ready'}));
    assert.deepEqual(pickerConcepts,[undefined]);
  }
});
