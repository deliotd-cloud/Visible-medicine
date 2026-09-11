// Actual Bundle + hook with controlled React lifecycle; no WebGL/browser claim.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';
const require=createRequire(import.meta.url), React=require('react'), THREE=require('three');
const compiled=await build({stdin:{contents:"export { Bundle } from './app/body-scene'; export { bodyPresentationOffset, arrangeBodyStructures, extractionOffsets } from './lib/body-arrangement';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',plugins:[{name:'expose-bundle-for-test',setup(api){api.onLoad({filter:/body-scene\.tsx$/},async args=>({contents:(await readFile(args.path,'utf8'))+'\nexport { Bundle };',loader:'tsx',resolveDir:dirname(args.path)}));}}]});
const geometry=new THREE.BoxGeometry();geometry.clearGroups();geometry.deleteAttribute('uv');
const scene=new THREE.Group(), items=Array.from({length:8},(_,i)=>({id:'source-'+i,nodeName:'part-'+i,bundle:'test',system:'skeleton',fmaId:'test-'+i,sourceName:'test bone',name:'Test bone '+i,anchor:[i*2,0,0],bounds:{min:[-1,-1,-1],max:[1,1,1]}}));
items.forEach((s,i)=>{s.center=[i*2,0,0];const m=new THREE.Mesh(geometry);m.name=s.nodeName;scene.add(m);});
let slots=[],cursor=0,effects=[],dirty=false,capability=true,invalidations=0;
const state={gl:{extensions:{has:name=>{assert.equal(name,'WEBGL_multi_draw');return capability;}}},invalidate(){invalidations++;}};
const sameDeps=(a,b)=>a&&b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
const hooks={...React,
  useMemo(fn,deps){const i=cursor++;if(!slots[i]||!sameDeps(slots[i].deps,deps))slots[i]={deps,value:fn()};return slots[i].value;},
  useState(initial){const i=cursor++;if(!slots[i])slots[i]={value:typeof initial==='function'?initial():initial};return [slots[i].value,value=>{const next=typeof value==='function'?value(slots[i].value):value;if(!Object.is(next,slots[i].value)){slots[i].value=next;dirty=true;}}];},
  useLayoutEffect(fn,deps){const i=cursor++;if(!slots[i]||!sameDeps(slots[i].deps,deps)){const old=slots[i];slots[i]={deps,cleanup:old?.cleanup};effects.push(()=>{slots[i].cleanup?.();slots[i].cleanup=fn();});}},
  useEffect(){cursor++;},
};
const mod={exports:{}}, document={body:{style:{cursor:''}}};
runInNewContext(compiled.outputFiles[0].text,{module:mod,exports:mod.exports,Float32Array,Uint16Array,Uint32Array,document,
 require:id=>id==='react'?hooks:id==='@react-three/fiber'?{useThree:selector=>selector(state)}:id==='@react-three/drei'?{useGLTF:()=>({scene}),Line:'Line'}:require(id)});
const selected=[];
const props={catalog:{structures:items},structures:items,selectedId:null,exam:false,hiddenIds:[],isolated:false,contextIds:[],appearance:{},inspection:{plane:'off',position:50,flipped:false,opacity:{},keepSelectedSolid:true},labels:true,landmarks:[],illustrated:true,showOrigins:false,onLoaded(){},onSelect:id=>selected.push(id)};
const input={bundle:{id:'test',url:'/test.glb'},items,props,offsets:new Map(items.map((s,i)=>[s.id,new THREE.Vector3(i*2,0,0)])),frame:new THREE.Box3(new THREE.Vector3(-2,-2,-2),new THREE.Vector3(20,2,2)),labelIds:items.map(s=>s.id),renderedCount:1000,originGuide:null};
const nodes=n=>!n||typeof n!=='object'?[]:Array.isArray(n)?n.flatMap(nodes):[n,...nodes(n.props?.children)];
let transitions=0;
function render(){let tree;for(let tries=0;tries<5;tries++){cursor=0;effects=[];dirty=false;tree=mod.exports.Bundle(input);const pending=effects;effects=[];pending.forEach(fn=>fn());if(!dirty){transitions++;return nodes(tree);}}throw Error('Unstable hook lifecycle');}
const findBatch=nodes=>nodes.find(n=>n.type==='primitive');
const tissues=nodes=>nodes.filter(n=>n.type?.name==='AnatomyTissue');
let tree=render(), primitive=findBatch(tree);assert(primitive);const original=primitive.props.object;
assert.equal(tissues(tree).length,0);assert.equal(original.instanceCount,8);
assert.equal(tree.filter(n=>n.type?.name==='SceneLabel').length,8);
let stop=0;primitive.props.onClick({batchId:3,stopPropagation(){stop++;}});assert.deepEqual(selected,['source-3']);assert.equal(stop,1);
primitive.props.onPointerOver({batchId:3,stopPropagation(){stop++;}});assert.equal(document.body.style.cursor,'pointer');primitive.props.onPointerOut();assert.equal(document.body.style.cursor,'');
for(const layout of ['spatial','extract','tray']) for(const amount of [0,25,40,70,100]) {
  const origin=new THREE.Vector3(0,0,0);
  const arranged=layout==='tray'?mod.exports.arrangeBodyStructures(items,origin,'anterior').offsets:layout==='extract'?mod.exports.extractionOffsets(items,'source-3','anterior'):undefined;
  props.layout=layout;input.offsets=new Map(items.map(s=>[s.id,mod.exports.bodyPresentationOffset(s,origin,amount,layout,false,arranged)]));
  tree=render();assert.equal(findBatch(tree).props.object,original,'No reallocation during separation');
  for(const s of items) {const matrix=original.getMatrixAt(Number(s.id.split('-')[1]),new THREE.Matrix4());matrix.elements.slice(12,15).forEach((v,i)=>assert(Math.abs(v-input.offsets.get(s.id).toArray()[i])<1e-5));}
}
props.selectedId='source-3';tree=render();assert.equal(tissues(tree).length,1);assert(tissues(tree)[0].props.selected);assert.equal(original.getVisibleAt(3),false);
props.isolated=true;tree=render();assert.equal(tissues(tree).length,8);assert.equal(original.visible,false);
props.isolated=false;props.selectedId=null;props.appearance={'source-2':{opacity:0.4}};tree=render();assert.equal(tissues(tree).length,1);assert.equal(tissues(tree)[0].props.opacity,0.4);
props.appearance={};props.inspection={...props.inspection,plane:'axial'};tree=render();assert.equal(tissues(tree).length,8);assert(tissues(tree).every(n=>n.props.clippingPlanes.length===1));assert.equal(original.visible,false);
props.inspection={...props.inspection,plane:'off'};props.hiddenIds=['source-1'];tree=render();assert.equal(tissues(tree).length,1);assert(tissues(tree)[0].props.ghost);
props.hiddenIds=[];props.contextIds=['source-3'];tree=render();primitive=findBatch(tree);primitive.props.onClick({batchId:3,stopPropagation(){throw Error('Context swallowed pointer');}});assert.equal(selected.length,1);
props.contextIds=[];props.exam=true;props.selectedId='source-3';tree=render();assert.equal(tissues(tree).length,0);assert.equal(tree.filter(n=>n.type?.name==='SceneLabel').length,0);findBatch(tree).props.onClick({batchId:3,stopPropagation(){}});assert.equal(selected.length,2,'Exam answer picking remains available');
let disposals=0;original.geometry.addEventListener('dispose',()=>disposals++);
input.renderedCount=149;tree=render();assert.equal(findBatch(tree),undefined);assert.equal(tissues(tree).length,8);assert.equal(disposals,1);assert(tissues(tree).every(n=>n.props.outline));
capability=false;input.renderedCount=1000;tree=render();assert.equal(findBatch(tree),undefined);assert.equal(tissues(tree).length,8);
capability=true;tree=render();const replacement=findBatch(tree).props.object;assert.notEqual(replacement,original);assert.equal(replacement.instanceCount,8);
let replacementDisposals=0;replacement.geometry.addEventListener('dispose',()=>replacementDisposals++);slots.forEach(s=>s?.cleanup?.());assert.equal(replacementDisposals,1);assert.equal(disposals,1);
assert.equal(geometry.attributes.position.count,24);geometry.dispose();
console.log(JSON.stringify({passed:true,actualBundleTransitions:transitions,pickingAndHover:true,sourceIdentityStable:true,geometryAllocationStable:true,cutOpacityContextExamAndDeviceFallback:true,cleanup:true,browserTesting:false}));
