import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {loadHeadBookmark} from './head-bookmark-ui-loader.ts';
import * as learning from '../lib/head-atlas-learning.ts';
import * as availability from '../lib/head-link-availability.ts';
import * as mriLearning from '../lib/head-mri-learning.ts';
import * as insulaLearning from '../lib/head-insula-learning.ts';
import * as orbitalLearning from '../lib/head-orbital-learning.ts';
import * as boneLearning from '../lib/head-ct-bone-learning.ts';

const source=readFileSync(new URL('../components/HeadAtlasLearningLibrary.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
const require=createRequire(import.meta.url);
type Props={children?:React.ReactNode;[key:string]:unknown};
type Element=React.ReactElement<Props>;

function harness(linksCurrent=true,missingConcept?:string){
  const state:unknown[]=[];
  const refs:Array<{current:{focus:()=>void}|null}>=[];
  let hook=0,focuses=0;
  const reactMock={...React,
    useState<T>(initial:T){const slot=hook++;if(!(slot in state))state[slot]=initial;
      return [state[slot] as T,(next:T|((previous:T)=>T))=>{state[slot]=typeof next==='function'?(next as (previous:T)=>T)(state[slot] as T):next;}];},
    useRef<T>(initial:T){const slot=hook++;if(!refs[slot])refs[slot]={current:{focus:()=>{focuses++;}}};return refs[slot] as {current:T};},
  };
  const dependencies:Record<string,unknown>={
    './HeadLearningBookmark':loadHeadBookmark(),
    react:reactMock,
    '../lib/head-atlas-learning':{...learning,headLearningLinks:(position:learning.HeadLearningPosition)=>
      position.conceptId===missingConcept?null:learning.headLearningLinks(position)},
    '../lib/head-link-availability.ts':{...availability,headLinksCurrent:()=>linksCurrent},
    '../lib/head-mri-learning':mriLearning,
    '../lib/head-insula-learning':insulaLearning,
    '../lib/head-orbital-learning':orbitalLearning,
    '../lib/head-ct-bone-learning':boneLearning,
  };
  const mod={exports:{} as {HeadAtlasLearningLibrary:()=>React.ReactNode}};
  new Function('require','module','exports',compiled)((id:string)=>dependencies[id]??require(id),mod,mod.exports);
  function render(){hook=0;const tree=mod.exports.HeadAtlasLearningLibrary();return {tree,html:renderToStaticMarkup(tree)};}
  function find(tree:React.ReactNode,type:string,predicate:(props:Props)=>boolean=()=>true):Element{
    const visit=(node:React.ReactNode):Element|undefined=>{
      if(Array.isArray(node)){for(const child of node){const match=visit(child);if(match)return match;}return;}
      if(!React.isValidElement<Props>(node))return;
      if(node.type===type&&predicate(node.props))return node;
      return visit(node.props.children);
    };
    const found=visit(tree);
    assert(found,`Missing ${type} control`);
    return found;
  }
  function changeSearch(value:string){const {tree}=render();const input=find(tree,'input',props=>props.type==='search');
    (input.props.onChange as (event:{target:{value:string}})=>void)({target:{value}});}
  function changeModality(value:string){const {tree}=render();const select=find(tree,'select');
    (select.props.onChange as (event:{target:{value:string}})=>void)({target:{value}});}
  function clear(){const {tree}=render();const button=find(tree,'button',props=>props.children==='Clear tour filters');
    (button.props.onClick as ()=>void)();}
  return {render,find,changeSearch,changeModality,clear,get focusCount(){return focuses;}};
}

function withoutStepPreviews(html:string){return html.replace(/<details class="head-linked-step-preview"[^>]*>[\s\S]*?<\/details>/g,'');}
function withoutMatchingSteps(html:string){return withoutStepPreviews(html).replace(/<div class="head-linked-matching-step">[\s\S]*?<\/div>/g,'');}
function rows(html:string){return [...withoutMatchingSteps(html).matchAll(/<li>(.*?)<\/li>/g)].map(match=>match[1]);}
function startLinks(row:string){return [...row.matchAll(/<a href="([^"]+)" aria-label="([^"]+)">([^<]+)<\/a>/g)]
  .map(match=>({href:match[1].replaceAll('&amp;','&'),label:match[2],text:match[3]}));}
function matchingSteps(html:string){return [...withoutStepPreviews(html).matchAll(/<div class="head-linked-matching-step">([\s\S]*?)<\/div>/g)].map(match=>match[1]);}

test('default discovery shows thirteen canonical tours with eleven CT and ten MRI starts',()=>{
  const {html}=harness().render();
  assert.match(html,/13 linked tours available/);
  assert.match(html,/<label>Search linked tours<input/);
  assert.match(html,/<label>Available view<select/);
  assert.equal(rows(html).length,13);
  assert.deepEqual(rows(html).map(row=>startLinks(row)[0]?.label),
    learning.headLearningSequencesForModality().map(sequence=>`Start ${sequence.label} in ${sequence.id==='cerebellar-orientation'?'CT':'the 3D Atlas'}`));
  assert.equal((withoutStepPreviews(html).match(/>CT<\/a>/g)??[]).length,11);
  assert.equal((withoutStepPreviews(html).match(/>MRI<\/a>/g)??[]).length,10);
  const controls=harness();
  const first=controls.render().tree;
  assert.equal(controls.find(first,'input',props=>props.type==='search').props.value,'');
  assert.equal(controls.find(first,'select').props.value,'all');
  assert.deepEqual(React.Children.toArray(controls.find(first,'select').props.children).filter(React.isValidElement).map(option=>(option as Element).props.value),['all','3D','CT','MRI']);
});

test('3D view keeps all twelve mapped tours and their exact canonical start destinations',()=>{
  const view=harness();
  view.changeModality('3D');
  const {tree,html}=view.render();
  const rendered=rows(html);
  const expected=learning.headLearningSequencesForModality().filter(sequence=>{
    const first=sequence.concepts[0];
    return !!learning.headLearningLinks({sequenceId:sequence.id,conceptId:first})?.atlasHref;
  });
  assert.equal(view.find(tree,'select').props.value,'3D');
  assert.match(html,/12 linked tours available/);
  assert.equal(expected.length,12);
  assert.equal(rendered.length,12);
  assert(!html.includes('aria-label="Cerebellar CT and MRI tours"'));
  assert(rendered.some(row=>row.includes('Paired hippocampi')),'MRI-only hippocampi still have a 3D start');
  for(const [index,sequence] of expected.entries()){
    const canonical=learning.headLearningLinks({sequenceId:sequence.id,conceptId:sequence.concepts[0]});
    assert(canonical?.atlasHref);
    assert(rendered[index].includes(sequence.label));
    assert.deepEqual(startLinks(rendered[index])[0],{
      href:canonical.atlasHref,label:`Start ${sequence.label} in the 3D Atlas`,text:'3D',
    });
  }
  assert.doesNotMatch(html,/\b(?:paid|subscription|entitlement|unlock)\b/i);
});

test('3D and cerebellar query show an empty state; clearing restores all tours and search focus',()=>{
  const view=harness();
  view.changeModality('3D');view.changeSearch('cerebellar');
  const empty=view.render().html;
  assert.equal(rows(empty).length,0);
  assert.match(empty,/No linked tours match\. Clear filters to see all available sequences\./);
  view.clear();
  const restored=view.render();
  assert.equal(view.focusCount,1);
  assert.equal(view.find(restored.tree,'input').props.value,'');
  assert.equal(view.find(restored.tree,'select').props.value,'all');
  assert.equal(rows(restored.html).length,13);
});

test('invalid view values leave the selected 3D filter and tour list unchanged',()=>{
  const view=harness();
  view.changeModality('3D');
  view.changeModality('injected');
  const {tree,html}=view.render();
  assert.equal(view.find(tree,'select').props.value,'3D');
  assert.equal(rows(html).length,12);
});

test('search is case insensitive, matches exact concept labels, and requires every query token',()=>{
  const view=harness();
  view.changeSearch('PONS');
  assert.deepEqual(rows(view.render().html).map(row=>startLinks(row)[0]?.label),['Start Brainstem orientation in the 3D Atlas']);
  view.changeSearch('left hippocampus');
  assert.deepEqual(rows(view.render().html).map(row=>startLinks(row)[0]?.label),['Start Paired hippocampi in the 3D Atlas']);
  view.changeSearch('hippocampus left nonsense');
  assert.equal(rows(view.render().html).length,0);
});

test('PONS search exposes exact second-step destinations without changing canonical tour starts',()=>{
  const view=harness();
  view.changeSearch('PONS');
  const html=view.render().html;
  assert.deepEqual(rows(html).map(row=>startLinks(row)[0]?.href),
    [learning.headLearningLinks({sequenceId:'brainstem',conceptId:'brainstem-midbrain'})?.atlasHref]);
  const matches=matchingSteps(html);
  assert.equal(matches.length,1);
  assert.match(matches[0],/Matching step 2: Pons/);
  const expected=learning.headLearningLinks({sequenceId:'brainstem',conceptId:'brainstem-pons'});
  assert(expected);
  assert.deepEqual(startLinks(matches[0]).map(link=>link.href),[expected.atlasHref,expected.ctHref,expected.mriHref]);
  for(const link of startLinks(matches[0])){
    const url=new URL(link.href,'https://example.invalid');
    assert.equal(url.searchParams.get('headStep'),'1');
    assert.deepEqual(learning.parseHeadLearningIntent(url.searchParams,link.text==='3D'?'atlas':'image'),
      {sequenceId:'brainstem',conceptId:'brainstem-pons'});
  }
  assert.match(html,/<details class="head-linked-step-preview"><summary>View steps · Brainstem orientation<\/summary>/);
});

test('multiword matching stays within one canonical concept label and modality narrows only shortcut links',()=>{
  const view=harness();
  view.changeSearch('rIgHt   lateral');
  view.changeModality('MRI');
  const matches=matchingSteps(view.render().html);
  assert.equal(matches.length,1);
  assert.match(matches[0],/Matching step 2: Right lateral ventricle/);
  assert.deepEqual(startLinks(matches[0]).map(link=>link.text),['MRI']);
  assert.equal(startLinks(matches[0])[0].href,
    learning.headLearningLinks({sequenceId:'ventricles',conceptId:'ventricle-right-lateral'})?.mriHref);
  view.changeSearch('left right');
  assert.equal(matchingSteps(view.render().html).length,0,'terms across two steps do not fabricate a matching step');
});

test('shortcuts follow exact mapped modalities and title-only or empty queries add no row',()=>{
  const view=harness();
  assert.equal(matchingSteps(view.render().html).length,0);
  view.changeSearch('Brainstem orientation');
  assert.equal(matchingSteps(view.render().html).length,0);
  view.changeSearch('amygdala');
  assert.equal(matchingSteps(view.render().html).length,2);
  for(const match of matchingSteps(view.render().html))assert.deepEqual(startLinks(match).map(link=>link.text),['3D','MRI']);
  view.changeSearch('parietal bone');
  for(const match of matchingSteps(view.render().html))assert.deepEqual(startLinks(match).map(link=>link.text),['3D','CT']);
  view.changeSearch('cerebellar vermis');
  assert.deepEqual(startLinks(matchingSteps(view.render().html)[0]).map(link=>link.text),['CT','MRI']);
});

test('missing matching-step binding offers no fallback and stale revision hides shortcuts',()=>{
  const missing=harness(true,'brainstem-pons');
  missing.changeSearch('pons');
  const matches=matchingSteps(missing.render().html);
  assert.equal(matches.length,1);
  assert.match(matches[0],/Exact comparison unavailable/);
  assert.equal(startLinks(matches[0]).length,0);
  const stale=harness(false);
  assert.equal(matchingSteps(stale.render().html).length,0);
});

test('facial search opens the exact third step in CT or 3D but does not invent an MRI target',()=>{
  const view=harness();view.changeSearch('mandible');view.changeModality('CT');
  const html=view.render().html;
  assert.equal(rows(html).length,1);assert.match(html,/Facial bone coverage/);
  const matches=matchingSteps(html);assert.equal(matches.length,1);
  assert.match(matches[0],/Matching step 3: Mandible/);
  assert.deepEqual(startLinks(matches[0]).map(a=>a.href),[learning.headLearningLinks({sequenceId:'ct-facial-coverage',conceptId:'bone-mandible'})!.ctHref]);
  view.changeModality('MRI');assert.equal(rows(view.render().html).length,0);
});

test('modality filtering uses mapped first-step links and preserves canonical destinations',()=>{
  const view=harness();
  for(const modality of ['CT','MRI'] as const){
    view.changeModality(modality);
    const rendered=rows(view.render().html);
    const expected=learning.headLearningSequencesForModality(modality);
    assert.equal(rendered.length,modality==='CT'?11:10);
    assert.deepEqual(rendered.map(row=>startLinks(row)[0]?.label),expected.map(sequence=>`Start ${sequence.label} in ${modality}`));
    for(const [index,sequence] of expected.entries()){
      const first=sequence.concepts[0];
      const canonical=learning.headLearningLinks({sequenceId:sequence.id,conceptId:first});
      assert(canonical);
      assert.deepEqual(startLinks(rendered[index]),[
        {href:modality==='CT'?canonical.ctHref:canonical.mriHref,label:`Start ${sequence.label} in ${modality}`,text:modality},
      ]);
    }
  }
});

test('combined filters show a helpful empty state, hide empty groups, and clear restores focus and order',()=>{
  const view=harness();
  view.changeModality('MRI');view.changeSearch('occipital bone');
  const empty=view.render().html;
  assert.equal(rows(empty).length,0);
  assert.match(empty,/No linked tours match\. Clear filters to see all available sequences\./);
  for(const group of ['MRI-only linked tours','Insula linked tours','Globe linked tours','CT-only bone linked tours'])
    assert(!empty.includes(`aria-label="${group}"`),group);
  view.clear();
  const restored=view.render();
  assert.equal(view.focusCount,1);
  assert.equal(view.find(restored.tree,'input').props.value,'');
  assert.equal(view.find(restored.tree,'select').props.value,'all');
  assert.equal(rows(restored.html).length,13);
  for(const group of ['MRI-only linked tours','Insula linked tours','Globe linked tours','CT-only bone linked tours'])
    assert(restored.html.includes(`aria-label="${group}"`),group);
});

test('stale head link revision offers neither controls nor navigation targets',()=>{
  const {html}=harness(false).render();
  assert(html.includes(availability.HEAD_LINK_REVISION_NOTICE));
  assert.doesNotMatch(html,/<a |<input|<select|<button|<li>/);
});
