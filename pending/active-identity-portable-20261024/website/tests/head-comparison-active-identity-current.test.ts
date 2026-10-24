import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import * as jsxRuntime from 'react/jsx-runtime';
import ts from 'typescript';
import {HEAD_MANIFEST_SHA256,type HeadEntry} from '../lib/head-atlas-import.ts';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {headImageConcept as headAtlasConcept} from '../lib/head-image-only-links.ts';
import {headImageHref} from '../lib/head-atlas-navigation.ts';
import {headDisclosureKeyDown} from '../lib/head-disclosure-keyboard.ts';
import {loadHeadSeparateComparisonLink} from './head-separate-comparison-test-source.ts';

// Execute the component's real derived values and its comparison JSX during the
// render that precedes the passive effect which clears an old selection.
const source=readFileSync(new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
const sha=(text:string)=>createHash('sha256').update(text).digest('hex');
assert.equal(sha(source),'9797cd2ce54405d0909d125f38fa4ea0184f367b7ac772406952f6dacd0b7ae5','viewer source drift');
assert.equal(sha(readFileSync(new URL('./head-separate-comparison-test-source.ts',import.meta.url),'utf8')),'395b5006f811e5db7f7dff713985d2e67ded3dde8845ae40298af67affe826bb','pure component adapter drift');
const {HeadSeparateComparisonLink}=loadHeadSeparateComparisonLink();
const tree=ts.createSourceFile('HeadAtlasViewer.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const names=['activeEntry','preserveScanTab','concept','comparisonOpen','otherModality','selectedComparisonHref'];
const declarations=new Map<string,ts.VariableDeclaration>();
let comparison:ts.Expression|undefined;
function visit(node:ts.Node):void{
  if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)&&names.includes(node.name.text))declarations.set(node.name.text,node);
  if(ts.isJsxExpression(node)&&node.expression&&node.getText(tree).includes('className="head-concept-links head-primary-comparison"'))comparison=node.expression;
  ts.forEachChild(node,visit);
}
visit(tree);
for(const name of names)assert(declarations.has(name),`${name} must be derived by the viewer`);
assert(comparison,'the viewer must render its actual comparison branch');
const program=`${names.map(name=>`const ${declarations.get(name)!.getText(tree)};`).join('\n')}
  const comparisonView=(${comparison.getText(tree)});
  return {activeEntry,concept,html:renderToStaticMarkup(comparisonView)};`;
const compiled=ts.transpileModule(program,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}});
const evaluate=new Function('exports','study','activeId','selected','quizActive','modality','HEAD_LINK_REVISION','HEAD_MANIFEST_SHA256','headAtlasConcept','headImageHref','Link','LearningResourceStatus','renderToStaticMarkup','require','pkg','inlineComparison','toggleInlineComparison','headDisclosureKeyDown','HeadSeparateComparisonLink',compiled.outputText) as (...args:any[])=>{activeEntry:HeadEntry|undefined;concept:ReturnType<typeof headAtlasConcept>|null;html:string};
const pons:HeadEntry={id:'cth.bst.pons',label:'Pons — regional mask',laterality:'midline_or_unpaired',representation:'partial-mask',family:'Brainstem',color:[1,0,0],opacity:{fill:0.3,outline:1}};
const thalamus:HeadEntry={id:'cth.dgm.thalamus.left',label:'Left thalamus — regional mask',laterality:'left',representation:'mask',family:'Deep gray',color:[0,1,0],opacity:{fill:0.3,outline:1}};
const study={definition:{entries:[pons,thalamus]}};
const selected=(entry:HeadEntry)=>({entry});
function render(activeId:string,selection:ReturnType<typeof selected>|null,activeStudy:typeof study|null=study,practice=false,revision=HEAD_MANIFEST_SHA256,pkg={source:'configured-local'}){
  return evaluate({},activeStudy,activeId,selection,practice,'CT',HEAD_LINK_REVISION,revision,headAtlasConcept,headImageHref,
    ({children,prefetch:_,...props}:React.PropsWithChildren<{href:string;prefetch?:boolean}>)=>React.createElement('a',props,children),
    ({status}:{status:string})=>React.createElement('span',{'data-resource-status':status}),
    renderToStaticMarkup,(id:string)=>id==='react/jsx-runtime'?jsxRuntime:null,pkg,null,()=>{},headDisclosureKeyDown,HeadSeparateComparisonLink);
}

