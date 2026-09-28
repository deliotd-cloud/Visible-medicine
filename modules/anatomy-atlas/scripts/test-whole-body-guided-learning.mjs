import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from './workspace-component-test-build.mjs';
const require=createRequire(import.meta.url),React=require('react');
const result=await build({stdin:{contents:"export * from './app/whole-body-guided-learning'; export {regionalTours} from './lib/regional-tours';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',loader:{'.css':'empty'},plugins:[{name:'observable-child-boundaries',setup(api){
 api.onLoad({filter:/[\\/]app[\\/]regional-guided-learning\.tsx$/},()=>({loader:'js',contents:'export const RegionalGuidedLearning="RegionalGuidedLearning";'}));
 api.onLoad({filter:/[\\/]components[\\/]ui[\\/]select\.tsx$/},()=>({loader:'js',contents:'export const Select="Select",SelectContent="SelectContent",SelectItem="SelectItem",SelectTrigger="SelectTrigger",SelectValue="SelectValue";'}));
}}]});
let state,exits=0;
const mod={exports:{}};
runInNewContext(result.outputFiles[0].text,{module:mod,exports:mod.exports,require(id){return id==='react'?{...React,useId:()=>':tour-picker:',useState:initial=>{state??=initial;return[state,next=>{state=next;}];}}:require(id);}});
const api=mod.exports,plain=v=>JSON.parse(JSON.stringify(v));
const catalog={structures:[],bundles:[]},onExit=()=>{exits++;};
const props={catalog,assetBase:'/atlas-runtime/head-neck',onExit};
const nodes=t=>!t||typeof t!=='object'?[]:Array.isArray(t)?t.flatMap(nodes):[t,...nodes(t.props?.children)];
let tree;
const render=()=>{tree=api.WholeBodyGuidedLearning(props);};
const node=type=>{const matches=nodes(tree).filter(n=>n.type===type);assert.equal(matches.length,1);return matches[0];};
render();
const options=api.wholeBodyTourOptions;
assert.equal(options.length,12);assert.equal(new Set(options.map(t=>t.id)).size,12);
assert.deepEqual(plain(options.map(t=>t.region)),['head-neck','spine','thorax','thorax','abdomen','pelvis','shoulder-arm','forearm','hand','thigh','leg','foot']);
assert.deepEqual([...options.map(t=>t.id)].sort(),[...api.regionalTours.map(t=>t.id)].sort(),'Reuse every regional tour exactly once');
assert.equal(node('SelectTrigger').props['aria-labelledby'],':tour-picker:');
const keys=new Set();
for(const tour of options){
 node('Select').props.onValueChange(tour.id);render();
 const child=node('RegionalGuidedLearning');
 assert.equal(child.props.tour,tour,'Reuse the actual reviewed object, not a whole-body clone');
 assert.equal(child.props.catalog,catalog);assert.equal(child.props.assetBase,props.assetBase);
 assert.equal(child.props.onExit,onExit);assert.equal(child.key,`${tour.id}:${tour.revision}`);
 assert.equal(child.props.initialStep,undefined);assert.equal(child.props.autoplay,undefined);
 assert(!keys.has(child.key),'Each different source/revision requires a fresh player');keys.add(child.key);
 for(const invalid of [null,undefined,'missing','whole-body','__proto__']){
  node('Select').props.onValueChange(invalid);render();assert.equal(node('RegionalGuidedLearning').key,child.key);
 }
 node('Select').props.onValueChange(tour.id);render();assert.equal(node('RegionalGuidedLearning').key,child.key,'Re-selecting same tour preserves its session');
}
node('RegionalGuidedLearning').props.onExit();assert.equal(exits,1);
assert.equal(nodes(tree).filter(n=>n.type==='RegionalGuidedLearning').length,1);
assert.equal(nodes(tree).filter(n=>n.type==='iframe'||n.type==='a').length,0,'No pop-out or cross-product navigation');
props.region='thorax';state=undefined;render();
const thoracic=options.filter(t=>t.region==='thorax');
assert.equal(thoracic.length,2);
assert.deepEqual(nodes(tree).filter(n=>n.type==='SelectItem').map(n=>n.props.value),plain(thoracic.map(t=>t.id)));
assert.equal(node('RegionalGuidedLearning').props.tour,thoracic[0]);
node('Select').props.onValueChange(thoracic[1].id);render();
assert.equal(node('RegionalGuidedLearning').props.tour,thoracic[1]);
node('Select').props.onValueChange(options.find(t=>t.region==='head-neck').id);render();
assert.equal(node('RegionalGuidedLearning').props.tour,thoracic[1],'A regional library rejects a valid but out-of-region tour');
props.region='spine';render();assert.equal(node('RegionalGuidedLearning').props.tour.region,'spine','Changed region cannot retain an out-of-scope selection');
props.region='missing';render();assert.equal(nodes(tree).filter(n=>n.type==='RegionalGuidedLearning').length,0);
const emptyExit=nodes(tree).find(n=>n.type==='button');assert(emptyExit);emptyExit.props.onClick();assert.equal(exits,2);
console.log(JSON.stringify({tours:options.length,exactRegionalScopes:true,revisionKeyedRemount:true,invalidSelectionsRejected:true,singleViewer:true,sharedExit:true}));
