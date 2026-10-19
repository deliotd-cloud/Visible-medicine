import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {createNativeVolumeGeometry} from '../lib/head-atlas-geometry.mjs';
import {headSliceKey,headSliceNumber} from '../lib/head-atlas-slice-controls.ts';
import {headDisclosureKeyDown} from '../lib/head-disclosure-keyboard.ts';
import {headSliceViewport,zoomHeadSliceViewport} from '../lib/head-slice-viewport.ts';
import {canvasVoxel} from '../lib/head-atlas-practice.ts';

const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
type Node={type:unknown;props:Record<string,any>};
type Plane='axial'|'coronal'|'sagittal';
type Vec3=[number,number,number];
const fixed:{[key in Plane]:number}={axial:2,coronal:1,sagittal:0};

function walk(value:unknown,match:(node:Node)=>boolean):Node|undefined{
  if(Array.isArray(value)){for(const child of value){const found=walk(child,match);if(found)return found;}return;}
  if(!value||typeof value!=='object'||!('props'in value))return;
  const node=value as Node;
  return match(node)?node:walk(node.props.children,match);
}

function fixture(plane:Plane,options:{quiz?:boolean;oblique?:boolean;cursor?:Vec3;quizPick?:Vec3}={}){
  const cursor=options.cursor??[2,1,3] as Vec3,axis=fixed[plane],changes:Vec3[]=[],answers:Vec3[]=[],crosshairMoves:string[]=[];
  const angle=options.oblique?28*Math.PI/180:0,c=Math.cos(angle),s=Math.sin(angle);
  const geometry=createNativeVolumeGeometry({shape_kji:[5,5,5],ijk_to_ras:[[c,-s,0,0],[s,c,0,0],[0,0,1,0],[0,0,0,1]]});
  const view=geometry.views[plane];
  assert.equal(view.fixedAxisIJK,axis);
  assert.equal(view.oblique,options.oblique??false);
  let study={geometry};
  let currentCursor=[...cursor] as Vec3,hookIndex=0,tree:Node,canvas:Node;
  const hookSlots:unknown[]=[];
  const hooks={
    useRef(initial:unknown){const index=hookIndex++;if(!(index in hookSlots))hookSlots[index]={current:initial};return hookSlots[index];},
    useState(initial:unknown){const index=hookIndex++;if(!(index in hookSlots))hookSlots[index]=initial;
      return [hookSlots[index],(value:unknown)=>{hookSlots[index]=typeof value==='function'?(value as (old:unknown)=>unknown)(hookSlots[index]):value;}];},
    useEffect:()=>{},
  };
  const loaded={exports:{} as Record<string,any>};
  new Function('require','module','exports',compiled+'\nmodule.exports.NativeSlice=NativeSlice;')((name:string)=>{
    if(name==='react')return hooks;
    if(name==='../lib/head-atlas-slice-controls')return {headSliceKey,headSliceNumber};
    if(name==='../lib/head-disclosure-keyboard')return {headDisclosureKeyDown};
    if(name==='../lib/head-atlas-display')return {headLabel:(entry:{label:string})=>entry.label,annotationInk:()=>''};
    if(name==='../lib/head-atlas-practice')return {canvasVoxel};
    if(name==='../lib/head-slice-viewport')return {headSliceViewport,zoomHeadSliceViewport};
    if(name==='react/jsx-runtime')return require(name);
    return {};
  },loaded,loaded.exports);
  function rerender(){
    hookIndex=0;
    tree=loaded.exports.NativeSlice({plane,study,selected:null,layers:[],groupLabels:false,
      opacity:1,layerOpacity:{},cursor:currentCursor,windowing:[40,80],overlay:false,regionalCourse:false,showCrosshair:false,
      onKeyboardMove:()=>crosshairMoves.push('move'),onCursor:(point:Vec3)=>{currentCursor=[...point] as Vec3;changes.push(point);},
      expanded:false,showName:false,quizPick:options.quizPick??null,
      onAnswer:options.quiz?(point:Vec3)=>answers.push(point):undefined});
    const found=walk(tree,node=>node.type==='canvas'&&node.props.role==='img');assert(found);canvas=found;
    return tree;
  }
  rerender();
  function press(key:string,modifiers:Record<string,boolean>={}){
    let prevented=0;
    canvas.props.onKeyDown({key,ctrlKey:false,altKey:false,metaKey:false,shiftKey:false,...modifiers,
      preventDefault:()=>{prevented++;}});
    return prevented;
  }
  function button(label:string){const found=walk(tree,node=>node.type==='button'&&node.props['aria-label']===label);assert(found,`button ${label}`);return found;}
  function textButton(label:string){const found=walk(tree,node=>node.type==='button'&&node.props.children===label);assert(found,`button ${label}`);return found;}
  function numberInput(){const found=walk(tree,node=>node.type==='input'&&node.props['aria-label']===`${plane} slice number`);assert(found);return found;}
  return {get tree(){return tree;},get canvas(){return canvas;},press,rerender,button,textButton,numberInput,changes,answers,crosshairMoves,cursor,
    replaceStudy(){study={geometry};rerender();},get currentCursor(){return currentCursor;},axis,view};
}

