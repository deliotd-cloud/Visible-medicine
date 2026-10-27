import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const {transformSync}=require('esbuild');
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const jsx=require('react/jsx-runtime');
function load(path,deps={}){
  const source=readFileSync(new URL(path,import.meta.url),'utf8');
  const code=transformSync(source,{loader:path.endsWith('.tsx')?'tsx':'ts',format:'cjs',jsx:'automatic'}).code;
  const module={exports:{}};
  new Function('require','module','exports',code)(id=>{
    if(id==='react/jsx-runtime')return jsx;
    if(id.endsWith('.css'))return {};
    if(Object.hasOwn(deps,id))return deps[id];
    throw Error(`Unexpected dependency ${id}`);
  },module,module.exports);
  return module.exports;
}
function elements(node,predicate){
  if(Array.isArray(node))return node.flatMap(child=>elements(child,predicate));
  if(!React.isValidElement(node))return [];
  return [...(predicate(node)?[node]:[]),...elements(node.props.children,predicate)];
}
const parse=load('../lib/head-learning-discovery.ts').parseHeadLearningDiscovery;
const regions=['head-neck','abdomen'];

test('catalogue accepts only bounded, singular page numbers and public filters',()=>{
  assert.deepEqual(parse({view:'3D',q:'  arm  ',region:'abdomen',headPage:'2',regionalPage:'1000'},regions),
    {view:'3D',query:'arm',region:'abdomen',headPage:2,regionalPage:1000});
  for(const value of ['0','-1','01','1.5','1e2',' 2','1001','999999999999',['1','2'],'']){
    assert.equal(parse({headPage:value},regions),null,JSON.stringify(value));
    assert.equal(parse({regionalPage:value},regions),null,JSON.stringify(value));
  }
  for(const bad of [{region:'unknown'},{headPage:'2',case:'private'},{regionalPage:'2',returnTo:'/atlas/ct-head'},
    {view:['CT','MRI']},{q:['arm','leg']},{headPage:undefined},{regionalPage:undefined}])assert.equal(parse(bad,regions),null,JSON.stringify(bad));
  assert.deepEqual(parse({},regions),{view:'all',query:''});
  const inherited=Object.create({headPage:'7',regionalPage:'8'});
  assert.deepEqual(parse(inherited,regions),{view:'all',query:''});
});

test('server catalogue seeds independent page requests and native filter submissions reset both',async()=>{
  const Link=({href,children,...props})=>React.createElement('a',{href,...props},children);
  const Head=()=>null,Regional=()=>null;
  const page=load('../app/atlas/guided-learning/page.tsx',{
    'next/link':{__esModule:true,default:Link},'next/navigation':{notFound(){throw Error('not found');}},
    '../../../components/HeadAtlasLearningLibrary':{HeadAtlasLearningLibrary:Head},
    '../../../components/RegionalLearningCatalogue':{RegionalLearningCatalogue:Regional},
    '../../../lib/regional-learning-catalogue':{regionalLearningCatalogue:()=>({available:true,tours:[]})},
    '../../../lib/atlas-navigation':{atlasBodyRegions:[{id:'head-neck',label:'Head and neck',href:'/atlas/head-neck-3d'}]},
    '../../../lib/head-learning-discovery':{parseHeadLearningDiscovery:parse},
  }).default;
  const tree=await page({searchParams:Promise.resolve({view:'all',q:'pons',region:'head-neck',headPage:'3',regionalPage:'2'})});
  const head=elements(tree,e=>e.type===Head)[0],regional=elements(tree,e=>e.type===Regional)[0];
  assert.equal(head.props.initialPage,3);assert.equal(regional.props.initialPage,2);
  assert.equal(head.props.catalogueSearch,regional.props.catalogueSearch);
  assert.deepEqual([...new URLSearchParams(head.props.catalogueSearch)],[['view','all'],['q','pons'],['region','head-neck'],['headPage','3'],['regionalPage','2']]);
  const form=elements(tree,e=>e.type==='form'&&e.props.role==='search')[0];
  assert.equal(elements(form,e=>e.type==='input'&&e.props.name==='headPage').length,0);
  assert.equal(elements(form,e=>e.type==='input'&&e.props.name==='regionalPage').length,0);
  assert.equal(elements(form,e=>e.type==='button'&&e.props.name==='view').length,5);
  const firstPage=await page({searchParams:Promise.resolve({view:'all',regionalPage:'1'})});
  assert.equal(elements(firstPage,e=>e.type==='details'&&e.props.className==='atlas-guided-regions')[0].props.open,true);
  const noPage=await page({searchParams:Promise.resolve({view:'all'})});
  assert.equal(elements(noPage,e=>e.type==='details'&&e.props.className==='atlas-guided-regions')[0].props.open,false);
});

