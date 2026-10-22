import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import test from 'node:test';
import {build} from './workspace-component-test-build.mjs';

const require=createRequire(import.meta.url),React=require('react');
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const built=await build({stdin:{contents:"export * from './app/whole-body-guided-learning'; export {regionalTours} from './lib/regional-tours';",resolveDir:process.cwd(),loader:'tsx'},
  bundle:true,write:false,platform:'node',format:'cjs',loader:{'.css':'empty'},plugins:[{name:'normal-viewer-boundaries',setup(api){
    api.onLoad({filter:/[\\/]app[\\/]regional-guided-learning\.tsx$/},()=>({loader:'js',contents:'export const RegionalGuidedLearning="RegionalGuidedLearning";'}));
    api.onLoad({filter:/[\\/]app[\\/]eye-layers\.tsx$/},()=>({loader:'js',contents:'export const EyeLayerView="EyeLayerView";'}));
  }}]});
const deferred=[],hooks=[];
let hookIndex=0,suspends=0,exits=0;
const mod={exports:{}};
runInNewContext(built.outputFiles[0].text,{module:mod,exports:mod.exports,require(id){return id==='next/dynamic'?(_loader,options)=>{
  deferred.push(options);return deferred.length===1?'EyeLayerView':'VentricularView';
}:id==='react'?{...React,useId:()=>':hamstring-library:',useState:initial=>{
  const index=hookIndex++;if(!(index in hooks))hooks[index]=initial;
  return [hooks[index],next=>{hooks[index]=typeof next==='function'?next(hooks[index]):next;}];
}}:require(id);}});
const api=mod.exports,plain=value=>JSON.parse(JSON.stringify(value));
const emptyCatalog={structures:[],bundles:[]};
const props={catalog:emptyCatalog,assetBase:'/atlas-runtime/head-neck',onExit:()=>{exits++;},pausedImaging:{suspend:()=>{suspends++;}}};
const nodes=value=>!value||typeof value!=='object'?[]:Array.isArray(value)?value.flatMap(nodes):[value,...nodes(value.props?.children)];
let tree;
const render=()=>{hookIndex=0;tree=api.WholeBodyGuidedLearning(props);};
const reset=()=>{hooks.length=0;render();};
const find=(type,predicate=()=>true)=>{const found=nodes(tree).filter(node=>node.type===type&&predicate(node));assert.equal(found.length,1,`Expected one ${type}`);return found[0];};
const tourSelect=()=>find('select',node=>node.props.id===':hamstring-library:-tour');
const regionSelect=()=>find('select',node=>node.props.id===':hamstring-library:-region');
const choices=()=>nodes(tourSelect()).filter(node=>node.type==='option'&&node.props.value&&!node.props.disabled).map(node=>node.props.value);
const select=id=>{tourSelect().props.onChange({target:{value:id}});render();};
const search=value=>{find('input').props.onChange({target:{value}});render();};
const filter=value=>{regionSelect().props.onChange({target:{value}});render();};
const player=()=>find('RegionalGuidedLearning');
const ids=['right-hamstring-orientation','left-hamstring-orientation'];
const tours=api.wholeBodyTourOptions;
const hamstrings=ids.map(id=>{const tour=tours.find(item=>item.id===id);assert(tour,id);return tour;});
const original=api.regionalTours.filter(tour=>!ids.includes(tour.id));