test('direct slice numbers accept only bounded one-based whole numbers',()=>{
  for(const [value,expected] of [['1',0],['5',4],[' 03 ',2]] as const)assert.equal(headSliceNumber(value,5),expected);
  for(const value of ['', ' ', '0', '-1', '6', '2.5', '1e0', '0x1', '+2', 'NaN', 'Infinity', '9007199254740992', '2x'])assert.equal(headSliceNumber(value,5),null,value);
  for(const count of [0,-1,1.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1])assert.equal(headSliceNumber('1',count),null);
  assert.equal(headSliceNumber('1',1),0);
});

test('typed slice navigation commits on Enter or blur, preserving in-plane coordinates and quiz answers',()=>{
  for(const plane of ['axial','coronal','sagittal'] as const)for(const quiz of [false,true]){
    const f=fixture(plane,{quiz,oblique:true});
    const type=(value:string)=>{f.numberInput().props.onChange({target:{value}});f.rerender();};
    const key=(key:string,extra:Record<string,unknown>={})=>f.numberInput().props.onKeyDown({key,currentTarget:{value:f.numberInput().props.value},preventDefault(){},stopPropagation(){},...extra});
    type('5');assert.equal(f.changes.length,0,'typing is not a cursor move');key('Enter');f.rerender();
    assert.deepEqual(f.currentCursor,f.cursor.map((value,index)=>index===f.axis?4:value));assert.equal(f.numberInput().props.value,'5');
    type('1');f.numberInput().props.onBlur({currentTarget:{value:'1'}});f.rerender();
    assert.deepEqual(f.currentCursor,f.cursor.map((value,index)=>index===f.axis?0:value));
    type('4');key('Escape');f.rerender();assert.equal(f.numberInput().props.value,'1');
    const count=f.changes.length;key('Enter');f.rerender();assert.equal(f.changes.length,count,'same slice is a no-op');
    for(const modifier of ['altKey','ctrlKey','metaKey']){type('3');key('Enter',{[modifier]:true});assert.equal(f.changes.length,count);}
    key('Enter',{nativeEvent:{isComposing:true}});assert.equal(f.changes.length,count);
    assert.equal(f.answers.length,0);assert.equal(f.crosshairMoves.length,0);
  }
});

test('invalid slice entry reports bounds without clamping and external navigation discards its stale display',()=>{
  for(const plane of ['axial','coronal','sagittal'] as const){
    const f=fixture(plane,{quiz:true});
    for(const value of ['','0','6','2.5','bad']){
      f.numberInput().props.onChange({target:{value}});f.rerender();
      f.numberInput().props.onBlur({currentTarget:{value}});f.rerender();
      assert.equal(f.numberInput().props['aria-invalid'],true);assert.equal(f.changes.length,0);assert.equal(f.numberInput().props.value,value);
      const html=renderToStaticMarkup(f.tree as React.ReactNode);assert.match(html,/Enter a whole slice number from 1 to 5/);assert.match(html,/role="alert"/);
    }
    f.press('End');f.rerender();assert.equal(f.numberInput().props.value,'5');assert.equal(f.numberInput().props['aria-invalid'],undefined);
    f.numberInput().props.onChange({target:{value:'2'}});f.rerender();assert.equal(f.numberInput().props.value,'2');
    f.replaceStudy();assert.equal(f.numberInput().props.value,'5','a replacement study never inherits the uncommitted number');
    assert.equal(f.answers.length,0);
  }
});

