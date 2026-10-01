import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from './workspace-component-test-build.mjs';
const require=createRequire(import.meta.url),React=require('react');
const compiled=await build({stdin:{contents:`export {WholeBodyGuidedLearning} from './app/whole-body-guided-learning';
 export {nestedGuidedStudyOptions} from './lib/nested-guided-learning';export {bodyDisplayCatalog} from './lib/body-display-catalog';
 export {eyeLayerGuide} from './lib/eye-layer-guide';export {default as raw} from './public/models/bodyparts3d/full-body/catalog.json';`,resolveDir:process.cwd(),loader:'tsx'},
 bundle:true,write:false,platform:'node',format:'cjs',loader:{'.css':'empty'},plugins:[{name:'observable-library-viewers',setup(api){
  api.onLoad({filter:/[\\/]app[\\/]regional-guided-learning\.tsx$/},()=>({contents:'export const RegionalGuidedLearning="RegionalGuidedLearning";',loader:'js'}));
  api.onLoad({filter:/[\\/]app[\\/]eye-layers\.tsx$/},()=>({contents:'export const EyeLayerView="EyeLayerView";',loader:'js'}));
  api.onLoad({filter:/[\\/]components[\\/]ui[\\/]select\.tsx$/},()=>({contents:'export const Select="Select",SelectContent="SelectContent",SelectItem="SelectItem",SelectTrigger="SelectTrigger",SelectValue="SelectValue";',loader:'js'}));
 }}]});
let selected,exits=0,checks=0;const module={exports:{}};
runInNewContext(compiled.outputFiles[0].text,{module,exports:module.exports,structuredClone,
 require:id=>id==='react'?{...React,useId:()=>':nested-tour-picker:',useState:v=>{selected??=v;return[selected,next=>{selected=next;}];}}:require(id)});
