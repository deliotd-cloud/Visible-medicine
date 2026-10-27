import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {test} from 'node:test';
import {build} from './workspace-test-build.mjs';

const built=await build({stdin:{contents:"export * from './lib/regional-tour-entry';export {regionalTours} from './lib/regional-tours';export {bodyDisplayCatalog} from './lib/body-display-catalog';export {parseBodyCatalog} from './lib/body-catalog-input';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const raw=JSON.parse(await readFile(new URL('../public/models/bodyparts3d/full-body/catalog.json',import.meta.url),'utf8'));
const catalog=api.bodyDisplayCatalog(api.parseBodyCatalog(raw));
const source='a'.repeat(40);
const params=(tour,step)=>({regionalTour:tour.id,tourRevision:tour.revision,tourSource:source,...(step===undefined?{}:{regionalStep:step})});

test('Every tour resolves each exact linked step in its region and Whole body',()=>{
 for(const tour of api.regionalTours)for(let index=0;index<tour.steps.length;index++){
  const entry=api.parseRegionalTourEntry(params(tour,String(index+1)));
  assert.deepEqual(entry,{status:'requested',id:tour.id,revision:tour.revision,sourceRevision:source,stepIndex:index});
  for(const region of new Set([tour.region,'whole-body'])){
   const result=api.resolveRegionalTourEntry(catalog,region,source,entry);
   assert.equal(result.status,'ready',`${tour.id}/${region}/${index}`);
   assert.equal(result.tour,tour);assert.equal(result.stepIndex,index);
  }
 }
});

test('Step syntax, duplicates and orphan fields fail closed',()=>{
 const tour=api.regionalTours[0];
 for(const value of ['', '0','00','01','201','999','1.0','+1','-1',' 1','1 ','1e2','1/2',[],['1'],['1','2'],1,null,undefined]){
  const input={...params(tour),regionalStep:value};
  assert.equal(api.parseRegionalTourEntry(input).status,'invalid',String(value));
  assert.equal(api.regionalTourEntrySuffix(input),null);
 }
 for(const field of ['regionalTour','tourRevision','tourSource','regionalStep']){
  const inherited=Object.assign(Object.create({[field]:params(tour,'1')[field]}),params(tour,'1'));
  delete inherited[field];
  assert.equal(api.parseRegionalTourEntry(inherited).status,'invalid',`Inherited ${field}`);
  assert.equal(api.regionalTourEntrySuffix(inherited),null);
 }
 assert.equal(api.parseRegionalTourEntry({regionalStep:'1'}).status,'invalid');
 assert.equal(api.parseRegionalTourEntry({...params(tour,'1'),tourSource:undefined}).status,'invalid');
});

test('Out-of-tour steps, changed identities and busy activity cannot substitute a stop',()=>{
 const tour=api.regionalTours.find(t=>t.steps.length<200);
 assert(tour);
 const entry=api.parseRegionalTourEntry(params(tour,String(tour.steps.length+1)));
 assert.deepEqual(api.resolveRegionalTourEntry(catalog,tour.region,source,entry),{status:'rejected',reason:'unavailable'});
 const first=api.parseRegionalTourEntry(params(tour,'1'));
 assert.deepEqual(api.resolveRegionalTourEntry(catalog,tour.region,'b'.repeat(40),first),{status:'rejected',reason:'source-changed'});
 assert.deepEqual(api.resolveRegionalTourEntry(catalog,tour.region,source,{...first,revision:'stale'}),{status:'rejected',reason:'unavailable'});
 assert.deepEqual(api.resolveRegionalTourEntry(catalog,tour.region,source,first,true),{status:'rejected',reason:'busy'});
 for(const stepIndex of [undefined,-1,1.5,200,'1',NaN])assert.deepEqual(api.resolveRegionalTourEntry(catalog,tour.region,source,{...first,stepIndex}),{status:'rejected',reason:'invalid'});
});

test('URL round trip forwards only admitted public fields and preserves legacy result shape',()=>{
 const tour=api.regionalTours[0];
 for(const step of [undefined,'1',String(tour.steps.length)]){
  const input={...params(tour,step),patientId:'private',autoplay:'1',returnUrl:'https://private.invalid'};
  const suffix=api.regionalTourEntrySuffix(input);
  const encoded=new URLSearchParams(suffix.slice(1));
  assert.deepEqual([...encoded.keys()],step===undefined?['regionalTour','tourRevision','tourSource']:['regionalTour','tourRevision','tourSource','regionalStep']);
  assert.deepEqual(api.parseRegionalTourEntry(Object.fromEntries(encoded)),api.parseRegionalTourEntry(input));
  assert(!suffix.includes('private'));assert(!suffix.includes('autoplay'));
 }
 const ordinary=api.parseRegionalTourEntry(params(tour));
 assert.deepEqual(Object.keys(api.resolveRegionalTourEntry(catalog,tour.region,source,ordinary)).sort(),['status','tour']);
});
