import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import * as availability from '../lib/head-link-availability.ts';
import * as links from '../lib/head-atlas-links.ts';
import * as navigation from '../lib/head-atlas-navigation.ts';
import * as lectures from '../lib/lecture-related-links.ts';
import * as status from '../components/LearningResourceStatus.ts';

const require=createRequire(import.meta.url),routes=[];
const source=readFileSync(new URL('../components/HeadAtlasComparisonNavigation.tsx',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exports={};
const sourceRevision={current:true};
const imports={
  'next/navigation':{useRouter:()=>({push:href=>routes.push(href)})},
  '../lib/head-link-availability.ts':{...availability,headLinksCurrent:()=>sourceRevision.current&&availability.headLinksCurrent()},
  '../lib/head-atlas-links':links,
  '../lib/head-atlas-navigation.ts':navigation,
  '../lib/lecture-related-links':lectures,
  './HeadAtlasLearningPicker':{HeadAtlasLearningPicker:()=>React.createElement('details',null,React.createElement('summary',null,'Linked tours'))},
  './LearningResourceStatus.ts':status,
  'react/jsx-runtime':require('react/jsx-runtime'),
};
new Function('require','module','exports',js)(id=>{assert(Object.hasOwn(imports,id),id);return imports[id];},{exports},exports);
const {HeadAtlasComparisonNavigation:Comparison}=exports;
function walk(value,accept){
  if(Array.isArray(value))return value.map(child=>walk(child,accept)).find(Boolean);
  if(!value||typeof value!=='object'||!('props'in value))return;
  return accept(value)?value:walk(value.props.children,accept);
}
const view=(conceptId,liveState='ready')=>Comparison({conceptId,liveState});
const html=(conceptId,liveState='ready')=>renderToStaticMarkup(React.createElement(Comparison,{conceptId,liveState}));

test('narrow comparison overlays anchor to the toolbar, not the small summary',()=>{
 const css=readFileSync(new URL('../app/atlas/head-neck-3d/head-learning.css',import.meta.url),'utf8');
 assert.match(css,/@media\(max-width:700px\)\s*\{\s*\.head-atlas-comparison \.head-comparison-disclosure\s*\{\s*position:static;/);
 assert.match(css,/\.head-atlas-comparison \.head-comparison-panel\s*\{\s*left:12px;\s*right:auto;/);
});

test('compact row retains honest status and current revision-bound modality links',()=>{
  const pons=links.headConceptById('brainstem-pons');
  const rendered=html(pons.conceptId);
  assert.match(rendered,/Learn this structure/);
  assert.match(rendered,/Links follow the selected structure/);
  assert.match(rendered,/separate, unregistered subjects/);
  assert(rendered.includes(navigation.headImageHref('CT',pons.conceptId,null,links.HEAD_LINK_REVISION).replaceAll('&','&amp;')));
  assert(rendered.includes(navigation.headImageHref('MRI',pons.conceptId,null,links.HEAD_LINK_REVISION).replaceAll('&','&amp;')));
  assert.match(rendered,/<summary>Change structure<\/summary>/);
  assert.match(rendered,/<summary>More learning<\/summary>/);
  assert.match(rendered,/<summary>Related lectures<\/summary>/);
  assert.match(rendered,/Lecture access is separate from Atlas access/);
  assert.match(rendered,/<summary>Comparison limits<\/summary>/);
  assert.match(rendered,/What do the labels mean/);
  assert.match(rendered,/head-comparison-panel/);
  assert.match(readFileSync(new URL('../app/atlas/head-neck-3d/head-learning.css',import.meta.url),'utf8'),/\.head-comparison-panel\s*\{[^}]*position:absolute;[^}]*max-height:/);
});

test('no focus gives a discoverable chooser; blocked states suppress all anatomy actions',()=>{
  const empty=html(null);
  assert.match(empty,/<summary>Choose linked anatomy<\/summary>/);
  assert.match(empty,/name="head-comparison"/);
  assert.doesNotMatch(empty,/Compare Pons on CT/);
  for(const state of ['practice','guided','connecting','unavailable']){
    const markup=html('brainstem-pons',state);
    assert.doesNotMatch(markup,/<form|head-comparison-actions|Compare Pons on CT|Compare Pons on MRI|Related lectures/);
    assert.match(markup,/role="status"/);
  }
  assert.match(html('limbic-left-amygdala'),/No exact CT comparison mapped/);
  assert.doesNotMatch(html('limbic-left-amygdala'),/Compare Left Amygdala on CT/);
});

test('native disclosures restore summary focus only on Escape and close on actual focus exit',()=>{
  const details=walk(view('brainstem-pons'),node=>node.type==='details'&&node.props.className==='head-comparison-disclosure');
  assert(details);
  let focus=0,prevent=0,stop=0;
  const summary={focus:()=>focus++};
  const panel={open:true,querySelector:selector=>{assert.equal(selector,'summary');return summary;},contains:next=>next===summary};
  details.props.onKeyDown({key:'Escape',currentTarget:panel,preventDefault:()=>prevent++,stopPropagation:()=>stop++});
  assert.equal(panel.open,false);assert.equal(focus,1);assert.equal(prevent,1);assert.equal(stop,1);
  panel.open=true;
  details.props.onKeyDown({key:'Tab',currentTarget:panel,preventDefault:()=>prevent++});
  assert.equal(panel.open,true);
  const previousNode=globalThis.Node;
  try{
    globalThis.Node=class {};
    const outside=new globalThis.Node();
    details.props.onBlur({currentTarget:panel,relatedTarget:outside});
    assert.equal(panel.open,false);
    panel.open=true;
    panel.contains=()=>true;
    details.props.onBlur({currentTarget:panel,relatedTarget:outside});
    assert.equal(panel.open,true);
  }finally{if(previousNode===undefined)delete globalThis.Node;else globalThis.Node=previousNode;}
});

test('unsent form choice survives a live selection change and only explicit valid submit navigates',()=>{
  routes.length=0;
  const first=view('brainstem-pons');
  const select=walk(first,node=>node.type==='select'&&node.props.name==='head-comparison');
  const disclosure=walk(first,node=>node.type==='details'&&node.props.className==='head-comparison-disclosure');
  const element={value:'',dataset:{}};
  select.props.ref(element);
  assert.equal(element.value,'brainstem-pons');
  element.value='bone-occipital';
  select.props.onChange({currentTarget:element});
  // Native details preserves mounted form controls when closed and reopened.
  assert.equal(disclosure.props.open,undefined);
  assert.equal(element.value,'bone-occipital');
  const changed=view('deep-right-putamen');
  const updated=walk(changed,node=>node.type==='select'&&node.props.name==='head-comparison');
  updated.props.ref(element);
  assert.equal(element.value,'bone-occipital');
  assert.deepEqual(routes,[]);
  const form=walk(changed,node=>node.type==='form');
  for(const value of ['unknown','javascript:alert(1)'])form.props.onSubmit({preventDefault(){},currentTarget:{elements:{namedItem:()=>({value})}}});
  assert.deepEqual(routes,[]);
  form.props.onSubmit({preventDefault(){},currentTarget:{elements:{namedItem:()=>element}}});
  assert.deepEqual(routes,[links.headConceptById('bone-occipital').atlasHref]);
  assert.match(html('deep-right-putamen'),/Compare Right putamen on CT/);
});

test('a reconnect remounts only the guarded form and restores an unsent canonical draft from its owner',()=>{
  routes.length=0;
  const owner={dataset:{}};
  const makeSelect=()=>({value:'',dataset:{},closest:selector=>{
    assert.equal(selector,'section.head-atlas-comparison');return owner;
  }});
  const initial=view('brainstem-pons');
  const first=walk(initial,node=>node.type==='select'&&node.props.name==='head-comparison');
  const initialSelect=makeSelect();
  first.props.ref(initialSelect);
  assert.equal(initialSelect.value,'brainstem-pons');
  initialSelect.value='deep-right-putamen';
  first.props.onChange({currentTarget:initialSelect});
  assert.equal(owner.dataset.headComparisonDraftValue,'deep-right-putamen');
  assert.deepEqual(routes,[]);

  const connecting=view('bone-left-zygomatic','connecting');
  assert.equal(walk(connecting,node=>node.type==='select'),undefined);
  assert.equal(walk(connecting,node=>node.type==='form'),undefined);
  assert.equal(owner.dataset.headComparisonDraftValue,'deep-right-putamen');
  const restored=view('bone-left-zygomatic');
  const restoredSelect=makeSelect();
  walk(restored,node=>node.type==='select'&&node.props.name==='head-comparison').props.ref(restoredSelect);
  assert.equal(restoredSelect.value,'deep-right-putamen');
  assert.equal(restoredSelect.dataset.headComparisonDraft,'true');
  assert.match(renderToStaticMarkup(restored),/Compare Left zygomatic bone on CT/);
  assert.deepEqual(routes,[],'reconnect does not navigate or submit the draft');

  const newOwner={dataset:{}};
  const remountedSelect={value:'',dataset:{},closest:()=>newOwner};
  walk(restored,node=>node.type==='select'&&node.props.name==='head-comparison').props.ref(remountedSelect);
  assert.equal(remountedSelect.value,'bone-left-zygomatic','a new component owner has no retained draft');

  try{
    sourceRevision.current=false;
    const stale=view('brainstem-pons');
    assert.equal(walk(stale,node=>node.type==='select'),undefined);
    assert.equal(walk(stale,node=>node.type==='form'),undefined);
    stale.props.ref(owner);
    assert.equal(owner.dataset.headComparisonDraftValue,undefined,'source refusal clears its retained draft');
  }finally{sourceRevision.current=true;}
  const afterSourceReset=makeSelect();
  walk(view('bone-left-zygomatic'),node=>node.type==='select'&&node.props.name==='head-comparison').props.ref(afterSourceReset);
  assert.equal(afterSourceReset.value,'bone-left-zygomatic');
});
