import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {createNativeVolumeGeometry} from '../lib/head-atlas-geometry.mjs';
import {headSliceViewport,zoomHeadSliceViewport,fitHeadMaskViewport,nearestHeadMaskSlice} from '../lib/head-slice-viewport.ts';
import {createHeadViewportMemory,defaultHeadViewportFrame} from '../lib/head-viewport-memory.ts';
import {headSliceKey,headSliceNumber} from '../lib/head-atlas-slice-controls.ts';

// NativeSlice's actual callbacks and viewport math, with only React scheduling,
// canvas drawing, and browser event targets replaced. No image or mask fixture.
const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
type Node={type:unknown;props:Record<string,any>};
type Effect={kind:'layout'|'passive';deps:unknown[];create:()=>void|(()=>void);cleanup?:()=>void};
const same=(a:unknown[]|undefined,b:unknown[])=>!!a&&a.length===b.length&&a.every((value,index)=>Object.is(value,b[index]));
function walk(value:unknown,match:(node:Node)=>boolean):Node|undefined{
  if(Array.isArray(value)){for(const item of value){const found=walk(item,match);if(found)return found;}return;}
  if(!value||typeof value!=='object'||!('props' in value))return;
  const node=value as Node;return match(node)?node:walk(node.props.children,match);
}
function fixture(){
  const originalResizeObserver=(globalThis as any).ResizeObserver;
  (globalThis as any).ResizeObserver=class {observe(){} disconnect(){}};
  const geometry=createNativeVolumeGeometry({shape_kji:[5,5,5],ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]});
  let study={geometry,data:new Int16Array(125)};
  let version=0,cursor:[number,number,number]=[2,2,2],answerCalls=0,cursorCalls=0;
  const slots:unknown[]=[],effects=new Map<number,Effect>(),pending=new Map<number,Effect>();
  let hook=0,tree:Node,layoutDirty=false;
  const hooks={
    useState(initial:unknown){const i=hook++;if(!(i in slots))slots[i]=typeof initial==='function'?(initial as ()=>unknown)():initial;
      return [slots[i],(value:any)=>{const next=typeof value==='function'?value(slots[i]):value;if(!Object.is(next,slots[i]))layoutDirty=true;slots[i]=next;}];},
    useRef(initial:unknown){const i=hook++;return slots[i]??(slots[i]={current:initial});},
    useMemo(create:()=>unknown,deps:unknown[]){const i=hook++,old=slots[i] as {deps:unknown[];value:unknown}|undefined;
      if(!same(old?.deps,deps))slots[i]={deps,value:create()};return (slots[i] as {value:unknown}).value;},
    useEffect(create:Effect['create'],deps:unknown[]){pending.set(hook++,{kind:'passive',deps,create});},
    useLayoutEffect(create:Effect['create'],deps:unknown[]){pending.set(hook++,{kind:'layout',deps,create});},
  };
  const mod={exports:{} as Record<string,any>};
  new Function('require','module','exports',compiled+'\nmodule.exports.NativeSlice=NativeSlice;')((name:string)=>{
    if(name==='react')return hooks;
    if(name==='react/jsx-runtime')return require(name);
    if(name==='../lib/head-slice-viewport')return {headSliceViewport,zoomHeadSliceViewport,fitHeadMaskViewport,nearestHeadMaskSlice};
    if(name==='../lib/head-viewport-memory')return {createHeadViewportMemory,defaultHeadViewportFrame};
    if(name==='../lib/head-atlas-slice-controls')return {headSliceKey,headSliceNumber};
    if(name==='../lib/head-atlas-display')return {headLabel:()=>'',annotationInk:()=>''};
    if(name==='../lib/head-atlas-overlays')return {layoutHeadLabels:()=>({labels:[],omitted:0})};
    if(name==='../lib/slice-wheel.mjs')return {bindSliceWheel:()=>()=>{}};
    return {};
  },mod,mod.exports);
  class Realm extends EventTarget{
    listeners=new Map<string,Set<unknown>>();
    addEventListener(name:string,fn:any,options?:any){if(fn){if(!this.listeners.has(name))this.listeners.set(name,new Set());this.listeners.get(name)!.add(fn);}super.addEventListener(name,fn,options);}
    removeEventListener(name:string,fn:any,options?:any){this.listeners.get(name)?.delete(fn);super.removeEventListener(name,fn,options);}
    count(){return [...this.listeners.values()].reduce((n,set)=>n+set.size,0);}
  }
  const doc=Object.assign(new Realm(),{visibilityState:'visible',defaultView:new Realm()});
  Object.defineProperty(doc,'hidden',{get:()=>doc.visibilityState==='hidden'});
  const captured=new Set<number>(),releases:number[]=[];
  const nativeCtx={createImageData:(w:number,h:number)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData:()=>{}};
  const element={ownerDocument:doc,focus:()=>{},getContext:()=>nativeCtx,
    setPointerCapture:(id:number)=>captured.add(id),hasPointerCapture:(id:number)=>captured.has(id),
    releasePointerCapture:(id:number)=>{releases.push(id);captured.delete(id);},
    getBoundingClientRect:()=>({left:0,top:0,width:300,height:300})};
  const annotation={getContext:()=>({})};
  const area={clientWidth:300,clientHeight:300};
  let onAnswer:((point:[number,number,number])=>void)|undefined=()=>{answerCalls++;};
  function commit(kind:'layout'|'passive'){
    for(const [i,next] of pending){if(next.kind!==kind)continue;const old=effects.get(i);
      if(old&&same(old.deps,next.deps))continue;old?.cleanup?.();const cleanup=next.create();
      effects.set(i,{...next,cleanup:typeof cleanup==='function'?cleanup:undefined});
    }
  }
  function render(phase:'all'|'layout'='all',depth=0):Node{
    assert(depth<12,'committed layout updates settle');layoutDirty=false;hook=0;pending.clear();
    tree=mod.exports.NativeSlice({plane:'axial',study,selected:null,layers:[],groupLabels:false,opacity:1,layerOpacity:{},cursor,windowing:[40,80],overlay:false,regionalCourse:false,showCrosshair:false,onCursor:(point:[number,number,number])=>{cursorCalls++;cursor=point;},expanded:false,showName:false,onAnswer,viewResetVersion:version});
    const refs=slots.filter(item=>item&&typeof item==='object'&&'current' in item) as Array<{current:unknown}>;
    refs[0].current=element;refs[1].current=annotation;refs[2].current=area;
    commit('layout');if(layoutDirty)return render(phase,depth+1);if(phase==='all')commit('passive');return tree;
  }
  function canvas(){const node=walk(tree,node=>node.type==='canvas'&&node.props.role==='img');assert(node);return node.props;}
  function button(label:string){const node=walk(tree,node=>node.type==='button'&&node.props.children===label);assert(node,`${label} button`);return node.props;}
  function pointer(pointerId:number,x:number,y:number,buttons=1,button=0){return {pointerId,clientX:x,clientY:y,buttons,button,pointerType:'mouse',isPrimary:true,currentTarget:element,preventDefault:()=>{}};}
  function pan(){render();const zoom=walk(tree,node=>node.type==='button'&&node.props['aria-label']==='axial zoom in');assert(zoom);zoom.props.onClick();render();
    button('Pan image').onClick();render();assert.equal(button('Pan image')['aria-pressed'],true);}
  function start(id=1){canvas().onPointerDown(pointer(id,80,80));assert(captured.has(id),'owner captured');}
  function position(){return [canvas().style.left,canvas().style.top];}
  function dispose(){for(const effect of effects.values())effect.cleanup?.();(globalThis as any).ResizeObserver=originalResizeObserver;}
  return {render,canvas,button,pointer,pan,start,position,dispose,doc,captured,releases,get cursor(){return cursor;},get answerCalls(){return answerCalls;},get cursorCalls(){return cursorCalls;},
    changeSource(){study={geometry,data:new Int16Array(125)};},reset(){version++;},setAnswer(value:typeof onAnswer){onAnswer=value;}};
}

