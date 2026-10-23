import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {HEAD_MANIFEST_SHA256} from '../lib/head-atlas-import.ts';
import {headLearningLinks,headLearningSequencesForModality} from '../lib/head-atlas-learning.ts';
import {headAtlasConceptOptions} from '../lib/head-atlas-links.ts';
import {headImageHref} from '../lib/head-atlas-navigation.ts';
import {headSeparateComparisonHref} from '../lib/head-separate-comparison.ts';

const revision=HEAD_MANIFEST_SHA256;
const require=createRequire(import.meta.url);

test('every mapped CT/MRI concept and full authored step keeps only its canonical destination',()=>{
  let mapped=0,unmapped=0;
  for(const concept of headAtlasConceptOptions())for(const modality of ['CT','MRI'] as const){
    const href=headImageHref(modality,concept.conceptId,null,revision);
    assert.equal(headSeparateComparisonHref(href,modality),href);
    if(href)mapped++;else unmapped++;
  }
  for(const id of ['cerebellum-left-hemisphere','cerebellum-right-hemisphere','cerebellum-vermis'])for(const modality of ['CT','MRI'] as const){
    const href=headImageHref(modality,id,null,revision);
    assert(href);assert.equal(headSeparateComparisonHref(href,modality),href);mapped++;
  }
  for(const sequence of headLearningSequencesForModality())for(const conceptId of sequence.concepts){
    const links=headLearningLinks({sequenceId:sequence.id,conceptId});
    for(const modality of ['CT','MRI'] as const){
      const href=modality==='CT'?links?.ctHref:links?.mriHref;
      assert.equal(headSeparateComparisonHref(href,modality),href??null,`${sequence.id}:${conceptId}:${modality}`);
      if(href)mapped++;else unmapped++;
    }
  }
  assert(mapped>70);assert(unmapped>0,'MRI-only tours must not invent CT targets');
});

test('stale, duplicate, private, foreign, wrong-view and incomplete destinations fail closed',()=>{
  const step=headLearningLinks({sequenceId:'brainstem',conceptId:'brainstem-pons'})!.mriHref!;
  const concept=headImageHref('MRI','brainstem-pons',null,revision)!;
  for(const href of [
    '', '/atlas/mri-head', '/atlas/mri-head?headTour=brainstem&headRevision='+revision,
    step.replace(revision,'0'.repeat(64)),step+'&headRevision='+revision,
    step+'&patient=private',step+'&file=private',step+'&quizAnswer=private',
    step+'&headStep=1',step.replace('headStep=1','headStep=0'),
    concept.replace('headRevision='+revision,''),concept+'&concept=brainstem-pons',
    'https://example.invalid'+step,'//example.invalid'+step,
    step.replace('/atlas/mri-head','/atlas/ct-head'),step+'#fragment',
    step.replace('concept=brainstem-pons','concept=unknown'),
  ])assert.equal(headSeparateComparisonHref(href,'MRI'),null,href);
  assert.equal(headSeparateComparisonHref(step,'CT'),null);
  assert.equal(headSeparateComparisonHref(headImageHref('CT','limbic-left-amygdala',null,revision),'CT'),null);
  for(const input of [false,true,42,[],{},null,undefined])assert.equal(headSeparateComparisonHref(input as unknown as string,'MRI'),null);
});

test('reusable link renders an explicit new tab only for a mapped current target',()=>{
  const source=readFileSync(new URL('../components/HeadSeparateComparisonLink.tsx',import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
  const module={exports:{} as {HeadSeparateComparisonLink:React.ComponentType<{href:string|null;modality:'CT'|'MRI'}>}};
  new Function('require','module','exports',code)((id:string)=>id==='../lib/head-separate-comparison.ts'?{headSeparateComparisonHref}:require(id),module,module.exports);
  const href=headImageHref('MRI','brainstem-pons',null,revision)!;
  const html=renderToStaticMarkup(React.createElement(module.exports.HeadSeparateComparisonLink,{href,modality:'MRI'}));
  assert.match(html,/target="_blank"/);assert.match(html,/rel="noopener noreferrer"/);
  assert.match(html,/new tab; keep this scan open/);assert.match(html,/MRI \(new tab\)/);
  assert.match(html,/href="\/atlas\/mri-head\?concept=brainstem-pons&amp;headRevision=/);
  assert.equal(renderToStaticMarkup(React.createElement(module.exports.HeadSeparateComparisonLink,{href:null,modality:'MRI'})),'');
  assert.equal(renderToStaticMarkup(React.createElement(module.exports.HeadSeparateComparisonLink,{href:href+'&patient=private',modality:'MRI'})),'');
});

test('only the guided and selected-structure groups gain the optional link',()=>{
  const guided=readFileSync(new URL('../components/HeadAtlasGuidedLearning.tsx',import.meta.url),'utf8');
  const viewer=readFileSync(new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
  assert.match(guided,/otherHref\?<><Link href=\{otherHref\} prefetch=\{false\}>Continue this step on/);
  assert.match(guided,/<HeadSeparateComparisonLink href=\{otherHref\} modality=/);
  assert.match(guided,/handoff\.atlasHref&&\(onCompare&&entry&&comparisonReady/);
  assert.match(viewer,/selectedComparisonHref&&<Link href=\{selectedComparisonHref\} prefetch=\{false\}/);
  assert.match(viewer,/selectedComparisonHref&&<HeadSeparateComparisonLink href=\{selectedComparisonHref\} modality=\{otherModality\}/);
  assert.match(viewer,/const concept=!quizActive&&selected&&selected\.entry===activeEntry/);
  assert.match(viewer,/rightPanel==='practice'\|\|quizActive\?<HeadAtlasPractice/);
  assert.equal((guided.match(/<HeadSeparateComparisonLink/g)??[]).length,1);
  assert.equal((viewer.match(/<HeadSeparateComparisonLink/g)??[]).length,1);
  for(const source of [guided,viewer])assert.doesNotMatch(source,/HeadSeparateComparisonLink[^\n]*onClick|HeadSeparateComparisonLink[^\n]*postMessage|HeadSeparateComparisonLink[^\n]*fetch\(/);
});
