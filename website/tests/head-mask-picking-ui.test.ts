import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {createNativeVolumeGeometry,type Vec3} from '../lib/head-atlas-geometry.mjs';
import {canvasVoxel} from '../lib/head-atlas-practice.ts';
import {headMaskHits} from '../lib/head-mask-picking.ts';
import {headSliceKey,headSliceNumber} from '../lib/head-atlas-slice-controls.ts';
import {headDisclosureKeyDown} from '../lib/head-disclosure-keyboard.ts';
import * as viewport from '../lib/head-slice-viewport.ts';
import {createHeadViewportMemory,defaultHeadViewportFrame} from '../lib/head-viewport-memory.ts';
import type {HeadEntry,LoadedEntry,LoadedStudy} from '../lib/head-atlas-import.ts';

const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
type Node={type:unknown;props:Record<string,any>};
type Plane='axial'|'coronal'|'sagittal';
function walk(value:unknown,match:(node:Node)=>boolean):Node|undefined{
  if(Array.isArray(value)){for(const child of value){const found=walk(child,match);if(found)return found;}return;}
  if(!value||typeof value!=='object'||!('props'in value))return;
  const node=value as Node;return match(node)?node:walk(node.props.children,match);
}
function fixture(plane:Plane='axial'){
  const angle=28*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
  const affine=[[c,-s,0,0],[s,c,0,0],[0,0,1,0],[0,0,0,1]],shape=[5,5,5],point:Vec3=[2,2,2];
  const entry=(id:string):HeadEntry=>({id,label:id,family:'bst',representation:'mask',color:[1,0,0],opacity:{fill:.4,outline:.8},mask:{file:`${id}.bin`,sha256:'a'.repeat(64),dtype:'uint8',shape_kji:[1,1,1],offset_kji:[2,2,2],native_shape_kji:shape,ijk_to_ras:affine}});
  const first=entry('First mask'),second=entry('Second mask'),image={file:'native.bin',sha256:'b'.repeat(64),dtype:'int16',shape_kji:shape,ijk_to_ras:affine};
  const study:LoadedStudy={definition:{image,entries:[first,second]},data:new Int16Array(125),geometry:createNativeVolumeGeometry(image),range:[0,1]};
  const a:LoadedEntry={entry:first,mask:new Uint8Array([1])},b:LoadedEntry={entry:second,mask:new Uint8Array([1])};
  const picks:HeadEntry[]=[],answers:Vec3[]=[],changes:Vec3[]=[],crosshairMoves:number[]=[];
  let cursor=[...point] as Vec3,layers:LoadedEntry[]=[a],selected:LoadedEntry|null=null,opacity=1,layerOpacity:Record<string,number>={},overlay=true,showName=true,quiz=false,reset=0,activeStudy=study;
  const slots:unknown[]= [];let hookIndex=0,tree:Node,canvas:Node,canvasFocus=0;
  const layouts=new Map<number,{deps:unknown[];cleanup?:()=>void}>(),pendingLayouts:Array<()=>void>=[];
  const same=(a:unknown[]|undefined,b:unknown[])=>!!a&&a.length===b.length&&a.every((value,index)=>Object.is(value,b[index]));
  const hooks={
    useRef(initial:unknown){const i=hookIndex++;if(!(i in slots))slots[i]={current:initial};return slots[i];},
    useState(initial:unknown){const i=hookIndex++;if(!(i in slots))slots[i]=typeof initial==='function'?(initial as ()=>unknown)():initial;return [slots[i],(value:unknown)=>{slots[i]=typeof value==='function'?(value as (old:unknown)=>unknown)(slots[i]):value;}];},
    useEffect:()=>{},
    useLayoutEffect(create:()=>void|(()=>void),deps:unknown[]){const i=hookIndex++,old=layouts.get(i);if(!same(old?.deps,deps))pendingLayouts.push(()=>{old?.cleanup?.();const cleanup=create();layouts.set(i,{deps,cleanup:typeof cleanup==='function'?cleanup:undefined});});},
  };
  const module={exports:{} as Record<string,any>};
  new Function('require','module','exports',compiled+'\nmodule.exports.NativeSlice=NativeSlice;')((name:string)=>{
    if(name==='react')return hooks;
    if(name==='../lib/head-atlas-practice')return {canvasVoxel};
    if(name==='../lib/head-mask-picking')return {headMaskHits};
    if(name==='../lib/head-atlas-display')return {headLabel:(item:HeadEntry)=>item.label,annotationInk:()=>''};
    if(name==='../lib/head-atlas-slice-controls')return {headSliceKey,headSliceNumber};
    if(name==='../lib/head-disclosure-keyboard')return {headDisclosureKeyDown};
    if(name==='../lib/head-slice-viewport')return viewport;
    if(name==='../lib/head-viewport-memory')return {createHeadViewportMemory,defaultHeadViewportFrame};
    if(name==='react/jsx-runtime')return require(name);
    return {};
  },module,module.exports);
  function render(){
    hookIndex=0;pendingLayouts.length=0;
    tree=module.exports.NativeSlice({plane,study:activeStudy,selected,layers,groupLabels:false,opacity,layerOpacity,cursor,windowing:[40,80],overlay,regionalCourse:false,showCrosshair:false,
      onKeyboardMove:()=>crosshairMoves.push(1),onCursor:(next:Vec3)=>{cursor=[...next] as Vec3;changes.push(next);},onSelectMask:(entry:HeadEntry)=>picks.push(entry),onAnswer:quiz?(next:Vec3)=>answers.push(next):undefined,
      expanded:false,showName,viewResetVersion:reset});
    const found=walk(tree,node=>node.type==='canvas'&&node.props.role==='img');assert(found);canvas=found;
    canvas.props.ref.current={getBoundingClientRect:()=>({left:0,top:0,width:500,height:500}),focus:()=>{canvasFocus++;}};
    for(const effect of pendingLayouts)effect();
    return tree;
  }
  function click(at:Vec3=point,button=0){
    const view=activeStudy.geometry.views[plane],pixel=view.pixelFromIJK(at),x=(pixel.x+.5)*500/view.width,y=(pixel.y+.5)*500/view.height;
    canvas.props.onClick({currentTarget:canvas.props.ref.current,clientX:x,clientY:y,button});render();
  }
  const chooser=()=>walk(tree,node=>node.props.role==='group'&&node.props['aria-label']==='Masks at this point');
  const button=(text:string)=>walk(tree,node=>node.type==='button'&&node.props.children===text);
  render();
  function press(key:string,extra:Record<string,unknown>={}){let prevented=0;canvas.props.onKeyDown({key,preventDefault(){prevented++;},...extra});render();return prevented;}
  return {study,a,b,point,picks,answers,changes,crosshairMoves,press,click,render,chooser,button,get tree(){return tree;},get canvasFocus(){return canvasFocus;},get cursor(){return cursor;},
    setLayers(value:LoadedEntry[]){layers=value;render();},setSelected(value:LoadedEntry|null){selected=value;render();},setOpacity(value:number){opacity=value;render();},
    setLayerOpacity(value:Record<string,number>){layerOpacity=value;render();},setOverlay(value:boolean){overlay=value;render();},setQuiz(value:boolean){quiz=value;render();},
    setShowName(value:boolean){showName=value;render();},setReset(value:number){reset=value;render();},setCursor(value:Vec3){cursor=value;render();},
    setStudy(value:LoadedStudy){activeStudy=value;render();}};
}