test('visible owner left-button drag pans without changing slice or placing answer',()=>{
  const h=fixture();try{h.pan();h.start();const before=h.position();h.canvas().onPointerMove(h.pointer(1,120,100));h.render();
    assert.notDeepEqual(h.position(),before);assert.deepEqual(h.cursor,[2,2,2]);assert.equal(h.cursorCalls,0);assert.equal(h.answerCalls,0);
    h.canvas().onPointerUp(h.pointer(1,120,100,0));assert.deepEqual(h.releases,[1]);}finally{h.dispose();}
});

test('move with released primary button cancels owner drag and capture',()=>{
  const h=fixture();try{h.pan();h.start();const before=h.position();h.canvas().onPointerMove(h.pointer(1,120,100,0));h.render();
    assert.deepEqual(h.position(),before);assert.deepEqual(h.releases,[1]);h.canvas().onPointerMove(h.pointer(1,140,120,1));h.render();assert.deepEqual(h.position(),before);}finally{h.dispose();}
});

for(const interruption of ['blur','pagehide','hidden'] as const)test(`${interruption} cancels pan and releases pointer capture`,()=>{
  const h=fixture();try{h.pan();h.start();const before=h.position();
    if(interruption==='hidden'){h.doc.visibilityState='hidden';h.doc.dispatchEvent(new Event('visibilitychange'));}
    else h.doc.defaultView.dispatchEvent(new Event(interruption));
    assert.deepEqual(h.releases,[1]);h.canvas().onPointerMove(h.pointer(1,140,120));h.render();assert.deepEqual(h.position(),before);
  }finally{h.dispose();}
});

test('foreign pointer cancel and lost capture preserve the owner drag',()=>{
  const h=fixture();try{h.pan();h.start(1);const before=h.position();h.canvas().onPointerCancel(h.pointer(2,100,100));h.canvas().onLostPointerCapture(h.pointer(2,100,100));
    h.canvas().onPointerMove(h.pointer(1,120,100));h.render();assert.notDeepEqual(h.position(),before);assert(h.captured.has(1));
  }finally{h.dispose();}
});