const mockReact={...React,useState(initial){return [typeof initial==='function'?initial():initial,()=>{}];},useRef(initial){return {current:initial};}};
const regionalTours=Array.from({length:13},(_,index)=>({id:`tour-${index+1}`,title:`Tour ${index+1}`,description:'Sample',regionId:'head-neck',regionLabel:'Head',steps:[],href:`/atlas/head-neck-3d?tour=tour-${index+1}`,revision:'rev'}));
const Regional=load('../components/RegionalLearningCatalogue.tsx',{
  react:mockReact,'../lib/regional-tour-entry-navigation':{regionalTourEntryHref:tour=>tour.href,regionalTourRegionHref:()=>'/atlas/head-neck-3d'},
}).RegionalLearningCatalogue;
function regional(page,query=''){
  const catalogue={available:true,sourceRevision:'rev',unavailableTours:0,regions:[],tours:regionalTours};
  return Regional({catalogue,initialQuery:query,fixedQuery:true,initialRegion:'all',fixedRegion:true,initialPage:page,
    catalogueSearch:'view=all&headPage=2&regionalPage=99'});
}
test('regional page clamps to filtered range and links preserve the head page',()=>{
  const tree=regional(99),html=renderToStaticMarkup(tree);
  assert.match(html,/Page 3 of 3/);assert.match(html,/showing 13–13 of 13/);
  assert.match(html,/Tour 13/);assert.doesNotMatch(html,/Tour 12/);
  const previous=elements(tree,e=>e.type==='a'&&e.props['aria-label']?.startsWith('Previous regional tour page'))[0];
  assert.equal(new URL(previous.props.href,'https://example.invalid').hash,'#regional-tour-results');
  assert.deepEqual([...new URL(previous.props.href,'https://example.invalid').searchParams],[['view','all'],['headPage','2'],['regionalPage','2']]);
  assert.equal(elements(tree,e=>e.type==='p'&&e.props.id==='regional-tour-results')[0].props.tabIndex,-1);
  const second=regional(2);
  const backToOne=elements(second,e=>e.type==='a'&&e.props['aria-label']?.startsWith('Previous regional tour page'))[0];
  assert.equal(new URL(backToOne.props.href,'https://example.invalid').searchParams.get('regionalPage'),'1');
  const empty=renderToStaticMarkup(regional(99,'absent'));
  assert.match(empty,/showing 0–0 of 0/);assert.doesNotMatch(empty,/regional tour page, page/);
  assert.match(renderToStaticMarkup(regional(1)),/Tour 1/);
  assert.match(renderToStaticMarkup(regional(-2)),/showing 1–6 of 13/);
  assert.match(renderToStaticMarkup(regional(Infinity)),/showing 1–6 of 13/);
  assert.match(renderToStaticMarkup(regional(1.5)),/showing 1–6 of 13/);
});

const groups=['headLearningSequences','headMriLearningSequences','headInsulaLearningSequences','headOrbitalLearningSequences','headCtBoneLearningSequences','headCerebellarLearningSequences','headCtFacialLearningSequences'];
const paths=['../lib/head-atlas-learning','../lib/head-mri-learning','../lib/head-insula-learning','../lib/head-orbital-learning','../lib/head-ct-bone-learning','../lib/head-cerebellar-learning.ts','../lib/head-ct-facial-learning.ts'];
const revisions=['HEAD_LEARNING_REVISION','HEAD_MRI_LEARNING_REVISION','HEAD_INSULA_LEARNING_REVISION','HEAD_ORBITAL_LEARNING_REVISION','HEAD_CT_BONE_LEARNING_REVISION','HEAD_CEREBELLAR_LEARNING_REVISION','HEAD_CT_FACIAL_LEARNING_REVISION'];
const deps={react:mockReact,'./HeadLearningBookmark':{HeadLearningBookmark:()=>null},
  '../lib/head-guided-comparison.ts':{headGuidedComparisonForStep:()=>null},
  '../lib/head-image-only-links.ts':{headImageConceptById:id=>({label:id})},
  '../lib/head-link-availability.ts':{headLinksCurrent:()=>true,HEAD_LINK_REVISION_NOTICE:'stale'}};
for(let i=0;i<paths.length;i++)deps[paths[i]]={[groups[i]]:i===0?Array.from({length:13},(_,n)=>({id:`head-${n+1}`,label:`Head ${n+1}`,concepts:[`step-${n+1}`]})):[],[revisions[i]]:'rev'};
deps[paths[0]].headLearningLinks=({sequenceId})=>({atlasHref:`/atlas/head-neck-3d?headTour=${sequenceId}&headStep=0`,ctHref:`/atlas/ct-head?headTour=${sequenceId}&headStep=0`});
const Head=load('../components/HeadAtlasLearningLibrary.tsx',deps).HeadAtlasLearningLibrary;
test('head page clamps, retains regional page and leaves exact tour links intact',()=>{
  const tree=Head({compact:true,fixedView:true,fixedQuery:true,initialQuery:'Head',initialPage:99,catalogueSearch:'view=all&q=Head&regionalPage=2&headPage=99'});
  const html=renderToStaticMarkup(tree);
  assert.match(html,/Showing linked tours 13–13 of 13/);assert.match(html,/Page 3 of 3/);
  assert.match(html,/href="\/atlas\/ct-head\?headTour=head-13&amp;headStep=0"/);
  const previous=elements(tree,e=>e.type==='a'&&e.props['aria-label']?.startsWith('Previous linked tours'))[0];
  assert.equal(new URL(previous.props.href,'https://example.invalid').hash,'#linked-tour-results');
  assert.deepEqual([...new URL(previous.props.href,'https://example.invalid').searchParams],[['view','all'],['q','Head'],['regionalPage','2'],['headPage','2']]);
  assert.equal(elements(tree,e=>e.type==='p'&&e.props.id==='linked-tour-results')[0].props.tabIndex,-1);
  const empty=renderToStaticMarkup(Head({compact:true,fixedView:true,fixedQuery:true,initialQuery:'absent',initialPage:99,catalogueSearch:'view=all&q=absent&regionalPage=2&headPage=99'}));
  assert.match(empty,/No linked tours match/);assert.doesNotMatch(empty,/Linked head tour pages/);
  for(const initialPage of [-1,NaN,Infinity,1.5]){
    const safe=renderToStaticMarkup(Head({compact:true,fixedView:true,fixedQuery:true,initialPage,catalogueSearch:'view=all&regionalPage=2'}));
    assert.match(safe,/Showing linked tours 1–6 of 13/);
  }
});
