import assert from 'node:assert/strict';import test from 'node:test';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import {transformSync} from 'esbuild';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import * as runtime from 'react/jsx-runtime';
const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
function load(p,deps={}){const code=transformSync(source(p),{loader:p.endsWith('.tsx')?'tsx':'ts',jsx:'automatic',format:'cjs'}).code,module={exports:{}};new Function('require','module','exports',code)(id=>{if(id==='react/jsx-runtime')return runtime;if(id.endsWith('.css'))return {};if(Object.hasOwn(deps,id))return deps[id];throw Error('Unexpected dependency '+id);},module,module.exports);return module.exports;}
const regions=load('lib/atlas-navigation.ts').atlasBodyRegions,ids=regions.map(r=>r.id),parse=load('lib/head-learning-discovery.ts').parseHeadLearningDiscovery;
const entryNavigation=load('lib/regional-tour-entry-navigation.ts',{'./atlas-navigation':{atlasBodyRegions:regions}});
const nodes=(node,predicate)=>Array.isArray(node)?node.flatMap(n=>nodes(n,predicate)):!React.isValidElement(node)?[]:[...(predicate(node)?[node]:[]),...nodes(node.props.children,predicate)];
const words=node=>Array.isArray(node)?node.map(words).join(''):React.isValidElement(node)?words(node.props.children):typeof node==='string'||typeof node==='number'?String(node):'';
const Link=({href,children,prefetch:_,...rest})=>React.createElement('a',{href,...rest},children),Head=()=>React.createElement('p',null,'Linked head tour sentinel'),Regional=()=>null,missing=new Error('not-found');
const synthetic={available:true,sourceRevision:'synthetic-revision',unavailableTours:0,regions:[{id:'thorax',label:'Thorax'},{id:'head-neck',label:'Head & neck'}],tours:[
 {id:'chest',title:'Thorax lesson',description:'Regional chest',regionId:'thorax',regionLabel:'Thorax',href:'/atlas/thorax-3d',revision:'synthetic-tour',steps:[{title:'Chest step',structureName:'Example'}]},
 {id:'head',title:'Head lesson',description:'Regional head',regionId:'head-neck',regionLabel:'Head & neck',href:'/atlas/head-neck-3d',revision:'synthetic-tour',steps:[{title:'Head step',structureName:'Example'}]},
]};
function pageHarness(){let reads=0;const Page=load('app/atlas/guided-learning/page.tsx',{
 'next/link':{__esModule:true,default:Link},'next/navigation':{notFound(){throw missing;}},
 '../../../components/HeadAtlasLearningLibrary':{HeadAtlasLearningLibrary:Head},'../../../components/RegionalLearningCatalogue':{RegionalLearningCatalogue:Regional},
 '../../../lib/regional-learning-catalogue':{regionalLearningCatalogue(){reads++;return synthetic;}},
 '../../../lib/atlas-navigation':{atlasBodyRegions:regions},'../../../lib/head-learning-discovery':{parseHeadLearningDiscovery:parse},
 }).default;return{show:params=>Page({searchParams:Promise.resolve(params)}),get reads(){return reads;}};}

test('legacy filters retain their exact value shape; explicit region is bounded by actual region IDs',()=>{
 assert.deepEqual(parse({}),{view:'all',query:''});assert.deepEqual(parse({view:'CT',q:'  pons   right '}),{view:'CT',query:'pons right'});
 for(const region of ['all',...ids])for(const view of ['all','3D','CT','MRI'])assert.deepEqual(parse({view,q:'  body   lesson ',region},ids),{view,query:'body lesson',region});
 for(const region of ['',[],['thorax','head-neck'],'Thorax','/atlas/ct-head','https://example.invalid','thorax?scan=private','thorax\u0000','unknown','toString','__proto__'])assert.equal(parse({view:'3D',region},ids),null,JSON.stringify(region));
 assert.equal(parse({region:'thorax'}),null,'No caller-supplied region allowlist means no invented destination');
 for(const params of [{view:'US',region:'thorax'},{view:['CT'],region:'head-neck'},{q:['x'],region:'all'},{q:'x'.repeat(121),region:'all'},{region:'thorax',scan:'private'},{region:'all',autoplay:'1'},{region:'all',permissions:'grant'}])assert.equal(parse(params,ids),null,JSON.stringify(params));
});

