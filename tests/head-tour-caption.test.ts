import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {facialAwareRequire} from './head-facial-hook-loader.ts';
import {headAnatomyCheckModule} from './head-anatomy-check-loader.ts';
import {HEAD_MANIFEST_SHA256} from '../lib/head-atlas-import.ts';
import {headLearningSequencesForModality,headLearningLinks} from '../lib/head-atlas-learning.ts';
import {headTeachingForReference} from '../lib/head-atlas-teaching.ts';

const require=createRequire(import.meta.url),facialRequire=facialAwareRequire(require);
const source=readFileSync(process.env.HEAD_CAPTION_BASELINE_SOURCE??new URL('../components/HeadAtlasReferenceTeaching.tsx',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{} as {HeadAtlasReferenceTeaching:React.ComponentType<any>}};
new Function('require','module','exports',code)((name:string)=>name==='./HeadAnatomyCheck'?headAnatomyCheckModule:name.startsWith('../lib/')&&!name.endsWith('.ts')?require(name+'.ts'):facialRequire(name),mod,mod.exports);
const Component=mod.exports.HeadAtlasReferenceTeaching;
const render=(conceptId:string,props:any={})=>renderToStaticMarkup(React.createElement(Component,{conceptId,revision:HEAD_MANIFEST_SHA256,compact:true,...props}));

for(const sequence of headLearningSequencesForModality().filter(s=>s.concepts.some(c=>headLearningLinks({sequenceId:s.id,conceptId:c})?.atlasHref)))test(`${sequence.id} compact notes preserve source scope and facial verification hold`,()=>{
  for(const conceptId of sequence.concepts){
    const html=render(conceptId);
    if(sequence.id==='ct-facial-coverage'){assert.equal(html,'','unverified facial packet stays withheld in compact mode');continue;}
    assert.match(html,/class="head-tour-caption"/);assert.match(html,/Scope &amp; sources · Draft/);assert.match(html,/awaiting radiologist review/);
    assert(!html.includes('<h3>Function'));assert(!html.includes('head-anatomy-check'));assert(!html.includes('<img'));
    assert(!html.includes('Spatially registered'));assert(!html.includes('clinically approved'));
  }
});
test('compact caption reuses the exact original anatomical summary and full mode stays available',()=>{
  const note=headTeachingForReference('brainstem-pons',HEAD_MANIFEST_SHA256);assert(note);
  const escaped=renderToStaticMarkup(React.createElement('p',null,note.anatomy.text)).slice(3,-4);
  const html=render('brainstem-pons');assert(html.includes(escaped));assert(html.includes(note.revision));
  const full=render('brainstem-pons',{compact:false});assert.match(full,/class="head-reference-teaching"/);assert(full.includes(note.function.text));
});
test('unknown concepts and stale revisions never create a fallback caption',()=>{
  assert.equal(render('not-an-anatomy-concept'),'');assert.equal(render('brainstem-pons',{revision:'0'.repeat(64)}),'');
});
