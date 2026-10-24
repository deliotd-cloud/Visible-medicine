import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {parseHeadLearningDiscovery} from '../lib/head-learning-discovery.ts';
import {atlasBodyRegions} from '../lib/atlas-navigation.ts';
import * as learning from '../lib/head-atlas-learning.ts';
import * as availability from '../lib/head-link-availability.ts';
import * as mriLearning from '../lib/head-mri-learning.ts';
import * as insulaLearning from '../lib/head-insula-learning.ts';
import * as orbitalLearning from '../lib/head-orbital-learning.ts';
import * as boneLearning from '../lib/head-ct-bone-learning.ts';
import * as cerebellarLearning from '../lib/head-cerebellar-learning.ts';
import * as headLinks from '../lib/head-atlas-links.ts';
import {atlasStudySuffix} from '../lib/atlas-study-transport.ts';
import * as lectureTour from '../lib/lecture-tour-context.ts';
import * as relatedLectures from '../lib/lecture-related-links.ts';

const require=createRequire(import.meta.url);
type Props={children?:React.ReactNode;[key:string]:any};
type Element=React.ReactElement<Props>;
const Link=({href,children,prefetch:_,...props}:Props)=>React.createElement('a',{href,...props},children);
const RegionalCatalogue=()=>null;
const regionalCatalogueData={available:true,sourceRevision:'9fba9a1e24b6669aafd48e945d55fc0939d50ab2',unavailableTours:0,regions:[],tours:[]};

