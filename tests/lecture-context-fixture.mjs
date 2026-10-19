import assert from 'node:assert/strict';
export const expectedStudioContext={actorId:'edu:synthetic-server-user',organizationId:'synthetic-organization'};
export const comparisonResponse=()=>new Response(JSON.stringify({ok:true,action:'verify-studio-mutation-context'}),{status:200,headers:{'content-type':'application/json'}});
export const isComparison=(url,init)=>String(url)==='/api/studio?mutationContext=1'&&init?.method==='GET';
export function installComparisonFetch(){
 const native=globalThis.fetch;
 let downstream=native;
 const wrapped=(url,init)=>{
  if(!isComparison(url,init))return downstream(url,init);
  assert.equal(init.credentials,'same-origin');
  assert.equal(init.cache,'no-store');
  assert.deepEqual(JSON.parse(new Headers(init.headers).get('X-Studio-Mutation-Context')),expectedStudioContext);
  return Promise.resolve(comparisonResponse());
 };
 Object.defineProperty(globalThis,'fetch',{configurable:true,enumerable:true,get:()=>wrapped,set:value=>{downstream=value===wrapped?native:value;}});
 return()=>{Object.defineProperty(globalThis,'fetch',{configurable:true,writable:true,enumerable:true,value:native});};
}