// Current policy: primary MRI navigation stays here; the separately labelled
// mapped action preserves the scan in a new tab. Assert exact roles, not only counts.
function assertCurrentComparisonActions(html:string,manual=false){
  const anchors=[...html.matchAll(/<a\b([^>]+)>([^<]*)<\/a>/g)].map(match=>({attributes:match[1],text:match[2]}));
  assert.equal(anchors.length,3,'Exactly primary Atlas, primary MRI and explicit mapped MRI actions');
  const [atlas,mri,separate]=anchors;
  const attr=(a:typeof atlas,name:string)=>a.attributes.match(new RegExp('(?:^| )'+name+'="([^\"]*)"'))?.[1];
  assert.equal(atlas.text,manual?'Full 3D Atlas ↗':'Full 3D Atlas');assert.equal(mri.text,'MRI');assert.equal(separate.text,'Open MRI (new tab)');
  assert.match(attr(atlas,'href')??'',/^\/atlas\/head-neck-3d\?/);
  assert.equal(attr(atlas,'aria-label'),manual?'Open Pons in the 3D Atlas (new tab)':'Open Pons in the 3D Atlas');
  assert.equal(attr(atlas,'target'),manual?'_blank':undefined);
  assert.equal(attr(atlas,'rel'),manual?'noopener noreferrer':undefined);
  assert.equal(attr(mri,'aria-label'),'Find Pons on MRI');assert.equal(attr(mri,'target'),undefined);
  assert.match(attr(mri,'href')??'',/^\/atlas\/mri-head\?concept=brainstem-pons&amp;headRevision=[a-f0-9]{64}$/);
  assert.equal(attr(separate,'href'),attr(mri,'href'),'Separate action keeps the exact mapped concept and revision');
  assert.equal(attr(separate,'target'),'_blank');assert.equal(attr(separate,'rel'),'noopener noreferrer');
  assert.equal(attr(separate,'aria-label'),'Open mapped MRI anatomy in a new tab; keep this scan open');
}

test('CURRENT: old selected anatomy cannot offer comparison while a newly active mask loads or fails',()=>{
  const old=render(pons.id,selected(pons));
  assert.equal(old.concept?.conceptId,'brainstem-pons');
  assert.match(old.html,/Open Pons in the 3D Atlas/);
  assert.match(old.html,/Find Pons on MRI/);
  const pending=render(thalamus.id,selected(pons));
  assert.equal(pending.activeEntry,thalamus);
  assert.equal(pending.concept,null);
  assert.equal(pending.html,'');
  const loaded=render(thalamus.id,selected(thalamus));
  assert.equal(loaded.concept?.conceptId,'deep-left-thalamus');
  assert.match(loaded.html,/Open Left thalamus in the 3D Atlas/);
  assert.doesNotMatch(loaded.html,/Pons/);
});

test('CURRENT: comparison requires exact current-study entry identity and current revision outside practice',()=>{
  for(const result of [
    render(pons.id,selected(pons),null),
    render(pons.id,selected({...pons})),
    render(pons.id,selected(pons),study,true),
    render(pons.id,selected(pons),study,false,'stale'),
  ]){
    assert.equal(result.concept,null);
    assert.equal(result.html,'');
  }
});

test('CURRENT: comparison is next to the selected name, before study controls and teaching, without duplicate links',()=>{
  const name=source.indexOf('<h2 ref={structureHeadingRef}');
  const comparison=source.indexOf('className="head-concept-links head-primary-comparison"');
  const studyControls=source.indexOf('<div className="head-study-set-action">');
  const teaching=source.indexOf('<HeadAtlasTeaching key={concept.conceptId}');
  assert(name>=0&&comparison>name&&studyControls>comparison&&teaching>studyControls);
  assert.equal(source.split('className="head-concept-links head-primary-comparison"').length,2);
  const {html}=render(pons.id,selected(pons));
  assert.match(html,/<nav aria-label="Compare Pons">/);
  assert.match(html,/>Full 3D Atlas<\/a>/);
  assert.match(html,/<button type="button" aria-pressed="false">Show beside 3D Atlas<\/button>/);
  assert.match(html,/>MRI<\/a>/);
  assertCurrentComparisonActions(html);
  assert.match(html,/<details><summary>Comparison limits<\/summary>/);
  assert.match(html,/not spatially registered/);
});

test('CURRENT: image-only comparison never implies an available 3D target',()=>{
  const entry:HeadEntry={...pons,id:'cth.cer.cerebellar_hemisphere.left',label:'Left cerebellar hemisphere — regional mask',laterality:'left',representation:'mask'};
  const {html,concept}=render(entry.id,selected(entry),{definition:{entries:[entry]}});
  assert.equal(concept?.conceptId,'cerebellum-left-hemisphere');
  assert.match(html,/Find Left cerebellar hemisphere on MRI/);
  assert.match(html,/No exact 3D part is mapped/);
  assert.doesNotMatch(html,/Full 3D Atlas|Show beside 3D Atlas/);
});

test('CURRENT: manual package comparison explicitly keeps the scan in its original tab',()=>{
 const {html}=render(pons.id,selected(pons),study,false,HEAD_MANIFEST_SHA256,{source:'manual'});
 assert.match(html,/target="_blank" rel="noopener noreferrer" aria-label="Open Pons in the 3D Atlas \(new tab\)"/);
 assert.match(html,/Full 3D Atlas opens separately; side-by-side comparison stays here/);
 assertCurrentComparisonActions(html,true);
});