test('one native GET selector carries region, live query and each selected view without duplicate child controls',async()=>{
 const harness=pageHarness();
 for(const region of ['all',...ids])for(const view of ['all','3D','CT','MRI']){
  const tree=await harness.show({view,q:'  Test   lesson ',region}),forms=nodes(tree,n=>n.type==='form'&&n.props.role==='search');assert.equal(forms.length,1);const form=forms[0];assert.equal(form.props.method,'get');assert.equal(form.props.action,'/atlas/guided-learning');
  const selects=nodes(form,n=>n.type==='select'&&n.props.name==='region');assert.equal(selects.length,1);const select=selects[0];assert.equal(select.props.defaultValue??select.props.value,region);assert.equal(select.props.onChange,undefined,'Use native GET; no stale client snapshot');
  assert.deepEqual(nodes(select,n=>n.type==='option').map(n=>n.props.value),['all',...ids]);
  const query=nodes(form,n=>n.type==='input'&&n.props.name==='q')[0];assert.equal(query.props.defaultValue,'Test lesson');assert.equal(query.props.onChange,undefined);
  const submissions=nodes(form,n=>n.type==='button'&&n.props.name==='view');assert.equal(submissions.length,5);assert.equal(words(submissions[0]),'Search');assert.equal(submissions[0].props.value,view);
  for(const submit of submissions){const native=new URLSearchParams([[query.props.name,'fresh unsent query'],[select.props.name,region],[submit.props.name,submit.props.value]]);assert.deepEqual(parse(Object.fromEntries(native),ids),{view:submit.props.value,query:'fresh unsent query',region});}
  const clear=nodes(tree,n=>n.type===Link&&words(n)==='Clear search');assert.equal(clear.length,1);const url=new URL(clear[0].props.href,'https://example.invalid');assert.equal(url.pathname,'/atlas/guided-learning');assert.deepEqual(Object.fromEntries(url.searchParams),{view,region});
  const child=nodes(tree,n=>n.type===Regional);assert.equal(child.length,view==='all'||view==='3D'?1:0);
  for(const node of child){assert.equal(node.props.initialRegion,region);assert.equal(node.props.fixedRegion,true);assert.equal(node.props.fixedQuery,true);assert.equal(node.props.initialQuery,'Test lesson');assert.equal(node.props.catalogue,synthetic);}
  const heads=nodes(tree,n=>n.type===Head);assert.equal(heads.length,region==='all'||region==='head-neck'?1:0,'Do not show head imaging under another region');
  const [disclosure]=nodes(tree,n=>n.type==='details'&&n.props.className==='atlas-guided-regions');assert.equal(disclosure.props.open,view==='all'||view==='3D','Search results open only in a view that offers regional 3D tours');
 }
});

test('non-head imaging shows honest empty scope without resolving source catalogues or inventing scan links',async()=>{
 for(const region of ids.filter(id=>id!=='head-neck'))for(const view of ['CT','MRI']){
  const harness=pageHarness(),tree=await harness.show({view,region,q:'orientation'}),html=renderToStaticMarkup(tree);assert.equal(harness.reads,0);assert.equal(nodes(tree,n=>n.type===Head||n.type===Regional).length,0);assert.match(html,/no|not.*available|unavailable/i);
  const destinations=nodes(tree,n=>n.type===Link||n.type==='a').map(n=>n.props.href);assert(!destinations.some(href=>/^\/atlas\/(?:ct-head|mri-head)/.test(href)),'Never substitute head scans for this region');
  const direct=destinations.filter(href=>/^\/atlas\/.*3d/.test(href));assert.deepEqual(direct,[regions.find(r=>r.id===region).href],'Existing optional 3D region navigation stays exact, not an imaging match');
  const [regionalDisclosure]=nodes(tree,n=>n.type==='details'&&n.props.className==='atlas-guided-regions');assert.equal(regionalDisclosure.props.open,false,'Do not expand unrelated 3D controls on an imaging-only filter');
  const [notice]=nodes(tree,n=>n.type==='section'&&n.props.className==='atlas-guided-no-imaging');assert(notice);const recovery=nodes(notice,n=>n.type===Link||n.type==='a').map(n=>new URL(n.props.href,'https://example.invalid')).filter(url=>url.pathname==='/atlas/guided-learning');assert(recovery.some(url=>url.searchParams.get('view')==='3D'&&url.searchParams.get('region')===region));assert(recovery.some(url=>url.searchParams.get('region')==='head-neck'&&url.searchParams.get('view')===view));
  for(const url of recovery){assert.equal(url.searchParams.get('q'),'orientation');assert(![...url.searchParams.keys()].some(key=>!['view','q','region'].includes(key)));}
 }
});

