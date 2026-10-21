import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import * as destinations from '../lib/review-destination.ts';
import * as focus from '../lib/public-route-focus.ts';

const require=createRequire(import.meta.url);
const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
function compile(p,mocks={}){
 const code=ts.transpileModule(source(p),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const m={exports:{}};new Function('require','module','exports',code)(name=>Object.hasOwn(mocks,name)?mocks[name]:name.endsWith('.css')?{}:require(name),m,m.exports);return m.exports;
}
let pathname='/atlas/3d';
const Link=({children,...props})=>React.createElement('a',props,children);
const shared={'next/link':Link,'next/navigation':{usePathname:()=>pathname},'../lib/review-destination':destinations};
const {SiteHeader}=compile('components/SiteHeader.tsx',{...shared,'./BrandLockup':{BrandLockup:()=>React.createElement('span',null,'Visible Medicine')},'../lib/atlas-navigation':{atlasModalities:[]}});
const {SiteFrame,WorkspaceContextBar}=compile('components/SiteFrame.tsx',{...shared,'./SiteHeader':{SiteHeader},'./SiteFooter':{SiteFooter:()=>null},'../lib/public-route-focus':focus});
const render=(Component,props)=>renderToStaticMarkup(React.createElement(Component,props,'Synthetic test content'));
const anchors=html=>[...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map(([,attrs,label])=>({href:attrs.match(/href="([^"]*)"/)?.[1],current:/aria-current="page"/.test(attrs),label:label.replace(/<[^>]*>/g,'')}));
const nav=(html,label)=>html.match(new RegExp('<nav[^>]*aria-label="'+label+'"[^>]*>([\\s\\S]*?)</nav>'))?.[1]??'';

test('actual signed-in public switcher offers direct Review with Administration secondary',()=>{
 pathname='/atlas/3d';const html=render(SiteHeader,{signedIn:true,reviewAvailable:true});
 const menu=html.match(/<details class="workspace-switcher"[\s\S]*?<\/details>/)?.[0];assert(menu);
 const items=anchors(menu);assert.deepEqual(items.map(i=>i.href),['/my-learning','/studio/workspace','/workspace/clinical-review-inbox','/workspace','/account']);
 assert(items.find(i=>i.href==='/workspace/clinical-review-inbox').label.startsWith('Clinical Review'));
 assert(items.find(i=>i.href==='/workspace').label.startsWith('Administration'));
});

test('actual public header never shows Review or Administration from sign-in alone',()=>{
 for(const [signedIn,reviewAvailable]of [[true,false],[false,false],[false,true]]){
  const html=render(SiteHeader,{signedIn,reviewAvailable});
  assert(!anchors(html).some(i=>i.href==='/workspace/clinical-review-inbox'));
  assert(!anchors(html).some(i=>i.label==='Administration'));
  assert.equal(html.includes('class="workspace-switcher"'),signedIn);
 }
});

test('actual Studio frame and review descendants keep clear primary and active destinations',()=>{
 for(const route of ['/studio/workspace','/workspace/clinical-review-inbox','/workspace/atlas-review/body','/workspace/review-candidates/item']){
  pathname=route;const html=render(SiteFrame,{signedIn:true,reviewAvailable:true});
  const primary=anchors(nav(html,'Choose workspace'));
  assert.deepEqual(primary.map(i=>i.href),['/my-learning','/studio/workspace','/workspace/clinical-review-inbox']);
  assert.deepEqual(primary.filter(i=>i.current).map(i=>i.href),[route.startsWith('/studio/')?'/studio/workspace':'/workspace/clinical-review-inbox']);
  assert.equal((html.match(/<header\b/g)??[]).length,1);
 }
});

test('actual context bar preserves meaningful fallback, account and immersive navigation',()=>{
 pathname='/workspace';const html=render(WorkspaceContextBar,{pathname,signedIn:true,reviewAvailable:false});
 assert.deepEqual(anchors(nav(html,'Choose workspace')).map(i=>i.href),['/my-learning','/studio/workspace','/workspace']);
 pathname='/workspace/atlas-review/model/embedded';const immersive=render(SiteFrame,{signedIn:true,reviewAvailable:true});
 assert(!immersive.includes('Choose workspace'));assert(!immersive.includes('Clinical Review navigation'));
});

test('secondary Administration has a current marker without anonymous review shortcuts',()=>{
 pathname='/workspace/people';const html=render(WorkspaceContextBar,{pathname,signedIn:true,reviewAvailable:true});
 assert(anchors(html).some(i=>i.href==='/workspace'&&i.label==='Administration'&&i.current));
 assert(!anchors(nav(html,'Choose workspace')).some(i=>i.current));
 const anonymous=render(WorkspaceContextBar,{pathname,signedIn:false,reviewAvailable:true});
 assert(!anchors(anonymous).some(i=>i.label==='Administration'||i.href==='/workspace/clinical-review-inbox'));
});

test('embedded lesson/editor toolbars default to Workspace without inferring review rights',()=>{
 for(const route of ['/my-learning','/studio/workbooks/synthetic/builder']){
  const html=render(WorkspaceContextBar,{pathname:route,signedIn:true});
  assert.deepEqual(anchors(nav(html,'Choose workspace')).map(i=>i.href),['/my-learning','/studio/workspace','/workspace']);
  assert(!anchors(html).some(i=>i.label==='Administration'||i.href==='/workspace/clinical-review-inbox'));
 }
});

test('actual request-scoped root passes only UI booleans and independently rechecks optional authorization',async()=>{
 let user=null,denied=false,authCalls=0;const FrameProbe=()=>null;
 const {default:Layout,dynamic}=compile('app/layout.tsx',{
  'next/font/local':()=>({variable:'test-font'}),'../components/SiteFrame':{SiteFrame:FrameProbe},
  '../components/SplashScreen':{SplashScreen:()=>null},'../components/LocalAtlasDiagnostics':{LocalAtlasDiagnostics:()=>null},
  '../lib/splash-intro':{SPLASH_BOOTSTRAP_SCRIPT:''},'./chatgpt-auth':{getChatGPTUser:async()=>user},
  '../lib/clinical-review-server':{authorizeClinicalReview:async()=>{authCalls++;if(denied)throw Error('Synthetic revoked/unavailable state');return{storageKey:'synthetic-private-scope'};}},
  '../lib/review-destination':destinations,
 });assert.equal(dynamic,'force-dynamic');
 function find(node){if(!node||typeof node!=='object')return null;if(node.type===FrameProbe)return node;for(const child of React.Children.toArray(node.props?.children)){const match=find(child);if(match)return match;}return null;}
 for(const [signedIn,unavailable,expected]of [[false,false,false],[true,false,true],[true,true,false],[false,false,false]]){
  user=signedIn?{userId:'synthetic-private-user',email:'private@example.invalid',displayName:'Synthetic private name'}:null;denied=unavailable;
  const tree=await Layout({children:'test'}),frame=find(tree);assert(frame);
  assert.deepEqual(Object.keys(frame.props).sort(),['children','reviewAvailable','signedIn']);
  assert.equal(frame.props.signedIn,signedIn);assert.equal(frame.props.reviewAvailable,expected);
  assert(!JSON.stringify(frame.props).includes('private'));assert(!JSON.stringify(frame.props).includes('storageKey'));
 }
 assert.equal(authCalls,2,'Anonymous paths do not query Review; each signed-in request rechecks');
});
