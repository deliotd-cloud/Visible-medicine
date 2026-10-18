import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import * as jsxRuntime from 'react/jsx-runtime';
import ts from 'typescript';

const source=readFileSync(new URL('../app/workspace/atlas-review/regional-mri/page.tsx',import.meta.url),'utf8');
function page(allowed:boolean,binding:unknown=null,context:unknown=null){
  let bindingCalls=0;
  let comparisonCalls=0;
  let contextCalls=0;
  let calls=0;const Viewer=({source,correctionProjectionRevision}:{source:unknown;correctionProjectionRevision?:string|null})=>React.createElement('div',{'data-bound-source':source===null?'none':'present','data-correction-projection':correctionProjectionRevision??'none'});
  const module={exports:{} as Record<string,any>};
  const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
  const mocks:Record<string,unknown>={'react/jsx-runtime':jsxRuntime,
    '@/lib/clinical-review-server':{authorizeClinicalReview:async()=>{calls++;if(!allowed)throw Error('denied');}},
    '@/lib/regional-mri-review-source':{regionalMriReviewSource:()=>{bindingCalls++;return binding;}},
    '@/lib/regional-mri-3d-catalogue':{regionalMri3dCatalogue:async(value:unknown)=>{assert.strictEqual(value,binding);comparisonCalls++;return null;}},
    '@/lib/regional-mri-review-context':{regionalMriReviewContext:async(value:unknown)=>{assert.strictEqual(value,binding);contextCalls++;return context;}},
    '@/components/RegionalMriReviewViewer':{RegionalMriReviewViewer:Viewer}};
  new Function('require','module','exports',code)((id:string)=>{assert(id in mocks,id);return mocks[id];},module,module.exports);
  return {module,get calls(){return calls;},get bindingCalls(){return bindingCalls;},get comparisonCalls(){return comparisonCalls;},get contextCalls(){return contextCalls;}};
}
test('regional MRI inspection rejects unauthorized users without constructing a data opener',async()=>{
  const p=page(false),html=renderToStaticMarkup(await p.module.exports.default());
  assert.equal(p.calls,1);assert.match(html,/role="alert"/);assert.match(html,/authorized administrator/);
  assert.equal(p.bindingCalls,0);
  assert.equal(p.comparisonCalls,0);
  assert.equal(p.contextCalls,0);
  assert.doesNotMatch(html,/data-bound-source|input|canvas/);
});
test('authorized inspection is dynamic, private in purpose and unbound until a verified export exists',async()=>{
  const p=page(true),html=renderToStaticMarkup(await p.module.exports.default());
  assert.equal(p.calls,1);assert.equal(p.module.exports.dynamic,'force-dynamic');
  assert.equal(p.bindingCalls,1);
  assert.equal(p.comparisonCalls,0);
  assert.equal(p.contextCalls,0);
  assert.deepEqual(p.module.exports.metadata.robots,{index:false,follow:false});
  assert.match(html,/data-bound-source="none"/);assert.match(html,/not learner publication or clinical sign-off/);
  assert.match(html,/href="\/workspace\/clinical-review-inbox"/);assert.match(html,/existing CT\/MRI head atlases are unchanged/);
  assert.doesNotMatch(source,/searchParams|fetch\s*\(|node:fs|approved|[A-F]:[\\/]/);
});
test('authorized local inspection receives the independent binding without an approval or upload action',async()=>{
  const p=page(true,{revision:'a'.repeat(64),label:'Synthetic regional inspection',region:'knee'}),html=renderToStaticMarkup(await p.module.exports.default());
  assert.equal(p.calls,1);assert.equal(p.bindingCalls,1);assert.match(html,/data-bound-source="present"/);
  assert.equal(p.comparisonCalls,1);
  assert.equal(p.contextCalls,1);
  assert.match(html,/prepared education-package folder/);assert.match(html,/not uploaded/);
  assert.match(html,/not website sign-off/);assert.match(html,/do not inherit the saved smooth-contour appearance/);
  assert.doesNotMatch(html,/approve|publish|upload button/);
});
test('inbox advertises regional source setup only among workflows outside pending counts',()=>{
  const inbox=readFileSync(new URL('../components/ClinicalReviewInbox.tsx',import.meta.url),'utf8');
  const tail=inbox.slice(inbox.indexOf('<details className="clinical-review-inbox-other"'));
  assert.match(tail,/not included in these counts/);
  assert.match(tail,/href="\/workspace\/atlas-review\/regional-mri" target="_blank" rel="noopener noreferrer"/);
  assert.match(tail,/Regional MRI inspection · corrections and recovery/);
  assert.equal((inbox.match(/href="\/workspace\/atlas-review\/regional-mri"/g)??[]).length,1);
});
test('independently bound review context advertises source scope without a saved-decision claim',async()=>{
 const p=page(true,{revision:'a'.repeat(64),label:'Synthetic inspection',region:'knee'},
  {projectionRevision:'b'.repeat(64),series:[{annotations:[{},{}]},{annotations:[{}]}]});
 const html=renderToStaticMarkup(await p.module.exports.default());assert.equal(p.contextCalls,1);
 assert.match(html,/Independent review context · ready/);assert.match(html,/2 source sequences · 3 annotation entries/);
 assert.match(html,/Private correction drafts are separate from clinical sign-off/);assert.match(html,new RegExp('b'.repeat(64)));
 assert.match(html,new RegExp('data-correction-projection="'+'b'.repeat(64)+'"'));
 assert.doesNotMatch(html,/<details open/);
});
