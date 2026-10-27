import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import * as jsxRuntime from 'react/jsx-runtime';
import ts from 'typescript';
import {HEAD_LINK_REVISION,headAtlasConceptOptions,headConceptById} from '../lib/head-atlas-links.ts';
import {headImageConcept} from '../lib/head-image-only-links.ts';
import {headRelatedLearning} from '../lib/head-related-learning.ts';
import {headGuidedComparisonForStep} from '../lib/head-guided-comparison.ts';
import {headImageHref} from '../lib/head-atlas-navigation.ts';
import {relatedLectureHref} from '../lib/lecture-related-links.ts';
import {LearningResourceStatus,LearningStatusKey} from '../components/LearningResourceStatus.ts';
import {headDisclosureKeyDown} from '../lib/head-disclosure-keyboard.ts';
import type {HeadEntry,Modality} from '../lib/head-atlas-import.ts';

function component(filename:string,exportName:string,bindings:Record<string,unknown>){
  const source=readFileSync(new URL(`../components/${filename}`,import.meta.url),'utf8');
  const tree=ts.createSourceFile(filename,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  for(const statement of tree.statements){
    if(!ts.isImportDeclaration(statement)||statement.importClause?.isTypeOnly)continue;
    const named=statement.importClause?.namedBindings;
    if(named&&ts.isNamedImports(named))for(const imported of named.elements){
      if(!imported.isTypeOnly)assert(Object.hasOwn(bindings,imported.name.text),`Unbound actual import: ${imported.name.text} from ${filename}`);
    }
  }
  const body=tree.statements.filter(statement=>!ts.isImportDeclaration(statement)&&!ts.isExpressionStatement(statement)).map(statement=>statement.getText(tree)).join('\n');
  const compiled=ts.transpileModule(`${body}\nexports.Component=${exportName};`,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
  const exports:{Component?:React.ComponentType<any>}={};
  const names=Object.keys(bindings);
  new Function('exports','require',...names,compiled)(exports,(id:string)=>id==='react/jsx-runtime'?jsxRuntime:null,...Object.values(bindings));
  assert(exports.Component);
  return exports.Component;
}

const Related=component('HeadAtlasRelatedLearning.tsx','HeadAtlasRelatedLearning',{
  HEAD_LINK_REVISION,headImageConcept,headRelatedLearning,headGuidedComparisonForStep,relatedLectureHref,
});
function Comparison(current=true){return component('HeadAtlasComparisonNavigation.tsx','HeadAtlasComparisonNavigation',{
  useRouter:()=>({push:()=>{}}),headLinksCurrent:()=>current,HEAD_LINK_REVISION_NOTICE:'Revision changed.',
  headAtlasConceptOptions,headConceptById,HEAD_LINK_REVISION,headImageHref,relatedLectureHref,
  HeadAtlasLearningPicker:()=>null,LearningResourceStatus,LearningStatusKey,headDisclosureKeyDown,
});}
function entry(modality:Modality):HeadEntry{return {
  id:`${modality==='CT'?'cth':'mrb'}.cer.cerebellar_hemisphere.left`,label:'Left cerebellar hemisphere — regional mask',
  family:'cer',laterality:'left',representation:'mask',color:[1,0,0],opacity:{fill:.2,outline:1},
};}
function render(component:React.ComponentType<any>,props:Record<string,unknown>){return renderToStaticMarkup(React.createElement(component,props));}
function link(html:string){
  const match=html.match(/<a\b([^>]*)>Find related lectures<\/a>/);
  if(!match)return null;
  const attributes=match[1];
  return {href:attributes.match(/\bhref="([^"]+)"/)?.[1]?.replaceAll('&amp;','&'),
    target:attributes.match(/\btarget="([^"]+)"/)?.[1],rel:attributes.match(/\brel="([^"]+)"/)?.[1]};
}

test('native CT and MRI image-only identities offer the exact pinned lecture route',()=>{
  for(const modality of ['CT','MRI'] as const){
    const selected=entry(modality);
    const html=render(Related,{entries:[selected],entry:selected,modality,revision:HEAD_LINK_REVISION,onStart:()=>{}});
    assert.match(html,/<summary>Related lectures<\/summary>/);
    assert.match(html,/Lecture access is separate from Atlas access/);
    assert.deepEqual(link(html),{href:relatedLectureHref('cerebellum-left-hemisphere',HEAD_LINK_REVISION),target:'_blank',rel:'noopener noreferrer'});
  }
});

test('native source-bound entry remains discoverable when no guided tour covers it',()=>{
  const NoTours=component('HeadAtlasRelatedLearning.tsx','HeadAtlasRelatedLearning',{
    HEAD_LINK_REVISION,headImageConcept,headRelatedLearning:()=>[],headGuidedComparisonForStep,relatedLectureHref,
  });
  const selected:HeadEntry={...entry('MRI'),id:'mrb.wmt.corpus_callosum',label:'Corpus callosum — regional mask',
    family:'wmt',laterality:'midline_or_unpaired',representation:'partial-mask'};
  const html=render(NoTours,{entries:[selected],entry:selected,modality:'MRI',revision:HEAD_LINK_REVISION,onStart:()=>{}});
  assert.match(html,/<summary>Learn this in context<\/summary>/);
  assert.doesNotMatch(html,/step [0-9]+ of/);
  assert.deepEqual(link(html),{href:relatedLectureHref('commissure-corpus-callosum',HEAD_LINK_REVISION),target:'_blank',rel:'noopener noreferrer'});
});

test('native entry links require membership, exact source, modality, and revision',()=>{
  const selected=entry('CT');
  const base={entries:[selected],entry:selected,modality:'CT',revision:HEAD_LINK_REVISION,onStart:()=>{}};
  for(const props of [
    {...base,entries:[]},
    {...base,entry:{...selected}},
    {...base,entry:{...selected,label:'Wrong anatomy'},entries:[{...selected,label:'Wrong anatomy'}]},
    {...base,modality:'MRI'},
    {...base,revision:'wrong-revision'},
  ])assert.equal(link(render(Related,props)),null);
});

test('native guided tours remain available beside the folded related lecture entry',()=>{
  const selected:HeadEntry={...entry('CT'),id:'cth.bst.pons',label:'Pons — regional mask',family:'bst',laterality:'midline_or_unpaired',representation:'partial-mask'};
  const html=render(Related,{entries:[selected],entry:selected,modality:'CT',revision:HEAD_LINK_REVISION,onStart:()=>{}});
  assert.match(html,/Learn this in context · 1 tour/);
  assert.match(html,/Brainstem orientation · step 2 of 3/);
  assert.match(html,/nothing is marked complete/);
  assert.deepEqual(link(html),{href:relatedLectureHref('brainstem-pons',HEAD_LINK_REVISION),target:'_blank',rel:'noopener noreferrer'});
});

test('existing 3D selection offers a pinned lecture route only when source and live state are valid',()=>{
  const Component=Comparison();
  const selected=render(Component,{conceptId:'brainstem-pons',liveState:'ready'});
  assert.deepEqual(link(selected),{href:relatedLectureHref('brainstem-pons',HEAD_LINK_REVISION),target:'_blank',rel:'noopener noreferrer'});
  assert.match(selected,/Compare focused anatomy/);
  for(const liveState of ['practice','guided','connecting','unavailable']){
    assert.equal(link(render(Component,{conceptId:'brainstem-pons',liveState})),null,liveState);
  }
  assert.equal(link(render(Component,{conceptId:'unknown',liveState:'ready'})),null);
  assert.equal(link(render(Comparison(false),{conceptId:'brainstem-pons',liveState:'ready'})),null);
});