test('PageUp/PageDown/Home/End clamp to the valid native slice and reject malformed input',()=>{
  assert.equal(headSliceKey('PageUp',2,5),1);
  assert.equal(headSliceKey('PageDown',2,5),3);
  assert.equal(headSliceKey('Home',2,5),0);
  assert.equal(headSliceKey('End',2,5),4);
  assert.equal(headSliceKey('PageUp',0,5),0);
  assert.equal(headSliceKey('PageDown',4,5),4);
  for(const key of ['PageUp','PageDown','Home','End'])assert.equal(headSliceKey(key,0,1),0);
  for(const key of ['ArrowUp','Enter',' ','pageup','Escape'])assert.equal(headSliceKey(key,2,5),null);
  for(const count of [0,-1,1.5,NaN,Infinity])assert.equal(headSliceKey('End',0,count),null);
  for(const slice of [-1,5,1.5,NaN,Infinity])assert.equal(headSliceKey('Home',slice,5),null);
});

test('each native plane changes only its fixed axis, including reversed and oblique views',()=>{
  for(const plane of ['axial','coronal','sagittal'] as const)for(const oblique of [false,true]){
    const f=fixture(plane,{oblique});
    const current=f.cursor[f.axis];
    for(const [key,expected] of [['PageUp',Math.max(0,current-1)],['PageDown',Math.min(4,current+1)],['Home',0],['End',4]] as const){
      assert.equal(f.press(key),1,`${plane} ${key} prevents page scroll`);
      assert.deepEqual(f.changes.at(-1),f.cursor.map((value,index)=>index===f.axis?expected:value),`${plane} ${key} keeps in-plane axes`);
    }
    assert.equal(f.answers.length,0);
    assert.equal(f.crosshairMoves.length,0,'slice paging does not reveal a locate answer crosshair');
  }
});

test('quiz paging never places an answer; modified shortcuts leave native controls alone',()=>{
  for(const plane of ['axial','coronal','sagittal'] as const){
    const f=fixture(plane,{quiz:true,oblique:true});
    for(const key of ['PageUp','PageDown','Home','End']){
      assert.equal(f.press(key),1);
      f.rerender();
      assert.equal(f.press('Enter'),1);
      assert.equal(f.press(' '),1);
      assert.equal(f.answers.length,0);
      assert.equal(f.crosshairMoves.length,0);
    }
    const prior=f.changes.length;
    for(const modifier of ['ctrlKey','altKey','metaKey'])for(const key of ['PageUp','PageDown','Home','End']){
      assert.equal(f.press(key,{[modifier]:true}),0);
      assert.equal(f.changes.length,prior);
      assert.equal(f.answers.length,0);
    }
  }
});

test('arrows and answer keys retain their existing separate behavior',()=>{
  const plain=fixture('axial'),quiz=fixture('axial',{quiz:true});
  assert.equal(plain.press('ArrowLeft'),1);
  assert.equal(plain.changes.length,1);
  assert.equal(plain.changes[0][plain.axis],plain.cursor[plain.axis]);
  plain.rerender();
  assert.equal(quiz.press('ArrowRight'),1);
  assert.equal(quiz.crosshairMoves.length,1);
  assert.equal(quiz.answers.length,0);
  const firstMove=[...quiz.currentCursor] as Vec3;
  quiz.rerender();
  assert.equal(quiz.press('Enter'),1);
  assert.deepEqual(quiz.answers,[firstMove], 'Enter answers the latest arrow-selected voxel after rerender');
  assert.equal(quiz.press('ArrowUp'),1);
  const secondMove=[...quiz.currentCursor] as Vec3;
  quiz.rerender();
  assert.equal(quiz.press(' '),1);
  assert.deepEqual(quiz.answers,[firstMove,secondMove], 'Space answers the latest arrow-selected voxel after rerender');
  assert.equal(plain.press('Enter'),0);
  assert.equal(plain.press(' '),0);
  const picked=fixture('sagittal',{quiz:true,quizPick:[2,1,3]});
  assert.equal(picked.press('Enter'),1);
  assert.deepEqual(picked.answers,[[2,1,3]],'an existing quiz pick still enables Enter without an arrow');
});

