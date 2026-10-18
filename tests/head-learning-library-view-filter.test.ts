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

function harness(options:{missing?:string;withoutMri?:string;current?:boolean}={}){
  const state:unknown[]=[];
  let hook=0;
  const reactMock={...React,
    useState<T>(initial:T){const slot=hook++;if(!(slot in state))state[slot]=initial;
      return [state[slot] as T,(next:T)=>{state[slot]=next;}];},
    useRef<T>(initial:T){return {current:initial};},
  };
  const dependencies:Record<string,unknown>={
    react:reactMock,
    './HeadLearningBookmark':loadHeadBookmark(),
    '../lib/head-atlas-learning':{...learning,headLearningLinks:(position:learning.HeadLearningPosition)=>{
      if(position.conceptId===options.missing)return null;
      const links=learning.headLearningLinks(position);
      return links&&position.conceptId===options.withoutMri?{...links,mriHref:undefined}:links;
    }},
    '../lib/head-link-availability.ts':{...availability,headLinksCurrent:()=>options.current!==false},
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
    const found=visit(tree);assert(found,`Missing ${type}`);return found;
  }
  function select(value:string){const {tree}=render();(find(tree,'select').props.onChange as (event:{target:{value:string}})=>void)({target:{value}});}
  function search(value:string){const {tree}=render();(find(tree,'input',props=>props.type==='search').props.onChange as (event:{target:{value:string}})=>void)({target:{value}});}
  function clear(){const {tree}=render();(find(tree,'button',props=>props.children==='Clear tour filters').props.onClick as ()=>void)();}
  return {render,find,select,search,clear};
}

function tour(html:string,label:string){
  const start=html.indexOf(`<strong>${label}</strong>`);
  assert(start>=0,`Missing tour ${label}`);
  return html.slice(start,html.indexOf('</details>',start)+10);
}
function anchors(html:string){return [...html.matchAll(/<a href="([^"]+)" aria-label="([^"]+)">([^<]+)<\/a>/g)]
  .map(match=>({href:match[1].replaceAll('&amp;','&'),label:match[2],view:match[3]}));}
function stepRows(html:string){return [...html.matchAll(/<li><span>[^<]+<\/span>([\s\S]*?)<\/li>/g)].map(match=>match[1]);}

test('default and each selected view keep only canonical action destinations',()=>{
  const view=harness();
  const sequence=learning.headLearningSequences[0];
  for(const selected of ['all','3D','CT','MRI'] as const){
    if(selected!=='all')view.select(selected);
    const html=tour(view.render().html,sequence.label);
    const first=learning.headLearningLinks({sequenceId:sequence.id,conceptId:sequence.concepts[0]})!;
    const expected=[
      ...((selected==='all'||selected==='3D')&&first.atlasHref?[{href:first.atlasHref,view:'3D'}]:[]),
      ...((selected==='all'||selected==='CT')&&first.ctHref?[{href:first.ctHref,view:'CT'}]:[]),
      ...((selected==='all'||selected==='MRI')&&first.mriHref?[{href:first.mriHref,view:'MRI'}]:[]),
    ];
    const start=html.match(/<nav aria-label="Start Brainstem orientation">([\s\S]*?)<\/nav>/)?.[1];
    assert(start);
    assert.deepEqual(anchors(start).map(({href,view})=>({href,view})),expected);
    const steps=stepRows(html);
    assert.equal(steps.length,sequence.concepts.length);
    for(const [index,conceptId] of sequence.concepts.entries()){
      const canonical=learning.headLearningLinks({sequenceId:sequence.id,conceptId})!;
      const links=anchors(steps[index]);
      assert.deepEqual(links.map(link=>link.view),expected.map(link=>link.view));
      for(const link of links){
        assert.equal(link.href,link.view==='3D'?canonical.atlasHref:link.view==='CT'?canonical.ctHref:canonical.mriHref);
        const url=new URL(link.href,'https://example.invalid');
        assert.equal(url.searchParams.get('headStep'),String(index));
        assert.deepEqual(learning.parseHeadLearningIntent(url.searchParams,link.view==='3D'?'atlas':'image'),{sequenceId:sequence.id,conceptId});
      }
    }
    assert.match(html,/<details class="head-linked-step-preview"><summary>/);
  }
});

test('search shortcuts, starts, and expanded steps honor the same selected view; clear restores all',()=>{
  const view=harness();view.search('PONS');view.select('CT');
  let html=tour(view.render().html,'Brainstem orientation');
  assert.deepEqual([...new Set(anchors(html).map(link=>link.view))],['CT']);
  const match=html.match(/<div class="head-linked-matching-step">([\s\S]*?)<\/div>/)?.[1];
  assert(match);
  assert.equal(anchors(match)[0].href,learning.headLearningLinks({sequenceId:'brainstem',conceptId:'brainstem-pons'})?.ctHref);
  view.clear();html=tour(view.render().html,'Brainstem orientation');
  assert.deepEqual([...new Set(anchors(html).map(link=>link.view))],['3D','CT','MRI']);
  assert.equal(view.find(view.render().tree,'select').props.value,'all');
});

test('unmapped selected step keeps its position with truthful unavailable text and no empty nav',()=>{
  const view=harness({withoutMri:'brainstem-pons'});view.select('MRI');view.search('PONS');
  const html=tour(view.render().html,'Brainstem orientation');
  const steps=stepRows(html);
  assert.equal(steps.length,3);
  assert.match(steps[1],/Exact comparison unavailable in the selected view/);
  assert.equal(anchors(steps[1]).length,0);
  assert.doesNotMatch(steps[1],/<nav/);
  assert.match(html,/Matching step 2: Pons[\s\S]*?Exact comparison unavailable in the selected view/);
  assert.equal(anchors(steps[0]).length,1);
  assert.equal(anchors(steps[2]).length,1);
});

test('stale revision remains fail closed',()=>{
  const html=harness({current:false}).render().html;
  assert.match(html,/temporarily unavailable because the imaging revision has changed/);
  assert.doesNotMatch(html,/<a |<nav|<details|<select/);
});
