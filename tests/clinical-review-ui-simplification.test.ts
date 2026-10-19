import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {build} from './review-component-test-build.ts';
import {reviewModelHref,reviewModelPreviewHref} from '../lib/clinical-review-links.ts';
const require=createRequire(import.meta.url);
const text=readFileSync('app/workspace/atlas-review/model/model-view.tsx','utf8');
const code=ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
const target={exports:{} as Record<string,any>};let received:unknown;
new Function('require','module','exports',code)((name:string)=>{
 if(name.endsWith('.css'))return{};
 if(name==='next/navigation')return{notFound:()=>{throw Error('Not found');}};
 if(name==='@/atlas-review/app/dissection-data')return{dissectionProfiles:{'whole-body':{},leg:{}}};
 if(name.endsWith('/clinical-review-return'))return{clinicalReviewReturn:async(params:unknown)=>{received=params;return{href:'/workspace/atlas-review/body?structure=fixture',name:'Fixture'};}};
 return require(name);
},target,target.exports);

test('embedded and standalone inspectors share exact query checks, but embedded cannot open a second worksheet',async()=>{
 const params={kind:'body',region:'leg',structure:'fixture',source:'a'.repeat(64)};
 const standard=renderToStaticMarkup(await target.exports.renderReviewModel(params));
 assert.match(standard,/data-review-return/);assert.deepEqual(received,params);
 const embedded=renderToStaticMarkup(await target.exports.renderReviewModel(params,true));
 assert.match(embedded,/review-model-embedded/);assert.doesNotMatch(embedded,/<a\b|data-review-return|<form\b/);
 const frame=(html:string)=>html.match(/<iframe[^>]*src="([^"]+)"/)?.[1];
 assert.equal(frame(standard),frame(embedded));assert(frame(embedded)?.includes('source='+params.source));
 for(const bad of [{...params,structure:['fixture','fixture']},{...params,source:'x'.repeat(257)},{...params,kind:'unknown'},{...params,region:'unknown'},{...params,redirect:'https://foreign.invalid'}])
  await assert.rejects(()=>target.exports.renderReviewModel(bad,true),/Not found/);
});

test('preview adapts only a supported model and retains exact source query, with no home fallback',()=>{
 const source='/regions/leg?structure=fixture&source='+ 'b'.repeat(64);
 const mapped=reviewModelHref(source),preview=reviewModelPreviewHref(source)!;
 assert.equal(preview.replace('/model/embedded?','/model?'),mapped);
 assert.equal(reviewModelPreviewHref(mapped),preview);
 for(const bad of [null,'/unavailable','/workspace/atlas-review','https://foreign.invalid','//foreign.invalid','/\\foreign.invalid'])assert.equal(reviewModelPreviewHref(bad),null);
});

test('compact presentation retains private parent authorization and removes only repeated chrome',()=>{
 for(const file of ['app/workspace/atlas-review/model/page.tsx','app/workspace/atlas-review/model/embedded/page.tsx'])assert(readFileSync(file,'utf8').includes('renderReviewModel(await searchParams'));
 const layout=readFileSync('app/workspace/atlas-review/layout.tsx','utf8');assert(layout.includes('await authorizeClinicalReview()'));assert(layout.includes("error.status === 401"));
 const css=readFileSync('app/workspace/atlas-review/model/review-model-embedded.css','utf8');assert.match(css,/\.review-model-embedded > \.review-model-frame \{[^}]*min-height:0/);
 const source=readFileSync('scripts/import-clinical-review.mjs','utf8');assert(source.includes("file === 'app/review/review-model-preview.tsx'"));assert(source.includes('href = reviewModelPreviewHref(href)'));
});

test('actual imported preview preserves client directive and maps exact material without a missing-model fallback',async()=>{
 const path='atlas-review/app/review/review-model-preview.tsx',imported=readFileSync(path,'utf8');
 assert(imported.startsWith("'use client';"));
 const compiled=await build({stdin:{contents:"export {ReviewModelPreview} from './atlas-review/app/review/review-model-preview';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',packages:'external',alias:{'@':process.cwd()}});
 const scope={exports:{} as Record<string,React.ComponentType<any>>};
 new Function('require','module','exports',compiled.outputFiles![0].text)(require,scope,scope.exports);
 const href='/regions/leg?structure=fixture&source='+ 'c'.repeat(64);
 const html=renderToStaticMarkup(React.createElement(scope.exports.ReviewModelPreview,{href,name:'Worksheet fixture',revision:'exact-worksheet-revision'}));
 assert(html.includes(reviewModelPreviewHref(href)!.replaceAll('&','&amp;')));
 assert.match(html,/Worksheet: Worksheet fixture/);assert.match(html,/Model selection changes inspection only/);
 assert.match(html,/exact-worksheet-revision/);
 const unavailable=renderToStaticMarkup(React.createElement(scope.exports.ReviewModelPreview,{href:null,name:'Unavailable fixture',revision:'exact'}));
 assert.doesNotMatch(unavailable,/<iframe|href="\/workspace\/atlas-review/);
});
