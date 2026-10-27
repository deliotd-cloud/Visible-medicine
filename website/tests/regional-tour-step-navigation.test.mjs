import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from 'esbuild';

const require=createRequire(import.meta.url),React=require('react');
const bundle=await build({stdin:{contents:"export * from './lib/regional-tour-entry-navigation'; export {RegionalLearningCatalogue} from './components/RegionalLearningCatalogue';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',packages:'external',loader:{'.css':'empty'}});
const mod={exports:{}};
const hooks={...React,useState:value=>[typeof value==='function'?value():value,()=>{throw Error('Unexpected update');}],useRef:value=>({current:value})};
runInNewContext(bundle.outputFiles[0].text,{module:mod,exports:mod.exports,URLSearchParams,require:id=>id==='react'?hooks:require(id)});
const {regionalTourStepHref,regionalTourEntryHref,regionalTourEntrySuffix,RegionalLearningCatalogue}=mod.exports;
const source='a'.repeat(40),tour={id:'tour-forearm',revision:'r.1',title:'Forearm tour',description:'A regional route',regionId:'forearm',regionLabel:'Forearm',href:'/atlas/3d?region=forearm',limitations:'Draft',steps:[{title:'Radial artery',structureName:'Right radial artery'},{title:'Ulna',structureName:'Right ulna'},{title:'Ulnar artery',structureName:'Right ulnar artery'}]};
const catalogue={available:true,sourceRevision:source,unavailableTours:0,regions:[{id:'forearm',label:'Forearm'}],tours:[tour]};
const params=href=>Object.fromEntries(new URL(href,'https://visible.example').searchParams);
const walk=(node,condition)=>!node||typeof node!=='object'?[]:Array.isArray(node)?node.flatMap(n=>walk(n,condition)):[...(condition(node)?[node]:[]),...walk(node.props?.children,condition)];
const links=tree=>walk(tree,n=>n.type==='a');

test('each step retains canonical region, exact source and tour revision, with one-based public ordinal',()=>{
  for(let i=0;i<tour.steps.length;i++){
    const href=regionalTourStepHref({...tour,privatePath:'never-forward',autoplay:true},source,i),q=params(href);
    assert.equal(q.regionalStep,String(i+1));assert.equal(q.region,'forearm');assert.equal(q.tourSource,source);assert.equal(q.tourRevision,tour.revision);assert.equal(q.regionalTour,tour.id);
    assert.deepEqual(Object.keys(q),['region','regionalTour','tourRevision','tourSource','regionalStep']);
    assert.equal(regionalTourEntrySuffix(q),href.slice(href.indexOf('&regionalTour')));
  }
  assert(!regionalTourEntryHref(tour,source).includes('regionalStep'));
});

test('step link refuses invalid positions, absent lists and noncanonical or unbound destinations',()=>{
  for(const index of [-1,3,0.5,NaN,Infinity,undefined,null,'1',200])assert.equal(regionalTourStepHref(tour,source,index),null);
  for(const bad of [null,{...tour,steps:undefined},{...tour,steps:[]},{...tour,steps:Array(201).fill(tour.steps[0])},{...tour,href:'https://unsafe.invalid'},{...tour,revision:''}])assert.equal(regionalTourStepHref(bad,source,0),null);
  assert.equal(regionalTourStepHref(tour,null,0),null);
});

test('public transport rejects orphan, duplicate, inherited, noncanonical and oversized ordinals',()=>{
  const good=params(regionalTourStepHref(tour,source,1));
  for(const step of ['',undefined,null,['2'],['2','2'],2,'0','-1','01','+1','1.0','1e1',' 1','1 ','1\n','201','999999','x'])assert.equal(regionalTourEntrySuffix({...good,regionalStep:step}),null,JSON.stringify(step));
  assert.equal(regionalTourEntrySuffix({regionalStep:'1'}),null);
  const inherited=Object.assign(Object.create({regionalStep:'1'}),params(regionalTourEntryHref(tour,source)));
  assert.equal(regionalTourEntrySuffix(inherited),null);
  assert.equal(regionalTourEntrySuffix({...good,tourSource:undefined}),null);
  assert(!regionalTourEntrySuffix({...good,privateStudy:'never-forward',autoplay:'1'}).includes('never-forward'));
  assert.equal(regionalTourEntrySuffix({...good,regionalStep:'200'}).endsWith('regionalStep=200'),true);
});

test('actual search links only matching original positions and expanded details link all steps, without autoplay',()=>{
  const tree=RegionalLearningCatalogue({catalogue,initialQuery:'artery'});
  const match=walk(tree,n=>n.props?.className==='regional-learning-catalogue-match');assert.equal(match.length,1);
  assert.deepEqual(links(match).map(n=>params(n.props.href).regionalStep),['1','3']);
  const all=links(tree).filter(n=>params(n.props.href).regionalStep);
  assert.equal(all.length,5);
  assert(all.every(n=>n.props.onClick===undefined&&!n.props.href.includes('autoplay')));
  assert(all.every(n=>n.props['aria-label'].includes('Forearm tour')));
  assert.equal(links(tree).filter(n=>n.props['aria-label']==='Open tour: Forearm tour').length,1);
});

test('changed or unavailable catalogue does not retain older step destinations',()=>{
  const changed=RegionalLearningCatalogue({catalogue:{...catalogue,sourceRevision:'b'.repeat(40)},initialQuery:'ulna'});
  assert(links(changed).every(n=>params(n.props.href).tourSource==='b'.repeat(40)));
  for(const current of [{...catalogue,available:false},{...catalogue,sourceRevision:null},{...catalogue,tours:[{...tour,href:'https://unsafe.invalid'}]}]){
    assert(links(RegionalLearningCatalogue({catalogue:current})).every(n=>!n.props.href.includes('regionalStep')));
  }
});
