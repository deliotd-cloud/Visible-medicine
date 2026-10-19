import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {loadHeadBookmark} from './head-bookmark-ui-loader.ts';
import * as learning from '../lib/head-atlas-learning.ts';
import * as tour from '../lib/lecture-tour-context.ts';
import * as related from '../lib/lecture-related-links.ts';
import {HEAD_LINK_REVISION,headConceptById,headConceptFromAtlasQuery} from '../lib/head-atlas-links.ts';

const source=readFileSync(new URL('../components/HeadAtlasLearningNavigation.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
type NavigationProps={position:learning.HeadLearningPosition;comparisonReady?:boolean;recoveryLinks?:boolean;onNavigate?:(href:string)=>boolean};
const mod={exports:{} as {HeadAtlasLearningNavigation:(props:NavigationProps)=>React.ReactNode}};
const require=createRequire(import.meta.url);
const pickerSource=readFileSync(new URL('../components/HeadAtlasLearningPicker.tsx',import.meta.url),'utf8');
const pickerCode=ts.transpileModule(pickerSource,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
const picker={exports:{} as {HeadAtlasLearningPicker:(props:{sequenceId?:string})=>React.ReactElement}};
new Function('require','module','exports',pickerCode)((id:string)=>id==='next/navigation'?{useRouter:()=>({push:()=>{}})}:id==='../lib/head-atlas-learning'?learning:id==='../lib/head-atlas-links'?{headConceptById}:require(id),picker,picker.exports);
new Function('require','module','exports',compiled)((id:string)=>id==='./HeadLearningBookmark'?loadHeadBookmark():id==='../lib/head-atlas-learning'?learning:id==='../lib/head-atlas-links'?{HEAD_LINK_REVISION}:id==='../lib/lecture-tour-context'?tour:id==='../lib/lecture-related-links'?related:id==='./HeadAtlasLearningPicker'?picker.exports:require(id),mod,mod.exports);
const render=(position:learning.HeadLearningPosition,options:Omit<NavigationProps,'position'>={})=>renderToStaticMarkup(React.createElement(mod.exports.HeadAtlasLearningNavigation,{position,...options}));

test('failed 3D focus exposes separate authored CT/MRI step recovery with exact revision pins',()=>{
  const position={sequenceId:'brainstem',conceptId:'brainstem-pons'};
  const current=learning.headLearningNavigation(position)!.current;
  const waiting=render(position,{comparisonReady:false});
  assert.doesNotMatch(waiting,/Open authored step on CT|Open authored step on MRI/);
  const html=render(position,{comparisonReady:false,recoveryLinks:true});
  for(const [view,href] of [['CT',current.ctHref],['MRI',current.mriHref]] as const){
    assert(href);
    const exact=href.replaceAll('&','&amp;');
    assert(html.includes(`href="${exact}" target="_blank" rel="noopener noreferrer" aria-label="Open authored Pons step on ${view} in a new tab"`));
    const url=new URL(href,'https://example.invalid');
    assert.deepEqual(learning.parseHeadLearningIntent(url.searchParams,'image'),position);
    assert.equal(url.searchParams.get('headRevision'),HEAD_LINK_REVISION);
  }
  assert.match(html,/authored tour step, not a confirmed live model selection/i);
  assert.match(html,/class="head-atlas-tour-recovery head-guided-status"/,'reuse the compact styled recovery row without new CSS');
  assert.match(html,/separate, unregistered subjects/);
  assert.match(html,/CT · awaiting model/);
  assert.match(html,/MRI · awaiting model/);
  assert.doesNotMatch(render(position,{comparisonReady:true,recoveryLinks:true}),/Open authored step on CT|Open authored step on MRI/);
  const mriOnly=render({sequenceId:'mri-amygdalae',conceptId:'limbic-left-amygdala'},{comparisonReady:false,recoveryLinks:true});
  assert.match(mriOnly,/Open authored step on MRI/);
  assert.doesNotMatch(mriOnly,/Open authored step on CT|href="[^"]*ct-head/);
  for(const invalid of [{sequenceId:'unknown',conceptId:'brainstem-pons'},{sequenceId:'brainstem',conceptId:null}])
    assert.equal(render(invalid,{comparisonReady:false,recoveryLinks:true}),'');
});

test('recovery new-tab clicks bypass the model navigation interception',()=>{
  const position={sequenceId:'brainstem',conceptId:'brainstem-pons'};
  const navigated:string[]=[];
  const tree=mod.exports.HeadAtlasLearningNavigation({position,comparisonReady:false,recoveryLinks:true,onNavigate:href=>{navigated.push(href);return true;}}) as React.ReactElement<any>;
  const oldElement=(globalThis as any).Element;
  class FakeElement{closest(_selector:string){return {target:'_blank',getAttribute:()=>learning.headLearningNavigation(position)!.current.ctHref,hasAttribute:()=>false};}}
  (globalThis as any).Element=FakeElement;
  try{
    let prevented=false;
    tree.props.onClick({defaultPrevented:false,button:0,metaKey:false,ctrlKey:false,shiftKey:false,altKey:false,target:new FakeElement(),currentTarget:{contains:()=>true},preventDefault:()=>{prevented=true;}});
    assert.deepEqual(navigated,[]);assert.equal(prevented,false);
    tree.props.onClick({defaultPrevented:false,button:0,metaKey:false,ctrlKey:true,shiftKey:false,altKey:false,target:new FakeElement(),currentTarget:{contains:()=>true},preventDefault:()=>{prevented=true;}});
    assert.deepEqual(navigated,[]);assert.equal(prevented,false);
  }finally{if(oldElement===undefined)delete (globalThis as any).Element;else (globalThis as any).Element=oldElement;}
});

test('stale head-link revision suppresses recovery links before navigation renders',()=>{
  const stale={exports:{} as {HeadAtlasLearningNavigation:(props:NavigationProps)=>React.ReactNode}};
  new Function('require','module','exports',compiled)((id:string)=>id==='../lib/head-link-availability.ts'
    ?{headLinksCurrent:()=>false,HEAD_LINK_REVISION_NOTICE:'Revision changed'}
    :id==='./HeadLearningBookmark'?loadHeadBookmark()
    :id==='../lib/head-atlas-learning'?learning
    :id==='../lib/head-atlas-links'?{HEAD_LINK_REVISION}
    :id==='../lib/lecture-tour-context'?tour
    :id==='../lib/lecture-related-links'?related
    :id==='./HeadAtlasLearningPicker'?picker.exports:require(id),stale,stale.exports);
  const html=renderToStaticMarkup(React.createElement(stale.exports.HeadAtlasLearningNavigation,
    {position:{sequenceId:'brainstem',conceptId:'brainstem-pons'},comparisonReady:false,recoveryLinks:true}));
  assert.match(html,/Revision changed/);
  assert.doesNotMatch(html,/<a |Open authored step|<nav/);
});

test('every step has canonical position and exact pinned adjacent 3D destinations',()=>{
  let count=0;
  for(const sequence of learning.headLearningSequencesForModality('CT').filter(sequence=>learning.headLearningLinks({sequenceId:sequence.id,conceptId:sequence.concepts[0]})?.atlasHref))for(const [index,conceptId] of sequence.concepts.entries()){
    const position={sequenceId:sequence.id,conceptId},navigation=learning.headLearningNavigation(position);assert(navigation);count++;
    assert.equal(navigation.index,index);assert.equal(navigation.total,sequence.concepts.length);assert.equal(navigation.sequenceLabel,sequence.label);
    assert.equal(navigation.exitHref,headConceptById(conceptId)?.atlasHref);
    const exit=new URL(navigation.exitHref,'https://example.invalid');
    assert.equal(headConceptFromAtlasQuery(exit.searchParams)?.conceptId,conceptId);
    assert.equal(learning.hasHeadLearningQuery(exit.searchParams),false,'leaving removes all tour metadata without losing exact anatomy');
    for(const [offset,destination] of [[-1,navigation.previous],[1,navigation.next]] as const){
      const expected=sequence.concepts[index+offset];
      if(!expected){assert.equal(destination,null);continue;}
      assert(destination);const url=new URL(destination.href,'https://example.invalid');
      assert.equal(url.pathname,'/atlas/head-neck-3d');assert.equal(url.searchParams.get('headRevision'),HEAD_LINK_REVISION);
      assert.deepEqual(learning.parseHeadLearningIntent(url.searchParams,'atlas'),{sequenceId:sequence.id,conceptId:expected});
      assert.equal(headConceptFromAtlasQuery(url.searchParams)?.conceptId,expected);
      const back=learning.headLearningNavigation({sequenceId:sequence.id,conceptId:expected});
      assert.equal(offset===1?back?.previous?.href:back?.next?.href,navigation.current.atlasHref);
    }
    for(const key of ['ctHref','mriHref'] as const){const href:string|undefined=navigation.current[key];if(!href){assert.equal(key,'mriHref');assert(sequence.id.startsWith('ct-'));continue;}assert.deepEqual(learning.parseHeadLearningIntent(new URL(href,'https://example.invalid').searchParams),position);}
  }
  assert.equal(count,38);
});

test('MRI-only strip has exact MRI/3D links, no invented CT link and stable end boundaries',()=>{
  for(const sequence of learning.headLearningSequencesForModality('MRI').filter(item=>item.id.startsWith('mri-')))for(const [index,conceptId] of sequence.concepts.entries()){
    const position={sequenceId:sequence.id,conceptId},nav=learning.headLearningNavigation(position);assert(nav);
    assert.equal(nav.current.ctHref,undefined);
    assert.equal(nav.index,index);
    const html=render(position);
    assert.match(html,/Continue .* on MRI/);
    assert.doesNotMatch(html,/Continue .* on CT|href="undefined"/);
    assert.equal(nav.previous===null,index===0);
    assert.equal(nav.next===null,index===sequence.concepts.length-1);
  }
});

test('invalid or unrelated position never produces a navigation strip',()=>{
  for(const position of [{sequenceId:'unknown',conceptId:'brainstem-pons'},{sequenceId:'brainstem',conceptId:null},{sequenceId:'ventricles',conceptId:'brainstem-pons'},{sequenceId:'brainstem',conceptId:'javascript:alert(1)'}]){
    assert.equal(learning.headLearningNavigation(position),null);assert.equal(render(position),'');
  }
});

test('all CT-only bone steps render CT and 3D navigation without an MRI fallback',()=>{
  for(const sequence of learning.headLearningSequencesForModality('CT').filter(s=>s.id.startsWith('ct-')))for(const conceptId of sequence.concepts){
    const html=render({sequenceId:sequence.id,conceptId});assert.match(html,/Continue .* on CT/);assert.match(html,/No exact MRI comparison mapped/);assert.doesNotMatch(html,/href="[^"]*mri-head|href="undefined"/);
  }
});

test('rendered strip labels destinations and unavailable boundaries without duplicate imaging actions',()=>{
  const middle=render({sequenceId:'brainstem',conceptId:'brainstem-pons'});
  assert.match(middle,/Step 2 \/ 3/);assert.match(middle,/<strong>Pons<\/strong>/);
  for(const text of ['Brainstem orientation','Draft','Previous step: Midbrain','Next step: Medulla oblongata','Continue Pons on CT','Continue Pons on MRI','selecting inside the model does not change these links','unregistered subjects'])assert(middle.includes(text),text);
  assert.equal((middle.match(/<a /g)??[]).length,9,'five existing navigation links, three collapsed step links, and one related lecture link');
  assert.equal((middle.match(/aria-current="step"/g)??[]).length,1);
  assert.match(middle,/2\. Pons · current/);
  assert.match(middle,/<details[^>]*class="head-linked-tour-picker"/);
  assert.match(middle,/<summary>Linked tours<\/summary>/);
  assert.match(middle,/<select[^>]*name="head-linked-tour"[^>]*required/);
  assert.match(middle,/Leave tour and explore Pons/);assert.doesNotMatch(middle,/Finish tour/);
  const first=render({sequenceId:'brainstem',conceptId:'brainstem-midbrain'}),last=render({sequenceId:'brainstem',conceptId:'brainstem-medulla'});
  assert.match(first,/<span aria-disabled="true">Previous<\/span>/);assert.doesNotMatch(first,/rel="prev"/);
  assert.match(last,/Finish tour and explore Medulla oblongata/);assert.doesNotMatch(last,/rel="next"|Leave tour|aria-disabled="true">Next/);
  assert(!/localStorage|sessionStorage|indexedDB|fetch\(|postMessage/.test(source));
  const wrapper=readFileSync(new URL('../app/atlas/head-neck-3d/page.tsx',import.meta.url),'utf8');
  const host=readFileSync(new URL('../components/HeadAtlasGuidedModel.tsx',import.meta.url),'utf8');
  assert(host.includes('without guided learning controls'));
  assert(wrapper.includes('HeadAtlasGuidedModel initialHref='));
  assert(host.includes('Open model only'));
  assert(wrapper.includes("intent?' head-guided-module-page':''"));
  const css=readFileSync(new URL('../app/atlas/head-neck-3d/head-learning.css',import.meta.url),'utf8');
  assert.match(css,/\.head-guided-module-page > \.head-atlas-tour \{ grid-column:1 \/ -1; grid-row:2;/);
  assert.match(css,/\.head-guided-module-page > \.shoulder-module-frame \{ grid-row:3;/);
  assert.match(css,/\.head-guided-module-page > \.shoulder-module-notes \{ grid-row:4;/);
});
