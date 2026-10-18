import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import * as jsxRuntime from 'react/jsx-runtime';
import ts from 'typescript';
import {HEAD_LINK_REVISION,headAtlasConceptOptions,headConceptById} from '../lib/head-atlas-links.ts';
import {headImageHref} from '../lib/head-atlas-navigation.ts';
import {relatedLectureHref} from '../lib/lecture-related-links.ts';
import {LearningResourceStatus,LearningStatusKey} from '../components/LearningResourceStatus.ts';

// Render the real component with inert router/picker dependencies. This checks
// browser-facing anchors without changing the source-pinned review bindings.
const source=readFileSync(new URL('../components/HeadAtlasComparisonNavigation.tsx',import.meta.url),'utf8');
const tree=ts.createSourceFile('HeadAtlasComparisonNavigation.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const component=tree.statements.filter(statement=>!ts.isImportDeclaration(statement)&&!ts.isExpressionStatement(statement)).map(statement=>statement.getText(tree)).join('\n');
const compiled=ts.transpileModule(`${component}\nexports.Component=HeadAtlasComparisonNavigation;`,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}});
function render(conceptId:string|null,liveState?:'connecting'|'ready'|'practice'|'guided'|'unavailable',current=true){
  const exports:{Component?:React.ComponentType<{conceptId:string|null;liveState?:typeof liveState}>}={};
  const evaluate=new Function('exports','require','useRouter','headLinksCurrent','HEAD_LINK_REVISION_NOTICE','headAtlasConceptOptions','headConceptById','HeadAtlasLearningPicker','headImageHref','HEAD_LINK_REVISION','relatedLectureHref','LearningResourceStatus','LearningStatusKey',compiled.outputText);
  evaluate(exports,(id:string)=>id==='react/jsx-runtime'?jsxRuntime:null,()=>({push:()=>{}}),()=>current,'Revision changed.',headAtlasConceptOptions,headConceptById,()=>null,headImageHref,HEAD_LINK_REVISION,relatedLectureHref,LearningResourceStatus,LearningStatusKey);
  return renderToStaticMarkup(React.createElement(exports.Component!,{conceptId,liveState}));
}

function anchors(html:string){
  return [...html.matchAll(/<a\b([^>]*)>(CT|MRI)<\/a>/g)].map(([,attributes,modality])=>({
    modality,
    href:attributes.match(/\bhref="([^"]+)"/)?.[1]?.replaceAll('&amp;','&'),
  }));
}

test('every mapped comparison anchor names its exact modality, concept and current head revision',()=>{
  for(const {conceptId} of headAtlasConceptOptions()){
    const link=headConceptById(conceptId)!;
    const actual=anchors(render(conceptId,'ready'));
    const expected=(['CT','MRI'] as const).flatMap(modality=>{
      const mapped=modality==='CT'?link.ctHref:link.mriHref;
      return mapped?[{modality,href:headImageHref(modality,conceptId,null,HEAD_LINK_REVISION)}]:[];
    });
    assert.deepEqual(actual,expected,conceptId);
    for(const {modality,href} of actual){
      const url=new URL(href!,'https://example.invalid');
      assert.equal(url.pathname,modality==='CT'?'/atlas/ct-head':'/atlas/mri-head',conceptId);
      assert.deepEqual([...url.searchParams.keys()],['concept','headRevision'],conceptId);
      assert.equal(url.searchParams.get('concept'),conceptId);
      assert.equal(url.searchParams.get('headRevision'),HEAD_LINK_REVISION);
    }
  }
});

test('stale and blocked comparison states emit no CT/MRI anchors',()=>{
  for(const state of ['connecting','practice','guided','unavailable'] as const){
    assert.deepEqual(anchors(render('brainstem-pons',state)),[],state);
  }
  assert.deepEqual(anchors(render('brainstem-pons','ready',false)),[]);
  assert.deepEqual(anchors(render('unknown','ready')),[]);
});
