import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import * as packet from '../lib/head-ct-facial-comparison-review.ts';
import {headReviewImageLinkModule} from './head-review-image-link-loader.ts';
const require=createRequire(import.meta.url);
function load(path:string,imports:Record<string,unknown>){
  const code=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const module={exports:{} as any};new Function('require','module','exports',code)((id:string)=>imports[id]??require(id),module,module.exports);return module.exports;
}
const Panel=load('components/HeadCtBoneDecisionPanel.tsx',{'../lib/head-ct-bone-decision-contract':{},'./HeadCtBoneDecisionForm':{}}).HeadCtBoneDecisionPanel;
const Review=load('components/HeadCtFacialComparisonReview.tsx',{'../lib/head-ct-facial-comparison-review':packet,
  './HeadCtBoneDecisionPanel':{HeadCtBoneDecisionPanel:Panel},'./HeadReviewImageLink':headReviewImageLinkModule}).HeadCtFacialComparisonReview;

test('three independent facial comparisons remain collapsed with explicit source evidence and lazy private review',()=>{
  const current=packet.headCtFacialComparisonPacket();
  const html=renderToStaticMarkup(React.createElement(Review,{packet:current}));
  assert(html.includes(packet.HEAD_CT_FACIAL_COMPARISON_REVISION));assert(html.includes(current.headRevision));
  assert.equal((html.match(/<button/g)??[]).length,3);
  assert.doesNotMatch(html,/<form|<input|<details[^>]+open|href="[^\"]*mri-head/);
  for(const item of current.items){
    assert(html.includes(`id="head-ct-bone-comparison-${item.conceptId}"`));
    assert(html.includes(`Review ${item.binding!.label} comparison`));assert(html.includes(item.ct.label));
    assert(html.includes(item.ct.id));assert(html.includes(item.atlas.sourceHash));
    assert(html.includes(item.binding!.atlasHref.replaceAll('&','&amp;')));
    assert(html.includes(item.binding!.ctHref!));
  }
  assert.match(html,/No new teaching or guided sequence/);
  const missing=renderToStaticMarkup(React.createElement(Review,{packet:null}));
  assert.match(missing,/role="alert"/);assert.doesNotMatch(missing,/href=|<button|<form/);
});

test('authorized head review route verifies the independent packet and includes all new picker destinations',()=>{
  const source=readFileSync('app/workspace/atlas-review/head-learning/page.tsx','utf8');
  assert(source.indexOf('await authorizeClinicalReview()')<source.indexOf('await verifiedHeadCtFacialComparisonPacket(HEAD_MANIFEST_SHA256)'));
  assert(source.includes('ctFacialComparisons?.items.map(item=>({id:\'head-ct-bone-comparison-\'+item.conceptId'));
  assert(source.includes('<HeadCtFacialComparisonReview packet={ctFacialComparisons}/>'));
});
