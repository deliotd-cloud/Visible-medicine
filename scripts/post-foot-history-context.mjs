// Test-only enrichment for source-bound post-foot history entry points.
import assert from 'node:assert/strict';
import {contentContext} from './content-contract-tools.mjs';
import {loadPostFootHelpers} from './load-post-foot-helpers.mjs';

export async function withPostFootHistoryHelpers(api){
 assert(api&&typeof api==='object'&&!Array.isArray(api),'Historical content API required');
 const helpers=await loadPostFootHelpers();
 const additions={};
 for(const [name,helper] of Object.entries(helpers)){
  assert.equal(typeof helper,'function',`Exact historical helper ${name} must be callable`);
  if(name in api){
   assert(Object.hasOwn(api,name),`Inherited historical helper ${name} cannot be silently replaced`);
   // Keep supplied values verbatim, including undefined/foreign values. The
   // exact source-bound replay must reject a missing or altered required helper.
   continue;
  }
  additions[name]=helper;
 }
 return {...api,...additions};
}

export async function postFootHistoryContext(options){
 const loaded=await contentContext(options);
 return {...loaded,api:await withPostFootHistoryHelpers(loaded.api)};
}
