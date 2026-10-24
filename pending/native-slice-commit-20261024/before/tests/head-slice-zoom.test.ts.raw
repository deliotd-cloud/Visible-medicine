import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {createNativeVolumeGeometry} from '../lib/head-atlas-geometry.mjs';
import {headDisclosureKeyDown} from '../lib/head-disclosure-keyboard.ts';
import {headSliceViewport,zoomHeadSliceViewport,fitHeadMaskViewport,nearestHeadMaskSlice} from '../lib/head-slice-viewport.ts';

const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
type Node={type:unknown;props:Record<string,any>};
const walk=(value:unknown,match:(node:Node)=>boolean):Node|undefined=>{
  if(Array.isArray(value)){for(const item of value){const found=walk(item,match);if(found)return found;}return;}
  if(!value||typeof value!=='object'||!('props'in value))return;
  const node=value as Node;return match(node)?node:walk(node.props.children,match);
};

test('NativeSlice reuses native raster on zoom/pan and rebuilds for slice, window, and mask changes',()=>{
  const originalResizeObserver=(globalThis as any).ResizeObserver;
  (globalThis as any).ResizeObserver=class {observe(){} disconnect(){}};
  try{
    const geometry=createNativeVolumeGeometry({shape_kji:[5,5,5],ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]});
    const study={geometry,data:new Int16Array(125)};
    const slots:unknown[]=[],effects=new Map<number,{deps:unknown[];cleanup?:()=>void}>();
    let hook=0,creates=0,renders=0,tree:Node|undefined;
    const same=(a:unknown[]|undefined,b:unknown[])=>!!a&&a.length===b.length&&a.every((value,index)=>Object.is(value,b[index]));
    const pending:Array<()=>void>=[];
    const hooks={
      useState(initial:unknown){const index=hook++;if(!(index in slots))slots[index]=initial;return [slots[index],(value:unknown)=>{slots[index]=typeof value==='function'?(value as (previous:unknown)=>unknown)(slots[index]):value;}];},
      useRef(initial:unknown){const index=hook++;if(!(index in slots))slots[index]={current:initial};return slots[index];},
      useEffect(create:()=>void|(()=>void),deps:unknown[]){const index=hook++,old=effects.get(index);if(!same(old?.deps,deps))pending.push(()=>{old?.cleanup?.();const cleanup=create();effects.set(index,{deps,cleanup:typeof cleanup==='function'?cleanup:undefined});});},
    };
    const nativeCtx={createImageData:(width:number,height:number)=>{creates++;return {data:new Uint8ClampedArray(width*height*4)};},putImageData:()=>{renders++;}};
    const annotationCtx={};
    const nativeCanvas={width:0,height:0,getContext:()=>nativeCtx};
    const annotationCanvas={width:0,height:0,getContext:()=>annotationCtx};
    const area={clientWidth:320,clientHeight:300};
    const loaded={exports:{} as Record<string,any>};
    new Function('require','module','exports',compiled+'\nmodule.exports.NativeSlice=NativeSlice;')((name:string)=>{
      if(name==='react')return hooks;
      if(name==='../lib/head-disclosure-keyboard')return {headDisclosureKeyDown};
      if(name==='react/jsx-runtime')return require(name);
      if(name==='../lib/head-slice-viewport')return {headSliceViewport,zoomHeadSliceViewport,fitHeadMaskViewport,nearestHeadMaskSlice};
      if(name==='../lib/head-atlas-display')return {headLabel:()=>'',annotationInk:()=>''};
      if(name==='../lib/head-atlas-overlays')return {layoutHeadLabels:()=>({labels:[],omitted:0})};
      if(name==='../lib/slice-wheel.mjs')return {bindSliceWheel:()=>()=>{}};
      return {};
    },loaded,loaded.exports);
    let cursor:[number,number,number]=[2,2,2],windowing:[number,number]=[40,80],selected:unknown=null,viewResetVersion=0;
    let showName=false,onAnswer:undefined|(()=>void),cursorCalls=0;
    const layers:unknown[]=[],layerOpacity={};
    function render(){
      hook=0;pending.length=0;
      tree=loaded.exports.NativeSlice({plane:'axial',study,selected,layers,groupLabels:false,opacity:1,layerOpacity,cursor,windowing,overlay:false,regionalCourse:false,showCrosshair:false,onCursor:(point:[number,number,number])=>{cursorCalls++;cursor=point;},expanded:false,showName,onAnswer,viewResetVersion});
      const canvases:{current:unknown}[]=[];
      for(const item of slots)if(item&&typeof item==='object'&&'current'in item)canvases.push(item as {current:unknown});
      canvases[0].current=nativeCanvas;canvases[1].current=annotationCanvas;canvases[2].current=area;
      for(const effect of pending)effect();
      return tree;
    }
    const canvas=()=>{const found=walk(tree,node=>node.type==='canvas'&&node.props.role==='img');assert(found);return found;};
    render();assert.equal(creates,1);assert.equal(renders,1);
    canvas().props.onKeyDown({key:'+',altKey:false,ctrlKey:false,metaKey:false,preventDefault:()=>{}});
    const zoomedTree=render();assert.equal(creates,1,'zoom does not reraster native data');
    const pan=walk(zoomedTree,node=>node.type==='button'&&node.props.children==='Pan image');assert(pan);pan.props.onClick();render();
    assert.match(canvas().props['aria-label'],/Pan mode; arrow keys pan; turn Pan off to select or answer/);
    assert.doesNotMatch(canvas().props['aria-label'],/Enter places an answer/);
    assert.doesNotMatch(canvas().props['aria-describedby'],/head-quiz-instructions/);
    const element={focus:()=>{},setPointerCapture:()=>{},hasPointerCapture:()=>true,releasePointerCapture:()=>{}};
    const pointer=(x:number,y:number)=>({button:0,buttons:1,pointerId:1,clientX:x,clientY:y,currentTarget:element,preventDefault:()=>{}});
    canvas().props.onPointerDown(pointer(0,0));canvas().props.onPointerMove(pointer(20,10));render();
    assert.equal(creates,1,'pan does not reraster native data');
    viewResetVersion++;render();render();
    assert.match(canvas().props['aria-label'],/zoom 100%/);
    assert.doesNotMatch(canvas().props['aria-label'],/Pan mode/);
    assert.equal(canvas().props.style.left,10);assert.equal(canvas().props.style.top,0);
    assert.equal(creates,1,'explicit recenter resets the view without rerastering unchanged native data');
    cursor=[2,2,3];render();assert.equal(creates,2,'slice change rebuilds native data');
    windowing=[60,120];render();assert.equal(creates,3,'window change rebuilds native data');
    selected={entry:{id:'exact-mask',color:[1,0,0]},mask:new Uint8Array(1)};render();assert.equal(creates,4,'mask selection rebuilds native data');
    assert.equal(renders,4);
    const focus=()=>walk(tree,node=>node.type==='button'&&node.props.children==='Fit selected mask');
    const mask=new Uint8Array(125);mask[(3*5+2)*5+2]=1;
    selected={entry:{id:'exact-mask',color:[1,0,0],mask:{offset_kji:[0,0,0],shape_kji:[5,5,5]}},mask};
    showName=true;render();render();assert(focus());
    const baselineCreates=creates;
    focus()!.props.onClick();render();render();
    assert.match(canvas().props['aria-label'],/zoom 400%/);
    assert.equal(creates,baselineCreates,'framing reuses the raster');assert.equal(cursorCalls,0,'framing does not navigate');
    assert(walk(tree,node=>node.type==='p'&&node.props.role==='status'&&node.props.children.startsWith('Selected mask framed')));
    cursor=[2,2,1];render();render();focus()!.props.onClick();render();
    assert.match(canvas().props['aria-label'],/zoom 400%/,'empty slice leaves view intact');
    assert(walk(tree,node=>node.type==='p'&&node.props.role==='status'&&node.props.children.startsWith('No saved mask voxels')));
    const nearest=()=>walk(tree,node=>node.type==='button'&&node.props.children==='Show nearest mask slice');
    assert(nearest());nearest()!.props.onClick();render();render();
    assert.deepEqual(cursor,[2,2,3]);assert.equal(cursorCalls,1,'Only the fixed native slice axis changes');
    assert.match(canvas().props['aria-label'],/zoom 400%/);
    assert(walk(tree,node=>node.type==='p'&&node.props.role==='status'&&node.props.children==='Showing nearest saved mask slice: 4 of 5.'));
    nearest()!.props.onClick();render();render();assert.equal(cursorCalls,1,'Already occupied slice is framed without redundant navigation');
    cursor=[2,2,1];render();render();assert.equal(walk(tree,node=>node.type==='p'&&node.props.role==='status'),undefined);
    cursor=[2,2,3];render();render();assert.equal(walk(tree,node=>node.type==='p'&&node.props.role==='status'),undefined,'Returning manually does not revive old navigation feedback');
    const empty=new Uint8Array(125);selected={entry:{id:'empty-mask',color:[1,0,0],mask:{offset_kji:[0,0,0],shape_kji:[5,5,5]}},mask:empty};render();render();
    nearest()!.props.onClick();render();assert.equal(cursorCalls,1);assert.deepEqual(cursor,[2,2,3]);
    assert(walk(tree,node=>node.type==='p'&&node.props.role==='status'&&node.props.children==='No valid saved mask slice is available in this view.'));
    walk(tree,node=>node.type==='button'&&node.props.children==='Fit image')!.props.onClick();render();
    assert.match(canvas().props['aria-label'],/zoom 100%/);
    assert.equal(walk(tree,node=>node.type==='p'&&node.props.role==='status'),undefined,'reset clears old framing feedback');
    onAnswer=()=>{};render();assert.equal(focus(),undefined,'find-it cannot expose target-framing action');assert.equal(nearest(),undefined);
    assert.equal(walk(tree,node=>node.type==='p'&&node.props.role==='status'),undefined,'practice hides focus messages');
    onAnswer=undefined;showName=false;render();assert.equal(focus(),undefined,'label question cannot expose target-framing action');assert.equal(nearest(),undefined);
    showName=true;selected={entry:{id:'point',color:[1,0,0]}};render();assert.equal(focus(),undefined,'no inferred framing for point or curve representations');assert.equal(nearest(),undefined);
  }finally{(globalThis as any).ResizeObserver=originalResizeObserver;}
});
