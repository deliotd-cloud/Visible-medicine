import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from './workspace-component-test-build.mjs';

const require=createRequire(import.meta.url),React=require('react');
const built=await build({stdin:{contents:"export * from './app/whole-body-guided-learning'; export {regionalTours} from './lib/regional-tours'; export {bodyDisplayCatalog} from './lib/body-display-catalog'; export {nestedGuidedStudyOptions} from './lib/nested-guided-learning'; export {default as raw} from './public/models/bodyparts3d/full-body/catalog.json';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',loader:{'.css':'empty'},plugins:[{name:'observable-child-boundaries',setup(api){
  api.onLoad({filter:/[\\/]app[\\/]regional-guided-learning\.tsx$/},()=>({loader:'js',contents:'export const RegionalGuidedLearning="RegionalGuidedLearning";'}));
  api.onLoad({filter:/[\\/]app[\\/]eye-layers\.tsx$/},()=>({loader:'js',contents:'export const EyeLayerView="EyeLayerView";'}));
}}]});
const hooks=[];let hookIndex=0,suspends=0,exits=0;
const mod={exports:{}};
runInNewContext(built.outputFiles[0].text,{module:mod,exports:mod.exports,require(id){
  return id==='next/dynamic'?loader=>loader.toString().includes('eye-layers')?'EyeLayerView':'VentricularView':
    id==='react'?{...React,useId:()=>':seed:',useState:initial=>{const index=hookIndex++;if(!(index in hooks))hooks[index]=initial;return[hooks[index],next=>{hooks[index]=typeof next==='function'?next(hooks[index]):next;}];}}:require(id);
}});
const api=mod.exports;
const emptyCatalog={structures:[],bundles:[]};
const props={catalog:emptyCatalog,onExit:()=>{exits++;},pausedImaging:{suspend:()=>{suspends++;}}};
const nodes=value=>!value||typeof value!=='object'?[]:Array.isArray(value)?value.flatMap(nodes):[value,...nodes(value.props?.children)];
let tree;
const render=()=>{hookIndex=0;tree=api.WholeBodyGuidedLearning(props);};
const mount=(region,initialTour,catalog=emptyCatalog)=>{hooks.length=0;props.region=region;props.catalog=catalog;props.initialTour=initialTour;render();};
const one=(type,predicate=()=>true)=>{const found=nodes(tree).filter(node=>node.type===type&&predicate(node));assert.equal(found.length,1,`Expected one ${type}`);return found[0];};
const player=()=>one('RegionalGuidedLearning');
const select=()=>one('select',node=>node.props['aria-label']==='Choose a tour');
const choose=id=>{select().props.onChange({target:{value:id}});render();};
const exact=id=>{const tour=api.regionalTours.find(t=>t.id===id);assert(tour);return tour;};
const selected=tour=>{assert.equal(player().props.tour,tour);assert.equal(player().key,`${tour.id}:${tour.revision}`);assert.equal(select().props.value,tour.id);assert.equal(player().props.autoplay,undefined);assert.equal(player().props.onStart,undefined);assert.equal(player().props.initialStep,undefined);};
const unavailable=()=>{assert.equal(nodes(tree).filter(node=>node.type==='RegionalGuidedLearning'||node.type==='EyeLayerView'||node.type==='VentricularView').length,0);assert.match(one('p',node=>node.props.role==='status').props.children,/requested tour is unavailable/i);assert.equal(nodes(tree).filter(node=>node.type==='select').length,0);one('button',node=>node.props.children==='Exit tour').props.onClick();};

const cross=exact('right-lower-limb-venous-orientation');
assert.equal(cross.region,'whole-body');assert(cross.scopeRegions.includes('leg'));
mount('whole-body',{id:cross.id,revision:cross.revision});selected(cross);assert.equal(suspends,0,'Initial selection never suspends imaging');
const thorax=api.regionalTours.filter(t=>t.region==='thorax');assert(thorax.length>1);
mount('thorax',{id:thorax[1].id,revision:thorax[1].revision});selected(thorax[1]);assert.equal(suspends,0);
const limb=exact('right-medial-thigh-orientation');
mount('thigh',{id:limb.id,revision:limb.revision});selected(limb);assert.equal(suspends,0);

const nestedCatalog=api.bodyDisplayCatalog(api.raw);
const nested=api.nestedGuidedStudyOptions(nestedCatalog,'head-neck')[0];assert(nested);
mount('head-neck',{id:nested.id,revision:'invented'},nestedCatalog);unavailable();
for(const malformed of [null,{}]){mount('head-neck',malformed,nestedCatalog);unavailable();}
for(const [region,seed] of [
  ['thorax',{id:thorax[1].id,revision:'stale'}],
  ['thorax',{id:limb.id,revision:limb.revision}],
  ['thorax',{id:'unknown-tour',revision:'unknown'}],
  ['thorax',{id:thorax[1].id}],
  ['thorax',{revision:thorax[1].revision}],
  ['thorax',null],
]){mount(region,seed);unavailable();}
assert.equal(suspends,0,'Rejected seeds never suspend imaging');

mount('thorax',undefined);selected(thorax[0]);
choose(thorax[1].id);selected(thorax[1]);assert.equal(suspends,1,'Explicit choice suspends imaging');
props.initialTour={id:thorax[2].id,revision:thorax[2].revision};render();selected(thorax[1]);assert.equal(suspends,1,'A changed seed after mount cannot replace user choice');
props.initialTour={id:'unknown-tour',revision:'stale'};render();selected(thorax[1]);
mount('thorax',{id:thorax[1].id,revision:thorax[1].revision});selected(thorax[1]);
choose(thorax[2].id);selected(thorax[2]);assert.equal(suspends,2);
props.initialTour={id:thorax[0].id,revision:thorax[0].revision};render();selected(thorax[2]);
assert.equal(suspends,2,'Rerender cannot re-suspend imaging');
console.log(JSON.stringify({initialRegionalSelection:true,rejectedSeeds:9,legacyDefault:true,userChoiceSuspends:true,autoplay:false,exits}));
