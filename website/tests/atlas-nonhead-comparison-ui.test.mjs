import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {atlasRuntimeExpansionModule} from './atlas-runtime-expansion-loader.mjs';
import {loadLiveLearningComponent} from './learning-frame-loader-transition.mjs';

const require=createRequire(import.meta.url);
const root=new URL('../',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('public/atlas-runtime/head-neck/manifest.json',root),'utf8'));

function compiled(path,imports={}){
  const source=readFileSync(new URL(path,root),'utf8');
  const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const module={exports:{}};
  new Function('require','module','exports',js)((id)=>{
    assert.ok(Object.hasOwn(imports,id),`unexpected import ${id} in ${path}`);
    return imports[id];
  },module,module.exports);
  return module.exports;
}

const {atlasBodyRegions,selectedBodyRegion}=compiled('lib/atlas-navigation.ts');
const {regionalTourEntrySuffix}=compiled('lib/regional-tour-entry-navigation.ts',{
  './atlas-navigation':{atlasBodyRegions},
});
const {hasHeadLearningQuery}=require('../lib/head-atlas-learning.ts');
const {atlasStudySuffix}=compiled('lib/atlas-study-transport.ts');
const {atlasReferenceRevisionCurrent}=compiled('lib/atlas-reference-revision.ts');
const notFound=()=>{throw Error('not-found');};
const redirect=(href)=>{throw Error(`redirect:${href}`);};
let bridgeCalls=[];
function HeadAtlasLinkedModel(props){
  bridgeCalls.push(props);
  return React.createElement('section',{'data-head-bridge':'mounted'},
    React.createElement('div',{'data-head-comparison-banner':true},'Comparison unavailable until model ready'),
    React.createElement('div',{'data-facial-teaching-hook':true}),props.coverage);
}
const {createAtlasDocumentAttempt}=compiled('components/atlas-runtime-state.ts');
const learningModule=await loadLiveLearningComponent(root);
const {AtlasRuntimeFrame}=compiled('components/AtlasRuntimeFrame.tsx',{
  './AtlasBodyLearning':learningModule,
  'react':React,
  './atlas-runtime-state':{createAtlasDocumentAttempt},
  './atlas-runtime-expansion':atlasRuntimeExpansionModule,
  './atlas-runtime-frame.css':{},
  'react/jsx-runtime':require('react/jsx-runtime'),
});
const page=compiled('app/atlas/3d/page.tsx',{
  'next/link':{default:({href,children,...rest})=>React.createElement('a',{href,...rest},children)},
  'next/navigation':{notFound,redirect},
  '../../../components/AtlasRegionalNavigation':{AtlasRegionalNavigation:({regionId})=>React.createElement('nav',{'data-region':regionId})},
  '../../../components/HeadAtlasLinkedModel':{HeadAtlasLinkedModel},
  '../../../components/AtlasRuntimeFrame':{AtlasRuntimeFrame},
  '../../../lib/atlas-navigation':{selectedBodyRegion},
  '../../../lib/atlas-study-transport':{atlasStudySuffix},
  '../../../lib/regional-tour-entry-navigation':{regionalTourEntrySuffix},
  '../../../lib/head-atlas-learning':{hasHeadLearningQuery},
  '../../../lib/atlas-reference-revision':{atlasReferenceRevisionCurrent},
  '../../../public/atlas-runtime/head-neck/manifest.json':{default:manifest},
  '../shoulder-3d/shoulder-module.css':{},
  '../head-neck-3d/head-learning.css':{},
  'react/jsx-runtime':require('react/jsx-runtime'),
});
async function render(params={}){
  bridgeCalls=[];
  const tree=await page.default({searchParams:Promise.resolve(params)});
  return renderToStaticMarkup(tree);
}
const sourceParams={study:'1',structure:'vm:anatomy:body:leg:left:bone:tibia',side:'left',source:'a'.repeat(64)};