test('unknown or repeated regions fail closed at the actual page and absent region keeps old remount identity',async()=>{
 const harness=pageHarness();for(const region of ['unknown',['thorax','head-neck'],[],['thorax'],'/atlas/ct-head'])await assert.rejects(harness.show({view:'MRI',region}),e=>e===missing);
 const base=await harness.show({view:'MRI',q:'PONS right'}),head=nodes(base,n=>n.type===Head)[0];assert.equal(head.key,JSON.stringify({view:'MRI',query:'PONS right'}));
 const one=await harness.show({view:'3D',region:'thorax'}),two=await harness.show({view:'3D',region:'head-neck'});assert.notEqual(nodes(one,n=>n.type===Regional)[0].key,nodes(two,n=>n.type===Regional)[0].key);
});

function regionalHarness(){const state=[],refs=[];let hook=0;const react={...React,useState(initial){const slot=hook++;if(!(slot in state))state[slot]=typeof initial==='function'?initial():initial;return[state[slot],next=>{state[slot]=typeof next==='function'?next(state[slot]):next;}];},useRef(initial){const slot=hook++;return refs[slot]??={current:initial};}};const Component=load('components/RegionalLearningCatalogue.tsx',{react,'../lib/regional-tour-entry-navigation':entryNavigation}).RegionalLearningCatalogue;return{render(props){hook=0;return Component({catalogue:synthetic,...props});}};}
test('fixed regional catalogue matches selected URL region, including a valid region with no tours',()=>{
 for(const region of ['all',...ids]){
  const tree=regionalHarness().render({initialRegion:region,fixedRegion:true,fixedQuery:true}),html=renderToStaticMarkup(tree);assert.equal(nodes(tree,n=>n.type==='select'||n.type==='input').length,0);assert.equal(nodes(tree,n=>n.type==='button'&&/Clear/.test(words(n))).length,0);
  const expected=synthetic.tours.filter(t=>region==='all'||t.regionId===region);const links=nodes(tree,n=>n.type==='a').map(n=>n.props.href);assert.deepEqual(links,expected.map(t=>t.href));assert.match(html,new RegExp(`${expected.length} matching tour`));
  if(expected.length===0){assert.match(html,/No regional tours match/);assert.doesNotMatch(html,/Thorax lesson|Head lesson/);}
 }
 const loose=regionalHarness().render({});assert.equal(nodes(loose,n=>n.type==='select').length,1);assert.equal(nodes(loose,n=>n.type==='input').length,1);
 const unavailable=regionalHarness().render({catalogue:{...synthetic,available:false},initialRegion:'thorax',fixedRegion:true,fixedQuery:true});assert.equal(nodes(unavailable,n=>n.type==='a').length,0);
});

test('closed region-filter milestone retains its exact source/assets/access witness; current entry delivery is checked separately',()=>{
 const receiptPath='F:/VisibleMedicine/staging/20261023-upper-cervical-website/SOURCE_BOUND.json',bytes=readFileSync(receiptPath);assert.equal(createHash('sha256').update(bytes).digest('hex'),'844ebfc007eeb515b1985f005f20109c9c48794279dcf60139692379f7b165ce');const parent=JSON.parse(bytes);
 for(const path of ['components/HeadAtlasLearningLibrary.tsx','lib/head-atlas-learning.ts','lib/head-atlas-links.ts','lib/regional-learning-catalogue.ts','scripts/bind-clinical-review.mjs','atlas-review/integration-inputs.json','lib/atlas-delivery-policy.ts','package.json','package-lock.json','LICENSES/THIRD_PARTY_NOTICES.md']){const row=parent.sourceRows.find(r=>r.path===path);assert(row,path);assert.equal(createHash('sha256').update(readFileSync(parent.website+'/'+path)).digest('hex'),row.sha256,path);}
});
