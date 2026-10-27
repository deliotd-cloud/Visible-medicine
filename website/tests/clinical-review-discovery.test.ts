import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';

const require=createRequire(import.meta.url);
type Exports=Record<string,any>;
function compile(path:string,imports:Record<string,unknown>={}) {
  const source=readFileSync(new URL('../'+path,import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{} as Exports};
  new Function('require','module','exports',code)((id:string)=>imports[id]??(id.endsWith('.css')?{}:require(id)),mod,mod.exports);
  return mod.exports;
}

const destinations={
  structures:'/workspace/atlas-review',
  'head-learning':'/workspace/atlas-review/head-learning',
  'source-comparisons':'/workspace/atlas-review/source-comparisons',
} as const;

test('all Clinical Review areas preserve the current worksheet and disclose safe new tabs',()=>{
  const {ClinicalReviewAreas}=compile('components/ClinicalReviewAreas.tsx');
  for(const current of ['structures','head-learning','source-comparisons'] as const){
    const html=renderToStaticMarkup(React.createElement(ClinicalReviewAreas,{current}));
    const links=[...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)];
    assert.equal(links.length,3,'the inbox and the other two areas should be links');
    const expected=['/workspace/clinical-review-inbox',...Object.entries(destinations).filter(([area])=>area!==current).map(([,href])=>href)].sort();
    const actual=links.map(([,attrs])=>attrs.match(/\bhref="([^"]+)"/)?.[1]).sort();
    assert.deepEqual(actual,expected,'navigation must use only the inbox and fixed review destinations');
    for(const [,attrs,label] of links){
      assert.match(attrs,/\btarget="_blank"/);
      assert.match(attrs,/\brel="[^"]*\bnoopener\b[^"]*\bnoreferrer\b[^"]*"/);
      assert.match(attrs+label,/new tab/i,'new-tab behavior must be visible or in the accessible name');
      assert.doesNotMatch(attrs,/\baria-current=/);
    }
    assert.equal((html.match(/aria-current="page"/g)??[]).length,1);
    assert.doesNotMatch(html,new RegExp(`<a\\b[^>]*aria-current="page"`),'current area must be text, not navigation');
    assert(!links.some(([,attrs])=>attrs.includes(`href="${destinations[current]}"`)));
    assert.doesNotMatch(html,/\b\d[\d,]*\s+(?:pending|approved|approvals|reviews|selections)\b/i,'area navigation must not invent counts');
    assert.doesNotMatch(html,/\b(?:approved|signed off|ready for publication)\b/i,'area navigation must not claim approval');
  }
});

test('overview wrapper retains generated metadata, dynamic mode and search parameters',async()=>{
  const calls:unknown[]=[];
  const generated={
    metadata:{title:'Generated overview sentinel'},
    dynamic:'force-dynamic',
    default:(props:unknown)=>{calls.push(props);return React.createElement('section',{'data-generated-overview':'yes'},'Original result');},
  };
  const areas={ClinicalReviewAreas:({current}:{current:string})=>React.createElement('nav',{'data-area':current})};
  const page=compile('app/workspace/atlas-review/page.tsx',{
    '@/atlas-review/app/review/overview/page':generated,
    '@/components/ClinicalReviewAreas':areas,
  });
  assert.strictEqual(page.metadata,generated.metadata);
  assert.equal(page.dynamic,generated.dynamic);
  const searchParams=Promise.resolve({q:'pons',scope:['nested','all'],page:'2'});
  const html=renderToStaticMarkup(await page.default({searchParams}));
  assert.equal(calls.length,1);
  assert.strictEqual((calls[0] as {searchParams:unknown}).searchParams,searchParams);
  assert.match(html,/data-area="structures"/);
  assert.match(html,/data-generated-overview="yes">Original result/);
});

test('source comparisons authorize before rendering area navigation',async()=>{
  for(const authorized of [false,true]){
    const calls:string[]=[];
    const page=compile('app/workspace/atlas-review/source-comparisons/page.tsx',{
      '@/lib/clinical-review-server':{authorizeClinicalReview:async()=>{calls.push('authorize');if(!authorized)throw new Error('Denied');}},
      '@/components/ClinicalReviewAreas':{ClinicalReviewAreas:({current}:{current:string})=>{calls.push('areas');return React.createElement('nav',{'data-area':current});}},
    });
    const html=renderToStaticMarkup(await page.default());
    assert.equal(page.dynamic,'force-dynamic');
    assert.equal(page.metadata.robots.index,false);
    if(!authorized){
      assert.deepEqual(calls,['authorize']);
      assert.match(html,/role="alert"/);
      assert.doesNotMatch(html,/data-area=|<nav\b/);
    }else{
      assert.deepEqual(calls,['authorize','areas']);
      assert.match(html,/data-area="source-comparisons"/);
      assert.match(html,/Source comparisons/);
    }
  }
});

test('shared Clinical Review layout withholds child navigation on denial',async()=>{
  class AccessError extends Error {status=403;}
  for(const authorized of [false,true]){
    const calls:string[]=[];
    const layout=compile('app/workspace/atlas-review/layout.tsx',{
      '@/app/chatgpt-auth':{chatGPTSignInPath:()=>'/sign-in'},
      '@/lib/clinical-review-server':{authorizeClinicalReview:async()=>{calls.push('authorize');if(!authorized)throw new AccessError('Review access denied');}},
      '@/lib/clinical-review-access':{ClinicalReviewAccessError:AccessError},
    });
    const child=React.createElement('nav',{'data-child-navigation':'yes'},'Private review areas');
    const html=renderToStaticMarkup(await layout.default({children:child}));
    assert.deepEqual(calls,['authorize']);
    if(!authorized){
      assert.match(html,/role="alert">Review access denied/);
      assert.doesNotMatch(html,/data-child-navigation=|Private review areas/);
    }else{
      assert.match(html,/data-child-navigation="yes"/);
    }
  }
});