for(const plane of ['axial','coronal','sagittal'] as const)test(`${plane} transformed native canvas selects one exact visible mask`,()=>{
  const f=fixture(plane);f.click();
  assert.deepEqual(f.changes,[f.point]);assert.deepEqual(f.picks,[f.a.entry]);assert.equal(f.chooser(),undefined);
  f.setLayers([]);f.click();assert.equal(f.picks.length,1);assert.equal(f.chooser(),undefined);
});

for(const plane of ['axial','coronal','sagittal'] as const)test(`${plane} keyboard exploration reveals crosshair then selects exact mask or overlap choice`,()=>{
  const f=fixture(plane);
  f.press('Enter');assert.deepEqual(f.picks,[],'no accidental selection before intentional movement');
  f.press('ArrowLeft');f.press('ArrowRight');assert.deepEqual(f.cursor,f.point);
  assert.equal(f.crosshairMoves.length,2);f.press('Enter');assert.deepEqual(f.picks,[f.a.entry]);
  f.setLayers([f.a,f.b]);f.press(' ');assert(f.chooser());assert.equal(f.picks.length,1);
  f.button('Second mask')!.props.onClick();f.render();assert.deepEqual(f.picks,[f.a.entry,f.b.entry]);
  assert.equal(f.canvasFocus,1);assert.deepEqual(f.answers,[]);
});

