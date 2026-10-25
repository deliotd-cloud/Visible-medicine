import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {headGuidedComparisonForStep,resolveHeadGuidedComparison} from '../lib/head-guided-comparison.ts';

const require=createRequire(import.meta.url);
const source=readFileSync('app/atlas/guided-learning/compare/page.tsx','utf8');
const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const page={exports:{} as any};
new Function('require','module','exports',code)((id:string)=>{
  if(id==='../../../../lib/head-guided-comparison.ts')return {resolveHeadGuidedComparison};
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
