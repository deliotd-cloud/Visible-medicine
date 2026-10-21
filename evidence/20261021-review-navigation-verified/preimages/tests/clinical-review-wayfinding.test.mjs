import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {isPublicFocusPath,shouldFocusPublicRoute,shouldFocusStudioPrimaryRoute} from '../lib/public-route-focus.ts';

const require=createRequire(import.meta.url);
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
function compile(path,imports={}){
 const code=ts.transpileModule(read(path),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const mod={exports:{}};
 new Function('require','module','exports',code)(name=>Object.hasOwn(imports,name)?imports[name]:name.endsWith('.css')?{}:require(name),mod,mod.exports);
 return mod.exports;
}
let pathname='/workspace/review-candidates';
const Link=({children,...props})=>React.createElement('a',props,children);
const {SiteFrame}=compile('components/SiteFrame.tsx',{'next/link':Link,'next/navigation':{usePathname:()=>pathname},'./SiteHeader':{SiteHeader:()=>null},'./SiteFooter':{SiteFooter:()=>null},'../lib/public-route-focus':{isPublicFocusPath,shouldFocusPublicRoute,shouldFocusStudioPrimaryRoute}});
const frame=(route,signedIn=true)=>{pathname=route;return renderToStaticMarkup(React.createElement(SiteFrame,{signedIn},'Synthetic route content'));};
const nav=(html,label)=>html.match(new RegExp('<nav[^>]*aria-label="'+label+'"[^>]*>([\\s\\S]*?)</nav>'))?.[1];
const links=html=>[...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map(([,attrs,label])=>({href:attrs.match(/\bhref="([^"]+)"/)?.[1],current:/\baria-current="page"/.test(attrs),label:label.replace(/<[^>]*>/g,'')}));

test('saved inspections and exact candidate descendants retain Clinical Review wayfinding',()=>{
 for(const route of ['/workspace/review-candidates','/workspace/review-candidates/synthetic-candidate','/workspace/review-candidates/synthetic-candidate/worksheet']){
  for(const signedIn of [false,true]){
   const html=frame(route,signedIn),primary=links(nav(html,'Choose workspace'));
   assert.deepEqual(primary.filter(item=>item.current).map(item=>[item.href,item.label]),[['/workspace/clinical-review-inbox','Clinical Review']]);
   assert.equal(nav(html,'Administration navigation'),undefined);
   const review=links(nav(html,'Clinical Review navigation')??'');
   assert.deepEqual(review.map(item=>item.href),['/workspace/clinical-review-inbox','/workspace/atlas-review','/workspace/atlas-review/source-comparisons','/workspace/review-candidates']);
   assert.deepEqual(review.filter(item=>item.current).map(item=>item.href),['/workspace/review-candidates']);
   assert.match(html,/class="workspace-admin-link" href="\/workspace">Administration/);
   assert.doesNotMatch(html,/href="\/workspace\/(?:people|readiness|control)"/);
  }
 }
});

test('other review routes keep one specific active destination and saved inspections remain discoverable',()=>{
 for(const [route,current] of [['/workspace/clinical-review-inbox','/workspace/clinical-review-inbox'],['/workspace/atlas-review','/workspace/atlas-review'],['/workspace/atlas-review/body','/workspace/atlas-review'],['/workspace/atlas-review/model','/workspace/atlas-review'],['/workspace/atlas-review/source-comparisons/optic','/workspace/atlas-review/source-comparisons']]){
  const html=frame(route),review=links(nav(html,'Clinical Review navigation')??'');
  assert.equal(review.length,4);
  assert.deepEqual(review.filter(item=>item.current).map(item=>item.href),[current]);
  assert.equal(review.filter(item=>item.href==='/workspace/review-candidates').length,1);
 }
});

test('review route matching is boundary-aware and does not expose review shortcuts in unrelated workspaces',()=>{
 for(const route of ['/workspace/review-candidates-old','/workspace/review-candidateship','/workspace/people','/workspace/atlas-reviewer']){
  const html=frame(route);
  assert(nav(html,'Administration navigation'));
  assert.equal(nav(html,'Clinical Review navigation'),undefined);
  assert.doesNotMatch(html,/href="\/workspace\/(?:review-candidates|clinical-review-inbox)"/);
 }
 for(const route of ['/studio/workspace','/my-learning','/account/settings']){
  const html=frame(route);assert.equal(nav(html,'Clinical Review navigation'),undefined);assert.doesNotMatch(html,/href="\/workspace\/review-candidates"/);
 }
});

test('embedded inspection stays immersive without the outer review navigation',()=>{
 const html=frame('/workspace/atlas-review/model/embedded');
 assert.match(html,/class="immersive-site-frame"/);
 assert.equal(nav(html,'Clinical Review navigation'),undefined);
 assert.equal(nav(html,'Choose workspace'),undefined);
});

test('authorized inbox has one level-one page heading without changing the server access gate',async()=>{
 const contract=compile('lib/clinical-review-inbox-contract.ts');
 const {ClinicalReviewInbox}=compile('components/ClinicalReviewInbox.tsx',{'../lib/clinical-review-inbox-contract':contract,'../lib/clinical-review-fetch':{clinicalReviewFetch(){throw Error('SSR must not scan or mutate reviews');}}});
 class AccessError extends Error{constructor(status,message){super(message);this.status=status;}}
 for(const status of [null,401,403,503]){
  let calls=0;
  const layout=compile('app/workspace/clinical-review-inbox/layout.tsx',{'@/app/chatgpt-auth':{chatGPTSignInPath:()=>'/signin-with-chatgpt?return_to=%2Fworkspace%2Fclinical-review-inbox'},'@/lib/clinical-review-server':{authorizeClinicalReview:async()=>{calls++;if(status)throw new AccessError(status,'Synthetic denied state');}},'@/lib/clinical-review-access':{ClinicalReviewAccessError:AccessError}});
  const html=renderToStaticMarkup(await layout.default({children:React.createElement(ClinicalReviewInbox)}));
  assert.equal(calls,1);assert.equal((html.match(/<h1(?:\s|>)/g)??[]).length,1);assert.equal((html.match(/<main(?:\s|>)/g)??[]).length,1);
  if(status===null){assert.match(html,/<h1 id="clinical-review-inbox-title">Clinical Review<\/h1>/);assert.match(html,/aria-labelledby="clinical-review-inbox-title"/);assert.match(html,/Saved decisions do not publish content or grant institution sign-off/);}
  else{assert.doesNotMatch(html,/class="clinical-review-inbox"|Load all review statuses|Browse review areas/);assert.match(html,/role="alert"/);}
 }
});

test('the inbox heading keeps the compact existing visual style through its stable id',()=>{
 const css=read('components/clinical-review-inbox.css');
 assert.match(css,/\.clinical-review-inbox #clinical-review-inbox-title\s*\{[^}]*font-size:1\.55rem;/);
 assert.doesNotMatch(css,/\.clinical-review-inbox h2\s*\{/);
});