await test('all 51 earlier choices and regional defaults remain; bilateral choices join thigh',()=>{
  assert.equal(deferred.length,2);
  assert.equal(original.length,51);assert.equal(tours.length,53);
  assert.equal(new Set(tours.map(tour=>tour.id)).size,53);
  assert.equal(tours.reduce((count,tour)=>count+tour.steps.length,0),317);
  assert.deepEqual(plain(hamstrings.map(tour=>tour.region)),['thigh','thigh']);
  props.region='whole-body';reset();
  assert.equal(player().props.tour,tours[0]);
  assert.equal(player().key,`${tours[0].id}:${tours[0].revision}`);
  assert.equal(choices().length,53);
  for(const tour of original){
    assert(choices().includes(tour.id),`Earlier choice ${tour.id}`);
    const option=nodes(tourSelect()).find(node=>node.type==='option'&&node.props.value===tour.id);
    assert.equal(option.props.children,tour.title);
  }
  for(const region of new Set(original.map(tour=>tour.region))){
    props.region=region;reset();
    const inRegion=region==='whole-body'?tours:tours.filter(tour=>tour.region===region);
    const oldDefault=region==='whole-body'?tours[0]:original.find(tour=>tour.region===region);
    assert.deepEqual(plain(choices()),plain(inRegion.map(tour=>tour.id)),`${region} choices`);
    assert.equal(player().props.tour,oldDefault,`${region} default`);
  }
  props.region='thigh';reset();
  assert.deepEqual(plain(choices()),plain(tours.filter(tour=>tour.region==='thigh').map(tour=>tour.id)));
  assert.equal(choices().length,4);
  assert(ids.every(id=>choices().includes(id)));
});

await test('title and individual stop discovery respect region filters without starting playback',()=>{
  props.region='whole-body';reset();
  const initialKey=player().key,initialTour=player().props.tour,initialSuspends=suspends;
  for(const tour of hamstrings){
    search(tour.title);
    assert(choices().includes(tour.id),`${tour.id} title`);
    assert.equal(player().key,initialKey);assert.equal(player().props.tour,initialTour);
    for(const step of tour.steps){
      search(step.title);
      assert(choices().includes(tour.id),`${tour.id}:${step.title}`);
      assert.equal(player().key,initialKey);
    }
  }
  filter('thigh');search(hamstrings[0].steps[0].title);
  assert(ids.every(id=>choices().includes(id)));
  filter('thorax');assert(ids.every(id=>!choices().includes(id)));
  filter('all');search('');
  assert.equal(player().key,initialKey);assert.equal(suspends,initialSuspends);
  assert.equal(player().props.initialStep,undefined);assert.equal(player().props.autoplay,undefined);
});

await test('explicit choices key the player by source revision, suspend once and retain exit',()=>{
  props.region='whole-body';reset();
  const start=suspends;
  for(const [index,tour] of hamstrings.entries()){
    select(tour.id);
    assert.equal(player().props.tour,tour);
    assert.equal(player().key,`${tour.id}:${tour.revision}`);
    assert.equal(player().props.catalog,emptyCatalog);
    assert.equal(player().props.initialStep,undefined);
    assert.equal(player().props.autoplay,undefined);
    assert.equal(suspends,start+index+1);
    select(tour.id);assert.equal(suspends,start+index+1);
  }
  filter('thorax');select(hamstrings[0].id);
  assert.equal(player().props.tour,hamstrings[1],'Hidden cross-region choice is refused');
  assert.equal(suspends,start+2);
  props.region='thigh';reset();
  assert.equal(player().props.tour,original.find(tour=>tour.region==='thigh'));
  for(const tour of hamstrings){
    select(tour.id);
    assert.equal(player().props.tour,tour);
    assert.equal(player().key,`${tour.id}:${tour.revision}`);
    assert.equal(player().props.initialStep,undefined);assert.equal(player().props.autoplay,undefined);
    select(original.find(item=>item.region==='thorax').id);
    assert.equal(player().props.tour,tour,'Thigh rejects a valid foreign-region choice');
  }
  const beforeExit=suspends;
  assert.equal(player().props.onExit,props.onExit);
  player().props.onExit();assert.equal(exits,1);assert.equal(suspends,beforeExit);
  assert.equal(nodes(tree).filter(node=>node.type==='RegionalGuidedLearning').length,1);
  assert.equal(nodes(tree).filter(node=>node.type==='iframe'||node.type==='a').length,0);
});

console.log(JSON.stringify({sourceComponentSha256:sha('app/whole-body-guided-learning.tsx'),sourceRegistrySha256:sha('lib/regional-tours.ts'),
  sourcePinsSha256:sha('content/hamstring-tour-pins.json'),earlierChoices:51,currentChoices:53,newStops:8,
  syntheticComponent:true,realBrowser:false,rendererGpuVerified:false}));
