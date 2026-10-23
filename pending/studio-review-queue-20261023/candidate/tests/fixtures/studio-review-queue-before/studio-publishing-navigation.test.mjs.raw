import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';

const require=createRequire(import.meta.url);
let pathname='/studio/workspace';
const Link=({children,...props})=>React.createElement('a',props,children);
function compile(path,mocks){
 const text=readFileSync(new URL('../'+path,import.meta.url),'utf8');
 const code=ts.transpileModule(text,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const module={exports:{}};
 new Function('require','module','exports',code)(name=>name in mocks?mocks[name]:require(name),module,module.exports);
 return module.exports;
}
const {StudioNavigation}=compile('components/StudioNavigation.tsx',{'next/link':Link,'next/navigation':{usePathname:()=>pathname}});
const {StudioShell}=compile('components/StudioShell.tsx',{'next/link':Link,'./StudioNavigation':{StudioNavigation},'./studio-workspace.css':{}});
const primary=html=>{const match=html.match(/<div class="studio-primary-navigation">([\s\S]*?)<\/div>/);assert(match);return match[1];};
const links=html=>[...html.matchAll(/href="([^"]+)"/g)].map(match=>match[1]);
const nav=roles=>renderToStaticMarkup(React.createElement(StudioNavigation,{educationRoles:roles}));

test('every Studio role sees exactly four primary authoring destinations, with publishing outside administration',()=>{
 pathname='/studio/workspace';
 for(const roles of [[],['educator'],['examiner'],['instructor'],['administrator']]){
  const html=nav(roles);
  assert.deepEqual(links(primary(html)),['/studio/workspace','/studio/courses','/studio/workbooks','/studio/publishing']);
  assert.equal(links(html).filter(href=>href==='/studio/publishing').length,1);
  assert.match(primary(html),/>Review &amp; publish<\/a>/);
 }
});

test('the actual empty Studio home still exposes publishing without a nonempty review queue',async()=>{
 pathname='/studio/workspace';let authCalls=0,snapshotCalls=0;
 const {default:Home}=compile('app/studio/workspace/page.tsx',{
  'next/link':Link,'@/components/StudioShell':{StudioShell},
  '../../chatgpt-auth':{requireChatGPTUser:async returnTo=>{assert.equal(returnTo,'/studio/workspace');authCalls++;return{userId:'synthetic-author',displayName:'Synthetic author',email:'author@example.test'};}},
  '@/lib/education-platform':{getStudioSnapshot:async auth=>{assert.equal(auth.externalSubject,'sites:synthetic-author');snapshotCalls++;return{organization:{name:'Synthetic education',role:'instructor'},educationRoles:['instructor'],workbooks:[],courses:[],releases:[]};}},
 });
 const html=renderToStaticMarkup(await Home());assert.equal(authCalls,1);assert.equal(snapshotCalls,1);
 assert.match(primary(html),/href="\/studio\/publishing">Review &amp; publish/);
 assert.doesNotMatch(html,/studio-action-queues/);assert.match(html,/No workbook drafts need editing/);
 assert.equal(links(html).filter(href=>href==='/studio/courses?new=1').length,1);
});

test('primary active state identifies only the exact authoring route and its children',()=>{
 for(const [path,active] of [
  ['/studio/workspace','/studio/workspace'],['/studio/courses/one','/studio/courses'],
  ['/studio/workbooks/one/builder','/studio/workbooks'],['/studio/publishing','/studio/publishing'],
  ['/studio/publishing/one','/studio/publishing'],['/studio/publishing-other',null],['/studio/analytics',null],
 ]){
  pathname=path;const html=primary(nav(['administrator']));
  const current=[...html.matchAll(/<a aria-current="page" href="([^"]+)"/g)].map(match=>match[1]);
  assert.deepEqual(current,active?[active]:[],path);
 }
});

test('publishing does not expand administration, while groups and reports retain their contextual open state',()=>{
 for(const [path,open] of [['/studio/workspace',false],['/studio/publishing',false],['/studio/publishing/one',false],['/studio/cohorts',true],['/studio/cohorts/one',true],['/studio/analytics',true]]){
  pathname=path;const html=nav(['administrator']);
  assert.match(html,/<summary>Administration<\/summary>/);
  assert.equal(/<details class="studio-manage-navigation" open="">/.test(html),open,path);
  const admin=html.match(/<details class="studio-manage-navigation"[^>]*>([\s\S]*?)<\/details>/);assert(admin);
  assert.deepEqual(links(admin[1]),['/studio/cohorts','/studio/analytics','/workspace']);
 }
});

test('administration keeps the same role-scoped destinations and omits an empty disclosure',()=>{
 pathname='/studio/workspace';
 for(const [roles,expected] of [[[],[]],[['educator'],[]],[['examiner'],['/studio/analytics']],[['instructor'],['/studio/cohorts','/studio/analytics']],[['administrator'],['/studio/cohorts','/studio/analytics','/workspace']]]){
  const html=nav(roles),secondary=html.match(/<details class="studio-manage-navigation"[^>]*>([\s\S]*?)<\/details>/);
  if(!expected.length)assert.equal(secondary,null);else{assert(secondary);assert.deepEqual(links(secondary[1]),expected);}
 }
});
