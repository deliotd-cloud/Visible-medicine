import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import * as jsxRuntime from 'react/jsx-runtime';
import ts from 'typescript';
import {parseRegionalLearningReviewRequest} from '../lib/regional-mri-learning-review-link.ts';
import {regionalReferenceDraftContext} from '../lib/regional-reference-draft-contract.ts';

const source=readFileSync(new URL('../app/workspace/atlas-review/reference-learning/page.tsx',import.meta.url),'utf8');
const request={target:'public-target',relation:'same-structure',atlasRevision:'a'.repeat(40),mappingRevision:'b'.repeat(64),teachingRevision:'c'.repeat(64)};
const entry={target:{id:'public-target',kind:'body',label:'Exact public target',side:'left',sourceHash:'d'.repeat(64),specimenRevision:null,relation:'same-structure'},revision:request.teachingRevision,
 topics:['Anatomy','Function','MRI','CT','X-ray','Ultrasound','Pathology','Clinical'].map((title,i)=>({id:title.toLowerCase(),title,body:i===3?'Pending source-bound teaching.':'Public reference draft',readiness:i===3?'pending':'draft',bullets:[],note:null,references:[]})),
 limitations:['Reference only'],reflection:{question:'Source-authored question?',answer:'Source-authored answer.',references:[]}};
function page(options:{allowed?:boolean;parsed?:boolean;source?:boolean;snapshot?:boolean}={}){
 const calls:string[]=[];
 const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
 const module={exports:{} as Record<string,any>};
 const binding={revision:'d'.repeat(64),region:'knee',label:'Synthetic source'};
 const catalogue={schema:'test'};
 const mocks:Record<string,unknown>={
  'react/jsx-runtime':jsxRuntime,
  'next/navigation':{notFound:()=>{calls.push('notFound');throw Error('notFound');}},
  '@/lib/clinical-review-server':{authorizeClinicalReview:async()=>{calls.push('authorize');if(options.allowed===false)throw Error('private source detail');}},
  '@/lib/regional-mri-learning-review-link':{parseRegionalLearningReviewRequest:(params:unknown)=>{calls.push('parse');return options.parsed===false?null:parseRegionalLearningReviewRequest(params as any);}},
  '@/lib/regional-mri-review-source':{regionalMriReviewSource:()=>{calls.push('source');return options.source===false?null:binding;}},
  '@/lib/regional-mri-3d-catalogue':{buildRegionalMri3dCatalogue:async(value:unknown)=>{assert.strictEqual(value,binding);calls.push('catalogue');return catalogue;}},
  '@/lib/regional-mri-learning-review':{resolveRegionalLearningReview:async(value:unknown,actual:unknown)=>{assert.deepEqual(value,request);assert.strictEqual(actual,options.source===false?null:catalogue);calls.push('resolve');return options.snapshot===false?null:{atlasRevision:request.atlasRevision,mappingRevision:request.mappingRevision,entry};}},
  '@/lib/regional-reference-draft-contract':{regionalReferenceDraftContext:(snapshot:any)=>{assert.strictEqual(snapshot.entry,entry);return regionalReferenceDraftContext(snapshot);}},
  '@/components/RegionalReferenceReviewNotes':{RegionalReferenceReviewNotes:({context}:any)=>{assert.equal(context.schema,'vm-regional-reference-teaching-draft-context-1');assert.equal(context.target.id,entry.target.id);assert.equal(context.teachingRevision,entry.revision);assert.equal(context.clinicalApproval,false);return React.createElement('p',null,'Private correction notes · no approval');}},
  '@/lib/regional-reference-review-index':{buildRegionalReferenceReviewIndex:async(actual:unknown)=>{assert.strictEqual(actual,options.source===false?null:catalogue);calls.push('index');return options.snapshot===false?null:{atlasRevision:request.atlasRevision,mappingRevision:request.mappingRevision,rows:[{label:'Public catalogue target'}]};}},
  '@/components/RegionalReferenceReviewCatalogue':{RegionalReferenceReviewCatalogue:({index}:any)=>React.createElement('p',null,`Reference catalogue rows: ${index.rows.length}`)},
 };
 new Function('require','module','exports',code)((id:string)=>{assert(id in mocks,id);return mocks[id];},module,module.exports);
 return {page:module.exports.default as (props:unknown)=>Promise<React.ReactNode>,calls,module};
}
const props=(params:unknown=request)=>({searchParams:Promise.resolve(params)});