test('whole body and shared limb routes render the plain viewer without head comparison UI',async()=>{
  for(const region of ['whole-body','shoulder-arm','forearm','hand','thigh','leg','foot']){
    const html=await render({region,...sourceParams,atlasRevision:manifest.sourceCommit,patientId:'private'});
    assert.equal(bridgeCalls.length,0,`${region} mounted the head selection bridge`);
    assert.doesNotMatch(html,/head-comparison-module-page|data-head-bridge|data-head-comparison-banner|data-facial-teaching-hook|Comparison unavailable until model ready/);
    assert.match(html,new RegExp(`data-region="${region}"`));
    const frame=html.match(/<iframe\b[^>]*>/)?.[0];
    assert.ok(frame,`${region} has a viewer`);
    const src=frame.match(/\bsrc="([^"]+)"/)?.[1]?.replaceAll('&amp;','&');
    assert.ok(src);
    const url=new URL(src,'https://atlas.test');
    assert.equal(url.pathname,'/atlas-runtime/head-neck/index.html');
    assert.equal(url.searchParams.get('region'),region);
    for(const [key,value] of Object.entries(sourceParams))assert.equal(url.searchParams.get(key),value);
    assert.equal(url.searchParams.has('atlasRevision'),false);
    assert.equal(url.searchParams.has('patientId'),false);
    assert.match(frame,new RegExp(`title="${selectedBodyRegion(region).label} 3D anatomy: explore, dissect and practise"`.replace('&','&amp;')));
    assert.match(frame,/referrerPolicy="same-origin"/);
    assert.match(frame,/allowFullScreen=""/);
    assert.match(html,/<details\b[^>]*class="shoulder-module-notes"[^>]*>/);
    assert.doesNotMatch(html,/<details\b[^>]*\bopen(?:=|\s|>)/);
    assert.match(html,/source selections in this view/);
    assert.match(html,/not registered to the main body or a patient scan/);
    assert.match(html,/Source, changes &amp; commercial licences/);
    assert.match(html,/separately paid imaging cases or lectures|paid lecture access remains separate/);
    assert.match(html,/Open full screen/);
  }
});

test('source-bound head and neck keeps the exact current revision on its head bridge',async()=>{
  const html=await render({region:'head-neck',...sourceParams,atlasRevision:manifest.sourceCommit});
  assert.equal(bridgeCalls.length,1);
  assert.equal(bridgeCalls[0].sourceRevision,manifest.sourceCommit);
  assert.equal(new URL(bridgeCalls[0].src,'https://atlas.test').searchParams.get('region'),'head-neck');
  assert.match(html,/data-head-bridge="mounted"/);
  assert.match(html,/head-comparison-module-page/);
});

test('plain head and neck redirects, while malformed, duplicate and stale inputs refuse',async()=>{
  await assert.rejects(render({region:'head-neck'}),/redirect:\/atlas\/head-neck-3d/);
  for(const params of [
    {region:['hand','foot']},{region:'../hand'},
    {region:'leg',study:['1','1']},{region:'leg',study:'3'},
    {region:'leg',source:'a'.repeat(63)},
    {region:'leg',atlasRevision:'f'.repeat(40)},
    {region:'leg',atlasRevision:[manifest.sourceCommit,manifest.sourceCommit]},
  ]){
    await assert.rejects(render(params),/not-found/,JSON.stringify(params));
    assert.equal(bridgeCalls.length,0);
  }
});

test('real query validators keep regional tours separate from study and head-learning handoffs',async()=>{
  const tour={regionalTour:'synthetic-tour',tourRevision:'synthetic-revision',tourSource:manifest.sourceCommit};
  const html=await render({region:'forearm',...tour,patientId:'private'});
  assert.equal(bridgeCalls.length,0);
  const frame=html.match(/<iframe\b[^>]*>/)?.[0];
  assert.ok(frame);
  const url=new URL(frame.match(/\bsrc="([^"]+)"/)[1].replaceAll('&amp;','&'),'https://atlas.test');
  assert.equal(url.pathname,'/atlas-runtime/head-neck/index.html');
  assert.equal(url.searchParams.get('region'),'forearm');
  for(const [key,value] of Object.entries(tour))assert.equal(url.searchParams.get(key),value);
  assert.equal(url.searchParams.has('patientId'),false);
  assert.equal(url.searchParams.has('study'),false);
  for(const params of [
    {region:'forearm',regionalTour:tour.regionalTour},
    {region:'forearm',...tour,regionalTour:[tour.regionalTour,tour.regionalTour]},
    {region:'forearm',...tour,tourRevision:'../invalid'},
    {region:'forearm',...tour,tourSource:'a'.repeat(39)},
    {region:'forearm',...tour,...sourceParams},
    ...['headTour','headStep','headRevision'].map(key=>({region:'forearm',...tour,[key]:'untrusted'})),
  ]){
    await assert.rejects(render(params),/not-found/,JSON.stringify(params));
    assert.equal(bridgeCalls.length,0);
  }
});
