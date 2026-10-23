import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {headImageHref} from '../lib/head-atlas-navigation.ts';

const require=createRequire(import.meta.url);
function load(source:string,imports:(name:string)=>unknown){
  const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const target={exports:{} as Record<string,unknown>};
  new Function('require','module','exports',compiled)(imports,target,target.exports);
  return target.exports;
}
const Region=load(readFileSync(new URL('../components/AtlasRegionNavigation.tsx',import.meta.url),'utf8'),name=>{
  if(name==='next/navigation')return {useRouter:()=>({push:()=>{}})};
  if(name==='../lib/atlas-navigation')return require('../lib/atlas-navigation.ts');
  return require(name);
}).AtlasRegionNavigation as React.ComponentType<{modality:string;selected:string}>;
const NativeDisclosure=load(readFileSync(new URL('../components/NativeDisclosure.tsx',import.meta.url),'utf8'),name=>name==='../lib/head-disclosure-keyboard'?require('../lib/head-disclosure-keyboard.ts'):require(name)).NativeDisclosure;
const Navigation=load(readFileSync(new URL('../components/AtlasWorkspaceNavigation.tsx',import.meta.url),'utf8'),name=>{
  if(name==='next/link')return {__esModule:true,default:({href,children,...rest}:{href:string;children:React.ReactNode})=>React.createElement('a',{href,...rest},children)};
  if(name==='./NativeDisclosure')return {NativeDisclosure};
  if(name==='./AtlasRegionNavigation')return {AtlasRegionNavigation:Region};
  if(name==='../lib/atlas-navigation')return require('../lib/atlas-navigation.ts');
  if(name==='../lib/head-atlas-navigation')return require('../lib/head-atlas-navigation.ts');
  if(name.endsWith('.css'))return {};
  return require(name);
}).AtlasWorkspaceNavigation as React.ComponentType<{modality:string;regionId:string;headNavigation?:{conceptId:string|null;position:null;revision:string}}>;

test('3D whole body is selected and all imaging routes explicitly browse without carried focus',()=>{
  const html=renderToStaticMarkup(React.createElement(Navigation,{modality:'3d',regionId:'whole-body'}));
  assert.match(html,/aria-label="Atlas modalities"/);
  assert.match(html,/<span aria-current="page">3D<\/span>/);
  assert.doesNotMatch(html,/<a[^>]*aria-current="page"/);
  for(const label of ['CT','MRI','Ultrasound','X-ray'])assert.match(html,new RegExp(`>${label}<\\/a>`));
  assert.doesNotMatch(html,/ · browse<\/a>/);
  assert.match(html,/Browse CT atlas · no focus or registration carried/);
  assert.match(html,/value="whole-body" selected=""/);
  assert.match(html,/value="shoulder"/);
  assert.match(html,/>Go<\/button>/);
});

test('generic 3D to CT head route is clearly browsing; valid CT to MRI keeps only verified head context',()=>{
  const generic=renderToStaticMarkup(React.createElement(Navigation,{modality:'3d',regionId:'head-neck'}));
  assert.match(generic,/href="\/atlas\/ct-head"[^>]*>CT<\/a>/);
  assert.match(generic,/<span aria-current="page">3D<\/span>/);
  assert.doesNotMatch(generic,/concept=|tour=/);
  const context={conceptId:'brainstem-pons',position:null,revision:HEAD_LINK_REVISION};
  const verified=renderToStaticMarkup(React.createElement(Navigation,{modality:'ct',regionId:'head-neck',headNavigation:context}));
  const mriHref=headImageHref('MRI',context.conceptId,context.position,context.revision)!;
  assert(verified.includes(`href="${mriHref.replaceAll('&','&amp;')}"`));
  assert.doesNotMatch(verified,/>MRI · browse<\/a>/);
  assert.match(verified,/aria-label="View Pons in 3D Atlas"/);
  assert.match(verified,/href="\/atlas\/head-neck-3d\?/);
  assert.match(verified,/>3D<\/a>/);
});

test('3D region tab retains a selected root-body region without inventing image correspondence',()=>{
  const html=renderToStaticMarkup(React.createElement(Navigation,{modality:'3d',regionId:'leg'}));
  assert.match(html,/<span aria-current="page">3D<\/span>/);
  assert.doesNotMatch(html,/<a[^>]*href="\/atlas\/3d\?region=leg"/);
  assert.match(html,/href="\/atlas\/ct"[^>]*>CT<\/a>/);
});

test('one closed native disclosure explains browse, source-bound comparison and independent access in every modality',()=>{
  for(const modality of ['3d','ct','mri','ultrasound','x-ray']){
    const html=renderToStaticMarkup(React.createElement(Navigation,{modality,regionId:'head-neck'}));
    assert.equal((html.match(/<summary>About modality links<\/summary>/g)??[]).length,1);
    assert.match(html,/<details class="atlas-workspace-navigation-help">/);
    assert.doesNotMatch(html,/<details[^>]*\bopen(?:=|\s|>)/);
    assert.match(html,/Verified, source-bound CT\/MRI head links and exact 3D head concept or tour links retain learning context/);
    assert.match(html,/other tabs do not carry anatomical focus/);
    assert.match(html,/separate subjects and are not spatially registered/);
    assert.match(html,/Atlas, imaging cases and lectures have separate access/);
    assert.match(html,/aria-label="Browse /);
    assert.match(html,/title="Browse this atlas\. This navigation does not carry an anatomical focus or spatial registration\."/);
  }
});

test('unmatched or stale head context keeps precise accessible leave-focus warning and never inherits a query',()=>{
  for(const context of [{conceptId:'not-mapped',position:null,revision:HEAD_LINK_REVISION},{conceptId:'brainstem-pons',position:null,revision:'0'.repeat(64)}]){
    const html=renderToStaticMarkup(React.createElement(Navigation,{modality:'ct',regionId:'head-neck',headNavigation:context}));
    assert.match(html,/href="\/atlas\/mri-head" aria-label="Browse MRI head · leave anatomy focus"/);
    assert.match(html,/No verified comparison for this context/);
    assert.doesNotMatch(html,/concept=|headTour=|headRevision=|linkRevision=/);
  }
});
