import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {modelLoadFailure,modelLoadAccessNotice} from '../lib/model-load-failure.ts';
import {reviewDisplayPaths} from './review-revision-evidence.mjs';

const source=readFileSync('app/anatomy-scene.tsx','utf8');
const ast=ts.createSourceFile('scene.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const boundary=ast.statements.find(n=>ts.isClassDeclaration(n)&&n.name?.text==='ModelBoundary');assert(boundary);
const compiled=ts.transpileModule(boundary.getText(ast)+'\nModelBoundary;',
 {compilerOptions:{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React}}).outputText;
function fixture(modelUrl='/atlas-runtime/shoulder/models/bodyparts3d/shoulder-right.glb',browser=true){
 const ready=[],cleared=[];
 const scope={React,Component:React.Component,Html:({children})=>React.createElement('section',null,children),Button:'button',URL,modelLoadFailure,modelLoadAccessNotice,
  useGLTF:{clear:url=>cleared.push(url)},...(browser?{window:{location:{href:'http://127.0.0.1:3000/atlas-runtime/shoulder/'}}}:{})};
 const Boundary=runInNewContext(compiled,scope),child=React.createElement('span',null,'model child');
 const instance=new Boundary({modelUrl,onModelReady:value=>ready.push(value),children:child});
 instance.setState=update=>{instance.state={...instance.state,...update};};
 const fail=error=>{instance.state={...instance.state,...Boundary.getDerivedStateFromError(error)};instance.componentDidCatch(error);};
 const markup=()=>renderToStaticMarkup(instance.render());
 return {instance,child,ready,cleared,fail,markup};
}
function elements(node){if(!node||typeof node!=='object')return[];return[node,...React.Children.toArray(node.props?.children).flatMap(elements)];}
const expected='http://127.0.0.1:3000/atlas-runtime/shoulder/models/bodyparts3d/shoulder-right.glb';
const wrapper=status=>new Error(`Could not load /atlas-runtime/shoulder/models/bodyparts3d/shoulder-right.glb: fetch for "${expected}" responded with ${status}: ${status===401?'Unauthorized':'Forbidden'}`);

test('actual shoulder boundary renders actionable exact-bundle 401/403 notices',()=>{
 for(const [status,text]of [[401,'Some model files require sign-in'],[403,'The website refused access']]){
  const f=fixture();f.fail(wrapper(status));const html=f.markup();
  assert(html.includes(text));assert(html.includes('Check access again'));assert(html.includes('role="status"'));
  assert(!html.includes('Retry shoulder anatomy'));assert(!html.includes(expected));assert.deepEqual(f.ready,[false]);
 }
});
test('unknown, other-bundle and misleading failures preserve the generic retry',()=>{
 for(const error of [new Error('Failed to fetch'),new Error('GLTFLoader decode failed: 401'),
  {response:{url:expected+'/other',status:401}},new Error(wrapper(401).message+' extra'),null]){
  const f=fixture();f.fail(error);const html=f.markup();assert(html.includes('The anatomy model could not load'));
  assert(html.includes('Retry shoulder anatomy'));assert(!html.includes('Sign in to'));
 }
});
test('configured and default URLs are classified exactly; absent browser origin is not guessed',()=>{
 for(const url of ['https://example.test/atlas/model.glb?v=2',undefined]){
  const f=fixture(url); // Set undefined explicitly to exercise production fallback.
  f.instance.props.modelUrl=url;
  const resolved=url??'http://127.0.0.1:3000/models/bodyparts3d/shoulder-right.glb';
  f.fail({response:{url:resolved,status:403}});assert(f.markup().includes('refused access'));
 }
 const f=fixture('/relative.glb',false);f.fail(wrapper(401));assert(f.markup().includes('Retry shoulder anatomy'));
});
test('retry clears only this model, resets the failure, and never invents readiness',()=>{
 for(const error of [wrapper(401),wrapper(403),new Error('Failed to fetch')]){
  const f=fixture();assert.equal(f.instance.render(),f.child);f.fail(error);
  const retry=elements(f.instance.render()).find(n=>n.type==='button');assert(retry);
  retry.props.onClick();assert.deepEqual(f.cleared,['/atlas-runtime/shoulder/models/bodyparts3d/shoulder-right.glb']);
  assert.equal(f.instance.state.failed,false);assert.equal(f.instance.state.error,null);
  assert.equal(f.instance.render(),f.child);assert.deepEqual(f.ready,[false]);
  f.fail(new Error('Later transient failure'));assert(f.markup().includes('Retry shoulder anatomy'));
 }
});
test('changing model URL gets a fresh boundary and the classifier is review-bound',()=>{
 assert.match(source,/<ModelBoundary key=\{props\.modelUrl \?\? '\/models\/bodyparts3d\/shoulder-right\.glb'\}/);
 assert(reviewDisplayPaths.includes('lib/model-load-failure.ts'));
 assert(!source.includes('fetch('),'No new preflight or authentication requests');
});