test('image zoom keys and buttons respect limits, modifiers, and fit reset',()=>{
  const f=fixture('axial');
  const zoom=()=>Number(String(f.canvas.props['aria-label']).match(/zoom (\d+)%/)?.[1]);
  assert.equal(zoom(),100);
  assert.equal(f.press('+'),1);f.rerender();assert.equal(zoom(),125);
  assert.equal(f.press('='),1);f.rerender();assert.equal(zoom(),150);
  assert.equal(f.press('-'),1);f.rerender();assert.equal(zoom(),125);
  for(const modifier of ['ctrlKey','altKey','metaKey'])for(const key of ['+','=','-','0']){
    assert.equal(f.press(key,{[modifier]:true}),0);f.rerender();assert.equal(zoom(),125);
  }
  for(let i=0;i<20;i++){f.press('+');f.rerender();}
  assert.equal(zoom(),400);assert.equal(f.button('axial zoom in').props.disabled,true);
  f.button('axial zoom out').props.onClick();f.rerender();assert.equal(zoom(),375);
  f.textButton('Fit image').props.onClick();f.rerender();assert.equal(zoom(),100);
  assert.equal(f.button('axial zoom out').props.disabled,true);
  f.button('axial zoom in').props.onClick();f.rerender();assert.equal(zoom(),125);
  assert.equal(f.press('0'),1);f.rerender();assert.equal(zoom(),100);
});

test('Pan mode captures only a left pointer, clamps drag, and suppresses click and answer',()=>{
  const f=fixture('coronal',{quiz:true,quizPick:[2,1,3]});
  for(let i=0;i<4;i++){f.press('+');f.rerender();}
  f.textButton('Pan image').props.onClick();f.rerender();
  assert.equal(f.textButton('Pan image').props['aria-pressed'],true);
  assert.equal(f.press('Enter'),1);assert.equal(f.answers.length,0);
  let captures=0,releases=0;
  const element={focus:()=>{},setPointerCapture:()=>captures++,hasPointerCapture:()=>true,releasePointerCapture:()=>releases++,getBoundingClientRect:()=>({left:0,top:0,width:300,height:300})};
  const pointer=(button:number,pointerId:number,clientX:number,clientY:number)=>({button,pointerId,clientX,clientY,currentTarget:element,preventDefault:()=>{}});
  f.canvas.props.onPointerDown(pointer(2,1,0,0));assert.equal(captures,0);
  f.canvas.props.onPointerDown(pointer(0,1,0,0));assert.equal(captures,1);
  const initialLeft=f.canvas.props.style.left;
  f.canvas.props.onPointerMove(pointer(0,2,1000,1000));f.rerender();assert.equal(f.canvas.props.style.left,initialLeft,'unrelated pointer cannot move image');
  f.canvas.props.onPointerMove(pointer(0,1,1000,1000));f.rerender();
  assert.equal(f.canvas.props.style.left,0,'drag reaches the horizontal blank-edge limit');
  assert.equal(f.canvas.props.style.top,0,'drag reaches the vertical blank-edge limit');
  f.canvas.props.onClick({currentTarget:element,clientX:150,clientY:150});assert.equal(f.answers.length,0);
  f.canvas.props.onPointerUp(pointer(0,1,1000,1000));assert.equal(releases,1);
  f.canvas.props.onPointerMove(pointer(0,1,-1000,-1000));f.rerender();assert.equal(f.canvas.props.style.left,0,'released drag no longer moves');
  f.canvas.props.onPointerDown(pointer(0,3,0,0));f.canvas.props.onPointerCancel(pointer(0,3,0,0));
  f.canvas.props.onPointerMove(pointer(0,3,-1000,-1000));f.rerender();assert.equal(f.canvas.props.style.left,0,'cancelled drag no longer moves');
  f.canvas.props.onPointerDown(pointer(0,4,0,0));f.canvas.props.onLostPointerCapture(pointer(0,4,0,0));
  f.canvas.props.onPointerMove(pointer(0,4,-1000,-1000));f.rerender();assert.equal(f.canvas.props.style.left,0,'lost capture ends drag');
  f.textButton('Pan image').props.onClick();f.rerender();
  assert.equal(f.textButton('Pan image').props['aria-pressed'],false);
  assert.equal(f.press('Enter'),1);assert.deepEqual(f.answers,[[2,1,3]]);
});

