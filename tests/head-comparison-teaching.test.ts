import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {headLearningSequencesForModality} from '../lib/head-atlas-learning.ts';
import {headGuidedComparisonForStep,resolveHeadGuidedComparison} from '../lib/head-guided-comparison.ts';
import {resolveHeadGuidedComparisonNavigation} from '../lib/head-guided-comparison-navigation.ts';
import {loadHeadComparisonTeaching} from './head-comparison-teaching-loader.ts';

const Teaching=loadHeadComparisonTeaching();
const require=createRequire(import.meta.url);
const component=(conceptId:string,modality:'CT'|'MRI',props:Record<string,unknown>={})=>renderToStaticMarkup(React.createElement(Teaching,{conceptId,modality,revision:HEAD_LINK_REVISION,...props}));
const activity=(conceptId:string)=>{
  const sequence=headLearningSequencesForModality().find(item=>item.concepts.includes(conceptId));
  assert(sequence,`No sequence for ${conceptId}`);
  const result=headGuidedComparisonForStep(sequence.id,conceptId);
  assert(result,`No mapped comparison for ${conceptId}`);
  return result;
};
const source=readFileSync(new URL('../app/atlas/guided-learning/compare/page.tsx',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const page={exports:{} as {default:(props:{searchParams:Promise<Record<string,string>>})=>Promise<React.ReactNode>}};
new Function('require','module','exports',code)((id:string)=>{
  if(id==='../../../../components/HeadAtlasTeaching')return {HeadAtlasTeaching:Teaching};
  if(id==='../../../../lib/head-guided-comparison.ts')return {resolveHeadGuidedComparison};
  if(id==='../../../../lib/head-guided-comparison-navigation.ts')return {resolveHeadGuidedComparisonNavigation};
  if(id==='next/navigation')return {notFound:()=>{throw Error('NOT_FOUND');}};
  if(id.endsWith('.css'))return {};
  if(id==='react/jsx-runtime')return require(id);
  throw Error(`Unexpected page import: ${id}`);
},page,page.exports);
const render=async(conceptId:string)=>{
  const params=Object.fromEntries(new URL(activity(conceptId).activityHref,'https://visible.invalid').searchParams);
  return renderToStaticMarkup(await page.exports.default({searchParams:Promise.resolve(params)}));
};
const cards=(html:string)=>html.match(/<article class="head-compare-card"[\s\S]*?<\/article>/g)??[];

test('brainstem comparison renders both real CT and MRI draft packets without questions',async()=>{
  const html=await render('brainstem-pons');
  assert.equal(cards(html).length,3);
  assert.equal((html.match(/class="head-teaching"/g)??[]).length,2);
  assert.match(html,/CT · reading notes · Draft/);assert.match(html,/MRI · reading notes · Draft/);
  assert.match(html,/Skull-base beam hardening/);assert.match(html,/actual sequence and native plane/);
  assert.match(html,/Clinical correlation · Draft/);assert.match(html,/Clinical sources &amp; separate revision/);
  assert.match(html,/Teaching packet/);assert.match(html,/awaiting radiologist review/);
  assert(!/<(?:form|input|iframe|img|video|canvas)\b/i.test(html));
  assert(!html.includes('Check understanding · Draft'));
  assert.match(component('brainstem-pons','CT'),/Check understanding · Draft/);
});

test('image-only, CT-only and MRI-only activities expose only mapped teaching',async()=>{
  for(const [conceptId,expectedNames] of [
    ['cerebellum-vermis',['CT','MRI']],
    ['bone-left-parietal',['3D Atlas','CT']],
    ['endocrine-pituitary-gland',['3D Atlas','MRI']],
  ] as const){
    const mapped=activity(conceptId);
    assert.deepEqual(mapped.availableViews.map(view=>view.name),expectedNames);
    const html=await render(conceptId),viewCards=cards(html);
    assert.equal(viewCards.length,expectedNames.length);
    assert.equal((html.match(/class="head-teaching"/g)??[]).length,expectedNames.filter(name=>name!=='3D Atlas').length);
    for(const name of ['CT','MRI'] as const){
      assert.equal(html.includes(`${name} · reading notes · Draft`),(expectedNames as readonly string[]).includes(name));
    }
    assert(!/<(?:form|input|iframe|img|video|canvas)\b/i.test(html));
  }
});

test('unknown and stale teaching only show an explicit optional fallback',()=>{
  assert.equal(component('unknown','CT'),'');
  assert.equal(component('brainstem-pons','CT',{revision:'stale'}),'');
  for(const props of [{conceptId:'unknown',revision:HEAD_LINK_REVISION},{conceptId:'brainstem-pons',revision:'stale'}]){
    const html=renderToStaticMarkup(React.createElement(Teaching,{modality:'CT',unavailableMessage:'Teaching unavailable for this mapping.',...props}));
    assert.match(html,/Teaching unavailable for this mapping/);
    assert(!html.includes('Skull-base beam hardening'));
  }
});

test('facial CT teaching remains behind the existing verification gate',async()=>{
  const mapped=activity('bone-mandible');
  assert.deepEqual(mapped.availableViews.map(view=>view.name),['3D Atlas','CT']);
  const html=await render('bone-mandible');
  assert.match(html,/CT teaching is unavailable for this mapped view or source revision/);
  assert(!html.includes('The mandible forms the lower jaw'));
  const verified=loadHeadComparisonTeaching(true);
  const ready=renderToStaticMarkup(React.createElement(verified,{conceptId:'bone-mandible',modality:'CT',revision:HEAD_LINK_REVISION,summary:'CT · reading notes · Draft',showAnatomyCheck:false}));
  assert.match(ready,/The mandible forms the lower jaw/);
  assert.match(ready,/CT · reading notes · Draft/);
  assert(!/<(?:form|input)\b/i.test(ready));
  const stale=renderToStaticMarkup(React.createElement(verified,{conceptId:'bone-mandible',modality:'CT',revision:'stale',unavailableMessage:'Unavailable'}));
  assert.match(stale,/Unavailable/);assert(!stale.includes('The mandible forms the lower jaw'));
});
