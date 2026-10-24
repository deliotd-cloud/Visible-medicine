import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const websiteRequire=createRequire(import.meta.url);
const {transformSync}=websiteRequire('esbuild');
const React=websiteRequire('react');
const {renderToStaticMarkup}=websiteRequire('react-dom/server');
const jsxRuntime=websiteRequire('react/jsx-runtime');
const views=[['all','All tours'],['3D','3D Atlas'],['CT','CT'],['MRI','MRI']];
const sentinel=new Error('not found');

function loadTsx(path,dependencies){
  const source=readFileSync(new URL(path,import.meta.url),'utf8');
  const code=transformSync(source,{loader:'tsx',format:'cjs',jsx:'automatic'}).code;
  const module={exports:{}};
  new Function('require','module','exports',code)(id=>{
    if(id==='react/jsx-runtime')return jsxRuntime;
    if(id.endsWith('.css'))return {};
    if(Object.hasOwn(dependencies,id))return dependencies[id];
    if(id==='../lib/regional-tour-entry-navigation')return loadTsx('../lib/regional-tour-entry-navigation.ts',{'./atlas-navigation':loadTsx('../lib/atlas-navigation.ts',{})});
    throw Error(`Unexpected dependency: ${id}`);
  },module,module.exports);
  return module.exports;
}

function elements(node,predicate){
  if(Array.isArray(node))return node.flatMap(child=>elements(child,predicate));
  if(!React.isValidElement(node))return [];
  return [...(predicate(node)?[node]:[]),...elements(node.props.children,predicate)];
}

const parser=loadTsx('../lib/head-learning-discovery.ts',{}).parseHeadLearningDiscovery;
const Link=({href,children,...props})=>React.createElement('a',{href,...props},children);
const Library=()=>null;
const RegionalCatalogue=()=>null;
const page=loadTsx('../app/atlas/guided-learning/page.tsx',{
  'next/link':{__esModule:true,default:Link},
  'next/navigation':{notFound:()=>{throw sentinel;}},
  '../../../components/HeadAtlasLearningLibrary':{HeadAtlasLearningLibrary:Library},
  '../../../components/RegionalLearningCatalogue':{RegionalLearningCatalogue:RegionalCatalogue},
  '../../../lib/regional-learning-catalogue':{regionalLearningCatalogue:()=>({regions:[],tours:[]})},
  '../../../lib/atlas-navigation':{atlasBodyRegions:[]},
  '../../../lib/head-learning-discovery':{parseHeadLearningDiscovery:parser},
});
const show=params=>page.default({searchParams:Promise.resolve(params)});

test('shared GET search and view buttons submit live q with exact selected view',async()=>{
  for(const current of views.map(([value])=>value)){
    const tree=await show({view:current,q:'  Pons   &   right  '});
    const [form]=elements(tree,e=>e.type==='form'&&e.props.role==='search');
    assert(form,current);
    assert.equal(form.props.action,'/atlas/guided-learning');
    assert.equal(form.props.method.toLowerCase(),'get');
    const [query]=elements(form,e=>e.type==='input'&&e.props.name==='q');
    assert(query);
    assert.equal(query.props.defaultValue,'Pons & right');
    assert.equal(query.props.maxLength,120);
    assert.equal(query.props.onChange,undefined,'native input holds the live typed value');
    const [search]=elements(form,e=>e.type==='button'&&e.props.children==='Search');
    assert(search);
    assert.equal(search.props.type,'submit');
    assert.equal(search.props.name,'view');
    assert.equal(search.props.value,current);
    const [nav]=elements(form,e=>e.type==='nav'&&e.props['aria-label']==='Guided learning views');
    assert(nav);
    const buttons=elements(nav,e=>e.type==='button');
    assert.equal(buttons.length,4,current);
    for(const [index,[view,label]] of views.entries()){
      const button=buttons[index];
      assert.equal(button.props.children,label);
      assert.equal(button.props.type,'submit');
      assert.equal(button.props.name,'view');
      assert.equal(button.props.value,view);
      assert.equal(button.props['aria-current'],view===current?'page':undefined);
      assert.equal(button.props.onClick,undefined,'view switch uses native form submission');
      const submitted=new URLSearchParams([[query.props.name,'new typed search'],[button.props.name,button.props.value]]);
      assert.deepEqual([...submitted],[['q','new typed search'],['view',view]]);
    }
    const [library]=elements(tree,e=>e.type===Library);
    assert(library);
    assert.equal(library.props.fixedView,true);
    assert.equal(library.props.fixedQuery,true);
    assert.equal(library.props.initialView,current);
    assert.equal(library.props.initialQuery,'Pons & right');
    assert.equal(library.props.compact,true);
    assert.equal(library.key,JSON.stringify({view:current,query:'Pons & right'}));
    const regions=elements(tree,e=>e.type===RegionalCatalogue);
    assert.equal(regions.length,current==='all'||current==='3D'?1:0);
    if(regions.length){
      assert.equal(regions[0].props.fixedQuery,true);
      assert.equal(regions[0].props.initialQuery,'Pons & right');
    }
  }
});