test('owner pointer cancel retires pan and releases capture',()=>{
  const h=fixture();try{h.pan();h.start(1);const before=h.position();h.canvas().onPointerCancel(h.pointer(1,100,100));
    assert.deepEqual(h.releases,[1]);h.canvas().onPointerMove(h.pointer(1,140,120));h.render();assert.deepEqual(h.position(),before);
  }finally{h.dispose();}
});

test('second pointerdown cannot replace captured owner',()=>{
  const h=fixture();try{h.pan();h.start(1);const before=h.position();h.canvas().onPointerDown(h.pointer(2,80,80));
    assert.deepEqual([...h.captured],[1]);h.canvas().onPointerMove(h.pointer(1,120,100));h.render();assert.notDeepEqual(h.position(),before);
  }finally{h.dispose();}
});

test('Fit image and reset release the active capture',()=>{
  const failures:string[]=[];
  for(const action of ['fit','reset'] as const){const h=fixture();try{h.pan();h.start();
    if(action==='fit')h.button('Fit image').onClick();else{h.reset();h.render();}
    if(h.releases.join(',')!=='1'||h.captured.size!==0)failures.push(`${action}: releases=${h.releases.join(',')||'none'}, captured=${[...h.captured].join(',')||'none'}`);
  }finally{h.dispose();}}
  assert.deepEqual(failures,[]);
});

test('unmount releases the active capture',()=>{
  const h=fixture();h.pan();h.start();h.dispose();assert.deepEqual(h.releases,[1]);assert.equal(h.captured.size,0);
});

test('hidden document refuses a new pan gesture',()=>{
  const h=fixture();try{h.pan();h.doc.visibilityState='hidden';h.canvas().onPointerDown(h.pointer(1,80,80));assert.equal(h.captured.size,0);
  }finally{h.dispose();}
});

test('source and reset commit retire an old pan callback before passive cleanup',()=>{
  const failures:string[]=[];
  for(const change of ['source','reset'] as const){const h=fixture();try{h.pan();h.start();const oldMove=h.canvas().onPointerMove;
    if(change==='source')h.changeSource();else h.reset();h.render('layout');assert.match(h.canvas()['aria-label'],/zoom 100%/);assert.equal(h.button('Pan image')['aria-pressed'],false);const before=h.position();oldMove(h.pointer(1,150,130));h.render();
    if(JSON.stringify(h.position())!==JSON.stringify(before)||h.releases.join(',')!=='1')failures.push(`${change}: moved=${JSON.stringify(h.position())!==JSON.stringify(before)}, releases=${h.releases.join(',')||'none'}`);
  }finally{h.dispose();}}
  assert.deepEqual(failures,[]);
});

test('only the owning realm cancels; cleanup removes all listeners and reopening never resumes a drag',()=>{
  const h=fixture();try{h.pan();assert.equal(h.doc.count(),1);assert.equal(h.doc.defaultView.count(),2);h.start();
    new EventTarget().dispatchEvent(new Event('blur'));h.doc.dispatchEvent(new Event('visibilitychange'));
    const before=h.position();h.canvas().onPointerMove(h.pointer(1,120,100));h.render();assert.notDeepEqual(h.position(),before);
    h.doc.visibilityState='hidden';h.doc.dispatchEvent(new Event('visibilitychange'));
    h.doc.visibilityState='visible';h.doc.dispatchEvent(new Event('visibilitychange'));const stopped=h.position();
    h.canvas().onPointerMove(h.pointer(1,150,120));h.render();assert.deepEqual(h.position(),stopped);assert.equal(h.captured.size,0);
  }finally{h.dispose();assert.equal(h.doc.count(),0);assert.equal(h.doc.defaultView.count(),0);}
});

test('a callback from the previous source cannot pan or release a new same-pointer gesture',()=>{
  const h=fixture();try{h.pan();h.start();const oldMove=h.canvas().onPointerMove;
    h.changeSource();h.render();h.render();h.pan();h.start(1);const before=h.position();
    oldMove(h.pointer(1,160,140));h.render();assert.deepEqual(h.position(),before);assert(h.captured.has(1));
    h.canvas().onPointerMove(h.pointer(1,120,100));h.render();assert.notDeepEqual(h.position(),before);
  }finally{h.dispose();}
});

test('zoom and keyboard pan explicitly retire the pointer gesture',()=>{
  for(const action of ['zoom','key']as const){const h=fixture();try{h.pan();h.start();
    h.canvas().onKeyDown({key:action==='zoom'?'+':'ArrowRight',altKey:false,ctrlKey:false,metaKey:false,shiftKey:false,preventDefault(){}});
    h.render();assert.equal(h.captured.size,0);const before=h.position();
    h.canvas().onPointerMove(h.pointer(1,160,140));h.render();assert.deepEqual(h.position(),before);
  }finally{h.dispose();}}
});
