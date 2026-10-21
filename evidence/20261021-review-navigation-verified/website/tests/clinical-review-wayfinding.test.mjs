import {assert,test,React,renderToStaticMarkup,compile,current,Link,require,replayOriginal} from './review-navigation-history-harness.mjs';

// Replays every old assertion against the exact prior SiteFrame source bytes.
replayOriginal('clinical-review-wayfinding.test.mjs','c04a8ca76716126748a8030885063451742ce6a7977a3b79db7dc5fa8c61cf25','SiteFrame.tsx','8a507e7acbbd860ac69e64ff54a7253b92e357c0d4a3ab58e878570ff3007c10');

let pathname='/workspace/review-candidates';
const focus=require('./lib/public-route-focus.ts');
const destination=compile(current('lib/review-destination.ts'));
const {SiteFrame,WorkspaceContextBar}=compile(current('components/SiteFrame.tsx'),{
 'next/link':Link,'next/navigation':{usePathname:()=>pathname},
 './SiteHeader':{SiteHeader:()=>null},'./SiteFooter':{SiteFooter:()=>null},
 '../lib/public-route-focus':focus,'../lib/review-destination':destination,
});
const frame=(route,signedIn=true,reviewAvailable=true)=>{pathname=route;return renderToStaticMarkup(React.createElement(SiteFrame,{signedIn,reviewAvailable},'Synthetic route content'));};
const nav=(html,label)=>html.match(new RegExp('<nav[^>]*aria-label="'+label+'"[^>]*>([\\s\\S]*?)</nav>'))?.[1];
const links=html=>[...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map(([,attrs,label])=>({href:attrs.match(/\bhref="([^"]+)"/)?.[1],current:/\baria-current="page"/.test(attrs),label:label.replace(/<[^>]*>/g,'')}));

test('CURRENT verified Review shows a direct primary destination, separate Administration and the exact active review item',()=>{
 for(const [route,currentItem] of [
  ['/workspace/clinical-review-inbox','/workspace/clinical-review-inbox'],
  ['/workspace/atlas-review','/workspace/atlas-review'],
  ['/workspace/atlas-review/source-comparisons/optic','/workspace/atlas-review/source-comparisons'],
  ['/workspace/review-candidates/synthetic-candidate','/workspace/review-candidates'],
 ]){
  const html=frame(route),primary=links(nav(html,'Choose workspace')??''),review=links(nav(html,'Clinical Review navigation')??'');
  assert.deepEqual(primary.filter(x=>x.current).map(x=>[x.href,x.label]),[['/workspace/clinical-review-inbox','Clinical Review']]);
  assert.deepEqual(review.filter(x=>x.current).map(x=>x.href),[currentItem]);
  assert.deepEqual(review.map(x=>x.href),['/workspace/clinical-review-inbox','/workspace/atlas-review','/workspace/atlas-review/source-comparisons','/workspace/review-candidates']);
  assert.match(html,/class="workspace-admin-link"[^>]*href="\/workspace">Administration/);
 }
});

test('CURRENT unavailable and anonymous positive hints keep Workspace as the primary destination',()=>{
 for(const [signedIn,reviewAvailable] of [[true,false],[false,true],[false,false]]){
  const html=frame('/workspace/review-candidates',signedIn,reviewAvailable),primary=links(nav(html,'Choose workspace')??'');
  assert.deepEqual(primary.filter(x=>[x.href,x.label].join('|')==='/workspace|Workspace').map(x=>[x.href,x.label]),[['/workspace','Workspace']]);
  assert.deepEqual(primary.filter(x=>x.current),[],'Review child routes must not mislabel Workspace as active');
  assert.doesNotMatch(html,/class="workspace-admin-link"/);
  assert.doesNotMatch(nav(html,'Choose workspace')??'',/href="\/workspace\/clinical-review-inbox"/);
 }
 const embedded=renderToStaticMarkup(React.createElement(WorkspaceContextBar,{pathname:'/workspace/review-candidates',signedIn:true}));
 assert.doesNotMatch(embedded,/href="\/workspace\/clinical-review-inbox"/);
});

test('CURRENT route boundaries and immersive frame keep review navigation scoped',()=>{
 for(const route of ['/workspace/review-candidates-old','/workspace/atlas-reviewer','/workspace/people']){
  const html=frame(route,true,false),primary=links(nav(html,'Choose workspace')??'');
  assert.equal(nav(html,'Clinical Review navigation'),undefined);
  assert.deepEqual(primary.filter(x=>x.current).map(x=>x.href),['/workspace']);
 }
 const html=frame('/workspace/atlas-review/model/embedded');
 assert.match(html,/class="immersive-site-frame"/);
 assert.equal(nav(html,'Choose workspace'),undefined);
 assert.equal(nav(html,'Clinical Review navigation'),undefined);
});

test('CURRENT server layout still authorizes independently of navigation availability',async()=>{
 const AccessError=class extends Error {constructor(status){super('Synthetic denied state');this.status=status;}};
 for(const status of [null,401,403,503]){
  let calls=0;
  const layout=compile(current('app/workspace/clinical-review-inbox/layout.tsx'),{
   '@/app/chatgpt-auth':{chatGPTSignInPath:()=>'/signin-with-chatgpt?return_to=%2Fworkspace%2Fclinical-review-inbox'},
   '@/lib/clinical-review-server':{authorizeClinicalReview:async()=>{calls++;if(status)throw new AccessError(status);}},
   '@/lib/clinical-review-access':{ClinicalReviewAccessError:AccessError},
  });
  const html=renderToStaticMarkup(await layout.default({children:React.createElement('div',{className:'synthetic-authorized-child'},'Authorized content')}));
  assert.equal(calls,1);
  if(status===null)assert.match(html,/synthetic-authorized-child/);
  else {assert.doesNotMatch(html,/synthetic-authorized-child/);assert.match(html,/role="alert"/);}
 }
});