test('empty search, optional clear link, and invalid transport parameters',async()=>{
  const tree=await show({view:'CT',q:'   '});
  const [form]=elements(tree,e=>e.type==='form'&&e.props.role==='search');
  assert(form);
  assert.equal(elements(form,e=>e.type==='input'&&e.props.name==='q')[0].props.defaultValue,'');
  const clear=elements(form,e=>e.type===Link&&e.props.children==='Clear search');
  if(clear.length){
    const url=new URL(clear[0].props.href,'https://example.invalid');
    assert.equal(url.pathname,'/atlas/guided-learning');
    assert.deepEqual([...url.searchParams],[['view','CT']]);
  }
  for(const params of [
    {view:'PET'},{view:['CT','MRI']},{q:['pons','right']},{q:'x'.repeat(121)},
    {view:'CT',source:'private'},{view:'CT',case:'example'},{view:'3D',tour:'brainstem'},
    {view:'MRI',autoplay:'1'},{view:'MRI',permissions:'grant'},
  ])await assert.rejects(show(params),error=>error===sentinel,JSON.stringify(params));
});

test('clear shared search retains selected view and Enter defaults to Search in that view',async()=>{
  for(const current of views.map(([value])=>value)){
    const tree=await show({view:current,q:'  pons '});
    const [form]=elements(tree,e=>e.type==='form'&&e.props.role==='search');
    const clears=elements(form,e=>e.type===Link&&e.props.children==='Clear search');
    assert.equal(clears.length,1);
    const destination=new URL(clears[0].props.href,'https://example.invalid');
    assert.equal(destination.pathname,'/atlas/guided-learning');
    assert.deepEqual([...destination.searchParams],[['view',current]]);
    const [firstSubmit]=elements(form,e=>e.type==='button'&&e.props.type==='submit');
    assert.equal(firstSubmit.props.children,'Search');
    assert.equal(firstSubmit.props.name,'view');assert.equal(firstSubmit.props.value,current);
  }
});

test('clear region preserves shared search and focuses the surviving selector',()=>{
  const catalogue={available:true,sourceRevision:'public-test',unavailableTours:0,
    regions:[{id:'head',label:'Head'},{id:'arm',label:'Arm'}],tours:[
      {id:'pons',title:'Pons tour',description:'Pons',regionId:'head',regionLabel:'Head',steps:[],href:'/atlas/head-neck-3d',revision:'public-test'},
      {id:'arm',title:'Arm tour',description:'Arm',regionId:'arm',regionLabel:'Arm',steps:[],href:'/atlas/3d?region=arm',revision:'public-test'}]};
  const state=[],refs=[];let hook=0,focused=0;
  const reactMock={...React,useState(initial){const slot=hook++;if(!(slot in state))state[slot]=typeof initial==='function'?initial():initial;return[state[slot],next=>{state[slot]=next;}];},useRef(initial){const slot=hook++;return refs[slot]??=( {current:initial});}};
  const Component=loadTsx('../components/RegionalLearningCatalogue.tsx',{react:reactMock}).RegionalLearningCatalogue;
  const render=()=>{hook=0;return Component({catalogue,initialQuery:'pons',fixedQuery:true});};
  let tree=render();const [region]=elements(tree,e=>e.type==='select');
  region.props.ref.current={focus(){focused++;}};
  region.props.onChange({target:{value:'arm'}});tree=render();
  assert.match(renderToStaticMarkup(tree),/No regional tours match/);
  const [clear]=elements(tree,e=>e.type==='button'&&e.props.children==='Clear region');assert(clear);
  clear.props.onClick();tree=render();const html=renderToStaticMarkup(tree);
  assert.equal(focused,1);assert.equal(elements(tree,e=>e.type==='select')[0].props.value,'all');
  assert.match(html,/Pons tour/);assert.doesNotMatch(html,/Arm tour/);
  assert.equal(elements(tree,e=>e.type==='button'&&e.props.children==='Clear region').length,0);
});

