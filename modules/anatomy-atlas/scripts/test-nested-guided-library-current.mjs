import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from './workspace-component-test-build.mjs';

const require=createRequire(import.meta.url),React=require('react');
const compiled=await build({stdin:{contents:`export {WholeBodyGuidedLearning,wholeBodyTourOptions} from './app/whole-body-guided-learning';
export {nestedGuidedStudyOptions} from './lib/nested-guided-learning';
export {nestedStudyTargets} from './lib/nested-anatomy';
export {bodyDisplayCatalog} from './lib/body-display-catalog';
export {eyeLayerGuide} from './lib/eye-layer-guide';
export {ventricularGuide} from './lib/ventricular-guide';
export {cardiacCavityGuide} from './lib/cardiac-cavity-guide';
export {default as raw} from './public/models/bodyparts3d/full-body/catalog.json';`,resolveDir:process.cwd(),loader:'tsx'},
 bundle:true,write:false,platform:'node',format:'cjs',loader:{'.css':'empty'},plugins:[{name:'observable-nested-children',setup(api){
  api.onLoad({filter:/[\\/]app[\\/]regional-guided-learning\.tsx$/},()=>({contents:'export const RegionalGuidedLearning="RegionalGuidedLearning";',loader:'js'}));
  api.onLoad({filter:/[\\/]app[\\/]eye-layers\.tsx$/},()=>({contents:'export const EyeLayerView="EyeLayerView";',loader:'js'}));
  api.onLoad({filter:/[\\/]app[\\/]ventricles\.tsx$/},()=>({contents:'export const VentricularView="VentricularView";',loader:'js'}));
  api.onLoad({filter:/[\\/]components[\\/]ui[\\/]select\.tsx$/},()=>({contents:'export const Select="Select",SelectContent="SelectContent",SelectItem="SelectItem",SelectTrigger="SelectTrigger",SelectValue="SelectValue";',loader:'js'}));
 }}]});
let slots=[],cursor=0,exits=0,checks=0;const deferred=[],module={exports:{}};
runInNewContext(compiled.outputFiles[0].text,{module,exports:module.exports,structuredClone,
 require:id=>id==='next/dynamic'?(_loader,options)=>{deferred.push(options);return deferred.length===1?'EyeLayerView':'VentricularView';}:
 id==='react'?{...React,useId:()=>':nested-current-picker:',useState:v=>{const i=cursor++;
  if(!(i in slots))slots[i]=typeof v==='function'?v():v;
  return[slots[i],next=>{slots[i]=typeof next==='function'?next(slots[i]):next;}];}}:require(id)});
const api=module.exports,plain=v=>JSON.parse(JSON.stringify(v));
const check=(value,message)=>{checks++;assert(value,message);};
const equal=(actual,expected,message)=>{checks++;assert.deepEqual(plain(actual),plain(expected),message);};
const catalog=api.bodyDisplayCatalog(api.raw),original=JSON.stringify(catalog);
const options=api.nestedGuidedStudyOptions(catalog);
const identities=[
 {id:'eye-layer-guide:vm:anatomy:body:head-neck:right:organ:right-eyeball',kind:'eye',title:'Right eye layers',parentId:'vm:anatomy:body:head-neck:right:organ:right-eyeball'},
 {id:'cardiac-cavity-guide:vm:anatomy:body:thorax:unpaired:organ:heart',kind:'cardiac',title:'Heart chamber spaces',parentId:'vm:anatomy:body:thorax:unpaired:organ:heart'},
 {id:'ventricular-guide:vm:anatomy:body:head-neck:midline:organ:brain',kind:'ventricles',title:'Ventricular spaces',parentId:'vm:anatomy:body:head-neck:midline:organ:brain'},
 {id:'eye-layer-guide:vm:anatomy:body:head-neck:left:organ:left-eyeball',kind:'eye',title:'Left eye layers',parentId:'vm:anatomy:body:head-neck:left:organ:left-eyeball'},
];
equal(options.map(({id,kind,title,parent})=>({id,kind,title,parentId:parent.id})),identities,'Exactly four source-labelled choices in current order');
equal(options.filter(o=>o.kind!=='cardiac').map(({id,kind,title,parent})=>({id,kind,title,parentId:parent.id})),
 identities.filter(o=>o.kind!=='cardiac'),'Original three choices retain their order and identity');
