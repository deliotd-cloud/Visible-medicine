import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {coverageRegionQuery} from '../lib/anatomy-coverage-view.ts';
const require=createRequire(import.meta.url),source=readFileSync('app/workspace/atlas-review/anatomy-coverage/page.tsx','utf8');
function harness({deny=false,unavailable=false,reject=false}={}){
 const calls:string[]=[],module={exports:{} as any};
 const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('require','module','exports',code)((id:string)=>{
  if(id==='@/lib/clinical-review-server')return {authorizeClinicalReview:async()=>{calls.push('authorize');if(deny)throw Error('private failure');}};
  if(id==='@/lib/anatomy-coverage-view')return {coverageRegionQuery,verifiedCoverageView:async()=>{calls.push('inventory');if(reject)throw Error('private source path');return unavailable?null:{sourceRevision:'synthetic'};}};
  if(id==='@/components/AnatomyCoverageReview')return {AnatomyCoverageReview:({region}:any)=>React.createElement('div',{'data-coverage':true,'data-region':region??'all'},'Verified summary')};
  return require(id);
 },module,module.exports);
 return {calls,module:module.exports,render:async(params:Record<string,any>={})=>renderToStaticMarkup(await module.exports.default({searchParams:Promise.resolve(params)}))};
}
test('reviewer authority precedes every inventory read; denied access reveals no summary',async()=>{
 const h=harness({deny:true}),html=await h.render();assert.deepEqual(h.calls,['authorize']);assert.match(html,/authorized administrator/);assert(!html.includes('Verified summary'));assert(!html.includes('private failure'));
});
test('valid private route supplies only the parsed region to its bound summary',async()=>{
 const h=harness(),html=await h.render({region:'spine'});assert.deepEqual(h.calls,['authorize','inventory']);assert.match(html,/data-region="spine"/);
 assert.equal(h.module.dynamic,'force-dynamic');assert.deepEqual(h.module.metadata.robots,{index:false,follow:false});
});
test('invalid or duplicated region never reads inventory or renders fallback counts',async()=>{
 for(const params of [{region:['hand','spine']},{region:'foreign'},{x:'secret'}]){const h=harness(),html=await h.render(params);assert.deepEqual(h.calls,['authorize']);assert.match(html,/filter is unavailable/);assert(!html.includes('Verified summary'));}
});
test('unavailable or rejected inventory stays generic with no partial source disclosure',async()=>{
 for(const ports of [{unavailable:true},{reject:true}]){const h=harness(ports),html=await h.render();assert.deepEqual(h.calls,['authorize','inventory']);assert.match(html,/inventory is unavailable or changed/);assert(!html.includes('private source path'));assert(!html.includes('Verified summary'));}
});
