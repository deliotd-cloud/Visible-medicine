import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {ClinicalReviewAccessError} from '../lib/clinical-review-access.ts';

const require=createRequire(import.meta.url);
function compile(path:string,imports:Record<string,unknown>={}) {
 const code=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const mod={exports:{} as Record<string,any>};
 new Function('require','module','exports',code)((id:string)=>imports[id]??(id.endsWith('.css')?{}:require(id)),mod,mod.exports);return mod.exports;
}
const auth=compile('app/chatgpt-auth.ts',{'next/headers':{},'next/navigation':{}});
const layoutPath='app/workspace/clinical-review-inbox/layout.tsx';
const selectedLayout=()=>existsSync(layoutPath)?layoutPath:'app/workspace/atlas-review/layout.tsx';
function guarded(error:Error|null) {
 let calls=0;
 const layout=compile(selectedLayout(),{
  '@/app/chatgpt-auth':auth,
  '@/lib/clinical-review-server':{authorizeClinicalReview:async()=>{calls++;if(error)throw error;}},
  '@/lib/clinical-review-access':{ClinicalReviewAccessError},
 });
 return {layout,calls:()=>calls};
}
const children=React.createElement('p',{'data-private-inbox':'yes'},'Private review rows');

test('anonymous inbox sign-in returns to the inbox with top-level navigation',async()=>{
 const {layout,calls}=guarded(new ClinicalReviewAccessError(401,'Sign in to open Clinical Review.'));
 const html=renderToStaticMarkup(await layout.default({children}));
 assert.equal(calls(),1);assert.match(html,/role="alert"/);assert.doesNotMatch(html,/data-private-inbox|Private review rows/);
 const href=html.match(/<a href="([^"]+)" target="_top">Sign in with ChatGPT<\/a>/)?.[1];assert(href);
 const url=new URL(href,'https://review.invalid');assert.equal(url.pathname,'/signin-with-chatgpt');
 assert.equal(url.searchParams.get('return_to'),'/workspace/clinical-review-inbox');
 assert.match(html,/href="\/workspace">Return to workspace/);
});

test('inbox denial and storage errors never render private rows or offer a sign-in bypass',async()=>{
 for(const error of [new ClinicalReviewAccessError(403,'Review access denied'),new ClinicalReviewAccessError(503,'Review storage is unavailable.'),new Error('secret database detail')]){
  const {layout,calls}=guarded(error),html=renderToStaticMarkup(await layout.default({children}));
  assert.equal(calls(),1);assert.match(html,/role="alert"/);assert.doesNotMatch(html,/data-private-inbox|Private review rows|Sign in with ChatGPT|secret database detail/);
  assert.match(html,error instanceof ClinicalReviewAccessError?new RegExp(error.message.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')):/Clinical Review is temporarily unavailable\./);
 }
});

test('authorized inbox preserves the personal-review limitation and its original child',async()=>{
 const {layout,calls}=guarded(null),html=renderToStaticMarkup(await layout.default({children}));
 assert.equal(calls(),1);assert.match(html,/class="website-clinical-review"/);assert.match(html,/data-private-inbox="yes">Private review rows/);
 assert.match(html,/Saved decisions do not publish content or grant institution sign-off/);assert.doesNotMatch(html,/Sign in with ChatGPT|role="alert"/);
});

test('inbox route uses its dedicated guarded layout while general Review remains unchanged',()=>{
 assert(existsSync(layoutPath),'inbox must have a dedicated server-authorized layout');
 const layout=readFileSync(layoutPath,'utf8'),page=readFileSync('app/workspace/clinical-review-inbox/page.tsx','utf8');
 assert.match(layout,/authorizeClinicalReview\(\)/);assert.match(layout,/dynamic = 'force-dynamic'/);assert.match(layout,/index: false, follow: false/);
 assert.match(layout,/chatGPTSignInPath\('\/workspace\/clinical-review-inbox'\)/);assert.doesNotMatch(layout,/headers\(|searchParams|returnTo/);
 assert.match(page,/return <ClinicalReviewInbox\/>/);assert.doesNotMatch(page,/ClinicalReviewLayout/);
 const shared=guarded(new ClinicalReviewAccessError(401,'Sign in')).layout;
 assert(shared);
 const original=compile('app/workspace/atlas-review/layout.tsx',{
  '@/app/chatgpt-auth':auth,'@/lib/clinical-review-server':{authorizeClinicalReview:async()=>{throw new ClinicalReviewAccessError(401,'Sign in');}},'@/lib/clinical-review-access':{ClinicalReviewAccessError},
 });
 return original.default({children}).then((element:React.ReactElement)=>{
  const html=renderToStaticMarkup(element);assert.match(html,/return_to=%2Fworkspace%2Fatlas-review/);assert.doesNotMatch(html,/data-private-inbox/);
 });
});
