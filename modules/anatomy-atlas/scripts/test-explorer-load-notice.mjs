// Execute the real Explorer callbacks and notice with controlled state; no GPU claim.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import React from 'react';
import ts from 'typescript';
import {modelLoadAccessNotice} from '../lib/model-load-failure.ts';
import {anatomyLoadReducer, anatomyLoadSummary, initialAnatomyLoads} from '../lib/anatomy-load-state.ts';

const source = readFileSync('app/body-explorer.tsx','utf8');
const ast = ts.createSourceFile('explorer.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const selected = new Map(); let notice;
function visit(node) {
  if (ts.isVariableDeclaration(node) && ['onLoaded','onFailure','accessNotice'].includes(node.name.getText(ast)))
    selected.set(node.name.getText(ast), node.initializer.getText(ast));
  if (ts.isJsxElement(node) && node.openingElement.attributes.properties.some(p => p.name?.text === 'className' && p.initializer?.text === 'body-loading error')) notice = node.getText(ast);
  ts.forEachChild(node,visit);
}
visit(ast); assert.equal(selected.size,3); assert(notice);
const compile = expression => ts.transpileModule(`this.result = (${expression});`,{compilerOptions:{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React}}).outputText;
let loads = initialAnatomyLoads, reasons = {}, required = ['a'];
const context = {React,Button:()=>null,modelLoadAccessNotice,useCallback:fn=>fn,
  loadDispatch:action=>{loads=anatomyLoadReducer(loads,action);},
  setFailureReasons:fn=>{reasons=fn(reasons);},retrying:false,retryError:'',retryAnatomy:()=>{}};
const evaluate = code => {runInNewContext(compile(code),context);return context.result;};
const fail = evaluate(selected.get('onFailure')), loaded = evaluate(selected.get('onLoaded'));
const text = node => !node?'':typeof node==='string'?node:Array.isArray(node)?node.map(text).join(''):text(node.props?.children);
const render = () => {
  context.loadStatus = anatomyLoadSummary(required,loads.loaded,loads.failed);
  context.failureReasons = reasons;
  context.accessNotice = evaluate(selected.get('accessNotice'));
  return context.loadStatus.failed.length ? text(evaluate(notice)) : '';
};
fail('a','sign-in'); assert.match(render(),/require sign-in.*Check access again/);
required=['b']; assert.equal(render(),'');
fail('b','access-denied'); assert.match(render(),/refused access.*Check access again/);
required=['a','b']; assert.match(render(),/require sign-in/);
loaded('a'); assert.match(render(),/refused access/);
fail('b'); assert.match(render(),/Some anatomy could not load.*Retry missing anatomy/);
assert.doesNotMatch(render(),/sign-in|refused access/);
loaded('b'); assert.equal(render(),'');
context.loadDispatch({type:'retry',ids:['a','b']}); assert.equal(render(),'');
console.log(JSON.stringify({passed:true,checks:9,actualExplorerCallbacksAndNotice:true,browserAcceptance:false}));
