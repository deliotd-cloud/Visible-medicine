import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {test} from 'node:test';
import {runInNewContext} from 'node:vm';
import {build} from 'esbuild';

// Run from the integrated website root after this file is copied into tests/.
// Bundle the real website catalogue/navigation and imported Atlas parser/resolver.
const require=createRequire(import.meta.url),ts=require('typescript');
const compiled=await build({stdin:{contents:`
export * from './lib/regional-tour-entry-navigation';
export {regionalLearningCatalogue} from './lib/regional-learning-catalogue';
export {parseRegionalTourEntry,resolveRegionalTourEntry} from './atlas-review/lib/regional-tour-entry';
export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';
export {default as raw} from './atlas-review/public/models/bodyparts3d/full-body/catalog.json';
export {atlasStudySuffix} from './lib/atlas-study-transport';
export {atlasReferenceRevisionCurrent} from './lib/atlas-reference-revision';
export {selectedBodyRegion} from './lib/atlas-navigation';
export {hasHeadLearningQuery} from './lib/head-atlas-learning';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',alias:{'@':process.cwd()}});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalogue=api.regionalLearningCatalogue(),catalog=api.bodyDisplayCatalog(api.raw);
const revision=JSON.parse(fs.readFileSync('public/atlas-runtime/head-neck/manifest.json')).sourceCommit;
const queryOf=href=>Object.fromEntries(new URL(href,'https://visible.example').searchParams);
const nodes=(node,type)=>!node||typeof node!=='object'?[]:Array.isArray(node)?node.flatMap(value=>nodes(value,type)):
  [...(node.type===type?[node]:[]),...nodes(node.props?.children,type)];

// Execute the current server route itself. Only framework components/navigation
// are shims; the route imports the bundled production navigation helpers above.
const route=ts.transpileModule(fs.readFileSync('app/atlas/3d/page.tsx','utf8'),{compilerOptions:{
  jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,
  esModuleInterop:true,resolveJsonModule:true}}).outputText;
const routeModule={exports:{}};
const dependencies={
  '../../../components/AtlasRuntimeFrame':{AtlasRuntimeFrame:'AtlasRuntimeFrame'},
  '../../../components/AtlasWorkspaceNavigation':{AtlasWorkspaceNavigation:'AtlasWorkspaceNavigation'},
  '../../../components/HeadAtlasLinkedModel':{HeadAtlasLinkedModel:'HeadAtlasLinkedModel'},
  '../../../lib/atlas-navigation':api,'../../../lib/atlas-study-transport':api,
  '../../../lib/regional-tour-entry-navigation':api,'../../../lib/atlas-reference-revision':api,
  '../../../lib/head-atlas-learning':api,
  '../../../public/atlas-runtime/head-neck/manifest.json':{sourceCommit:revision},
  'next/link':{__esModule:true,default:'Link'},
  'next/navigation':{notFound(){throw Error('NOT_FOUND');},redirect(href){throw Error('REDIRECT:'+href);}},
};
runInNewContext(route,{module:routeModule,exports:routeModule.exports,
  require:id=>id.endsWith('.css')?{}:Object.hasOwn(dependencies,id)?dependencies[id]:
    id==='react/jsx-runtime'?require(id):(()=>{throw Error('Unlisted route dependency '+id);})()});
const page=query=>routeModule.exports.default({searchParams:Promise.resolve(query)});
async function delivered(href){
  const tree=await page(queryOf(href));
  const frames=[...nodes(tree,'AtlasRuntimeFrame'),...nodes(tree,'HeadAtlasLinkedModel')];
  assert.equal(frames.length,1);
  const url=new URL(frames[0].props.src,'https://visible.example');
  return {url,entry:api.parseRegionalTourEntry(Object.fromEntries(url.searchParams))};
}

test('Representative regional first, middle and last step links reach the exact imported Atlas tour and stop',async()=>{
  assert(catalogue.available);assert.equal(catalogue.sourceRevision,revision);
  assert(catalogue.regions.length>1);
  for(const region of catalogue.regions){
    const tour=catalogue.tours.find(item=>item.regionId===region.id&&item.steps.length>=3);
    assert(tour,`Three-step representative in ${region.id}`);
    for(const index of new Set([0,Math.floor(tour.steps.length/2),tour.steps.length-1])){
      const href=api.regionalTourStepHref(tour,revision,index);
      assert(href,`${tour.id} step ${index+1}`);
      assert.deepEqual([...new URL(href,'https://visible.example').searchParams.keys()],
        ['region','regionalTour','tourRevision','tourSource','regionalStep']);
      const {url,entry}=await delivered(href);
      assert.deepEqual([...url.searchParams.keys()],
        ['region','regionalTour','tourRevision','tourSource','regionalStep']);
      assert.equal(url.searchParams.get('region'),region.id);
      assert.equal(url.searchParams.get('regionalStep'),String(index+1));
      assert.equal(entry.status,'requested');assert.equal(entry.stepIndex,index);
      const result=api.resolveRegionalTourEntry(catalog,region.id,revision,entry);
      assert.equal(result.status,'ready',`${tour.id} step ${index+1}`);
      assert.equal(result.tour.id,tour.id);assert.equal(result.tour.revision,tour.revision);
      assert.equal(result.stepIndex,index);
      assert.equal(result.tour.steps[index].title,tour.steps[index].title);
      assert(!url.searchParams.has('autoplay'));
      for(const privateKey of ['study','structure','source','url','privateStudy','scan','patient'])
        assert(!url.searchParams.has(privateKey));
    }
  }
});

test('A legacy tour URL still opens the tour without selecting or playing a stop',async()=>{
  const tour=catalogue.tours.find(item=>item.regionId==='thorax');assert(tour);
  const href=api.regionalTourEntryHref(tour,revision),{url,entry}=await delivered(href);
  assert.equal(url.searchParams.has('regionalStep'),false);
  assert.equal(entry.status,'requested');assert.equal(Object.hasOwn(entry,'stepIndex'),false);
  const result=api.resolveRegionalTourEntry(catalog,tour.regionId,revision,entry);
  assert.equal(result.status,'ready');assert.equal(result.tour.id,tour.id);
  assert.equal(Object.hasOwn(result,'stepIndex'),false);
  assert.equal(url.searchParams.has('autoplay'),false);
});

test('Malformed, duplicate, orphan and mixed-intent step requests stop at the website route',async()=>{
  const tour=catalogue.tours.find(item=>item.regionId==='thorax');assert(tour);
  const valid=queryOf(api.regionalTourStepHref(tour,revision,0));
  const invalid=[
    {regionalStep:'1'},
    {...valid,regionalStep:['1','1']},
    {...valid,regionalTour:[valid.regionalTour,valid.regionalTour]},
    {...valid,tourRevision:undefined},
    {...valid,tourSource:undefined},
    ...['','0','01','201','1.0','-1','1x'].map(regionalStep=>({...valid,regionalStep})),
    {...valid,study:'1',structure:'example-id',side:'right',source:'a'.repeat(64)},
    {...valid,headTour:'brainstem'},
    {...valid,headRevision:'a'.repeat(64)},
  ];
  for(const query of invalid)await assert.rejects(page(query),/NOT_FOUND/);
  for(const bad of [null,[],false])assert.equal(api.regionalTourEntrySuffix(bad),null);
  for(const index of [-1,tour.steps.length,200,0.5,NaN])
    assert.equal(api.regionalTourStepHref(tour,revision,index),null);
});

test('Only bounded tour fields cross the route; changed source and out-of-tour ordinals never substitute',async()=>{
  const tour=catalogue.tours.find(item=>item.regionId==='thorax');assert(tour);
  const href=api.regionalTourStepHref(tour,revision,0);
  const extra=await delivered(href+'&privateStudy=secret&url=https%3A%2F%2Fprivate.invalid&autoplay=1');
  assert.deepEqual([...extra.url.searchParams.keys()],
    ['region','regionalTour','tourRevision','tourSource','regionalStep']);
  const stale={...queryOf(href),tourSource:'0'.repeat(40)};
  const staleDelivered=await delivered('/atlas/3d?'+new URLSearchParams(stale));
  assert.equal(api.resolveRegionalTourEntry(catalog,tour.regionId,revision,staleDelivered.entry).status,'rejected');
  const outside={...queryOf(href),regionalStep:String(tour.steps.length+1)};
  assert(Number(outside.regionalStep)<=200);
  const outsideDelivered=await delivered('/atlas/3d?'+new URLSearchParams(outside));
  const result=api.resolveRegionalTourEntry(catalog,tour.regionId,revision,outsideDelivered.entry);
  assert.deepEqual(result,{status:'rejected',reason:'unavailable'});
  const changed={...queryOf(href),tourRevision:'obsolete'};
  const changedDelivered=await delivered('/atlas/3d?'+new URLSearchParams(changed));
  assert.equal(api.resolveRegionalTourEntry(catalog,tour.regionId,revision,changedDelivered.entry).status,'rejected');
});