test('Pan mode arrow keys move the viewport with Shift acceleration without moving the voxel cursor',()=>{
  const f=fixture('sagittal',{quiz:true,quizPick:[2,1,3]});
  for(let i=0;i<4;i++){f.press('+');f.rerender();}
  f.textButton('Pan image').props.onClick();f.rerender();
  const left=f.canvas.props.style.left,top=f.canvas.props.style.top;
  assert.equal(f.press('ArrowRight'),1);f.rerender();assert.equal(f.canvas.props.style.left,left+20);
  assert.equal(f.press('ArrowDown',{shiftKey:true}),1);f.rerender();assert.equal(f.canvas.props.style.top,top+40);
  for(let i=0;i<30;i++){f.press('ArrowRight');f.rerender();}
  assert.equal(f.canvas.props.style.left,0,'keyboard pan clamps at the last nonblank edge');
  assert.equal(f.changes.length,0,'pan keys do not move the anatomical cursor');
  assert.equal(f.crosshairMoves.length,0,'pan keys do not reveal quiz crosshair');
  assert.equal(f.press('Enter'),1);assert.equal(f.answers.length,0);
  f.textButton('Pan image').props.onClick();f.rerender();
  assert.equal(f.press('ArrowLeft'),1);assert.equal(f.changes.length,1,'arrow resumes voxel navigation with Pan off');
});

test('click after panning off uses zoomed rectangle for exact native voxel scoring',()=>{
  for(const plane of ['axial','coronal','sagittal'] as const){
    const f=fixture(plane,{quiz:true});
    f.press('+');f.rerender();f.press('+');f.rerender();
    f.textButton('Pan image').props.onClick();f.rerender();
    const element={focus:()=>{},setPointerCapture:()=>{},hasPointerCapture:()=>true,releasePointerCapture:()=>{}};
    const pointer=(clientX:number,clientY:number)=>({button:0,pointerId:5,clientX,clientY,currentTarget:element,preventDefault:()=>{}});
    f.canvas.props.onPointerDown(pointer(0,0));f.canvas.props.onPointerMove(pointer(30,-20));f.rerender();f.canvas.props.onPointerUp(pointer(30,-20));
    f.textButton('Pan image').props.onClick();f.rerender();
    const style=f.canvas.props.style,rect={left:100+style.left,top:200+style.top,width:style.width,height:style.height};
    const pixel={x:2,y:3},point=f.view.pixelToIJK(pixel.x,pixel.y,f.currentCursor[f.axis]);
    const x=rect.left+(pixel.x+.5)*rect.width/f.view.width,y=rect.top+(pixel.y+.5)*rect.height/f.view.height;
    f.canvas.props.onClick({currentTarget:{getBoundingClientRect:()=>rect},clientX:x,clientY:y,button:0});
    assert.deepEqual(f.answers,[point],`${plane} answer follows zoomed and panned native pixel`);
    assert.deepEqual(f.changes.at(-1),point);
  }
});

test('plane-specific collapsed shortcut help is always described without quiz target text',()=>{
  const ids=new Set<string>();
  for(const plane of ['axial','coronal','sagittal'] as const)for(const quiz of [false,true]){
    const f=fixture(plane,{quiz}),description=String(f.canvas.props['aria-describedby']??'');
    const shortcutId=description.split(/\s+/).find(id=>id.includes(plane));
    assert(shortcutId,`${plane} has plane-specific help`);
    ids.add(shortcutId);
    assert.equal(description.includes('head-quiz-instructions'),quiz);
    const html=renderToStaticMarkup(f.tree as React.ReactNode);
    assert(html.includes(`id="${shortcutId}"`));
    assert.match(html,/Keyboard controls/);
    for(const key of ['Page Up','Page Down','Home','End','Arrow'])assert.match(html,new RegExp(key,'i'));
    assert.doesNotMatch(html,/<details[^>]*\sopen(?:\s|=|>)/);
    if(quiz)assert.doesNotMatch(html,/Pons|caudate|hippocampus|correct answer/i);
  }
  assert.equal(ids.size,3);
  assert.doesNotMatch(source,/localStorage|sessionStorage|indexedDB|postMessage/);
});