function component(path:string,dependencies:Record<string,unknown>={}){
  const source=readFileSync(new URL(path,import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const module={exports:{} as Record<string,any>};
  const integrationDependencies={
    '../../../components/RegionalLearningCatalogue':{RegionalLearningCatalogue:RegionalCatalogue},
    '../../../lib/regional-learning-catalogue':{regionalLearningCatalogue:()=>regionalCatalogueData},
    ...dependencies,
  };
  new Function('require','module','exports',code)((id:string)=>integrationDependencies[id as keyof typeof integrationDependencies]??(id.endsWith('.css')?{}:require(id)),module,module.exports);
  return module.exports;
}

function findAll(node:React.ReactNode,predicate:(element:Element)=>boolean):Element[]{
  if(Array.isArray(node))return node.flatMap(item=>findAll(item,predicate));
  if(!React.isValidElement<Props>(node))return [];
  return [...(predicate(node)?[node]:[]),...findAll(node.props.children,predicate)];
}

function library(initialView:'all'|'3D'|'CT'|'MRI'='all',initialQuery='',current=true){
  const state:unknown[]=[];let hook=0;
  const reactMock={...React,
    useState<T>(initial:T){const slot=hook++;if(!(slot in state))state[slot]=initial;
      return [state[slot] as T,(next:T)=>{state[slot]=next;}];},
    useRef<T>(initial:T){return {current:initial};},
  };
  const mod=component('../components/HeadAtlasLearningLibrary.tsx',{
    react:reactMock,
    './HeadLearningBookmark':{HeadLearningBookmark:()=>null},
    '../lib/head-atlas-learning':learning,
    '../lib/head-link-availability.ts':{...availability,headLinksCurrent:()=>current},
    '../lib/head-mri-learning':mriLearning,
    '../lib/head-insula-learning':insulaLearning,
    '../lib/head-orbital-learning':orbitalLearning,
    '../lib/head-ct-bone-learning':boneLearning,
    '../lib/head-cerebellar-learning.ts':cerebellarLearning,
  });
  hook=0;
  const tree=mod.HeadAtlasLearningLibrary({initialView,initialQuery}) as React.ReactNode;
  return {tree,html:renderToStaticMarkup(tree)};
}

function links(html:string){
  return [...html.matchAll(/<a\s+[^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/g)]
    .map(match=>({href:match[1].replaceAll('&amp;','&'),text:match[2]}));
}

test('discovery URL parser accepts only normalized view and bounded query',()=>{
  assert.deepEqual(parseHeadLearningDiscovery({}),{view:'all',query:''});
  assert.deepEqual(parseHeadLearningDiscovery({view:'CT',q:'  pons    right  '}),{view:'CT',query:'pons right'});
  assert.deepEqual(parseHeadLearningDiscovery({view:'MRI',q:''}),{view:'MRI',query:''});
  assert.deepEqual(parseHeadLearningDiscovery({view:undefined,q:undefined}),{view:'all',query:''});
  for(const bad of [
    {view:''},{view:'ct'},{view:'PET'},{view:['CT','MRI']},{q:['pons','medulla']},
    {view:'CT',headTour:'brainstem'},{q:'pons',source:'folder'},{q:'x'.repeat(121)},
    {q:'pons\u0000'},{q:'pons\u001f'},{q:'pons\u007f'},
  ])assert.equal(parseHeadLearningDiscovery(bad),null,JSON.stringify(bad));
});

test('dedicated page passes validated URL filters and remount key; invalid input reaches notFound',async()=>{
  const sentinel=new Error('not found');
  const Library=()=>null;
  const page=component('../app/atlas/guided-learning/page.tsx',{
    'next/navigation':{notFound:()=>{throw sentinel;}},
    'next/link':{__esModule:true,default:Link},
    '../../../components/HeadAtlasLearningLibrary':{HeadAtlasLearningLibrary:Library},
    '../../../lib/head-learning-discovery':{parseHeadLearningDiscovery},
    '../../../lib/head-learning-discovery.ts':{parseHeadLearningDiscovery},
    '../../../lib/atlas-navigation':{atlasBodyRegions},
    '../../../lib/atlas-navigation.ts':{atlasBodyRegions},
  });
  const show=async(params:Record<string,string|string[]|undefined>)=>page.default({searchParams:Promise.resolve(params)}) as Promise<React.ReactNode>;
  const first=findAll(await show({view:'MRI',q:'  PONS   right '}),element=>element.type===Library);
  assert.equal(first.length,1);
  assert.deepEqual({view:first[0].props.initialView,query:first[0].props.initialQuery,key:first[0].key},
    {view:'MRI',query:'PONS right',key:JSON.stringify({view:'MRI',query:'PONS right'})});
  const second=findAll(await show({view:'CT',q:'pons'}),element=>element.type===Library);
  assert.equal(second.length,1);
  assert.notEqual(first[0].key,second[0].key);
  await assert.rejects(show({view:'bad'}),error=>error===sentinel);
  await assert.rejects(show({q:'pons',folder:'private'}),error=>error===sentinel);
});

test('discovery page offers all existing regional 3D tours as collapsed navigation',async()=>{
  const page=component('../app/atlas/guided-learning/page.tsx',{
    'next/navigation':{notFound:()=>{throw Error('unexpected notFound');}},
    'next/link':{__esModule:true,default:Link},
    '../../../components/HeadAtlasLearningLibrary':{HeadAtlasLearningLibrary:()=>null},
    '../../../lib/head-learning-discovery':{parseHeadLearningDiscovery},
    '../../../lib/head-learning-discovery.ts':{parseHeadLearningDiscovery},
    '../../../lib/atlas-navigation':{atlasBodyRegions},
    '../../../lib/atlas-navigation.ts':{atlasBodyRegions},
  });
  const html=renderToStaticMarkup(await page.default({searchParams:Promise.resolve({})}));
  assert.match(html,/<details[^>]*><summary>Regional and whole-body 3D tours/);
  assert.doesNotMatch(html,/<details[^>]*\sopen(?:\s|=|>)/);
  for(const region of atlasBodyRegions){
    assert(html.includes(`href="${region.href.replaceAll('&','&amp;')}"`),region.id);
    assert(html.includes(region.label.replaceAll('&','&amp;')),region.id);
  }
  assert.match(html,/Open a region, then choose <strong>Guided learning<\/strong>/i);
});

test('regional catalogue receives normalized search only for all/3D and opens explicitly for3D',async()=>{
  let reads=0;
  const page=component('../app/atlas/guided-learning/page.tsx',{
    'next/navigation':{notFound:()=>{throw Error('unexpected notFound');}},
    'next/link':{__esModule:true,default:Link},
    '../../../components/HeadAtlasLearningLibrary':{HeadAtlasLearningLibrary:()=>null},
    '../../../lib/head-learning-discovery':{parseHeadLearningDiscovery},
    '../../../lib/atlas-navigation':{atlasBodyRegions},
    '../../../lib/regional-learning-catalogue':{regionalLearningCatalogue:()=>{reads++;return regionalCatalogueData;}},
  });
  for(const view of ['all','3D','CT','MRI']){
    const before=reads;
    const tree=await page.default({searchParams:Promise.resolve({view,q:'  pons   right '})});
    const regional=findAll(tree,element=>element.type===RegionalCatalogue);
    const expected=view==='all'||view==='3D';
    assert.equal(regional.length,expected?1:0);
    assert.equal(reads-before,expected?1:0,'imaging-filtered pages do not resolve the3D catalogue');
    if(expected){assert.equal(regional[0].props.catalogue,regionalCatalogueData);assert.equal(regional[0].props.initialQuery,'pons right');}
    const disclosure=findAll(tree,element=>element.type==='details'&&element.props.className==='atlas-guided-regions');
    assert.equal(disclosure.length,1);assert.equal(disclosure[0].props.open,view==='all'||view==='3D');
  }
});

test('URL seeded library keeps canonical starts, step positions, and modality limits',()=>{
  for(const view of ['CT','MRI'] as const){
    const {tree,html}=library(view,'PONS');
    const controls=findAll(tree,element=>element.type==='select'||element.type==='input');
    assert.equal(controls.find(element=>element.type==='select')?.props.value,view);
    assert.equal(controls.find(element=>element.type==='input')?.props.value,'PONS');
    const expected=learning.headLearningLinks({sequenceId:'brainstem',conceptId:'brainstem-midbrain'});
    const matching=learning.headLearningLinks({sequenceId:'brainstem',conceptId:'brainstem-pons'});
    assert(expected&&matching);
    const hrefs=links(html).map(link=>link.href);
    assert(hrefs.includes(view==='CT'?expected.ctHref!:expected.mriHref!));
    assert(hrefs.includes(view==='CT'?matching.ctHref!:matching.mriHref!));
    assert(hrefs.every(href=>!href.startsWith('/atlas/head-neck-3d')));
    for(const href of hrefs){
      const url=new URL(href,'https://example.invalid');
      assert.equal(url.searchParams.get('headRevision'),new URL(view==='CT'?expected.ctHref!:expected.mriHref!,'https://example.invalid').searchParams.get('headRevision'));
      assert.deepEqual(learning.parseHeadLearningIntent(url.searchParams,'image'),
        {sequenceId:'brainstem',conceptId:url.searchParams.get('concept')});
    }
  }
  const ct=library('CT','parietal bone').html;
  const mri=library('MRI','parietal bone').html;
  assert.match(ct,/CT-only bone coverage/);
  assert.doesNotMatch(mri,/CT-only bone coverage/);
  const mriOnly=library('MRI','amygdala').html;
  const ctOnly=library('CT','amygdala').html;
  assert.match(mriOnly,/MRI-only comparisons/);
  assert.doesNotMatch(ctOnly,/MRI-only comparisons/);
  const defaultView=library();
  assert.equal(findAll(defaultView.tree,e=>e.type==='select')[0].props.value,'all');
  assert.equal(findAll(defaultView.tree,e=>e.type==='input')[0].props.value,'');
  assert.match(defaultView.html,/13 linked tours available/);
});

test('3D head host offers guided catalogue outside the model lifecycle and preserves the current study',async()=>{
  for(const liveState of ['connecting','ready','unavailable','practice']){
    const page=component('../app/atlas/head-neck-3d/page.tsx',{
      'next/link':{__esModule:true,default:Link},
      'next/navigation':{notFound:()=>{throw Error('unexpected notFound');}},
      '../../../components/AtlasWorkspaceNavigation':{AtlasWorkspaceNavigation:()=>null},
      '../../../components/HeadAtlasGuidedModel':{HeadAtlasGuidedModel:()=>null},
      '../../../components/HeadAtlasLinkedModel':{HeadAtlasLinkedModel:()=>React.createElement('p',{'data-model-state':liveState},liveState)},
      '../../../components/HeadAtlasLearningLibrary':{HeadAtlasLearningLibrary:()=>null},
      '../../../public/atlas-runtime/head-neck/manifest.json':{default:JSON.parse(readFileSync(new URL('../public/atlas-runtime/head-neck/manifest.json',import.meta.url),'utf8'))},
      '../../../lib/atlas-study-transport':{atlasStudySuffix},
      '../../../lib/head-atlas-links':headLinks,
      '../../../lib/head-atlas-learning':learning,
    });
    const tree=await page.default({searchParams:Promise.resolve({})}) as React.ReactNode;
    const headers=findAll(tree,e=>e.type==='header');assert.equal(headers.length,1);
    const entry=findAll(headers[0],e=>e.props.href==='/atlas/guided-learning?view=3D');
    assert.equal(entry.length,1,liveState);
    assert.equal(entry[0].props.target,'_blank');assert.equal(entry[0].props.rel,'noopener noreferrer');
    assert.equal(entry[0].props.prefetch,false);
    assert.equal(entry[0].props['aria-label'],'Find guided head tours (opens in a new tab)');
    const url=new URL(entry[0].props.href,'https://example.invalid');
    assert.deepEqual([...url.searchParams],[['view','3D']]);
    const html=renderToStaticMarkup(tree);assert(html.includes(`data-model-state="${liveState}"`));
    assert.match(html,/<header[^>]*>[\s\S]*href="\/atlas\/guided-learning\?view=3D"[\s\S]*<\/header>/);
  }
  const hrefs=links(library('3D','PONS').html).map(link=>link.href);
  assert(hrefs.length>0);assert(hrefs.every(href=>href.startsWith('/atlas/head-neck-3d?')));
  for(const href of hrefs){const url=new URL(href,'https://example.invalid');
    assert(learning.parseHeadLearningIntent(url.searchParams,'atlas'));
    assert.equal(url.searchParams.get('headRevision'),learning.headLearningPacket().headRevision);}
  assert.doesNotMatch(library('3D','pons',false).html,/<a |<nav|<details|<select|<input/);
});

test('stale head revision hides discovery targets even with URL seeded filters',()=>{
  const html=library('CT','pons',false).html;
  assert(html.includes(availability.HEAD_LINK_REVISION_NOTICE));
  assert.doesNotMatch(html,/<a |<nav|<details|<select|<input/);
});

test('Atlas hub links to discovery and CT/MRI guided context opens it in a separate tab',async()=>{
  const hub=component('../app/atlas/page.tsx',{
    'next/navigation':{redirect:()=>{throw Error('unexpected redirect');}},
    'next/link':{__esModule:true,default:Link},
    '../../lib/atlas-navigation':{legacyModalityHref:()=>null},
    '../../components/AtlasModalityCards':{AtlasModalityCards:()=>null,AtlasImageNotes:()=>null},
  });
  const html=renderToStaticMarkup(await hub.default({searchParams:Promise.resolve({})}));
  assert.match(html,/href="\/atlas\/guided-learning"/);

  const guided=component('../components/HeadAtlasGuidedLearning.tsx',{
    react:{...React,useEffect:()=>{},useLayoutEffect:()=>{},useRef:(value:unknown)=>({current:value}),useState:(value:unknown)=>[value,()=>{}]},
    'next/link':{__esModule:true,default:Link},
    '../lib/head-atlas-import':{HEAD_MANIFEST_SHA256:learning.headLearningPacket().headRevision},
    '../lib/head-atlas-learning':learning,
    '../lib/head-link-availability.ts':availability,
    '../lib/head-atlas-practice':{practiceEntries:()=>[]},
    '../lib/head-atlas-focus':{focusHeadLearningContent:()=>{}},
    '../lib/lecture-tour-context':lectureTour,
    '../lib/lecture-related-links':relatedLectures,
    './HeadAtlasTeaching':{HeadAtlasTeaching:()=>null},
    './HeadAtlasConceptTeaching':{HeadAtlasConceptTeaching:()=>null},
    './HeadLearningBookmark':{HeadLearningBookmark:()=>null},
  });
  for(const modality of ['CT','MRI'] as const){
    const tree=guided.HeadAtlasGuidedLearning({study:null,modality,position:{sequenceId:'brainstem',conceptId:null},onPositionChange:()=>{},onSelect:()=>{},onPractice:()=>{}});
    const discover=findAll(tree,e=>e.props.href===`/atlas/guided-learning?view=${modality}`);
    assert.equal(discover.length,1,modality);
    assert.equal(discover[0].props.target,'_blank');
    assert.equal(discover[0].props.prefetch,false);
    assert.equal(discover[0].props.rel,'noopener noreferrer');
  }
});

test('new discovery surface declares no upload, storage, or viewer bridge',()=>{
  for(const path of ['../app/atlas/guided-learning/page.tsx','../lib/head-learning-discovery.ts']){
    const source=readFileSync(new URL(path,import.meta.url),'utf8');
    assert.doesNotMatch(source,/\b(?:fetch|XMLHttpRequest|localStorage|sessionStorage|indexedDB|postMessage)\s*\(/);
  }
});