const groups=[
  [{id:'shared',label:'Shared tour',concepts:['pons']}],
  [{id:'mri-only',label:'MRI tour',concepts:['amygdala']}],
  [],[],
  [{id:'ct-only',label:'CT tour',concepts:['bone']}],
  [],[],
];
const groupPaths=['../lib/head-atlas-learning','../lib/head-mri-learning','../lib/head-insula-learning','../lib/head-orbital-learning','../lib/head-ct-bone-learning','../lib/head-cerebellar-learning.ts','../lib/head-ct-facial-learning.ts'];
const groupKeys=['headLearningSequences','headMriLearningSequences','headInsulaLearningSequences','headOrbitalLearningSequences','headCtBoneLearningSequences','headCerebellarLearningSequences','headCtFacialLearningSequences'];
const revisionKeys=['HEAD_LEARNING_REVISION','HEAD_MRI_LEARNING_REVISION','HEAD_INSULA_LEARNING_REVISION','HEAD_ORBITAL_LEARNING_REVISION','HEAD_CT_BONE_LEARNING_REVISION','HEAD_CEREBELLAR_LEARNING_REVISION','HEAD_CT_FACIAL_LEARNING_REVISION'];
const destinations={
  shared:{atlasHref:'/atlas/head-neck-3d?headTour=shared&headStep=0',ctHref:'/atlas/ct-head?headTour=shared&headStep=0',mriHref:'/atlas/mri-head?headTour=shared&headStep=0'},
  'mri-only':{mriHref:'/atlas/mri-head?headTour=mri-only&headStep=0'},
  'ct-only':{atlasHref:'/atlas/head-neck-3d?headTour=ct-only&headStep=0',ctHref:'/atlas/ct-head?headTour=ct-only&headStep=0'},
};

function library({initialView='all',initialQuery='',fixedView=false,fixedQuery=false,current=true}={}){
  const state=[];let hook=0;
  const reactMock={...React,useState(initial){const slot=hook++;if(!(slot in state))state[slot]=initial;return [state[slot],next=>{state[slot]=next;}];},useRef(initial){return {current:initial};}};
  const dependencies={
    react:reactMock,
    './HeadLearningBookmark':{HeadLearningBookmark:()=>null},
    '../lib/head-image-only-links.ts':{headImageConceptById:id=>({label:id})},
    '../lib/head-link-availability.ts':{headLinksCurrent:()=>current,HEAD_LINK_REVISION_NOTICE:'Mapping unavailable'},
  };
  for(let index=0;index<groups.length;index++)dependencies[groupPaths[index]]={
    [groupKeys[index]]:groups[index],[revisionKeys[index]]:`revision-${index}`,
  };
  dependencies['../lib/head-atlas-learning'].headLearningLinks=({sequenceId})=>destinations[sequenceId]??null;
  const Component=loadTsx('../components/HeadAtlasLearningLibrary.tsx',dependencies).HeadAtlasLearningLibrary;
  function render(){hook=0;const tree=Component({initialView,initialQuery,fixedView,fixedQuery,compact:true});return {tree,html:renderToStaticMarkup(tree)};}
  function search(query){const [input]=elements(render().tree,e=>e.type==='input'&&e.props.type==='search');assert(input);input.props.onChange({target:{value:query}});}
  function select(view){const [input]=elements(render().tree,e=>e.type==='select');assert(input);input.props.onChange({target:{value:view}});}
  function clear(){const [button]=elements(render().tree,e=>e.type==='button'&&e.props.children==='Clear tour filters');assert(button);button.props.onClick();}
  return {render,search,select,clear};
}