test('keyboard picking refuses hidden masks, pan, modified/repeated/composing keys and routes quiz only to answers',()=>{
  const f=fixture();f.press('ArrowLeft');f.press('ArrowRight');
  for(const extra of [{ctrlKey:true},{altKey:true},{metaKey:true},{repeat:true},{nativeEvent:{isComposing:true}}])f.press('Enter',extra);
  assert.deepEqual(f.picks,[]);
  f.setOverlay(false);f.press('Enter');f.setOverlay(true);
  f.setOpacity(0);f.press(' ');f.setOpacity(1);
  f.setShowName(false);f.press('Enter');f.setShowName(true);
  f.button('Pan image')!.props.onClick();f.render();f.press('Enter');f.button('Pan image')!.props.onClick();f.render();
  f.setCursor([0,0,0]);f.press('Enter');assert.deepEqual(f.picks,[]);
  f.setCursor(f.point);f.setQuiz(true);f.press('Enter');assert.deepEqual(f.answers,[f.point]);assert.deepEqual(f.picks,[]);
  const moves=f.changes.length;f.press('ArrowLeft',{nativeEvent:{isComposing:true}});assert.equal(f.changes.length,moves);
});

test('overlap opens an explicit chooser; named button selects exact entry and Dismiss/Escape restore canvas focus',()=>{
  const f=fixture();f.setLayers([f.a,f.b]);f.click();
  assert.equal(f.picks.length,0);assert(f.chooser());assert(f.button('First mask'));assert(f.button('Second mask'));assert(f.button('Dismiss'));
  f.button('Second mask')!.props.onClick();f.render();assert.deepEqual(f.picks,[f.b.entry]);assert.equal(f.chooser(),undefined);assert.equal(f.canvasFocus,1);
  f.click();f.button('Dismiss')!.props.onClick();f.render();assert.equal(f.chooser(),undefined);assert.equal(f.canvasFocus,2);
  f.click();let prevented=0,stopped=0;f.chooser()!.props.onKeyDown({key:'Escape',preventDefault(){prevented++;},stopPropagation(){stopped++;}});f.render();
  assert.equal(f.chooser(),undefined);assert.equal(f.canvasFocus,3);assert.deepEqual([prevented,stopped],[1,1]);assert.deepEqual(f.picks,[f.b.entry]);
});

test('chooser is invalidated by source, layers, selected mask, visibility, reset or cursor changes',()=>{
  const changes=[
    (f:ReturnType<typeof fixture>)=>f.setStudy({...f.study}),
    (f:ReturnType<typeof fixture>)=>f.setLayers([f.b,f.a]),
    (f:ReturnType<typeof fixture>)=>f.setSelected(f.a),
    (f:ReturnType<typeof fixture>)=>f.setOpacity(.5),
    (f:ReturnType<typeof fixture>)=>f.setLayerOpacity({'First mask':.5}),
    (f:ReturnType<typeof fixture>)=>f.setOverlay(false),
    (f:ReturnType<typeof fixture>)=>f.setReset(1),
    (f:ReturnType<typeof fixture>)=>f.setCursor([1,2,2]),
  ];
  for(const change of changes){const f=fixture();f.setLayers([f.a,f.b]);f.click();assert(f.chooser());change(f);assert.equal(f.chooser(),undefined);assert.deepEqual(f.picks,[]);}
});

test('quiz, hidden labels and pan mode suppress mask chooser and preserve quiz answer path',()=>{
  const f=fixture();f.setLayers([f.a,f.b]);f.setQuiz(true);f.click();assert.deepEqual(f.answers,[f.point]);assert.deepEqual(f.picks,[]);assert.equal(f.chooser(),undefined);
  f.setQuiz(false);f.setShowName(false);f.click();assert.equal(f.chooser(),undefined);
  f.setShowName(true);
  const pan=f.button('Pan image');assert(pan);pan.props.onClick();f.render();
  const moves=f.changes.length;f.click();assert.equal(f.changes.length,moves);assert.equal(f.chooser(),undefined);assert.deepEqual(f.picks,[]);
});

test('right and middle clicks never move the cursor, select a mask or place a quiz answer',()=>{
  for(const quiz of [false,true]){
    const f=fixture();f.setQuiz(quiz);
    for(const button of [1,2])f.click(f.point,button);
    assert.deepEqual(f.changes,[]);assert.deepEqual(f.picks,[]);assert.deepEqual(f.answers,[]);
    assert.equal(f.chooser(),undefined);
    f.click();assert.equal(f.changes.length,1);
    assert.equal(quiz?f.answers.length:f.picks.length,1);
  }
});
