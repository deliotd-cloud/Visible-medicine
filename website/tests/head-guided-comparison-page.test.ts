import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {headGuidedComparisonForStep,resolveHeadGuidedComparison} from '../lib/head-guided-comparison.ts';
import {resolveHeadGuidedComparisonNavigation} from '../lib/head-guided-comparison-navigation.ts';

const require=createRequire(import.meta.url);
const source=readFileSync('app/atlas/guided-learning/compare/page.tsx','utf8');
const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const page={exports:{} as any};
new Function('require','module','exports',code)((id:string)=>{
  if(id==='../../../../lib/head-guided-comparison.ts')return {resolveHeadGuidedComparison};
  if(id==='../../../../lib/head-guided-comparison-navigation.ts')return {resolveHeadGuidedComparisonNavigation};
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
  assert.equal((html.match(/target="_blank" rel="noopener noreferrer"/g)??[]).length,3);
  assert.match(html,/Reflect as you compare/);assert.match(html,/separate, unregistered subjects/);
  assert.match(html,/Source and access limitations/);assert.match(html,/Back to linked tours/);
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
