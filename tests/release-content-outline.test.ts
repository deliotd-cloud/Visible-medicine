import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import type {StudioRelease, StudioWorkbook} from '../lib/education-platform.ts';

const require=createRequire(import.meta.url);
function compile(path:string,mocks:Record<string,unknown>={}) {
  const code=ts.transpileModule(readFileSync(new URL('../'+path,import.meta.url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const mod={exports:{} as Record<string,any>};
  new Function('require','module','exports',code)((name:string)=>name.endsWith('.css')?{}:Object.hasOwn(mocks,name)?mocks[name]:require(name),mod,mod.exports);
  return mod.exports;
}
const outline=compile('components/ReleaseContentOutline.tsx');
const release={courseId:'course-one',version:7,workbookIds:['two','one']} satisfies Pick<StudioRelease,'courseId'|'version'|'workbookIds'>;
const one:StudioWorkbook={id:'one',courseId:'course-one',moduleId:'module-one',courseTitle:'Synthetic course',moduleTitle:'Module',title:'First saved workbook',mode:'teaching',status:'draft',version:2,durationMinutes:60,caseCount:0};
const two:StudioWorkbook={...one,id:'two',title:'Second saved lecture',mode:'lecture',status:'changes-requested',version:5};
function render(selection=release,workbooks=[one,two]) {return renderToStaticMarkup(React.createElement(outline.ReleaseContentOutline,{release:selection,workbooks}));}

test('release selection order wins over alphabetical or snapshot order and shows separate revisions',()=>{
  const html=render();
  assert(html.indexOf(two.title)<html.indexOf(one.title));
  assert.match(html,/Release version 7 · 2 items/);assert.match(html,/Lecture \/ presentation · Version 5 · changes requested/);
  assert.match(html,/Imaging teaching · Version 2 · draft/);
  assert.match(html,/current saved Studio items, not a frozen copy/);
  assert.doesNotMatch(html,/<a\b|<form\b|<button\b|approved revision/i);
});
test('missing and wrong-course selections retain their positions without exposing foreign metadata or identifiers',()=>{
  const foreign={...one,id:'foreign-private-id',courseId:'different-course',title:'Foreign confidential title'};
  const html=render({...release,workbookIds:['one','unavailable-private-id',foreign.id,'two']},[one,two,foreign,{...one,id:'unselected',title:'Unselected hidden title'}]);
  assert.equal((html.match(/<li>/g)||[]).length,4);assert.equal((html.match(/Selected item unavailable/g)||[]).length,2);
  assert(html.indexOf(one.title)<html.indexOf('Selected item unavailable'));assert(html.lastIndexOf('Selected item unavailable')<html.indexOf(two.title));
  for(const secret of [foreign.id,foreign.title,'unavailable-private-id','Unselected hidden title'])assert(!html.includes(secret));
  assert.match(html,/No other item has been substituted/);
});
test('empty selection never substitutes all available course workbooks',()=>{
  const html=render({...release,workbookIds:[]});assert.match(html,/No content selected/);assert.match(html,/0 items/);
  assert.doesNotMatch(html,/<ol>|<li>|First saved workbook|Second saved lecture/);
});
test('a single assessment has singular count and text is HTML escaped',()=>{
  const html=render({...release,workbookIds:['one']},[{...one,title:'<img src=x onerror=alert(1)>',mode:'assessment',status:'published'}]);
  assert.match(html,/1 item<\/span>/);assert.match(html,/Assessment · Version 2 · published/);
  assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<img\b/);
});
test('preview refuses missing authentication before snapshot access or outline rendering',async()=>{
  let reads=0;
  const {default:Page}=compile('app/studio/releases/[releaseId]/preview/page.tsx',{
    'next/link':()=>null,'next/navigation':{notFound(){throw Error('not found');}},
    '../../../../chatgpt-auth':{requireChatGPTUser:async()=>{throw Error('sign in required');}},
    '@/lib/education-platform':{getStudioSnapshot:async()=>{reads++;return{};}},
    '@/lib/pilot-readiness':{releaseReadiness(){throw Error('must not render');}},'@/components/ReleaseContentOutline':outline,
  });
  await assert.rejects(Page({params:Promise.resolve({releaseId:'private-id'})}),/sign in required/);assert.equal(reads,0);
});
test('an authenticated snapshot without the requested release stays not found',async()=>{
  const {default:Page}=compile('app/studio/releases/[releaseId]/preview/page.tsx',{
    'next/link':()=>null,'next/navigation':{notFound(){throw Error('not found');}},
    '../../../../chatgpt-auth':{requireChatGPTUser:async()=>({userId:'fixture',email:'',displayName:''})},
    '@/lib/education-platform':{getStudioSnapshot:async()=>({releases:[],workbooks:[one,two]})},
    '@/lib/pilot-readiness':{releaseReadiness(){throw Error('must not render');}},'@/components/ReleaseContentOutline':outline,
  });
  await assert.rejects(Page({params:Promise.resolve({releaseId:'private-id'})}),/not found/);
});
