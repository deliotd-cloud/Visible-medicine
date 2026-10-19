import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {loadHeadBookmark} from './head-bookmark-ui-loader.ts';
import * as learning from '../lib/head-atlas-learning.ts';
import * as mriLearning from '../lib/head-mri-learning.ts';
import * as insulaLearning from '../lib/head-insula-learning.ts';
import * as orbitalLearning from '../lib/head-orbital-learning.ts';
import * as boneLearning from '../lib/head-ct-bone-learning.ts';
import {HEAD_LINK_REVISION,headConceptFromAtlasQuery} from '../lib/head-atlas-links.ts';

const source=readFileSync(new URL('../components/HeadAtlasLearningLibrary.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
const mod={exports:{} as {HeadAtlasLearningLibrary:()=>React.ReactNode}};
const require=createRequire(import.meta.url);
new Function('require','module','exports',compiled)((id:string)=>id==='./HeadLearningBookmark'?loadHeadBookmark():id==='../lib/head-atlas-learning'?learning:id==='../lib/head-mri-learning'?mriLearning:id==='../lib/head-insula-learning'?insulaLearning:id==='../lib/head-orbital-learning'?orbitalLearning:id==='../lib/head-ct-bone-learning'?boneLearning:require(id),mod,mod.exports);
const html=renderToStaticMarkup(React.createElement(mod.exports.HeadAtlasLearningLibrary));
// Keep the original start-link assertions scoped to the outer tour rows.
function withoutStepPreviews(markup:string){return markup.replace(/<details class="head-linked-step-preview"[^>]*>[\s\S]*?<\/details>/g,'');}
const startHtml=withoutStepPreviews(html);

test('renders five draft tours with all twenty-five declared concepts and non-clinical scope',()=>{
  assert.equal(learning.headLearningSequences.length,5);
  assert.equal(learning.headLearningSequences.reduce((total,sequence)=>total+sequence.concepts.length,0),25);
  assert.match(html,/<section aria-label="CT and MRI linked tours">/);
  assert.match(html,/<h2>CT\/MRI-linked tours · Draft<\/h2>/);
  assert.equal((startHtml.match(/<li>/g)??[]).length,13);
  for(const sequence of learning.headLearningSequences){
    assert(html.includes(`${sequence.label}</strong> · ${sequence.concepts.length} steps`));
    assert(html.includes(`aria-label="Start ${sequence.label} in the 3D Atlas"`));
  }
  for(const phrase of ['existing 3D Atlas','separate, unregistered subjects','Configured local previews load CT/MRI automatically; otherwise choose the approved atlas folder','do not track progress','completion or clinical approval'])assert(html.includes(phrase),phrase);
  assert(html.includes(learning.HEAD_LEARNING_REVISION));
  assert(html.includes('Sequence review revision'));
  assert(html.includes('MRI-only comparisons · Draft'));
  assert(html.includes('No exact CT target is mapped'));
  assert(html.includes(mriLearning.HEAD_MRI_LEARNING_REVISION));
  for(const sequence of mriLearning.headMriLearningSequences)assert(html.includes(`${sequence.label}</strong> · ${sequence.concepts.length} steps`));
  assert(html.includes(insulaLearning.headInsulaLearningSequences[0].label));
  assert(html.includes(insulaLearning.HEAD_INSULA_LEARNING_REVISION));
  assert.match(html,/insula|coverage comparison/i);
  assert(html.includes(orbitalLearning.headOrbitalLearningSequences[0].label));
  assert(html.includes(orbitalLearning.HEAD_ORBITAL_LEARNING_REVISION));
  assert(html.includes('Eye layers and the optic nerve are not matched'));
});

test('each start uses its exact canonical first-step source pin and round-trips as an Atlas intent',()=>{
  const hrefs=[...startHtml.matchAll(/<a href="([^"]+)" aria-label="[^"]+ in the 3D Atlas"/g)].map(match=>match[1].replaceAll('&amp;','&'));
  assert.equal(hrefs.length,12);
  const firstStepPins=[
    {concept:'brainstem-midbrain',study:'2',structure:'vm:anatomy:body:head-neck:midline:organ:brain',side:'both',source:'f68b34d46c0c6273b687e3c8c890541a34cb2c66cbb383a5a9783e4a5990d335',detail:'brainstem',part:'vm:anatomy:body:head-neck:midline:organ:midbrain',partSource:'fd1d8d04656a300fe0e8271a418ec0807b227baa96d6afa822d0df6ad0bf72ba'},
    {concept:'ventricle-left-lateral',study:'2',structure:'vm:anatomy:body:head-neck:midline:organ:brain',side:'left',source:'f68b34d46c0c6273b687e3c8c890541a34cb2c66cbb383a5a9783e4a5990d335',detail:'ventricles',part:'vm:anatomy:body:head-neck:left:space:left-lateral-ventricle',partSource:'e99326a0fd0b0bdc0a64d2a1adbb7a63c758af6f765199b8febe851e62b9eab1'},
    {concept:'deep-left-caudate',study:'1',structure:'vm:anatomy:body:head-neck:left:organ:left-caudate-nucleus',side:'left',source:'6046dacb923f5103acb3b86dadf2817b5f0c133af88e0d225170cf331fbd0e3c',detail:null,part:null,partSource:null},
    {concept:'cortex-left-frontal-lobe',study:'2',structure:'vm:anatomy:body:head-neck:midline:organ:brain',side:'left',source:'f68b34d46c0c6273b687e3c8c890541a34cb2c66cbb383a5a9783e4a5990d335',detail:'cerebral',part:'vm:anatomy:body:head-neck:left:organ:left-frontal-lobe',partSource:'7a62de7b68d7fe823b299ad5dfc9eb628db7a105d120f571789eacf7b3314410'},
    {concept:'limbic-left-hippocampus',study:'2',structure:'vm:anatomy:body:head-neck:midline:organ:brain',side:'left',source:'f68b34d46c0c6273b687e3c8c890541a34cb2c66cbb383a5a9783e4a5990d335',detail:'cerebral',part:'vm:anatomy:body:head-neck:left:organ:left-hippocampus',partSource:'11cf97da7aa459f1181c79278b41c9c4369f8954eb5d4a00d1bc22b5cf28964e'},
    {concept:'limbic-left-amygdala',study:'1',structure:'vm:anatomy:body:head-neck:left:organ:left-amygdala',side:'left',source:'6046dacb923f5103acb3b86dadf2817b5f0c133af88e0d225170cf331fbd0e3c',detail:null,part:null,partSource:null},
    {concept:'commissure-corpus-callosum',study:'1',structure:'vm:anatomy:body:head-neck:midline:organ:corpus-callosum',side:'both',source:'6046dacb923f5103acb3b86dadf2817b5f0c133af88e0d225170cf331fbd0e3c',detail:null,part:null,partSource:null},
    {concept:'cortex-left-insula',study:'2',structure:'vm:anatomy:body:head-neck:midline:organ:brain',side:'left',source:'f68b34d46c0c6273b687e3c8c890541a34cb2c66cbb383a5a9783e4a5990d335',detail:'cerebral',part:'vm:anatomy:body:head-neck:left:organ:left-insula',partSource:'7a62de7b68d7fe823b299ad5dfc9eb628db7a105d120f571789eacf7b3314410'},
    {concept:'orbit-left-globe',study:'1',structure:'vm:anatomy:body:head-neck:left:organ:left-eyeball',side:'left',source:'7fe91d4bfe3a5aa96bc77b83d10ab07775892328acc081dab6fb92b0c0c40915',detail:null,part:null,partSource:null},
  ];
  for(const [index,sequence] of learning.headLearningSequencesForModality('MRI').filter(sequence=>learning.headLearningLinks({sequenceId:sequence.id,conceptId:sequence.concepts[0]})?.atlasHref).entries()){
    const first=sequence.concepts[0],href=hrefs[index],pin=firstStepPins[index];
    assert.equal(first,pin.concept);
    assert.equal(href,learning.headLearningLinks({sequenceId:sequence.id,conceptId:first})?.atlasHref);
    const url=new URL(href,'https://example.invalid'),query=url.searchParams;
    assert.equal(url.pathname,'/atlas/head-neck-3d');
    assert.deepEqual([...query.keys()],['study','structure','side','source',...(pin.detail?['detail','part','partSource']:[]),'concept','headTour','headStep','headRevision']);
    for(const key of ['concept','study','structure','side','source','detail','part','partSource'] as const)assert.equal(query.get(key),pin[key]);
    assert.equal(query.get('headTour'),sequence.id);
    assert.equal(query.get('headStep'),'0');
    assert.equal(query.get('headRevision'),HEAD_LINK_REVISION);
    assert.deepEqual(learning.parseHeadLearningIntent(query,'atlas'),{sequenceId:sequence.id,conceptId:first});
    assert.equal(headConceptFromAtlasQuery(query)?.conceptId,first);
  }
});

test('library delegates explicit bookmarks and has no direct storage, network request, or bridge',()=>{
  assert.match(source,/<HeadLearningBookmark\/>/);
  assert.doesNotMatch(source,/localStorage|sessionStorage|indexedDB|fetch\s*\(|postMessage|BroadcastChannel|WebSocket/);
});

test('direct imaging starts retain the same canonical first step and revision without inventing CT coverage',()=>{
  const rows=[...startHtml.matchAll(/<li>(.*?)<\/li>/g)].map(match=>match[1]);
  const sequences=learning.headLearningSequencesForModality();
  assert.equal(rows.length,sequences.length);
  let ctCount=0,mriCount=0;
  for(const [i,sequence] of sequences.entries()){
    const expected=learning.headLearningLinks({sequenceId:sequence.id,conceptId:sequence.concepts[0]})!;
    const anchors=[...rows[i].matchAll(/<a href="([^"]+)" aria-label="([^"]+)">([^<]+)<\/a>/g)];
    assert(rows[i].includes(`aria-label="Start ${sequence.label}"`));
    assert.deepEqual(anchors.map(a=>a[3]),[...(expected.atlasHref?['3D']:[]),...(expected.ctHref?['CT']:[]),...(expected.mriHref?['MRI']:[])]);
    for(const anchor of anchors.filter(a=>a[3]!=='3D')){
      const modality=anchor[3],href=anchor[1].replaceAll('&amp;','&');
      assert.equal(anchor[2],`Start ${sequence.label} in ${modality}`);
      assert.equal(href,modality==='CT'?expected.ctHref:expected.mriHref);
      const url=new URL(href,'https://example.invalid');
      assert.equal(url.pathname,modality==='CT'?'/atlas/ct-head':'/atlas/mri-head');
      assert.deepEqual([...url.searchParams.keys()],['concept','headTour','headStep','headRevision']);
      assert.equal(url.searchParams.get('headStep'),'0');
      assert.equal(url.searchParams.get('headRevision'),HEAD_LINK_REVISION);
      assert.deepEqual(learning.parseHeadLearningIntent(url.searchParams),{sequenceId:sequence.id,conceptId:sequence.concepts[0]});
      if(modality==='CT')ctCount++;else mriCount++;
    }
  }
  assert.equal(ctCount,11);assert.equal(mriCount,10);
  for(const seq of mriLearning.headMriLearningSequences)assert(!startHtml.includes(`Start ${seq.label} in CT`));
});

test('unavailable canonical starts render no fallback or arbitrary destination',()=>{
  function renderWithMissing(missing:Set<string>){
    const mocked={...learning,headLearningLinks:(position:learning.HeadLearningPosition)=>missing.has(position.sequenceId)?null:learning.headLearningLinks(position)};
    const module={exports:{} as {HeadAtlasLearningLibrary:()=>React.ReactNode}};
    new Function('require','module','exports',compiled)((id:string)=>id==='./HeadLearningBookmark'?loadHeadBookmark():id==='../lib/head-atlas-learning'?mocked:id==='../lib/head-mri-learning'?mriLearning:id==='../lib/head-insula-learning'?insulaLearning:id==='../lib/head-orbital-learning'?orbitalLearning:id==='../lib/head-ct-bone-learning'?boneLearning:require(id),module,module.exports);
    return renderToStaticMarkup(React.createElement(module.exports.HeadAtlasLearningLibrary));
  }
  const oneMissing=withoutStepPreviews(renderWithMissing(new Set(['ventricles'])));
  assert.equal((oneMissing.match(/<li>/g)??[]).length,12);
  assert.equal((oneMissing.match(/<a href=/g)??[]).length,30);
  assert(!oneMissing.includes('Start Ventricular spaces'));
  assert(!oneMissing.includes('href="#"'));
  const allMissing=withoutStepPreviews(renderWithMissing(new Set(learning.headLearningSequencesForModality().map(sequence=>sequence.id))));
  assert.equal((allMissing.match(/<li>|<a /g)??[]).length,0);
  assert.equal((allMissing.match(/<ol><\/ol>/g)??[]).length,7);
});
