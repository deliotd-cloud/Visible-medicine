import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import * as learning from '../lib/head-atlas-learning.ts';
import * as availability from '../lib/head-link-availability.ts';
import * as mriLearning from '../lib/head-mri-learning.ts';
import * as insulaLearning from '../lib/head-insula-learning.ts';
import * as orbitalLearning from '../lib/head-orbital-learning.ts';
import * as boneLearning from '../lib/head-ct-bone-learning.ts';
import * as cerebellarLearning from '../lib/head-cerebellar-learning.ts';

const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/HeadAtlasLearningLibrary.tsx',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
type View='all'|'3D'|'CT'|'MRI';
function render(view:View='all',query='',current=true,missing?:{concept:string;view?:'MRI'}){
  const module={exports:{} as Record<string,any>};
  const mocks:Record<string,unknown>={
    './HeadLearningBookmark':{HeadLearningBookmark:()=>null},
    '../lib/head-atlas-learning':{...learning,headLearningLinks:(position:learning.HeadLearningPosition)=>{
      const links=learning.headLearningLinks(position);
      if(position.conceptId!==missing?.concept)return links;
      return missing.view&&links?{...links,mriHref:undefined}:null;
    }},
    '../lib/head-link-availability.ts':{...availability,headLinksCurrent:()=>current},
    '../lib/head-mri-learning':mriLearning,
    '../lib/head-insula-learning':insulaLearning,
    '../lib/head-orbital-learning':orbitalLearning,
    '../lib/head-ct-bone-learning':boneLearning,
    '../lib/head-cerebellar-learning.ts':cerebellarLearning,
  };
  new Function('require','module','exports',code)((id:string)=>mocks[id]??require(id),module,module.exports);
  return renderToStaticMarkup(React.createElement(module.exports.HeadAtlasLearningLibrary,{initialView:view,initialQuery:query}));
}
function contextRows(html:string){return [...html.matchAll(/<div class="head-linked-matching-step head-linked-contributing-step">([\s\S]*?)<\/div>/g)].map(match=>match[1]);}
function hrefs(html:string){return [...html.matchAll(/href="([^"]+)"/g)].map(match=>match[1].replaceAll('&amp;','&'));}

test('split terms explain how separate canonical steps contribute and retain exact links',()=>{
  const html=render('all','left right');
  assert.match(html,/Search terms span the tour title or different steps/);
  const rows=contextRows(html);
  assert(rows.some(row=>row.includes('step 1: Left caudate')&&row.includes('left')));
  assert(rows.some(row=>row.includes('step 2: Right caudate')&&row.includes('right')));
  const left=rows.find(row=>row.includes('step 1: Left caudate'))!;
  const expected=learning.headLearningLinks({sequenceId:'deep-grey',conceptId:'deep-left-caudate'})!;
  assert(hrefs(left).includes(expected.atlasHref!));
  assert(hrefs(left).includes(expected.ctHref!));
  assert(hrefs(left).includes(expected.mriHref!));
  assert.match(html,/<details class="head-linked-step-preview"><summary>View steps/);
  assert.doesNotMatch(html,/<details[^>]*head-linked-step-preview[^>]* open/);
});

test('title-plus-step and title-only searches explain the hit without inventing a matching step',()=>{
  const joined=render('CT','brainstem pons');
  assert.match(joined,/Search terms span the tour title or different steps/);
  const pons=contextRows(joined).find(row=>row.includes('step 2: Pons'))!;
  assert(pons);
  assert(hrefs(pons).includes(learning.headLearningLinks({sequenceId:'brainstem',conceptId:'brainstem-pons'})!.ctHref!));
  const title=render('CT','brainstem orientation');
  assert.match(title,/Tour title matches this search; no single step label matches every term/);
  assert.equal(contextRows(title).length,0);
  assert(hrefs(title).includes(learning.headLearningLinks({sequenceId:'brainstem',conceptId:'brainstem-midbrain'})!.ctHref!));
});

test('single and exact multiword step matches remain direct, with normalized case and whitespace',()=>{
  const single=render('MRI','  PoNs  ');
  assert.match(single,/Matching step 2: Pons/);
  assert.doesNotMatch(single,/Search terms span|Tour title matches this search|head-linked-contributing-step/);
  const exact=render('CT','  LEFT   ThAlAmUs  ');
  assert.match(exact,/Matching step 7: Left thalamus/);
  assert.equal(contextRows(exact).length,0);
  assert(hrefs(exact).includes(learning.headLearningLinks({sequenceId:'deep-grey',conceptId:'deep-left-thalamus'})!.ctHref!));
});

test('search context preserves all/3D/CT/MRI modality gates and canonical positions',()=>{
  const target=learning.headLearningLinks({sequenceId:'deep-grey',conceptId:'deep-left-caudate'})!;
  for(const view of ['all','3D','CT','MRI'] as const){
    const row=contextRows(render(view,'left right')).find(item=>item.includes('step 1: Left caudate'))!;
    assert(row,view);
    const links=hrefs(row);
    assert.deepEqual(links,[...(view==='all'||view==='3D'?[target.atlasHref!]:[]),...(view==='all'||view==='CT'?[target.ctHref!]:[]),...(view==='all'||view==='MRI'?[target.mriHref!]:[])]);
    for(const href of links)assert.equal(new URL(href,'https://example.invalid').searchParams.get('headStep'),'0');
  }
  assert.match(render('CT','cerebellar orientation'),/Cerebellar orientation/);
  assert.match(render('MRI','cerebellar orientation'),/Cerebellar orientation/);
  assert.match(render('all','cerebellar orientation'),/Cerebellar orientation/);
  assert.doesNotMatch(render('3D','cerebellar orientation'),/Cerebellar CT and MRI tours/);
});

test('empty, no-hit and stale searches keep their established closed states',()=>{
  const empty=render();
  assert.match(empty,/13 linked tours available/);
  assert.doesNotMatch(empty,/Search terms span|Tour title matches this search|head-linked-contributing-step/);
  assert.match(render('all','   '),/13 linked tours available/);
  const none=render('all','unmapped-nonsense');
  assert.match(none,/No linked tours match/);
  assert.equal(contextRows(none).length,0);
  const stale=render('MRI','left right',false);
  assert.match(stale,/imaging revision has changed/);
  assert.doesNotMatch(stale,/<a |Search terms span|head-linked-contributing-step/);
});

test('a contributing step with missing or unmapped links keeps its slot without substitute destinations',()=>{
  for(const missing of [{concept:'deep-right-caudate'},{concept:'deep-right-caudate',view:'MRI' as const}]){
    const html=render('MRI','left right',true,missing);
    const rows=contextRows(html),right=rows.find(row=>row.includes('step 2: Right caudate'));
    assert(right,'The original canonical slot is retained.');
    assert.match(right,/contributes: right/);
    assert.match(right,/Exact comparison unavailable in the selected view/);
    assert.deepEqual(hrefs(right),[]);
    assert.doesNotMatch(right,/<nav/);
    const left=rows.find(row=>row.includes('step 1: Left caudate'));
    assert(left);
    assert.deepEqual(hrefs(left),[learning.headLearningLinks({sequenceId:'deep-grey',conceptId:'deep-left-caudate'})!.mriHref]);
  }
});