test('fixed view hides inline selector and clear removes query while retaining CT scope',()=>{
  const view=library({initialView:'CT',initialQuery:'pons',fixedView:true});
  assert.equal(elements(view.render().tree,e=>e.type==='select').length,0);
  assert.match(view.render().html,/Shared tour/);
  assert.doesNotMatch(view.render().html,/CT tour/);
  view.search('no match');
  assert.match(view.render().html,/No linked tours match/);
  view.clear();
  const {tree,html}=view.render();
  assert.equal(elements(tree,e=>e.type==='input'&&e.props.type==='search')[0].props.value,'');
  assert.equal(elements(tree,e=>e.type==='select').length,0);
  assert.match(html,/Shared tour/);
  assert.match(html,/CT tour/);
  assert.doesNotMatch(html,/MRI tour/);
  assert.doesNotMatch(html,/href="\/atlas\/(?:mri-head|head-neck-3d)/);
  assert.equal(elements(tree,e=>e.type==='button'&&e.props.children==='Clear tour filters').length,0);
});

test('fixed query removes duplicate head filters while keeping URL-seeded modality and query',()=>{
  const {tree,html}=library({initialView:'CT',initialQuery:'pons',fixedView:true,fixedQuery:true}).render();
  assert.equal(elements(tree,e=>e.type==='input'&&e.props.type==='search').length,0);
  assert.equal(elements(tree,e=>e.type==='select').length,0);
  assert.equal(elements(tree,e=>e.type==='button'&&e.props.children==='Clear tour filters').length,0);
  assert.match(html,/Shared tour/);
  assert.doesNotMatch(html,/CT tour|MRI tour/);
  assert.doesNotMatch(html,/href="\/atlas\/(?:mri-head|head-neck-3d)/);
});

test('fixed query removes duplicate regional search but leaves region navigation',()=>{
  const catalogue={available:true,sourceRevision:'test-revision',unavailableTours:0,
    regions:[{id:'head',label:'Head',href:'/atlas/head-neck-3d'}],
    tours:[{id:'regional-pons',title:'Pons tour',description:'Pons example',regionId:'head',regionLabel:'Head',
      steps:[{title:'Pons',structureName:'Pons'}],href:'/atlas/head-neck-3d?tour=regional-pons',revision:'test-revision'}]};
  const reactMock={...React,useState(initial){return [typeof initial==='function'?initial():initial,()=>{}];},useRef(initial){return {current:initial};}};
  const Component=loadTsx('../components/RegionalLearningCatalogue.tsx',{react:reactMock}).RegionalLearningCatalogue;
  const tree=Component({catalogue,initialQuery:'pons',fixedQuery:true});
  const html=renderToStaticMarkup(tree);
  assert.equal(elements(tree,e=>e.type==='input'&&e.props.type==='search').length,0);
  assert.equal(elements(tree,e=>e.type==='button'&&e.props.children==='Clear filters').length,0);
  assert.equal(elements(tree,e=>e.type==='select').length,1,'region filtering remains available');
  assert.match(html,/Pons tour/);
});

test('default library retains inline view selection and clear resets both filters',()=>{
  const view=library({initialView:'CT',initialQuery:'pons'});
  assert.equal(elements(view.render().tree,e=>e.type==='select')[0].props.value,'CT');
  view.select('MRI');
  assert.equal(elements(view.render().tree,e=>e.type==='select')[0].props.value,'MRI');
  view.clear();
  const {tree,html}=view.render();
  assert.equal(elements(tree,e=>e.type==='select')[0].props.value,'all');
  assert.equal(elements(tree,e=>e.type==='input'&&e.props.type==='search')[0].props.value,'');
  assert.match(html,/Shared tour/);
  assert.match(html,/MRI tour/);
  assert.match(html,/CT tour/);
});

test('stale revision suppresses all library destinations under fixed view',()=>{
  const {tree,html}=library({initialView:'CT',fixedView:true,current:false}).render();
  assert.match(html,/Mapping unavailable/);
  assert.equal(elements(tree,e=>e.type==='a').length,0);
  assert.equal(elements(tree,e=>e.type==='select').length,0);
});