check(new Set(options.map(o=>o.id)).size===4,'Four distinct study IDs');
check(deferred.length===2,'Both nested viewers remain deferred');
for(const option of options){
 check(option.region===(option.kind==='cardiac'?'thorax':'head-neck')&&option.guide.status==='draft','Source-region draft guidance only');
 check(option.guide.parentId===option.parent.id&&option.guide.study===option.kind&&option.guide.id===option.id,'Guide identity matches the choice');
 equal(option.guide,option.kind==='eye'?api.eyeLayerGuide(option.parent):option.kind==='cardiac'?api.cardiacCavityGuide(option.parent):api.ventricularGuide(option.parent),'Reuse the exact existing guide');
 check(option.guide.steps.length===(option.kind==='eye'?4:option.kind==='cardiac'?6:5),'Complete existing guide');
 check(/^[a-f0-9]{64}$/.test(option.sourceHash)&&/^[a-f0-9]{64}$/.test(option.parentHash),'Source hashes present');
 const parentBundles=catalog.bundles.filter(b=>b.id===option.parent.bundle);
 check(parentBundles.length===1&&parentBundles[0].sha256===option.parentHash,'Exact sole parent bundle hash');
 const targets=api.nestedStudyTargets(catalog).filter(t=>t.parentId===option.parent.id&&t.study===option.kind);
 const guidedIds=new Set(option.guide.steps.flatMap(step=>step.ids));
 check(targets.length===guidedIds.size&&targets.every(t=>guidedIds.has(t.structureId)&&t.parentHash===option.parentHash&&t.sourceHash===option.sourceHash),'Every guide target has the same pinned parent and child source');
 equal(api.nestedGuidedStudyOptions(catalog,option.region).find(o=>o.id===option.id),option,'Same source identity in regional discovery');
}
check(JSON.stringify(catalog)===original,'No catalogue or geometry repair');
equal(api.nestedGuidedStudyOptions(catalog,'thorax').map(o=>o.id),[identities[1].id],'Thorax exposes only the exact heart guide');
equal(api.nestedGuidedStudyOptions(catalog,'head-neck').map(o=>o.id),[identities[0].id,identities[2].id,identities[3].id],'Head-neck retains exactly the original three guides');
for(const region of ['pelvis','missing','head-neck?study=eye','__proto__'])equal(api.nestedGuidedStudyOptions(catalog,region),[],'Out-of-region discovery rejected');
for(const change of [c=>{c.sourceVersion='3.0';},c=>{c.coordinateSystem.unit='foreign';}]){
 const changed=structuredClone(catalog);change(changed);equal(api.nestedGuidedStudyOptions(changed),[],'Version or frame mismatch rejects every choice');
}
for(const option of options)for(const change of [
 c=>{c.structures=c.structures.filter(s=>s.id!==option.parent.id);},
 c=>{c.structures.find(s=>s.id===option.parent.id).bounds.min[0]+=1;},
 c=>{c.structures.push(structuredClone(c.structures.find(s=>s.id===option.parent.id)));},
]){
 const changed=structuredClone(catalog);change(changed);
 const actual=api.nestedGuidedStudyOptions(changed);
 equal(actual.map(o=>o.id),options.filter(o=>o.id!==option.id).map(o=>o.id),'Only affected parent choice denied; exact other three retained');
 check(JSON.stringify(changed)!==original&&JSON.stringify(catalog)===original,'No mutation, mirroring or catalogue repair');
}
for(const bundleId of new Set(options.map(o=>o.parent.bundle)))for(const change of [
 c=>{c.bundles=c.bundles.filter(b=>b.id!==bundleId);},
 c=>{c.bundles.find(b=>b.id===bundleId).sha256='0'.repeat(64);},
 c=>{c.bundles.find(b=>b.id===bundleId).url='/foreign-model.glb';},
 c=>{c.bundles.push(structuredClone(c.bundles.find(b=>b.id===bundleId)));},
]){
 const changed=structuredClone(catalog);change(changed);
 equal(api.nestedGuidedStudyOptions(changed).map(o=>o.id),options.filter(o=>o.parent.bundle!==bundleId).map(o=>o.id),'Invalid bundle rejects only choices sharing that source; independent bundle retained');
 check(JSON.stringify(catalog)===original,'No catalogue repair after bundle rejection');
}