const api=module.exports,plain=v=>JSON.parse(JSON.stringify(v)),check=(v,m)=>{checks++;assert(v,m);};
const equal=(a,b,m)=>{checks++;assert.deepEqual(plain(a),plain(b),m);};
const catalog=api.bodyDisplayCatalog(api.raw),original=JSON.stringify(catalog),options=api.nestedGuidedStudyOptions(catalog);
equal(options.map(o=>o.title),['Right eye layers','Left eye layers'],'Source-labelled sides retained');
check(new Set(options.map(o=>o.id)).size===2,'Unique source study IDs');
for(const o of options){check(o.guide.steps.length===4&&o.guide.status==='draft','Complete draft only');
 equal(o.guide,api.eyeLayerGuide(o.parent),'Reuse exact existing guide');
 check(o.sourceHash.match(/^[a-f0-9]{64}$/)&&o.parentHash.match(/^[a-f0-9]{64}$/),'Actual source hashes');
 equal(api.nestedGuidedStudyOptions(catalog,'head-neck').find(x=>x.id===o.id),o,'Same source in regional and whole-body discovery');
 o.guide.steps[0].caption='Altered returned guide';check(api.nestedGuidedStudyOptions(catalog).find(x=>x.id===o.id).guide.steps[0].caption!=='Altered returned guide','Detached guidance');
}
check(JSON.stringify(catalog)===original,'No catalogue repair or geometry mutation');
for(const region of ['thorax','pelvis','unknown','head-neck?study=eye','__proto__'])equal(api.nestedGuidedStudyOptions(catalog,region),[],'Out-of-region rejection');
for(const change of [c=>{c.sourceVersion='3.0';},c=>{c.coordinateSystem.unit='foreign';}]){
 const c=structuredClone(catalog);change(c);equal(api.nestedGuidedStudyOptions(c),[],'Source/frame mismatch denies all guidance');
}
for(const o of api.nestedGuidedStudyOptions(catalog))for(const change of [
 c=>{c.structures=c.structures.filter(s=>s.id!==o.parent.id);},
 c=>{c.structures.find(s=>s.id===o.parent.id).bounds.min[0]+=1;},
 c=>{c.structures.push(structuredClone(c.structures.find(s=>s.id===o.parent.id)));},
 c=>{c.bundles.find(b=>b.id===o.parent.bundle).sha256='0'.repeat(64);},
 c=>{c.bundles.find(b=>b.id===o.parent.bundle).url='/foreign-model.glb';},
 c=>{c.bundles=c.bundles.filter(b=>b.id!==o.parent.bundle);},
 c=>{c.bundles.push(structuredClone(c.bundles.find(b=>b.id===o.parent.bundle)));},
]){
 const c=structuredClone(catalog);change(c);const valid=api.nestedGuidedStudyOptions(c);
 check(!valid.some(v=>v.id===o.id),'Missing/duplicate/changed parent or bundle denied');
 check(valid.length===1,'Other exact side independently retained, never mirrored');
}
let tree;const props={catalog,assetBase:'/atlas-runtime/head-neck',onExit:()=>exits++,region:'whole-body'};
const nodes=t=>!t||typeof t!=='object'?[]:Array.isArray(t)?t.flatMap(nodes):[t,...nodes(t.props?.children)];
const render=()=>{tree=api.WholeBodyGuidedLearning(props);};
const one=type=>{const list=nodes(tree).filter(n=>n.type===type);check(list.length===1,'One '+type);return list[0];};
render();check(nodes(tree).filter(n=>n.type==='SelectItem').length===26,'24 regional and2 nested options in one picker');
check(one('RegionalGuidedLearning').props.tour.id==='right-lower-limb-bone-orientation','Whole-body first default retained');
const keys=new Set();
for(const o of api.nestedGuidedStudyOptions(catalog)){
 one('Select').props.onValueChange(o.id);render();const eye=one('EyeLayerView');
 equal(eye.props.parent,o.parent,'Exact source parent');check(eye.props.educationCatalog===catalog,'Current education catalogue');
 check(eye.props.assetBase===props.assetBase,'Same-origin contained assets');check(eye.props.initialGuidedLearningExpanded===true,'Discoverable Start, not autoplay');
 check(eye.props.autoplay===undefined&&eye.props.initialSelectedId===undefined,'No fabricated step or incoming selection');
 check(nodes(tree).filter(n=>n.type==='RegionalGuidedLearning'||n.type==='iframe'||n.type==='a').length===0,'Single inline eye viewer, no popout');
 const container=nodes(tree).find(n=>n.props?.className==='whole-body-nested-guidance'),key=container.key;
 check(!keys.has(key),'Sides remount with their own source/guide identity');keys.add(key);
 for(const bad of [null,undefined,'eye','right-eye','__proto__']){one('Select').props.onValueChange(bad);render();check(one('EyeLayerView').props.parent.id===o.parent.id,'Unknown choice does not alter source');}
 one('Select').props.onValueChange(o.id);render();check(nodes(tree).find(n=>n.props?.className==='whole-body-nested-guidance').key===key,'Same study retains session');
 nodes(tree).find(n=>n.type==='button'&&n.props.children==='Exit tour').props.onClick();
}
check(exits===2,'Exit callback shared');
props.region='thorax';render();check(nodes(tree).filter(n=>n.type==='EyeLayerView').length===0,'Region switch unmounts previous eye');
check(one('RegionalGuidedLearning').props.tour.region==='thorax','Valid region default');
for(const o of options){one('Select').props.onValueChange(o.id);render();check(nodes(tree).filter(n=>n.type==='EyeLayerView').length===0,'Out-of-region eye choice denied');}
props.region='head-neck';selected=undefined;render();check(nodes(tree).filter(n=>n.type==='SelectItem').length===6,'Head-neck exposes its4 regional and2 nested guides');
check(one('RegionalGuidedLearning').props.tour.id==='laryngeal-framework-orientation','Head-neck default retained');
one('Select').props.onValueChange(options[0].id);render();check(one('EyeLayerView').props.parent.id===options[0].parent.id,'Head-neck exact eye');
props.catalog=structuredClone(catalog);props.catalog.bundles.find(b=>b.id===options[0].parent.bundle).sha256='0'.repeat(64);render();
check(nodes(tree).filter(n=>n.type==='EyeLayerView').length===0,'Source invalidation unmounts stale guide');
const css=readFileSync('app/whole-body-guided-learning.css','utf8');check(css.includes('whole-body-nested-guidance')&&css.includes('min-height:0'),'Inline working surface bounded');
console.log(JSON.stringify({checks,nestedGuides:2,stops:8,existingChildren:15,regionalToursRetained:24,singleInlineViewer:true,sourceGuards:true,browserAcceptance:false}));
