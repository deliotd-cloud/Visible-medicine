import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {headImageConcept} from '../lib/head-image-only-links.ts';
import {headImageHref} from '../lib/head-atlas-navigation.ts';
import {HEAD_MANIFEST_SHA256} from '../lib/head-atlas-import.ts';
import {HeadSeparateComparisonLink} from './head-separate-component-loader.ts';

const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/HeadOtherViews.tsx',import.meta.url),'utf8');
const viewer=readFileSync(new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
const program=ts.createSourceFile('HeadAtlasViewer.tsx',viewer,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let conceptDeclaration,otherViewsNode,toolbarButton;
function walk(node){
 if(ts.isVariableDeclaration(node)&&node.name.getText(program)==='concept')conceptDeclaration=node;
 if(ts.isJsxSelfClosingElement(node)&&node.tagName.getText(program)==='HeadOtherViews')otherViewsNode=node;
 if(ts.isJsxOpeningElement(node)&&node.tagName.getText(program)==='button'&&node.parent.getText(program).includes('Compare beside 3D Atlas'))toolbarButton=node;
 ts.forEachChild(node,walk);
}
walk(program);
assert(conceptDeclaration&&otherViewsNode&&toolbarButton,'actual viewer concept guard, disclosure call and toolbar action');
assert.match(conceptDeclaration.getText(program),/selected\.entry===activeEntry&&HEAD_LINK_REVISION===HEAD_MANIFEST_SHA256/);
assert.match(otherViewsNode.parent.getText(program),/^concept&&<HeadOtherViews/);
assert.equal((viewer.match(/onClick=\{toggleInlineComparison\}/g)||[]).length,1,'one inline launch action');
assert.match(toolbarButton.parent.getText(program),/ref=\{comparisonButtonRef\}/);
assert.match(viewer,/canFocusImages=\{!!study&&!quizActive&&rightPanel==='info'&&!comparisonOpen\}/);

const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const linkCalls=[];
const Link=({children,...props})=>{linkCalls.push(props);return React.createElement('a',Object.fromEntries(Object.entries(props).filter(([key])=>key!=='prefetch')),children)};
const {HeadOtherViews}=(()=>{
 const module={exports:{}};
 new Function('require','module','exports',compiled)((id)=>{
  if(id==='react/jsx-runtime')return require('react/jsx-runtime');
  if(id==='react')return React;
  if(id==='next/link')return {default:Link};
  if(id==='./HeadSeparateComparisonLink')return {HeadSeparateComparisonLink};
  if(id==='./LearningResourceStatus.ts')return {LearningResourceStatus:({status})=>React.createElement('span',{'data-status':status})};
  if(id==='../lib/head-disclosure-keyboard')return {headDisclosureKeyDown:()=>{}};
  throw Error('Unexpected '+id);
 },module,module.exports);
 return module.exports;
})();
const pons={id:'cth.bst.pons',label:'Pons — regional mask',laterality:'midline_or_unpaired',representation:'partial-mask',family:'Brainstem',color:[1,0,0],opacity:{fill:0.3,outline:1}};
const cerebellum={...pons,id:'cth.cer.cerebellar_hemisphere.left',label:'Left cerebellar hemisphere — regional mask',laterality:'left',representation:'mask'};
function render(entry,source='configured-local',modality='CT',comparison=true){
 linkCalls.length=0;
 const concept=headImageConcept(entry,modality);
 assert(concept);
 const href=comparison?headImageHref(modality==='CT'?'MRI':'CT',concept.conceptId,null,HEAD_MANIFEST_SHA256):null;
 return {html:renderToStaticMarkup(React.createElement(HeadOtherViews,{identity:`${modality}:${HEAD_MANIFEST_SHA256}:${entry.id}`,label:concept.label,atlasHref:concept.atlasHref,scopeNote:concept.scopeNote,comparisonHref:href,modality,preserveScanTab:source!=='configured-local'})),href,concept,links:[...linkCalls]};
}
const attrs=html=>[...html.matchAll(/<a\b([^>]+)>([^<]*)<\/a>/g)].map(match=>({attributes:match[1],text:match[2]}));

test('mapped CT concept has collapsed exact routes, distinct-source limit and one toolbar launch',()=>{
 const {html,href,links}=render(pons);
 assert.match(html,/<details class="head-other-views[^\"]*"><summary>Other views<\/summary>/);
 assert.doesNotMatch(html,/<details[^>]* open/);
 assert.doesNotMatch(html,/Show beside 3D Atlas|Close side-by-side comparison/);
 const linksInView=attrs(html);
 assert.equal(linksInView.length,3);
 assert.match(linksInView[0].attributes,/href="\/atlas\/head-neck-3d\?/);
 assert.match(linksInView[1].attributes,/href="\/atlas\/mri-head\?concept=brainstem-pons&amp;headRevision=/);
 assert.equal(linksInView[2].attributes.match(/href="([^\"]+)/)?.[1],href.replaceAll('&','&amp;'));
 assert.match(linksInView[2].attributes,/target="_blank" rel="noopener noreferrer"/);
 assert.equal(links.length,1);assert.equal(links[0].href,href);assert.equal(links[0].prefetch,false);
 assert.match(html,/Same anatomical concept, not spatially registered subjects/);
 assert.match(html,/Comparison limits/);
});

test('manual package preserves the scan with native new-tab link modifiers',()=>{
 const {html,links}=render(pons,'manual');
 const anchors=attrs(html);
 assert.match(anchors[0].attributes,/target="_blank" rel="noopener noreferrer"/);
 assert.match(html,/Full 3D Atlas opens separately; side-by-side comparison stays here/);
 assert.equal(links[0].prefetch,false);
 assert.match(anchors[2].attributes,/target="_blank" rel="noopener noreferrer"/);
});

test('3D-unmapped and other-modality-unmapped notices preserve exact availability',()=>{
 const no3d=render(cerebellum);
 assert.equal(attrs(no3d.html).length,2);
 assert.match(no3d.html,/No exact 3D part is mapped for this annotation/);
 const noOther=render(pons,'configured-local','CT',false);
 assert.equal(attrs(noOther.html).length,1);
 assert.match(noOther.html,/No exact MRI comparison is mapped/);
 assert.equal(noOther.links.length,0);
});


 test('selection identity closes an open disclosure and returns child focus to summary without scrolling',()=>{
  const slots=[];let index=0;let layoutEffect;
  const fakeReact={useRef(initial){const slot=index++;return slots[slot]??(slots[slot]={current:initial});},useLayoutEffect(callback){layoutEffect=callback;}};
  const module={exports:{}};
  new Function('require','module','exports',compiled)((id)=>{
   if(id==='react/jsx-runtime')return require('react/jsx-runtime');
   if(id==='react')return fakeReact;
   if(id==='next/link')return {default:Link};
   if(id==='./HeadSeparateComparisonLink')return {HeadSeparateComparisonLink:()=>null};
   if(id==='./LearningResourceStatus.ts')return {LearningResourceStatus:()=>null};
   if(id==='../lib/head-disclosure-keyboard')return {headDisclosureKeyDown:()=>{}};
   throw Error('Unexpected '+id);
  },module,module.exports);
  const Component=module.exports.HeadOtherViews;
  const props={identity:'CT:revision:pons',label:'Pons',atlasHref:'/atlas/head-neck-3d',scopeNote:'Distinct sources.',comparisonHref:null,modality:'CT',preserveScanTab:false};
  Component(props);layoutEffect();
  let focusOptions;
  const child={};
  const summary={focus(options){focusOptions=options;}};
  const details={open:true,contains(node){return node===child;},querySelector(selector){assert.equal(selector,':scope > summary');return summary;}};
  slots[0].current=details;
  const oldDocument=globalThis.document;
  globalThis.document={activeElement:child};
  try{
   index=0;Component({...props,identity:'CT:revision:thalamus'});layoutEffect();
   assert.equal(details.open,false);
   assert.deepEqual(focusOptions,{preventScroll:true});
   details.open=true;focusOptions=undefined;globalThis.document.activeElement={};
   index=0;Component({...props,identity:'CT:revision:cerebellum'});layoutEffect();
   assert.equal(details.open,false);assert.equal(focusOptions,undefined,'outside focus stays untouched');
  }finally{globalThis.document=oldDocument;}
 });
