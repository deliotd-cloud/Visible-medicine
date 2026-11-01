import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {headGuidedComparisonForStep,resolveHeadGuidedComparison} from '../lib/head-guided-comparison.ts';
import {resolveHeadGuidedComparisonNavigation} from '../lib/head-guided-comparison-navigation.ts';
import {headLearningSequencesForModality} from '../lib/head-atlas-learning.ts';
import {parseHeadLearningDiscovery} from '../lib/head-learning-discovery.ts';
import {loadHeadComparisonTeaching} from './head-comparison-teaching-loader.ts';

const require=createRequire(import.meta.url);
const source=readFileSync('app/atlas/guided-learning/compare/page.tsx','utf8');
const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const page={exports:{} as any};
new Function('require','module','exports',code)((id:string)=>{
  if(id==='../../../../lib/head-guided-comparison.ts')return {resolveHeadGuidedComparison};
  if(id==='../../../../lib/head-guided-comparison-navigation.ts')return {resolveHeadGuidedComparisonNavigation};
  if(id==='../../../../components/HeadAtlasTeaching')return {HeadAtlasTeaching:loadHeadComparisonTeaching()};
  if(id==='next/navigation')return {notFound:()=>{throw Error('NOT_FOUND');}};
  if(id.endsWith('.css'))return {};
  return require(id);
},page,page.exports);
const render=async(params:Record<string,string|string[]|undefined>)=>renderToStaticMarkup(await page.exports.default({searchParams:Promise.resolve(params)}));

test('route renders exact cards and accessible new-tab handoffs without loading media',async()=>{
  const activity=headGuidedComparisonForStep('brainstem','brainstem-pons');assert(activity);
  const html=await render(Object.fromEntries(new URL(activity.activityHref,'https://visible.invalid').searchParams));
  assert.match(html,/Visible Medicine · Draft activity/);assert.match(html,/Compare views: Pons/);assert.match(html,/Step 2 of 3/);
  assert.equal((html.match(/class="head-compare-card"/g)??[]).length,3);
  for(const view of activity.availableViews){assert(html.includes(view.href.replaceAll('&','&amp;')));assert(html.includes(`in ${view.name} (opens in a new tab)`));}
  const mappedCards=html.match(/<article class="head-compare-card"[\s\S]*?<\/article>/g)??[];
  assert.equal(mappedCards.length,3);
  assert.equal(mappedCards.filter(card=>card.includes('target="_blank" rel="noopener noreferrer"')).length,3);
  assert.match(html,/What to look for/);assert.match(html,/CT · reading notes · Draft/);assert.match(html,/MRI · reading notes · Draft/);
  assert.match(html,/Reflect as you compare/);assert.match(html,/separate, unregistered subjects/);
  assert.match(html,/Source and access limitations/);assert.match(html,/Back to this tour/);
  assert(!/<(?:iframe|img|video|canvas|form|input)\b/i.test(html));
  assert.deepEqual(page.exports.metadata.robots,{index:false,follow:false});
});

test('route refuses stale and arbitrary fields before rendering any handoff',async()=>{
  const activity=headGuidedComparisonForStep('brainstem','brainstem-pons');assert(activity);
  const params=Object.fromEntries(new URL(activity.activityHref,'https://visible.invalid').searchParams);
  await assert.rejects(()=>render({...params,headRevision:'stale'}),/NOT_FOUND/);
  await assert.rejects(()=>render({...params,redirect:'https://other.invalid'}),/NOT_FOUND/);
  await assert.rejects(()=>render({...params,headStep:['1','1']}),/NOT_FOUND/);
});

test('middle step offers named same-tab neighboring activities with accessible step counts',async()=>{
  const activity=headGuidedComparisonForStep('brainstem','brainstem-pons');assert(activity);
  const params=Object.fromEntries(new URL(activity.activityHref,'https://visible.invalid').searchParams),steps=resolveHeadGuidedComparisonNavigation(params);assert(steps?.previous&&steps.next);
  const html=await render(params),nav=html.match(/<nav class="head-compare-steps"[\s\S]*?<\/nav>/)?.[0];assert(nav);
  assert.match(nav,/aria-label="Compare tour steps"/);assert.equal((nav.match(/<a /g)??[]).length,2);
  for(const [direction,target]of [['Previous',steps.previous],['Next',steps.next]] as const){assert(nav.includes(target.href.replaceAll('&','&amp;')));assert(nav.includes(`${direction} structure: ${target.label}, step ${target.step} of ${target.total}`));}
  assert(!nav.includes('target='));assert(!/button|autoplay|progress|score/.test(nav));
});

test('first and final activity use explicit boundaries without wrapping or implying completion',async()=>{
  for(const [conceptId,boundary,other]of [['brainstem-midbrain','Start of tour','End of tour'],['brainstem-medulla','End of tour','Start of tour']]){
    const activity=headGuidedComparisonForStep('brainstem',conceptId);assert(activity);
    const html=await render(Object.fromEntries(new URL(activity.activityHref,'https://visible.invalid').searchParams)),nav=html.match(/<nav class="head-compare-steps"[\s\S]*?<\/nav>/)?.[0];assert(nav);
    assert(nav.includes(boundary));assert(!nav.includes(other));assert.equal((nav.match(/<a /g)??[]).length,1);assert(!/completed|score|passed/.test(nav));
  }
});


test('every mapped activity returns to its canonical tour through valid catalogue filters',async()=>{
  let checked=0;const sequences=new Set<string>();
  for(const sequence of headLearningSequencesForModality())for(const concept of sequence.concepts){
    const activity=headGuidedComparisonForStep(sequence.id,concept);if(!activity)continue;
    const html=await render(Object.fromEntries(new URL(activity.activityHref,'https://visible.invalid').searchParams));
    const nav=html.match(/<nav aria-label="Guided learning return">([\s\S]*?)<\/nav>/)?.[1];assert(nav);
    const href=nav.match(/href="([^"]+)"/)?.[1]?.replaceAll('&amp;','&');assert(href);
    const target=new URL(href,'https://visible.invalid');assert.equal(target.origin,'https://visible.invalid');assert.equal(target.pathname,'/atlas/guided-learning');
    assert.equal(target.hash,`#linked-step-${sequence.id}-${concept}`);
    assert.deepEqual([...target.searchParams.keys()],['view','region','q','returnTour','returnConcept','returnStep','returnRevision']);
    const filter=parseHeadLearningDiscovery(Object.fromEntries([...target.searchParams].filter(([key])=>['view','region','q'].includes(key))),['head-neck']);assert.deepEqual(filter,{view:'all',query:sequence.label,region:'head-neck'});
    assert.match(nav,/Back to this tour/);assert(!nav.includes('target='));
    assert.equal(target.searchParams.get('returnTour'),sequence.id);
    assert.equal(target.searchParams.get('returnConcept'),concept);
    assert.equal(target.searchParams.get('returnStep'),String(sequence.concepts.indexOf(concept)));
    assert.equal(target.searchParams.get('returnRevision'),activity.sourceRevision);
    for(const key of ['headRevision','headTour','headStep','concept','redirect','returnTo'])assert(!target.searchParams.has(key));
    sequences.add(sequence.id);checked++;
  }
  assert.equal(checked,45);assert.equal(sequences.size,13);
});
