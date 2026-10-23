import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import * as availability from '../lib/head-link-availability.ts';
import * as links from '../lib/head-atlas-links.ts';
import * as learning from '../lib/head-atlas-learning.ts';
import * as navigation from '../lib/head-atlas-navigation.ts';
import * as lectures from '../lib/lecture-related-links.ts';
import * as keyboard from '../lib/head-disclosure-keyboard.ts';
import * as status from '../components/LearningResourceStatus.ts';

const require=createRequire(import.meta.url),routes=[];
let current=true;
function load(name,extra={}){
 const source=fs.readFileSync(new URL('../components/'+name+'.tsx',import.meta.url),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const imports={'next/navigation':{useRouter:()=>({push:href=>routes.push(href)})},
  '../lib/head-link-availability.ts':{...availability,headLinksCurrent:()=>current&&availability.headLinksCurrent()},
  '../lib/head-atlas-links':links,'../lib/head-atlas-learning':learning,
  '../lib/head-atlas-navigation.ts':navigation,'../lib/lecture-related-links':lectures,
  '../lib/head-disclosure-keyboard.ts':keyboard,'./LearningResourceStatus.ts':status,
  'react/jsx-runtime':require('react/jsx-runtime'),...extra};
 const module={exports:{}};
 new Function('require','module','exports',compiled)(id=>{assert(Object.hasOwn(imports,id),id);return imports[id];},module,module.exports);
 return module.exports;
}
const picker=load('HeadAtlasLearningPicker');
const comparison=load('HeadAtlasComparisonNavigation',{'./HeadAtlasLearningPicker':picker});
const walk=value=>Array.isArray(value)?value.flatMap(walk):value&&typeof value==='object'&&'props'in value?[value,...walk(value.props.children)]:[];
function menus(){
 const tree=comparison.HeadAtlasComparisonNavigation({conceptId:'brainstem-pons',liveState:'ready',teaching:React.createElement('p',null,'Draft teaching')});
 return [...walk(tree).filter(n=>n.type==='details'),picker.HeadAtlasLearningPicker({conceptId:'brainstem-pons'})];
}
function fixture(){
 const calls=[];
 const summary={isConnected:true,focus:options=>calls.push(['focus',options])};
 const details={isConnected:true,open:true,querySelector:selector=>{assert.equal(selector,':scope > summary');return summary;}};
 const event={key:'Escape',defaultPrevented:false,nativeEvent:{isComposing:false,keyCode:27},currentTarget:details,
  target:{closest:selector=>{assert.equal(selector,'details');return details;}},
  preventDefault(){this.defaultPrevented=true;calls.push(['prevent']);},stopPropagation(){calls.push(['stop']);}};
 return{calls,summary,details,event};
}

test('every directly owned comparison and linked-tour menu uses the actual guarded handler',()=>{
 const details=menus();assert.equal(details.length,6);
 for(const node of details)assert.equal(node.props.onKeyDown,keyboard.headDisclosureKeyDown);
});

test('IME, handled, detached and nested Escape never dismisses or changes the live model links',()=>{
 routes.length=0;
 for(const node of menus())for(const mutate of [
  f=>{f.event.nativeEvent.isComposing=true;},f=>{f.event.nativeEvent.keyCode=229;},
  f=>{f.event.defaultPrevented=true;},f=>{f.event.key='Enter';},
  f=>{f.details.isConnected=false;},f=>{f.summary.isConnected=false;},
  f=>{f.details.open=false;},f=>{f.event.target=null;},
  f=>{f.event.target={closest:()=>({open:true,isConnected:true})};},
 ]){
  const f=fixture();mutate(f);const before=f.details.open;
  node.props.onKeyDown(f.event);
  assert.equal(f.details.open,before);assert.deepEqual(f.calls,[]);
 }
 assert.deepEqual(routes,[]);
});

test('a deliberate Escape closes only its own live menu and restores focus without scrolling',()=>{
 routes.length=0;
 for(const node of menus()){
  const f=fixture();node.props.onKeyDown(f.event);
  assert.equal(f.details.open,false);
  assert.deepEqual(f.calls,[['prevent'],['stop'],['focus',{preventScroll:true}]]);
  node.props.onKeyDown(f.event);assert.equal(f.calls.length,3,'repeated handled Escape is inert');
 }
 assert.deepEqual(routes,[],'dismissal never launches a model, scan, lecture or tour');
});

test('Escape in a nested tour or teaching note preserves More learning and its choice',()=>{
 const nodes=menus(),outer=nodes.find(n=>walk(n.props.children).some(c=>c.type==='summary'&&c.props.children==='More learning'));
 assert(outer);
 for(const inner of [nodes.at(-1),...nodes.filter(n=>n.props.className==='head-learning-material')]){
  const inside=fixture(),outside=fixture();inner.props.onKeyDown(inside.event);
  inside.event.currentTarget=outside.details;outer.props.onKeyDown(inside.event);
  assert.equal(inside.details.open,false);assert.equal(outside.details.open,true);assert.deepEqual(outside.calls,[]);
 }
 // A native nested disclosure with no app handler must not close an ancestor.
 const outside=fixture();outside.event.target={closest:()=>({open:true,isConnected:true})};
 outer.props.onKeyDown(outside.event);assert.equal(outside.details.open,true);assert.deepEqual(outside.calls,[]);
});

test('draft/reference status and exact source-bound links retain all existing gated states',()=>{
 for(const state of ['practice','guided','connecting','unavailable','sign-in','access-denied']){
  const html=renderToStaticMarkup(React.createElement(comparison.HeadAtlasComparisonNavigation,{conceptId:'brainstem-pons',liveState:state}));
  assert.doesNotMatch(html,/<form|<select|<details|Compare Pons on CT|Compare Pons on MRI/);
 }
 try{
  current=false;
  for(const [component,props] of [[comparison.HeadAtlasComparisonNavigation,{conceptId:'brainstem-pons',liveState:'ready'}],[picker.HeadAtlasLearningPicker,{conceptId:'brainstem-pons'}]]){
   const html=renderToStaticMarkup(React.createElement(component,props));assert.match(html,/imaging revision has changed/);assert.doesNotMatch(html,/<details|<a|<form/);
  }
 }finally{current=true;}
 const html=renderToStaticMarkup(React.createElement(comparison.HeadAtlasComparisonNavigation,{conceptId:'brainstem-pons',liveState:'ready'}));
 for(const modality of ['CT','MRI'])assert(html.includes(navigation.headImageHref(modality,'brainstem-pons',null,links.HEAD_LINK_REVISION).replaceAll('&','&amp;')));
 assert.match(html,/separate, unregistered subjects/);assert.match(html,/Lecture access is separate from Atlas access/);
});
