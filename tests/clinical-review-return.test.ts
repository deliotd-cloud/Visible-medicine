import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {build} from 'esbuild';
import {reviewReturnDestination,closeReviewModel} from '../scripts/clinical-review-viewer/review-return.ts';

test('every registered worksheet returns from its exact model link, including nested and specimen scopes',{timeout:120000},async()=>{
 const result=await build({stdin:{contents:`
  export {clinicalReviewReturn} from './lib/clinical-review-return';
  export {reviewModelHref} from './lib/clinical-review-links';
  export {clinicalReviewEntries} from './atlas-review/lib/clinical-review-index';
  export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';
  export {nestedReviewMaterial} from './atlas-review/lib/nested-review-material';
  export {specimenReviewMaterial} from './atlas-review/lib/specimen-review-material';
 `,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64')).catch(error=>{error.stack=error.message;throw error;});
 const home={href:'/workspace/atlas-review',name:null};
 const counts:Record<string,number>={};
 const fixtures:Record<string,Record<string,string>>={};
 for(const entry of api.clinicalReviewEntries){
  const q=new URL(entry.href,'https://review.test').searchParams;
  const source=entry.scope==='shoulder'?'/shoulder?'+new URLSearchParams({structure:entry.id}):
   entry.scope==='body'?(await api.bodyReviewMaterial(entry.id)).atlasLink:
   entry.scope==='nested'?(await api.nestedReviewMaterial(JSON.stringify([q.get('parent'),q.get('study')]),entry.id)).atlasLink:
   (await api.specimenReviewMaterial(q.get('specimen'),entry.id)).atlasLink;
  assert(source,entry.key+' must have a model link');
  const params=Object.fromEntries(new URL(api.reviewModelHref(source),'https://review.test').searchParams);
  const destination=await api.clinicalReviewReturn(params);
  assert.deepEqual(destination,{href:entry.href,name:entry.name},entry.key);
  counts[entry.scope]=(counts[entry.scope]??0)+1;
  fixtures[entry.scope]??=params;
 }
 assert.equal(counts.body,1104);assert.equal(counts.shoulder,9);
 assert(counts.nested>=106);assert(counts.specimens>=200);
 for(const params of Object.values(fixtures)){
  assert.deepEqual(await api.clinicalReviewReturn({...params,redirect:'https://foreign.test'}),home);
  assert.deepEqual(await api.clinicalReviewReturn(Object.fromEntries(Object.entries(params).reverse())),await api.clinicalReviewReturn(params));
  for(const [key,value]of Object.entries(params)){
   assert.deepEqual(await api.clinicalReviewReturn({...params,[key]:[value,value]}),home,'Duplicate '+key);
   assert.deepEqual(await api.clinicalReviewReturn({...params,[key]:'x'.repeat(257)}),home,'Oversized '+key);
   assert.deepEqual(await api.clinicalReviewReturn({...params,[key]:value+'-foreign'}),home,'Altered source context '+key);
  }
 }
 assert.deepEqual(await api.clinicalReviewReturn({}),home);
 assert.deepEqual(await api.clinicalReviewReturn({...fixtures.body,source:'0'.repeat(64)}),home);
 const page=readFileSync('app/workspace/atlas-review/model/page.tsx','utf8');
 assert(page.includes('await clinicalReviewReturn(Object.fromEntries(query))'));
 assert(page.includes('data-review-return href={back.href}'));
 console.log(JSON.stringify({roundTrips:counts,noPrivateRecords:true}));
});

test('specimen close uses only the same-origin host worksheet and has a safe fallback',()=>{
 const origin='https://visiblemedicine.test',home='/workspace/atlas-review';
 const expected=home+'/body?structure=vm%3Aanatomy%3Atest';
 assert.equal(reviewReturnDestination(origin+expected,origin),expected);
 for(const bad of [null,'//foreign.test'+expected,'https://foreign.test'+expected,'javascript:alert(1)',
  '/workspace/atlas-review-elsewhere','/workspace/atlas-review/body?structure=a&structure=b',
  expected+'&redirect=https://foreign.test',expected+'&token=private',home+'?source=abc',
  home+'/body?structure='+'x'.repeat(257)])assert.equal(reviewReturnDestination(bad,origin),home);
 const global=globalThis as unknown as {window?:unknown},previous=global.window;
 try{
  const location={href:'',origin};
  global.window={parent:{document:{querySelector:(selector:string)=>{assert.equal(selector,'a[data-review-return]');return {href:origin+expected};}}},top:{location},location:{origin,search:'?return=https://foreign.test'}};
  closeReviewModel();assert.equal(location.href,expected);
  global.window={parent:{get document(){throw Error('Cross-origin');}},top:{location},location:{origin}};
  closeReviewModel();assert.equal(location.href,home);
  global.window={parent:{document:{querySelector:()=>null}},top:{location},location:{origin}};
  closeReviewModel();assert.equal(location.href,home);
 }finally{if(previous===undefined)delete global.window;else global.window=previous;}
 const viewer=readFileSync('scripts/clinical-review-viewer/main.tsx','utf8');
 assert(viewer.includes('const close = closeReviewModel;'));
 assert.equal((viewer.match(/onClose=\{close\}/g)??[]).length,2,'Both lower-limb and independent specimen close handlers use the host return');
});
