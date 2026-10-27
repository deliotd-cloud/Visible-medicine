import assert from 'node:assert/strict';import fs from 'node:fs';import {createRequire} from 'node:module';import {runInNewContext} from 'node:vm';import {test} from 'node:test';import {build} from 'esbuild';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),React=require('react'),ts=require('typescript');
const bundle=await build({stdin:{contents:`export * from './lib/regional-tour-entry-navigation';
export {regionalLearningCatalogue} from './lib/regional-learning-catalogue';
export {parseRegionalTourEntry,resolveRegionalTourEntry} from './atlas-review/lib/regional-tour-entry';
export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';
export {default as raw} from './atlas-review/public/models/bodyparts3d/full-body/catalog.json';
export {atlasStudySuffix} from './lib/atlas-study-transport';export {atlasReferenceRevisionCurrent} from './lib/atlas-reference-revision';
export {selectedBodyRegion} from './lib/atlas-navigation';export {hasHeadLearningQuery} from './lib/head-atlas-learning';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',alias:{'@':process.cwd()}});
const api=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const catalogue=api.regionalLearningCatalogue(),catalog=api.bodyDisplayCatalog(api.raw),revision=JSON.parse(fs.readFileSync('public/atlas-runtime/head-neck/manifest.json')).sourceCommit;
const params=href=>Object.fromEntries(new URL(href,'https://visible.example').searchParams);
const walk=(node,type)=>!node||typeof node!=='object'?[]:Array.isArray(node)?node.flatMap(n=>walk(n,type)):[...(node.type===type?[node]:[]),...walk(node.props?.children,type)];
const words=node=>typeof node==='string'||typeof node==='number'?String(node):!node?'':Array.isArray(node)?node.map(words).join(''):words(node.props?.children);
const routeFile='app/atlas/3d/page.tsx',routeCode=ts.transpileModule(fs.readFileSync(routeFile,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,resolveJsonModule:true}}).outputText;
const routeModule={exports:{}};
const deps={
  '../../../components/AtlasRuntimeFrame':{AtlasRuntimeFrame:'AtlasRuntimeFrame'},
  '../../../components/AtlasRegionalNavigation':{AtlasRegionalNavigation:'AtlasWorkspaceNavigation'},
  '../../../components/HeadAtlasLinkedModel':{HeadAtlasLinkedModel:'HeadAtlasLinkedModel'},
  '../../../lib/atlas-navigation':api,'../../../lib/atlas-study-transport':api,
  '../../../lib/regional-tour-entry-navigation':api,'../../../lib/atlas-reference-revision':api,'../../../lib/head-atlas-learning':api,
  '../../../public/atlas-runtime/head-neck/manifest.json':{sourceCommit:revision},
  'next/link':{__esModule:true,default:'Link'},'next/navigation':{notFound(){throw Error('NOT_FOUND');},redirect(href){throw Error('REDIRECT:'+href);}},
};
runInNewContext(routeCode,{module:routeModule,exports:routeModule.exports,require:id=>id.endsWith('.css')?{}:Object.hasOwn(deps,id)?deps[id]:id==='react/jsx-runtime'?require(id):(()=>{throw Error('Unlisted route dependency '+id);})()});
const page=query=>routeModule.exports.default({searchParams:Promise.resolve(query)});

test('Every actually admitted catalogue tour roundtrips Website URL/route transport into the exact imported source resolver',async()=>{
  assert(catalogue.available);assert.equal(catalogue.sourceRevision,revision);assert(catalogue.tours.length>0);
  for(const tour of catalogue.tours){
    const href=api.regionalTourEntryHref(tour,revision);assert(href,tour.id);
    const query=params(href),tree=await page(query),frame=[...walk(tree,'AtlasRuntimeFrame'),...walk(tree,'HeadAtlasLinkedModel')];assert.equal(frame.length,1);
    const destination=new URL(frame[0].props.src,'https://visible.example');assert.equal(destination.searchParams.get('region'),tour.regionId);
    assert.deepEqual([...destination.searchParams.keys()],['region','regionalTour','tourRevision','tourSource']);
    const entry=api.parseRegionalTourEntry(Object.fromEntries(destination.searchParams));
    const result=api.resolveRegionalTourEntry(catalog,tour.regionId,revision,entry);assert.equal(result.status,'ready',tour.id);assert.equal(result.tour.id,tour.id);assert.equal(result.tour.revision,tour.revision);
    assert(!destination.searchParams.has('autoplay'));assert(!destination.searchParams.has('study'));
  }
});
test('Route rejects duplicate/partial intent, study collisions and linked-head collisions instead of dropping the tour',async()=>{
  const tour=catalogue.tours.find(t=>t.regionId==='thorax');assert(tour);const query=params(api.regionalTourEntryHref(tour,revision));
  for(const bad of [{...query,regionalTour:[query.regionalTour,query.regionalTour]},
    {...query,tourRevision:undefined},{...query,tourSource:'bad'},
    {...query,study:'1',structure:'test',side:'right',source:'a'.repeat(64)},
    {...query,headTour:'brainstem'},{...query,headRevision:'a'.repeat(64)},
    {...query,region:'unknown'}])await assert.rejects(page(bad),/NOT_FOUND/);
  const extra=await page({...query,privateStudy:'never-forward',url:'https://private.invalid',autoplay:'1'});
  const frame=walk(extra,'AtlasRuntimeFrame')[0];assert(!frame.props.src.includes('never-forward'));assert(!frame.props.src.includes('private'));assert(!frame.props.src.includes('autoplay'));
});
test('Normal region navigation and existing source-bound study transport keep their previous destinations',async()=>{
  await assert.rejects(page({region:'thorax'}),/REDIRECT:\/atlas\/thorax-3d/);
  const normal=await page({region:'leg'});assert.equal(walk(normal,'AtlasRuntimeFrame')[0].props.src,'/atlas-runtime/head-neck/index.html?region=leg');
  const study=await page({region:'thorax',study:'1',structure:'example-id',side:'right',source:'a'.repeat(64)});
  const frame=walk(study,'AtlasRuntimeFrame')[0];assert(frame.props.src.includes('study=1'));assert(!frame.props.src.includes('regionalTour'));
});
test('Runtime refuses stale source, stale tour, changed region and damaged target geometry without fallback',()=>{
  const tour=catalogue.tours.find(t=>t.regionId==='thorax');assert(tour);const query=params(api.regionalTourEntryHref(tour,revision)),entry=api.parseRegionalTourEntry(query);
  for(const [r,e] of [['thorax',{...entry,sourceRevision:'0'.repeat(40)}],['thorax',{...entry,revision:'obsolete'}],['abdomen',entry]])assert.equal(api.resolveRegionalTourEntry(catalog,r,revision,e).status,'rejected');
  const damaged={...catalog,structures:[]};assert.equal(api.resolveRegionalTourEntry(damaged,'thorax',revision,entry).status,'rejected');
  assert.deepEqual(api.resolveRegionalTourEntry(catalog,'thorax',revision,entry,true),{status:'rejected',reason:'busy'});
});

const uiBuild=await build({stdin:{contents:"export {RegionalLearningCatalogue} from './components/RegionalLearningCatalogue';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',packages:'external',loader:{'.css':'empty'}});
let hooks=[],cursor=0,fetches=0;
const uiModule={exports:{}},shim={...React,useState(initial){const i=cursor++;if(!(i in hooks))hooks[i]=typeof initial==='function'?initial():initial;return[hooks[i],next=>{hooks[i]=typeof next==='function'?next(hooks[i]):next;}];},useRef(){const i=cursor++;return hooks[i]??=( {current:null});}};
runInNewContext(uiBuild.outputFiles[0].text,{module:uiModule,exports:uiModule.exports,URLSearchParams,require:id=>id==='react'?shim:require(id),fetch(){fetches++;throw Error('No fetch allowed');}});
function render(data){cursor=0;return uiModule.exports.RegionalLearningCatalogue({catalogue:data});}
test('Actual compact catalogue opens exact tours with native links, no onClick/autoplay/fetch, preserving pagination',()=>{
  hooks=[];let tree=render(catalogue);const visited=[];
  for(let page=0;page<Math.ceil(catalogue.tours.length/6);page++){
    const visible=catalogue.tours.slice(page*6,(page+1)*6);
    const links=walk(tree,'a'),tourLinks=links.filter(link=>words(link)==='Open tour');
    const stepLinks=links.filter(link=>link.props.className==='regional-learning-step-link');
    assert.equal(tourLinks.length,visible.length);
    assert.equal(stepLinks.length,visible.reduce((count,tour)=>count+tour.steps.length,0));
    for(let i=0;i<visible.length;i++){
      const link=tourLinks[i],tour=visible[i],query=params(link.props.href);
      assert.equal(link.props.href,api.regionalTourEntryHref(tour,revision));
      assert.equal(link.props.onClick,undefined);assert.equal(link.props.target,undefined);
      assert.equal(query.tourSource,revision);assert.equal(query.autoplay,undefined);visited.push(query.regionalTour);
    }
    const expected=visible.flatMap(tour=>tour.steps.map((step,index)=>({tour,step,index})));
    for(let i=0;i<expected.length;i++){
      const link=stepLinks[i],{tour,step,index}=expected[i],query=params(link.props.href);
      assert.equal(words(link),step.title);
      assert.equal(link.props.href,api.regionalTourStepHref(tour,revision,index));
      assert.equal(link.props.onClick,undefined);assert.equal(link.props.target,undefined);
      assert.equal(query.region,tour.regionId);assert.equal(query.regionalTour,tour.id);
      assert.equal(query.tourRevision,tour.revision);assert.equal(query.tourSource,revision);
      assert.equal(query.regionalStep,String(index+1));assert.equal(query.autoplay,undefined);
    }
    const next=walk(tree,'button').find(b=>words(b)==='Next');if(next&&!next.props.disabled){next.props.onClick();tree=render(catalogue);}
  }
  assert.deepEqual(visited,catalogue.tours.map(t=>t.id));assert.equal(fetches,0);assert.match(words(tree),/Play full tour.*continuous playback/);assert.match(words(tree),/Start guided tour.*step-by-step/);
});
test('Canonical manual fallback is explicit; malformed destinations never create navigation links',()=>{
  const tour=catalogue.tours[0];hooks=[];let tree=render({...catalogue,sourceRevision:null,tours:[tour]});
  assert.equal(walk(tree,'a')[0].props.href,tour.href);assert.match(words(tree),/Choose Guided learning/);
  for(const href of ['javascript:alert(1)','https://foreign.invalid/atlas/3d','/atlas/3d?region=wrong']){hooks=[];tree=render({...catalogue,tours:[{...tour,href}]});assert.equal(walk(tree,'a').length,0);assert.match(words(tree),/destination is unavailable/);}
  for(const value of [null,[],false])assert.equal(api.regionalTourEntrySuffix(value),null);
});
test('Closed head/source/access contracts retain the original binder and inventory assertions',()=>{
  const receiptFile='F:/VisibleMedicine/staging/20261024-head-tools-proof/SOURCE_BOUND.json',receiptDigest='1071697c3bd7da15fa7b3daa563f4d55ce3d9b4ae1854d9eb36fe1790a6492e0',digest=b=>createHash('sha256').update(b).digest('hex');
  const receiptBytes=fs.readFileSync(receiptFile);assert.equal(digest(receiptBytes),receiptDigest);const receipt=JSON.parse(receiptBytes);const revision=receipt.atlasHead;
  const historicalRead=(p,encoding)=>{if(/^[A-Za-z]:/.test(p))return fs.readFileSync(p,encoding);const row=receipt.sourceRows.find(r=>r.path===p);assert(row,p);const bytes=fs.readFileSync(receipt.website+'/'+p);assert.equal(digest(bytes),row.sha256,p);return encoding?bytes.toString(encoding):bytes;};

  const path='F:/VisibleMedicine/staging/20261023-guided-region-website/SOURCE_BOUND.json',bytes=historicalRead(path),sha=v=>createHash('sha256').update(v).digest('hex');
  assert.equal(sha(bytes),'7a85dfdc8fb90e2a3a650166214ba8424e6e6f4b5eaf8b2fd5b6a5c23b76e8ff');const parent=JSON.parse(bytes);
  for(const p of ['components/HeadAtlasLearningLibrary.tsx','lib/head-atlas-learning.ts','lib/head-atlas-links.ts','lib/regional-learning-catalogue.ts','package.json','package-lock.json','LICENSES/THIRD_PARTY_NOTICES.md'])assert.equal(sha(historicalRead(p)),parent.sourceRows.find(r=>r.path===p).sha256,p);
  const binderPath='scripts/bind-clinical-review.mjs',oldBinder=historicalRead(parent.website+'/'+binderPath),newBinder=historicalRead(binderPath);
  assert.equal(sha(oldBinder),parent.sourceRows.find(r=>r.path===binderPath).sha256,'Exact historical binder at source receipt');
  const binderInsertion=`  // Independent unitless references use separate private assets and exact links.
  // Registry, routing, account gate and rendering adaptations all invalidate Review.
  'lib/clinical-review-reference-selection.ts','lib/clinical-review-reference-assets.json','lib/clinical-review-reference-registry.ts','lib/clinical-review-reference-delivery.ts',
  'app/api/atlas-delivery/references/[...asset]/route.ts','lib/clinical-review-server.ts','lib/clinical-review-access.ts','lib/atlas-static-boundary.ts','worker/index.ts',
  ...['reviews','body-review','body-review/decisions','nested-review','specimen-review','review-overview'].map(path=>'app/api/atlas-review/'+path+'/route.ts'),
  'vite.config.ts','scripts/local-atlas-development-plugin.mjs',
`;
  const comparisonInsertion="  // Exact concept/step new-tab actions retain the current native study.\n  'components/HeadSeparateComparisonLink.tsx','lib/head-separate-comparison.ts',\n";
  const completeBinderText=newBinder.toString();
  assert.equal(completeBinderText.split(comparisonInsertion).length,2,'One declared separate-comparison binder insertion');
  const binderText=completeBinderText.replace(comparisonInsertion,'');assert.equal(binderText.split(binderInsertion).length,2,'One declared FDA binder insertion');
  assert.equal(binderText.replace(binderInsertion,''),oldBinder.toString(),'Whole current binder inverses to exact historical binder');
  const oldInventory=historicalRead(parent.website+'/lib/atlas-model-inventory.json'),newInventory=historicalRead('lib/atlas-model-inventory.json');
  assert.deepEqual(JSON.parse(newInventory).models,JSON.parse(oldInventory).models);
  const before=historicalRead(parent.website+'/lib/atlas-delivery-policy.ts','utf8'),after=historicalRead('lib/atlas-delivery-policy.ts','utf8');
  assert.equal(after.split(sha(newInventory)).length,2);assert.equal(after.replace(sha(newInventory),sha(oldInventory)),before);
  const binding=JSON.parse(historicalRead('atlas-review/integration-inputs.json'));assert.equal(binding.sourceCommit,revision);
  assert.equal(binding.inputs.length,1783);assert.equal(binding.sha256,sha(JSON.stringify(binding.inputs)));
  for(const row of binding.inputs)assert.equal(sha(historicalRead(row.path)),row.sha256,row.path);
  const viewer=JSON.parse(historicalRead('public/atlas-review-viewer/manifest.json'));assert.equal(viewer.websiteIntegrationSha256,binding.sha256);assert.equal(viewer.personalRecordsIncluded,false);assert.equal(viewer.mode,'production');
});

test('Historical coccygeus seam stays sealed; current delivery and head/access files match the verified step proposal',async()=>{
  const {assertSealedCurrentHeadFeatureDelivery}=await import('./head-feature-source-roles.mjs');
  // This helper authenticates the historical a9 admission using its own sealed source role.
  const historical=assertSealedCurrentHeadFeatureDelivery();
  assert.equal(historical.source,'a9f5930a853bfb7b419ffd756bb29cefc174f3da');
  assert.throws(()=>assertSealedCurrentHeadFeatureDelivery({readActual:p=>p==='atlas-review/manifest.json'?Buffer.from('altered current source'):fs.readFileSync(p)}));

  const {validateCurrentAtlasDelivery}=await import('./current-atlas-delivery.mjs');
  const current=validateCurrentAtlasDelivery();
  assert.equal(current.source,revision);
  const file='F:/VisibleMedicine/staging/20261027-tour-step-website/SOURCE_PROPOSAL.json';
  const digest=b=>createHash('sha256').update(b).digest('hex'),bytes=fs.readFileSync(file);
  assert.equal(digest(bytes),'ee690e83da8c3a42a8da1a8439b36a60a3f398393308c0224ca4864b8c6fccb7');
  const parent=JSON.parse(bytes);
  assert.equal(parent.website,'F:/VisibleMedicine/staging/20261027-tour-step-website/website');
  // These paths were not changed by the native tour-step import. Bind both
  // source and current bytes to the already verified proposal, not a new baseline.
  for(const p of ['components/HeadAtlasLearningLibrary.tsx','lib/head-atlas-learning.ts','lib/head-atlas-links.ts','lib/regional-learning-catalogue.ts','scripts/bind-clinical-review.mjs','package.json','package-lock.json','LICENSES/THIRD_PARTY_NOTICES.md']){
    const row=parent.sourceRows.find(r=>r.path===p);assert(row,p);
    assert.equal(digest(fs.readFileSync(parent.website+'/'+p)),row.sha256,p+' proposal');
    assert.equal(digest(fs.readFileSync(p)),row.sha256,p+' integrated');
  }
});
