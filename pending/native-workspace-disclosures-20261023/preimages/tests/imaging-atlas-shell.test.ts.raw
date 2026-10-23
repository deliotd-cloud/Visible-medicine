import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {atlasRegionLinks} from '../lib/atlas-navigation.ts';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import * as headNavigation from '../lib/head-atlas-navigation.ts';
import {headLearningSequencesForModality} from '../lib/head-atlas-learning.ts';
import {focusImagingPane} from '../lib/imaging-pane-focus.ts';

const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/ImagingAtlasShell.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../components/imaging-atlas-shell.css',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
const loaded={exports:{} as Record<string,unknown>};
let selectedRegion:{modality:string;selected:string}|undefined;
const navigationSource=readFileSync(new URL('../components/AtlasWorkspaceNavigation.tsx',import.meta.url),'utf8');
const navigationCompiled=ts.transpileModule(navigationSource,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
const navigationLoaded={exports:{} as Record<string,unknown>};
const paneNavigationSource=readFileSync(new URL('../components/ImagingPaneNavigation.tsx',import.meta.url),'utf8');
const paneNavigationCompiled=ts.transpileModule(paneNavigationSource,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
const paneNavigationLoaded={exports:{} as Record<string,unknown>};
new Function('require','module','exports',paneNavigationCompiled)((name:string)=>name==='../lib/imaging-pane-focus'?{focusImagingPane}:require(name),paneNavigationLoaded,paneNavigationLoaded.exports);
const loadComponent=(name:string):unknown=>{
  if(name==='next/link')return {__esModule:true,default:({href,children,...rest}:{href:string;children:React.ReactNode})=>React.createElement('a',{href,...rest},children)};
  if(name==='./AtlasRegionNavigation')return {AtlasRegionNavigation:({modality,selected}:{modality:string;selected:string})=>{
    selectedRegion={modality,selected};
    return React.createElement('nav',{'aria-label':`${modality.toUpperCase()} anatomical regions`},React.createElement('label',null,'Region',React.createElement('select',{'aria-label':'Region'})),React.createElement('button',{type:'submit'},'Go'));
  }};
  if(name==='./AtlasWorkspaceNavigation')return navigationLoaded.exports;
  if(name==='../lib/atlas-navigation')return require('../lib/atlas-navigation.ts');
  if(name==='../lib/head-atlas-navigation')return headNavigation;
  if(name==='./ImagingPaneNavigation')return paneNavigationLoaded.exports;
  if(name.endsWith('.css'))return {};
  return require(name);
};
new Function('require','module','exports',navigationCompiled)(loadComponent,navigationLoaded,navigationLoaded.exports);
new Function('require','module','exports',compiled)(loadComponent,loaded,loaded.exports);
const {ImagingAtlasShell}=loaded.exports as {ImagingAtlasShell:React.ComponentType<{
  title:string;modality:'ct'|'mri'|'ultrasound'|'x-ray';regionId:string;subtitle?:string;notice:React.ReactNode;actions?:React.ReactNode;sidebar:React.ReactNode;toolbar?:React.ReactNode;children:React.ReactNode;info:React.ReactNode;
  headNavigation?:{conceptId:string|null;position:{sequenceId:string;conceptId:string|null}|null;revision:string};
  infoLabel?:string;
  comparison?:React.ReactNode;
}>};

const shell=(modality:'ct'|'mri'|'ultrasound'|'x-ray',regionId:string,headNavigation?:{conceptId:string|null;position:{sequenceId:string;conceptId:string|null}|null;revision:string})=>
  renderToStaticMarkup(React.createElement(ImagingAtlasShell,{title:'Synthetic imaging fixture',modality,regionId,headNavigation,notice:'Different subjects; semantic navigation only.',sidebar:'Index',children:'Image fixture',info:'Information'}));
const modalityHref=(html:string,label:string)=>{
  const markup=html.match(/<nav class="imaging-workspace-modalities"[^>]*>(.*?)<\/nav>/)?.[1];assert(markup,'modality tabs render');
  const escaped=label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  if(markup.includes(`<span aria-current="page">${label}</span>`))return null;
  const match=markup.match(new RegExp(`<a[^>]*href="([^"]+)"[^>]*>${escaped}(?: · browse)?<\\/a>`));assert(match,`${label} tab renders`);
  return match[1].replaceAll('&amp;','&');
};

test('inline comparison keeps native viewer and index while folding, not dropping, learning controls',()=>{
 const html=renderToStaticMarkup(React.createElement(ImagingAtlasShell,{
  title:'MRI head',modality:'mri',regionId:'head-neck',notice:'Unregistered subjects',
  sidebar:'Structure index fixture',children:'Native scan fixture',info:'Teaching and practice fixture',comparison:React.createElement('section',null,'Reference model fixture'),
 }));
 assert.match(html,/imaging-workspace-grid has-reference-comparison/);
 assert.match(html,/Structure index fixture/);assert.match(html,/Native scan fixture/);
 assert.match(html,/<details class="imaging-comparison-learning"><summary>Structure &amp; learning<\/summary>Teaching and practice fixture<\/details>/);
 assert.match(html,/Reference model fixture/);assert.match(html,/>Expand workspace<\/button>/);
 assert(html.indexOf('Reference model fixture')<html.indexOf('<details class="imaging-comparison-learning">'),'reference model precedes folded learning in reading and focus order');
 assert.doesNotMatch(html,/<details[^>]*\bopen/,'teaching does not crowd the model by default');
});

test('CT and MRI name an open 3D comparison in both shortcut and learning landmark',()=>{
  for(const modality of ['ct','mri'] as const)for(const infoLabel of [undefined,'Anatomy learning panel','Custom anatomy notes'])for(const comparisonOpen of [false,true]){
    const html=renderToStaticMarkup(React.createElement(ImagingAtlasShell,{
      title:`${modality.toUpperCase()} head`,modality,regionId:'head-neck',notice:'Unregistered subjects',
      sidebar:'Structure index fixture',children:'Native scan fixture',info:'Teaching and practice fixture',
      ...(infoLabel===undefined?{}:{infoLabel}),
      ...(comparisonOpen?{comparison:React.createElement('section',null,'Reference model fixture')}:{})
    }));
    const expected=comparisonOpen?'3D comparison and anatomy learning':infoLabel??'Structure information';
    assert.match(html,new RegExp(`Skip to ${expected.toLowerCase()}`),`${modality} ${comparisonOpen?'open':'closed'} shortcut`);
    assert.ok(html.includes(`class="imaging-workspace-info" aria-label="${expected}" data-imaging-pane="learning" tabindex="-1"`),`${modality} ${comparisonOpen?'open':'closed'} landmark`);
    assert.equal(html.includes('Reference model fixture'),comparisonOpen);
    assert.equal(html.includes('imaging-comparison-learning'),comparisonOpen);
  }
});

test('shared shell renders compact navigation and independent semantic workbench slots',()=>{
  selectedRegion=undefined;
  const html=renderToStaticMarkup(React.createElement(ImagingAtlasShell,{
    title:'CT head anatomy',modality:'ct',regionId:'head-neck',subtitle:'Native head study',
    notice:React.createElement('p',null,'Different subjects and local browser session.'),
    actions:React.createElement('button',null,'Open package'),
    sidebar:React.createElement('label',null,'Find anatomy',React.createElement('input',{type:'search'})),
    toolbar:React.createElement('button',null,'Axial'),
    children:React.createElement('div',{'aria-label':'Native image'},'Image'),
    info:React.createElement('h2',null,'Selected structure'),
  }));
  assert.deepEqual(selectedRegion,{modality:'ct',selected:'head-neck'});
  assert.match(html,/<main class="imaging-workspace-page">/);
  assert.match(html,/<nav aria-label="Breadcrumb">/);
  assert.match(html,/<h1>CT head anatomy<\/h1>/);
  assert.match(html,/Education only · no diagnostic use/);
  assert.match(html,/class="imaging-workspace-sidebar" aria-label="Anatomy index"/);
  assert.match(html,/class="imaging-workspace-viewer" aria-label="Image viewer"/);
  assert.match(html,/class="imaging-workspace-stage"/);
  assert.match(html,/class="imaging-workspace-info" aria-label="Structure information"/);
  assert.match(html,/data-imaging-pane="index" tabindex="-1"/);
  assert.match(html,/data-imaging-pane="image" tabindex="-1"/);
  assert.match(html,/data-imaging-pane="learning" tabindex="-1"/);
  assert(html.indexOf('Imaging workspace shortcuts')<html.indexOf('Breadcrumb'));
  assert.match(html,/Find anatomy/);
  assert.match(html,/Native image/);
  assert.match(html,/Selected structure/);
  assert.match(html,/class="imaging-workspace-toolbar"/);
  assert.doesNotMatch(html,/href="\/atlas\/3d"/);
  for(const modality of ['ct','mri','ultrasound','x-ray'] as const){
    if(modality==='ct')continue; // Active modality never navigates away from the current study.
    const href=atlasRegionLinks(modality).find(region=>region.id==='head-neck')!.href.replaceAll('&','&amp;');
    assert.ok(html.includes(`href="${href}"`),`${modality} keeps the selected region`);
  }
  assert.match(html,/<span aria-current="page">CT<\/span>/);
});

test('unavailable region falls back to modality root and optional slots stay absent',()=>{
  const html=renderToStaticMarkup(React.createElement(ImagingAtlasShell,{
    title:'X-ray anatomy',modality:'x-ray',regionId:'unknown',notice:'In preparation',sidebar:'Index',children:'No released study',info:'Information pending',
  }));
  assert.match(html,/href="\/atlas\/ct"/);
  assert.match(html,/href="\/atlas\/mri"/);
  assert.match(html,/href="\/atlas\/ultrasound"/);
  assert.match(html,/<span aria-current="page">X-ray<\/span>/);
  assert.doesNotMatch(html,/imaging-workspace-toolbar/);
  assert.doesNotMatch(html,/imaging-workspace-actions/);
  assert.match(html,/No released study/);
});

test('head CT/MRI shell tabs preserve only exact concept or tour navigation',()=>{
  const concept={conceptId:'brainstem-pons',position:null,revision:HEAD_LINK_REVISION};
  const tour={conceptId:'ventricle-right-lateral',position:{sequenceId:'ventricles',conceptId:'ventricle-right-lateral'},revision:HEAD_LINK_REVISION};
  for(const context of [concept,tour])for(const selected of ['ct','mri'] as const){
    const html=shell(selected,'head-neck',context);
    assert.equal(modalityHref(html,'CT'),selected==='ct'?null:headNavigation.headImageHref('CT',context.conceptId,context.position,context.revision));
    assert.equal(modalityHref(html,'MRI'),selected==='mri'?null:headNavigation.headImageHref('MRI',context.conceptId,context.position,context.revision));
    for(const other of ['Ultrasound','X-ray'])assert(!modalityHref(html,other)!.includes('concept='));
  }
});

test('head tab context fails closed outside exact head CT/MRI scope',()=>{
  const contexts=[
    {conceptId:'unknown',position:null,revision:HEAD_LINK_REVISION},
    {conceptId:'brainstem-pons',position:null,revision:'stale'},
    {conceptId:'brainstem-pons',position:{sequenceId:'ventricles',conceptId:'brainstem-pons'},revision:HEAD_LINK_REVISION},
  ];
  for(const context of contexts)for(const selected of ['ct','mri'] as const){
    const html=shell(selected,'head-neck',context);
    for(const [label,modality] of [['CT','ct'],['MRI','mri']] as const){
      if(modality===selected){assert.equal(modalityHref(html,label),null);continue;}
      const expected=atlasRegionLinks(modality).find(item=>item.id==='head-neck')!.href;
      assert.equal(modalityHref(html,label),expected,`${selected} must not relay invalid context to ${label}`);
      assert.match(html,new RegExp(`aria-label="Browse ${label} head · leave (?:anatomy focus|tour)"`));
    }
  }
  const concept={conceptId:'brainstem-pons',position:null,revision:HEAD_LINK_REVISION};
  for(const [selected,regionId] of [['ct','thorax'],['mri','knee'],['ultrasound','head-neck'],['x-ray','head-neck']] as const){
    const html=shell(selected,regionId,concept);
    for(const [label,modality] of [['CT','ct'],['MRI','mri']] as const){
      const expected=atlasRegionLinks(modality).find(item=>item.id===regionId)?.href;
      assert.equal(modalityHref(html,label),selected===modality?null:expected??atlasRegionLinks(modality)[0]?.href??`/atlas/${modality}`);
    }
  }
});

test('MRI-only modality tab discloses leaving the current tour instead of implying a CT match',()=>{
 let count=0;
 for(const sequence of headLearningSequencesForModality('MRI').filter(item=>item.id.startsWith('mri-')))for(const conceptId of sequence.concepts){
  count++;
  const context={conceptId,position:{sequenceId:sequence.id,conceptId},revision:HEAD_LINK_REVISION};
  const html=shell('mri','head-neck',context);
  assert.equal(modalityHref(html,'CT'),'/atlas/ct-head');
  assert.match(html,/aria-label="Browse CT head · leave tour"/);
  assert.match(html,/No verified comparison for this context/);
  assert.equal(modalityHref(html,'MRI'),null,'active modality preserves the current MRI-only tour in place');
 }
 assert.equal(count,4);
 const html=shell('mri','head-neck',{conceptId:'limbic-left-amygdala',position:null,revision:HEAD_LINK_REVISION});
 assert.match(html,/aria-label="Browse CT head · leave anatomy focus"/);
});

test('scoped styles keep a compact three-pane desktop and independently scrolling content',()=>{
  assert.match(css,/\.imaging-workspace-grid\{[^}]*grid-template-columns:216px minmax\(0,1fr\) 264px/);
  assert.match(css,/\.imaging-workspace-grid\{[^}]*height:calc\(100dvh - 230px\);min-height:550px/);
  assert.match(css,/\.imaging-workspace-grid>aside,[^{]*\{[^}]*overflow:auto/);
  assert.match(css,/\.imaging-workspace-stage\{[^}]*min-height:0;overflow:auto/);
  assert.match(css,/:focus-visible\{outline:2px solid var\(--imaging-teal\)/);
  assert.match(css,/\.anatomy-site-frame \.imaging-workspace-grid\{height:auto;min-height:0;flex:1\}/);
  assert.match(css,/\.anatomy-site-frame:has\(\.imaging-workspace-page\)\{height:100dvh;display:flex;flex-direction:column;min-height:0\}/);
  assert.match(css,/>#main-content\{flex:1;min-height:0\}/);
});

test('legacy CT and MRI bookmarks enter the same shared imaging layout without changing regions',async()=>{
  const source=readFileSync(new URL('../app/atlas/[slug]/page.tsx',import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const route={exports:{} as Record<string,unknown>};
  const Head=()=>null,Pending=()=>null;
  new Function('require','module','exports',code)((name:string)=>{
    if(name==='next/link')return {__esModule:true,default:()=>null};
    if(name==='next/navigation')return {notFound:()=>{throw Error('Not found');}};
    if(name==='../../../components/HeadAtlasViewer')return {HeadAtlasViewer:Head};
    if(name==='../../../components/ImagingAtlasPage')return {ImagingAtlasPage:Pending};
    if(name.startsWith('../../../components/'))return {};
    if(name==='../../../lib/catalog')return require('../lib/catalog.ts');
    if(name==='../../../lib/atlas-knowledge')return {};
    return require(name);
  },route,route.exports);
  const Page=route.exports.default as (props:{params:Promise<{slug:string}>})=>Promise<React.ReactElement<{modality:string;region?:string}>>;
  for(const [slug,modality,region] of [['ct-chest','ct','thorax'],['ct-abdomen','ct','abdomen'],['mr-knee','mri','knee']]){
    const page=await Page({params:Promise.resolve({slug})});
    assert.equal(page.type,Pending);assert.equal(page.props.modality,modality);assert.equal(page.props.region,region);
  }
  const head=await Page({params:Promise.resolve({slug:'ct-head'})});
  assert.equal(head.type,Head);assert.equal(head.props.modality,'CT');
});