const props={catalog,assetBase:'/atlas-runtime/head-neck',onExit:()=>exits++,region:'whole-body'};
const nodes=t=>!t||typeof t!=='object'?[]:Array.isArray(t)?t.flatMap(nodes):[t,...nodes(t.props?.children)];
let tree;const render=()=>{cursor=0;tree=api.WholeBodyGuidedLearning(props);};
const one=type=>{const found=nodes(tree).filter(n=>n.type===type);check(found.length===1,'One '+type);return found[0];};
const nestedNode=()=>nodes(tree).find(n=>n.props?.className==='whole-body-nested-guidance');
const picker=()=>nodes(tree).find(n=>n.type==='select'&&n.props?.['aria-label']==='Choose a tour')?.props;
const pickerOptions=()=>nodes(tree).find(n=>n.type==='select'&&n.props?.['aria-label']==='Choose a tour');
const choose=id=>picker().onChange({target:{value:id}});
render();check(api.wholeBodyTourOptions.length===51,'Exact 51-tour regional union at source 840fcbf7');
check(nodes(pickerOptions()).filter(n=>n.type==='option').length===55,'51 regional and exactly four nested whole-body choices');
check(one('RegionalGuidedLearning').props.tour.id==='right-lower-limb-bone-orientation','Existing whole-body default');
const keys=new Set();
for(const option of options){
 choose(option.id);render();
 const child=one(option.kind==='eye'?'EyeLayerView':'VentricularView');
 equal(child.props.parent,option.parent,'Exact source parent passed to child');
 check(child.props.educationCatalog===catalog&&child.props.assetBase===props.assetBase,'Current catalog and contained asset base');
 check(child.props.initialGuidedLearningExpanded===true&&child.props.autoplay===undefined&&child.props.initialSelectedId===undefined,'Visible explicit Start, no autoplay or fabricated step');
 if(option.kind!=='eye')check(child.props.study===option.kind,'Shared ventricular viewer receives exact named study');
 else check(child.props.study===undefined,'Eye viewer keeps eye study');
 check(nodes(tree).filter(n=>n.type==='RegionalGuidedLearning'||n.type==='iframe'||n.type==='a').length===0,'Single inline nested viewer');
 const key=nestedNode()?.key;check(typeof key==='string'&&key.includes(option.id)&&key.includes(option.parentHash)&&key.includes(option.sourceHash),'Remount key binds study and source hashes');
 check(key.includes(JSON.stringify(option.guide))&&!keys.has(key),'Distinct guide identity remounts each nested viewer');keys.add(key);
 for(const bad of [null,undefined,'eye','ventricles','cardiac','missing','__proto__']){
  choose(bad);render();check(one(option.kind==='eye'?'EyeLayerView':'VentricularView').props.parent.id===option.parent.id,'Invalid choice preserves current study');
 }
 choose(option.id);render();check(nestedNode().key===key,'Re-selecting same study preserves session');
 nodes(tree).find(n=>n.type==='button'&&n.props.children==='Exit tour').props.onClick();
}
check(exits===4,'Shared Exit for all four nested tours');
props.region='thorax';render();check(!nestedNode(),'Changing region invalidates nested selection');
check(one('RegionalGuidedLearning').props.tour.region==='thorax','Valid regional fallback');
for(const option of options.filter(o=>o.region!=='thorax')){choose(option.id);render();check(!nestedNode(),'Out-of-region nested choice rejected');}
const cardiac=options.find(o=>o.kind==='cardiac');
choose(cardiac.id);render();
check(one('VentricularView').props.study==='cardiac'&&nestedNode()?.key.includes(cardiac.id),'Exact heart guide remains available in thorax');
props.region='head-neck';slots=[];render();
check(nodes(pickerOptions()).filter(n=>n.type==='option').length===11,'Eight regional and exactly three nested head-neck choices');
check(one('RegionalGuidedLearning').props.tour.id==='laryngeal-framework-orientation','Head-neck default retained');
const ventricular=options.find(o=>o.kind==='ventricles');
choose(ventricular.id);render();check(one('VentricularView').props.parent.id===ventricular.parent.id,'Head-neck ventricular route');
props.catalog=structuredClone(catalog);props.catalog.bundles.find(b=>b.id===ventricular.parent.bundle).sha256='0'.repeat(64);render();
check(!nestedNode()&&one('RegionalGuidedLearning').props.tour.region==='head-neck','Invalidated source unmounts stale ventricular guide');
console.log(JSON.stringify({checks,nestedGuides:4,regionalToursRetained:51,wholeBodyChoices:55,headNeckChoices:11,sourceGuards:true,sharedExit:true,browserAcceptance:false}));