test('authorization happens first and denial never opens source, catalogue or teaching',async()=>{
 const f=page({allowed:false});const html=renderToStaticMarkup(await f.page(props()));
 assert.deepEqual(f.calls,['authorize']);assert.match(html,/authorized administrator/);
 assert.doesNotMatch(html,/private source detail|Exact public target|Public reference draft/);
});

test('malformed, missing and stale bindings have no substitute snapshot',async()=>{
 const malformed=page();await assert.rejects(malformed.page(props({...request,target:['one','two']})),/notFound/);
 assert.deepEqual(malformed.calls,['authorize','parse','notFound']);
 const missing=page({source:false,snapshot:false});await assert.rejects(missing.page(props()),/notFound/);
 assert.deepEqual(missing.calls,['authorize','parse','source','resolve','notFound']);
 const stale=page({snapshot:false});await assert.rejects(stale.page(props()),/notFound/);
 assert.deepEqual(stale.calls,['authorize','parse','source','catalogue','resolve','notFound']);
});

test('valid route renders read-only public revisions, all topics and exact internal navigation links',async()=>{
 const f=page();const html=renderToStaticMarkup(await f.page(props()));
 assert.deepEqual(f.calls,['authorize','parse','source','catalogue','resolve']);
 assert.equal(f.module.exports.dynamic,'force-dynamic');assert.deepEqual(f.module.exports.metadata.robots,{index:false,follow:false});
 assert.match(html,/<h1>Exact public target<\/h1>/);assert.match(html,/Read-only draft general reference teaching/);
 assert.match(html,/not a scan finding/);assert.match(html,/Readiness: pending/);
 assert.equal((html.match(/<h3>/g)??[]).length,8);
 for(const revision of [request.atlasRevision,request.mappingRevision,request.teachingRevision])assert.match(html,new RegExp(revision));
 assert.match(html,/Source-authored question/);assert.match(html,/Show source-authored answer/);
 assert.deepEqual([...html.matchAll(/href="([^"]+)"/g)].map(m=>m[1]),['/workspace/clinical-review-inbox','/workspace/atlas-review/reference-learning','/workspace/atlas-review/regional-mri']);
 assert.doesNotMatch(source,/fetch\s*\(|<form|<button|save|approve\s*\(|POST|PUT|DELETE/);
});

test('canonical snapshot supplies the exact private notes context only after authorization and resolution',async()=>{
 const allowed=page();assert.match(renderToStaticMarkup(await allowed.page(props())),/Private correction notes · no approval/);
 const denied=page({allowed:false});assert.doesNotMatch(renderToStaticMarkup(await denied.page(props())),/Private correction notes/);
 const unavailable=page({snapshot:false});await assert.rejects(unavailable.page(props()),/notFound/);
});

test('query-free catalogue authorizes before source/index and never selects a snapshot or loads private notes',async()=>{
 const allowed=page();const html=renderToStaticMarkup(await allowed.page(props({})));
 assert.deepEqual(allowed.calls,['authorize','source','catalogue','index']);assert.match(html,/Reference teaching drafts/);assert.match(html,/Reference catalogue rows: 1/);assert.doesNotMatch(html,/Private correction notes/);
 const denied=page({allowed:false});assert.match(renderToStaticMarkup(await denied.page(props({}))),/authorized administrator/);assert.deepEqual(denied.calls,['authorize']);
 const missing=page({source:false,snapshot:false});const unavailable=renderToStaticMarkup(await missing.page(props({})));assert.match(unavailable,/No current source-bound reference teaching catalogue/);assert.deepEqual(missing.calls,['authorize','source','index']);assert.doesNotMatch(unavailable,/Reference catalogue rows/);
 for(const bad of [{target:request.target},{browse:'1'},{atlasRevision:'0'.repeat(40)},{target:['one','two']}]){const f=page();await assert.rejects(f.page(props(bad)),/notFound/);assert.deepEqual(f.calls,['authorize','parse','notFound']);}
});
