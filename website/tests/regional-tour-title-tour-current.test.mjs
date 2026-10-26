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
  '../../../components/AtlasWorkspaceNavigation':{AtlasWorkspaceNavigation:'AtlasWorkspaceNavigation'},
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
    const links=walk(tree,'a');assert(links.length>0&&links.length<=6);
    for(const link of links){assert.equal(words(link),'Open tour');assert.equal(link.props.onClick,undefined);assert.equal(link.props.target,undefined);const query=params(link.props.href);assert.equal(query.tourSource,revision);assert.equal(query.autoplay,undefined);visited.push(query.regionalTour);}
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
test('Current a01 head/source/access contracts bind the exact78fb predecessor and complete current Review',()=>{
  const receiptPath=process.env.VM_CURRENT_SOURCE_RECEIPT,receiptSha=process.env.VM_CURRENT_SOURCE_SHA256;
  assert(receiptPath&&/^[a-f0-9]{64}$/.test(receiptSha??''),'Exact current source receipt required');
  const sha=b=>createHash('sha256').update(b).digest('hex'),bytes=fs.readFileSync(receiptPath);assert.equal(sha(bytes),receiptSha);const source=JSON.parse(bytes);
  assert.equal(source.atlasHead,'a01ea4a00740dee0905204a33893761b8ae1ff1e');assert.equal(fs.realpathSync(source.website),fs.realpathSync(process.cwd()));
  assert.equal(source.parentSha256,'78fb4e35a0c9a20347232edfd881f4aeb19ad280fe0d1c6523e699c3496876c1');const parentBytes=fs.readFileSync(source.parent);assert.equal(sha(parentBytes),source.parentSha256);const parent=JSON.parse(parentBytes),rows=new Map(source.sourceRows.map(r=>[r.path,r]));
  const read=p=>{const bytes=fs.readFileSync(p);assert.equal(sha(bytes),rows.get(p)?.sha256,p);return bytes;};
  read('tests/regional-tour-title-tour-current.test.mjs');
  for(const p of ['components/HeadAtlasLearningLibrary.tsx','lib/head-atlas-learning.ts','lib/head-atlas-links.ts','lib/regional-learning-catalogue.ts','package.json','package-lock.json','LICENSES/THIRD_PARTY_NOTICES.md','scripts/bind-clinical-review.mjs'])assert.equal(sha(read(p)),parent.sourceRows.find(r=>r.path===p).sha256,p);
  const oldInventory=fs.readFileSync(parent.website+'/lib/atlas-model-inventory.json'),newInventory=read('lib/atlas-model-inventory.json');assert.equal(sha(oldInventory),parent.sourceRows.find(r=>r.path==='lib/atlas-model-inventory.json').sha256);assert.deepEqual(JSON.parse(newInventory).models,JSON.parse(oldInventory).models);
  const policy=read('lib/atlas-delivery-policy.ts').toString(),oldPolicy=fs.readFileSync(parent.website+'/lib/atlas-delivery-policy.ts','utf8');assert.equal(sha(Buffer.from(oldPolicy)),parent.sourceRows.find(r=>r.path==='lib/atlas-delivery-policy.ts').sha256);assert.equal(policy.split(sha(newInventory)).length,2);assert.equal(policy.replace(sha(newInventory),sha(oldInventory)),oldPolicy);
  const binding=JSON.parse(read('atlas-review/integration-inputs.json'));assert.equal(binding.sourceCommit,revision);assert.equal(binding.sourceCommit,source.atlasHead);assert.equal(binding.inputs.length,1818);assert.equal(binding.inputs.length,source.protectedReviewInputs);assert.equal(binding.sha256,sha(JSON.stringify(binding.inputs)));assert.equal(binding.sha256,source.reviewBindingSha256);for(const row of binding.inputs)assert.equal(sha(read(row.path)),row.sha256,row.path);
  const viewer=JSON.parse(read('public/atlas-review-viewer/manifest.json'));assert.equal(viewer.websiteIntegrationSha256,binding.sha256);assert.equal(viewer.sourceCommit,source.atlasHead);assert.equal(viewer.personalRecordsIncluded,false);assert.equal(viewer.mode,'production');
});
