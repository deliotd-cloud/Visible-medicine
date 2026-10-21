import {assert,test,React,renderToStaticMarkup,compile,current,Link,require,replayOriginal} from './review-navigation-history-harness.mjs';

// The complete prior test runs, unchanged apart from its module/read bridge,
// against the exact prior source bytes, including its original inverse hash.
replayOriginal('header-workspace-destination.test.mjs','1f7e3b57a0c5cbd87a29a020e41fd879fd39d3fb3c5e06d06f9e07f0cd2e78d0','SiteHeader.tsx','ab71e13765bb490f5f891d933f09b40987c9643f4e4bee1ba7c2471fa94feeec');

let pathname='/atlas/3d';
const destination=compile(current('lib/review-destination.ts'));
const {SiteHeader}=compile(current('components/SiteHeader.tsx'),{
 'next/link':Link,'next/navigation':{usePathname:()=>pathname},
 './BrandLockup':{BrandLockup:()=>React.createElement('span',null,'Visible Medicine')},
 '../lib/atlas-navigation':{atlasModalities:[]},
 '../lib/review-destination':destination,
});
const render=(signedIn,reviewAvailable)=>renderToStaticMarkup(React.createElement(SiteHeader,{signedIn,reviewAvailable}));
const switcher=html=>html.match(/<details class="workspace-switcher"[\s\S]*?<\/details>/)?.[0];
const links=html=>[...html.matchAll(/href="([^"]+)"/g)].map(match=>match[1]);

test('CURRENT header routes a verified reviewer directly to Review and offers Administration separately',()=>{
 const html=render(true,true),menu=switcher(html);
 assert(menu);
 assert.deepEqual(links(menu),['/my-learning','/studio/workspace','/workspace/clinical-review-inbox','/workspace','/account']);
 assert.match(menu,/<b>Clinical Review<\/b><span>Outstanding anatomy and teaching reviews<\/span>/);
 assert.match(menu,/<b>Administration<\/b><span>Institution settings and controls<\/span>/);
 assert.match(html,/href="\/workspace\/clinical-review-inbox"[^>]*>Clinical Review<span/);
 assert.match(html,/href="\/workspace"[^>]*>Administration<span/);
});

test('CURRENT header fails closed for unavailable and anonymous positive hints',()=>{
 for(const [signedIn,reviewAvailable] of [[true,false],[false,true],[false,false]]){
  const html=render(signedIn,reviewAvailable);
  assert.doesNotMatch(html,/href="\/workspace\/clinical-review-inbox"/);
  assert.doesNotMatch(html,/>Clinical Review<\/b>|>Clinical Review<span/);
  if(signedIn){
   const menu=switcher(html);
   assert.deepEqual(links(menu),['/my-learning','/studio/workspace','/workspace','/account']);
   assert.match(menu,/<b>Workspace<\/b><span>Institution tools, when authorized<\/span>/);
   assert.doesNotMatch(menu,/>Administration<\/b>/);
  }else{
   assert.equal(switcher(html),undefined);
   assert.match(html,/href="\/account-entry"/);
  }
 }
});

test('CURRENT active Review is boundary-aware in the switcher and compact navigation',()=>{
 pathname='/workspace/atlas-review/source-comparisons';
 const html=render(true,true);
 assert.match(switcher(html),/aria-current="page" href="\/workspace\/clinical-review-inbox"/);
 pathname='/workspace/atlas-reviewer';
 const unrelated=render(true,true);
 assert.doesNotMatch(switcher(unrelated),/aria-current="page" href="\/workspace\/clinical-review-inbox"/);
 pathname='/atlas/3d';
});
