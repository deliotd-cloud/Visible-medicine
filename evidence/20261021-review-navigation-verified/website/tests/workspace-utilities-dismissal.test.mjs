import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {isPublicFocusPath,shouldFocusPublicRoute} from '../lib/public-route-focus.ts';
import {reviewDestination,reviewDestinationActive} from '../lib/review-destination.ts';

const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/SiteFrame.tsx',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
const module={exports:{}};
const imports={'next/link':({children,...props})=>React.createElement('a',props,children),
  'next/navigation':{usePathname:()=>'/workspace'},'./SiteHeader':{SiteHeader:()=>null},
  './SiteFooter':{SiteFooter:()=>null},'./workspace-navigation.css':{},
  '../lib/public-route-focus':{isPublicFocusPath,shouldFocusPublicRoute},
  '../lib/review-destination':{reviewDestination,reviewDestinationActive}};
new Function('require','module','exports',code)(name=>Object.hasOwn(imports,name)?imports[name]:require(name),module,module.exports);
function find(node,predicate){
  if(!node||typeof node!=='object')return null;
  if(predicate(node))return node;
  for(const child of React.Children.toArray(node.props?.children)){const result=find(child,predicate);if(result)return result;}
  return null;
}
const tree=()=>module.exports.WorkspaceContextBar({pathname:'/workspace/clinical-review-inbox',signedIn:true});
const menu=()=>find(tree(),node=>node.type==='details'&&node.props.className==='workspace-mobile-menu');

test('utilities keep native disclosure semantics and the same three navigation destinations',()=>{
  const html=renderToStaticMarkup(tree());
  assert.match(html,/<details class="workspace-mobile-menu"><summary>/);
  const block=html.slice(html.indexOf('<details'),html.indexOf('</details>'));
  assert.deepEqual([...block.matchAll(/href="([^"]+)"/g)].map(match=>match[1]),['/','/account#notifications','/trust']);
  assert.doesNotMatch(block,/<details[^>]*\bopen(?:=|>)/);
});

test('Escape from an open utilities disclosure closes it and returns focus to its summary',()=>{
  let prevented=0,stopped=0,focused=0;
  const target={open:true,querySelector:selector=>{assert.equal(selector,'summary');return{focus:()=>focused++};}};
  menu().props.onKeyDown({key:'Escape',currentTarget:target,preventDefault:()=>prevented++,stopPropagation:()=>stopped++});
  assert.equal(target.open,false);assert.equal(prevented,1);assert.equal(stopped,1);assert.equal(focused,1);
});

test('other keys and Escape from a closed disclosure do not intercept input or focus',()=>{
  for(const [key,open] of [['Tab',true],['Enter',true],['ArrowDown',true],['Escape',false]]){
    const target={open,querySelector:()=>{throw Error('unexpected focus');}};
    menu().props.onKeyDown({key,currentTarget:target,preventDefault:()=>{throw Error('unexpected prevention');},stopPropagation:()=>{throw Error('unexpected propagation');}});
    assert.equal(target.open,open);
  }
});

test('moving focus inside keeps the menu open; leaving closes it without stealing focus',()=>{
  const internal={};
  const target={open:true,contains:node=>node===internal};
  menu().props.onBlur({currentTarget:target,relatedTarget:internal});assert.equal(target.open,true);
  menu().props.onBlur({currentTarget:target,relatedTarget:{}});assert.equal(target.open,false);
  target.open=true;menu().props.onBlur({currentTarget:target,relatedTarget:null});assert.equal(target.open,false);
});

test('each utilities link dismisses only its owning disclosure and never intercepts navigation',()=>{
  const nav=find(menu(),node=>node.type==='nav');
  const links=React.Children.toArray(nav.props.children);
  assert.equal(links.length,3);
  for(const link of links){
    const removed=[];
    link.props.onClick({currentTarget:{closest:selector=>{assert.equal(selector,'details');return{removeAttribute:name=>removed.push(name)};}}});
    assert.deepEqual(removed,['open']);
    assert.doesNotThrow(()=>link.props.onClick({currentTarget:{closest:()=>null}}));
  }
});
