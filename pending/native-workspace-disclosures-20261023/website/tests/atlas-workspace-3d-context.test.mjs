import {loadNativeDisclosure} from './native-disclosure-source.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {HEAD_LINK_REVISION,headConceptById} from '../lib/head-atlas-links.ts';
import {headLearningLinks} from '../lib/head-atlas-learning.ts';
import {headImageHref} from '../lib/head-atlas-navigation.ts';
import {headLinksCurrent} from '../lib/head-link-availability.ts';

const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/AtlasWorkspaceNavigation.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
function navigation(current=headLinksCurrent()){
  const loaded={exports:{}};
  new Function('require','module','exports',compiled)(name=>{
    if(name==='next/link')return {__esModule:true,default:({href,children,...rest})=>React.createElement('a',{href,'data-client-link':'',...rest},children)};
    if(name==='./NativeDisclosure')return {NativeDisclosure:loadNativeDisclosure()};
    if(name==='./AtlasRegionNavigation')return {AtlasRegionNavigation:()=>null};
    if(name==='../lib/atlas-navigation')return require('../lib/atlas-navigation.ts');
    if(name==='../lib/head-atlas-navigation')return require('../lib/head-atlas-navigation.ts');
    if(name==='../lib/head-link-availability.ts')return {headLinksCurrent:()=>current};
    if(name.endsWith('.css'))return {};
    return require(name);
  },loaded,loaded.exports);
  return loaded.exports.AtlasWorkspaceNavigation;
}
const render=(modality,context,regionId='head-neck',current=true)=>renderToStaticMarkup(React.createElement(navigation(current),{modality,regionId,headNavigation:context}));
function tab(html,label){
  const nav=html.match(/<nav class="imaging-workspace-modalities"[^>]*>(.*?)<\/nav>/)?.[1];
  assert(nav);
  return nav.match(new RegExp(`<a\\b[^>]*>${label}<\\/a>`))?.[0]??null;
}
const href=markup=>markup?.match(/\bhref="([^"]+)"/)?.[1]?.replaceAll('&amp;','&');
const context=(conceptId,position=null,revision=HEAD_LINK_REVISION)=>({conceptId,position,revision});

test('mapped head concept opens exact source-pinned 3D target in a fresh native link',()=>{
  assert(headLinksCurrent());
  for(const [modality,id] of [['ct','brainstem-pons'],['mri','limbic-left-amygdala']]){
    const expected=headConceptById(id);
    assert(expected?.atlasHref);
    const html=render(modality,{...context(id),patientId:'PRIVATE',study:'private',score:100,answer:'secret',url:'https://outside.invalid'});
    const link=tab(html,'3D');assert(link);
    assert.equal(href(link),expected.atlasHref);
    assert.match(link,new RegExp(`aria-label="View ${expected.label} in 3D Atlas"`));
    assert.match(link,/title="These views show separate subjects/);
    assert.doesNotMatch(link,/data-client-link|PRIVATE|private|secret|outside|score|answer/);
    assert.equal(tab(html,modality==='ct'?'CT':'MRI'),null);
  }
});

test('authored nested tour step preserves exact index, concept and source metadata',()=>{
  for(const [modality,position] of [
    ['ct',{sequenceId:'globes',conceptId:'orbit-right-globe'}],
    ['mri',{sequenceId:'mri-amygdalae',conceptId:'limbic-right-amygdala'}],
  ]){
    const expected=headLearningLinks(position)?.atlasHref;assert(expected);
    const link=tab(render(modality,context(position.conceptId,position)),'3D');assert(link);
    assert.equal(href(link),expected);
    assert.match(link,/headTour=/);assert.match(link,/headStep=1/);assert.match(link,/headRevision=/);
    assert.match(link,/step 2 of 2/);
    assert.doesNotMatch(link,/data-client-link/);
  }
});

test('unmapped, image-only, stale and contradictory contexts only browse general head',()=>{
  const invalid=[
    context('cerebellum-vermis'),context('not-mapped'),context('brainstem-pons',null,'0'.repeat(64)),
    context('brainstem-pons',{sequenceId:'globes',conceptId:'orbit-left-globe'}),
    context('brainstem-pons',{sequenceId:'globes',conceptId:'brainstem-pons'}),
    context('brainstem-pons',{sequenceId:'missing',conceptId:'brainstem-pons'}),
    context(null,{sequenceId:'brainstem',conceptId:null}),
    context(null,{sequenceId:'brainstem',conceptId:'brainstem-pons'}),
  ];
  for(const item of invalid){
    const link=tab(render('ct',item),'3D');assert(link);
    assert.equal(href(link),'/atlas/head-neck-3d');
    assert.match(link,/aria-label="Browse 3D head · leave (?:tour|anatomy focus)"/);
    assert.doesNotMatch(link,/concept=|headTour=|headRevision=|data-client-link/);
  }
  const stale=tab(render('mri',context('limbic-left-amygdala'),'head-neck',false),'3D');
  assert.equal(href(stale),'/atlas/head-neck-3d');
  assert.match(stale,/leave anatomy focus/);
});

test('CT/MRI behavior, static active modality and generic browsing remain intact',()=>{
  const position={sequenceId:'brainstem',conceptId:'brainstem-pons'};
  const html=render('ct',context(position.conceptId,position));
  assert.equal(href(tab(html,'MRI')),headImageHref('MRI',position.conceptId,position,HEAD_LINK_REVISION));
  assert.match(tab(html,'MRI'),/data-client-link/);
  assert.match(html,/<span aria-current="page">CT<\/span>/);
  assert.equal(href(tab(render('ct',undefined),'3D')),'/atlas/head-neck-3d');
  assert.equal(href(tab(render('ct',context('brainstem-pons'),'spine'),'3D')),'/atlas/spine-3d');
  assert.equal(href(tab(render('ultrasound',context('brainstem-pons')),'3D')),'/atlas/head-neck-3d');
  assert.equal(href(tab(render('x-ray',context('brainstem-pons')),'3D')),'/atlas/head-neck-3d');
  assert.equal(tab(render('3d',undefined),'3D'),null);
});
