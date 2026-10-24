import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve, isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';

// The exact NativeSlice function is compiled from the selected source file. The
// host below separates render, layout commit and passive commit; refs are shared
// with an interrupted render, as they are in React's current/work-in-progress fibers.
const website=resolve(import.meta.dirname,'..');
const require=createRequire(resolve(website,'package.json'));
const ts=require('typescript');
const sourcePath=process.env.VM_NATIVE_SLICE_SOURCE
  ?resolve(process.env.VM_NATIVE_SLICE_SOURCE):resolve(website,'components/HeadAtlasViewer.tsx');
assert(isAbsolute(sourcePath));
const source=readFileSync(sourcePath,'utf8');
const begin=source.indexOf('export function NativeSlice(');
const end=source.indexOf('\nexport type HeadLocalSourceState',begin);
assert(begin>=0&&end>begin,'exact NativeSlice source bounds');
const nativeSource=source.slice(begin,end);
const {createNativeVolumeGeometry}=await import(pathToFileURL(resolve(website,'lib/head-atlas-geometry.mjs')));
const viewportSource=readFileSync(resolve(website,'lib/head-slice-viewport.ts'),'utf8');
const viewportJS=ts.transpileModule(viewportSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const viewportModule={exports:{}};
new Function('module','exports',viewportJS)(viewportModule,viewportModule.exports);
const viewport=viewportModule.exports;
const windowJS=ts.transpileModule(readFileSync(resolve(website,'lib/head-window-drag.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const windowModule={exports:{}};
new Function('module','exports',windowJS)(windowModule,windowModule.exports);
const {bindSliceWheel}=await import(pathToFileURL(resolve(website,'lib/slice-wheel.mjs')));
const frames=new Map();let nextFrame=0,realBindings=false;
const scheduler={request:callback=>{frames.set(++nextFrame,callback);return nextFrame;},cancel:id=>frames.delete(id)};

let host;
const jsx=(type,props,key)=>({type,props:props??{},key});
const hooks={
  useRef:value=>host.hook('ref',()=>({kind:'ref',current:value})),
  useState:value=>{
    const at=host.cursor++;
    let cell=host.committed[at];
    if(!cell){cell={kind:'state',value:typeof value==='function'?value():value,pending:[]};host.draft[at]=cell;}
    const current=cell.pending.reduce((v,update)=>typeof update==='function'?update(v):update,cell.value);
    cell={...cell,value:current,pending:[]};host.draft[at]=cell;
    return [current,update=>{
      const target=host.committed[at]??host.draft[at];
      target.pending.push(update);
    }];
  },
  useMemo:(factory,deps)=>{
    const at=host.cursor++,old=host.committed[at];
    const same=old&&depsEqual(old.deps,deps);
    const cell=same?old:{kind:'memo',deps,value:factory()};
    host.draft[at]=cell;return cell.value;
  },
  useEffect:(effect,deps)=>host.effect('passive',effect,deps),
  useLayoutEffect:(effect,deps)=>host.effect('layout',effect,deps),
};
function depsEqual(a,b){return a&&b&&a.length===b.length&&a.every((value,i)=>Object.is(value,b[i]));}
const bindings={window:[],wheel:[]};
function bind(kind,options,element){
  const realCleanup=realBindings?(kind==='window'?windowModule.exports.bindHeadWindowDrag(element,options,scheduler):bindSliceWheel(element,options)):null;
  const record={options,active:true,cleanups:0};
  bindings[kind].push(record);
  return ()=>{realCleanup?.();record.active=false;record.cleanups++;};
}
const imports={
  react:hooks,
  'react/jsx-runtime':{jsx,jsxs:jsx,Fragment:Symbol('Fragment')},
  '../lib/head-slice-viewport':viewport,
  '../lib/head-window-drag':{bindHeadWindowDrag:(canvas,options)=>bind('window',options,canvas)},
  '../lib/slice-wheel.mjs':{bindSliceWheel:(area,options)=>bind('wheel',options,area)},
  '../lib/head-atlas-slice-controls':{headSliceKey:()=>null,headSliceNumber:()=>null},
};
const names=[...source.slice(0,begin).matchAll(/^import(?: type)?[^;]+;\s*$/gm)].map(match=>match[0]);
const compiled=ts.transpileModule(`${names.join('\n')}\nconst clamp=(v:number,max:number)=>Math.max(0,Math.min(max,Math.round(v)));\n${nativeSource}`,{fileName:sourcePath,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
const module={exports:{}};
const unused=new Proxy({}, {get:()=>()=>{throw Error('Unexpected dependency used by fixture');}});
new Function('require','module','exports',compiled)(name=>imports[name]??unused,module,module.exports);
const {NativeSlice}=module.exports;
assert.equal(typeof NativeSlice,'function');

class CommitHost{
  constructor(){this.committed=[];this.draft=[];this.cursor=0;this.tree=null;this.pending=null;this.layoutQueue=[];this.passiveQueue=[];this.dom=createDOM();}
  hook(kind,make){const at=this.cursor++;const cell=this.committed[at]??make();this.draft[at]=cell;return cell.value??cell;}
  effect(kind,callback,deps){
    const at=this.cursor++,old=this.committed[at];
    this.draft[at]={kind,deps,callback,cleanup:old?.cleanup};
  }
  render(props){host=this;this.cursor=0;this.draft=[];this.pending=NativeSlice(props);return this.pending;}
  abort(){this.draft=[];this.pending=null;}
  commitLayout(){
    assert(this.pending,'render required before commit');
    const previous=this.committed,next=this.draft;
    this.layoutQueue=[];this.passiveQueue=[];
    for(let i=0;i<next.length;i++){
      const cell=next[i],old=previous[i];
      if(cell.kind==='layout'||cell.kind==='passive'){
        if(!old||!depsEqual(old.deps,cell.deps)){
          (cell.kind==='layout'?this.layoutQueue:this.passiveQueue).push({old,cell});
        }else cell.cleanup=old.cleanup;
      }
    }
    // DOM refs are installed at the mutation boundary, before layout effects.
    this.tree=this.pending;this.committed=next;this.pending=null;this.draft=[];
    for(const [index,element] of [[0,this.dom.canvas],[1,this.dom.annotation],[2,this.dom.area],[3,this.dom.section]]){
      if(this.committed[index]?.kind==='ref')this.committed[index].current=element;
    }
    for(const {old} of this.layoutQueue)old?.cleanup?.();
    for(const {cell} of this.layoutQueue)cell.cleanup=cell.callback()??null;
  }
  commitPassive(){for(const {old} of this.passiveQueue)old?.cleanup?.();for(const {cell} of this.passiveQueue)cell.cleanup=cell.callback()??null;this.passiveQueue=[];}
  commit(){this.commitLayout();this.commitPassive();}
  unmountLayout(){for(const cell of this.committed)if(cell?.kind==='layout'){cell.cleanup?.();cell.cleanup=null;}}
  unmountPassive(){for(const cell of this.committed)if(cell?.kind==='passive'){cell.cleanup?.();cell.cleanup=null;}this.committed=[];this.tree=null;}
  element(type,predicate=()=>true){
    const visit=node=>{
      if(Array.isArray(node)){for(const item of node){const found=visit(item);if(found)return found;}return null;}
      if(!node||typeof node!=='object')return null;
      if(node.type===type&&predicate(node.props))return node;
      return visit(node.props?.children);
    };
    const found=visit(this.tree);assert(found,`missing ${type}`);return found;
  }
}
function createDOM(){
  const captured=new Set(),events=new Map();
  const ownerDocument=Object.assign(new EventTarget(),{hidden:false,visibilityState:'visible',defaultView:new EventTarget()});
  const canvas=Object.assign(new EventTarget(),{ownerDocument,getContext:()=>null,hasPointerCapture:id=>captured.has(id),setPointerCapture:id=>captured.add(id),releasePointerCapture:id=>captured.delete(id),focus(){},getBoundingClientRect:()=>({left:0,top:0,width:320,height:300})});
  const area=Object.assign(new EventTarget(),{ownerDocument,clientHeight:300,clientWidth:320});
  const annotation={ownerDocument,getContext:()=>null};
  const section={ownerDocument};
  return {canvas,area,annotation,section,captured,events};
}
globalThis.ResizeObserver=class{observe(){}disconnect(){}};
const geometry=createNativeVolumeGeometry({ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]],shape_kji:[5,5,5]});
const studyA={geometry,data:new Int16Array(125)},studyB={geometry,data:new Int16Array(125)};
const base={plane:'axial',study:studyA,selected:null,layers:[],groupLabels:false,opacity:1,layerOpacity:{},cursor:[1,1,1],windowing:[40,80],overlay:false,regionalCourse:false,showCrosshair:false,onCursor:()=>{},onWindowing:()=>{},expanded:true,onAnswer:undefined,onSelectMask:undefined};
const live=kind=>bindings[kind].at(-1);
const pointer=(canvas,id,x,y,buttons=1)=>({currentTarget:canvas,pointerId:id,clientX:x,clientY:y,button:0,buttons,preventDefault(){}});

test('committed handlers retain cursor and window through compatible abandoned render',()=>{
  const h=new CommitHost(),cursorCalls=[],windowCalls=[];
  const initial={...base,onCursor:p=>cursorCalls.push(p),onWindowing:w=>windowCalls.push(w)};
  h.render(initial);h.commit();
  const wheel=live('wheel'),window=live('window');
  assert.equal(wheel.options.getSlice(),1);assert.deepEqual(window.options.getWindow(),[40,80]);
  const speculative={...initial,cursor:[2,3,4],windowing:[70,110]};
  h.render(speculative);
  assert.equal(wheel.options.getSlice(),1);
  assert.deepEqual(window.options.getWindow(),[40,80]);
  h.abort();
  assert.equal(wheel.options.getSlice(),1);
  assert.deepEqual(window.options.getWindow(),[40,80]);
  h.render(speculative);h.commitLayout();
  assert.equal(wheel.options.getSlice(),4);
  assert.deepEqual(window.options.getWindow(),[70,110]);
  h.commitPassive();
  wheel.options.onSlice(3);window.options.onChange([75,120]);
  assert.deepEqual(cursorCalls.at(-1),[2,3,3]);
  assert.deepEqual(windowCalls.at(-1),[75,120]);
});

test('control: ordinary committed update preserves working wheel, window and keyboard movement',()=>{
  const h=new CommitHost(),cursorCalls=[],windowCalls=[],answers=[],maskCalls=[];
  const first={...base,onCursor:p=>cursorCalls.push(p),onWindowing:w=>windowCalls.push(w),onAnswer:p=>answers.push(p),onSelectMask:v=>maskCalls.push(v)};
  const dataBefore=[...studyA.data],layersBefore=[...first.layers];
  h.render(first);h.commit();
  h.render({...first,cursor:[1,1,2],windowing:[50,90]});h.commit();
  live('wheel').options.onSlice(3);
  live('window').options.onChange([55,95]);
  const canvas=h.element('canvas',p=>p.role==='img');
  canvas.props.onKeyDown({key:'ArrowRight',shiftKey:false,altKey:false,ctrlKey:false,metaKey:false,nativeEvent:{},preventDefault(){}});
  assert.deepEqual(cursorCalls.at(-2),[1,1,3]);
  assert.deepEqual(cursorCalls.at(-1),[0,1,2]);
  assert.deepEqual(windowCalls,[[55,95]]);
  assert.equal(answers.length,0);assert.equal(maskCalls.length,0);
  assert.deepEqual([...studyA.data],dataBefore);assert.deepEqual(first.layers,layersBefore);
});

test('replacement and unmount retire window and wheel bindings in layout phase',()=>{
  for(const changed of [{study:studyB},{plane:'coronal'},{viewResetVersion:1}]){
    const h=new CommitHost();h.render(base);h.commit();
    const oldWindow=live('window'),oldWheel=live('wheel');
    h.render({...base,...changed});h.commitLayout();
    assert.equal(oldWindow.active,false,'window binding must retire at layout commit');
    assert.equal(oldWheel.active,false,'wheel binding must retire at layout commit');
    h.commitPassive();
  }
  const h=new CommitHost();h.render(base);h.commit();
  const oldWindow=live('window'),oldWheel=live('wheel');
  h.unmountLayout();
  assert.equal(oldWindow.active,false,'window binding must retire at unmount layout');
  assert.equal(oldWheel.active,false,'wheel binding must retire at unmount layout');
  h.unmountPassive();
});

test('active pan survives abandoned replacement; committed replacement and unmount release capture',()=>{
  const h=new CommitHost(),cursorCalls=[];
  const first={...base,onCursor:p=>cursorCalls.push(p)};
  h.render(first);h.commit();
  h.element('canvas',p=>p.role==='img').props.onKeyDown({key:'+',nativeEvent:{},preventDefault(){}});
  h.render(first);h.commit();
  h.element('button',p=>p.children==='Pan image').props.onClick();
  h.render(first);h.commit();
  const canvas=h.dom.canvas;
  const oldCanvas=h.element('canvas',p=>p.role==='img');
  const beforePan=oldCanvas.props.style.left;
  oldCanvas.props.onPointerDown(pointer(canvas,7,20,20));
  assert(canvas.hasPointerCapture(7));
  h.render({...first,study:studyB,cursor:[2,2,2]});
  assert(canvas.hasPointerCapture(7),'render cannot tear down committed gesture');
  h.abort();
  oldCanvas.props.onPointerMove(pointer(canvas,7,25,20));
  assert(canvas.hasPointerCapture(7),'abandoned render cannot invalidate committed callback');
  h.render(first);h.commit();
  assert.notEqual(h.element('canvas',p=>p.role==='img').props.style.left,beforePan,'committed pan still moves after abandoned replacement');
  h.render({...first,study:studyB,cursor:[2,2,2]});h.commitLayout();
  assert.equal(canvas.hasPointerCapture(7),false,'replacement layout cleanup releases pointer');
  const count=cursorCalls.length;
  oldCanvas.props.onPointerMove(pointer(canvas,7,50,20));
  assert.equal(cursorCalls.length,count,'old handler cannot move replacement cursor');
  h.commitPassive();
  h.unmountLayout();h.unmountPassive();

  const u=new CommitHost();u.render(first);u.commit();
  u.element('button',p=>p.children==='Pan image').props.onClick();u.render(first);u.commit();
  u.element('canvas',p=>p.role==='img').props.onPointerDown(pointer(u.dom.canvas,9,20,20));
  assert(u.dom.canvas.hasPointerCapture(9));
  u.unmountLayout();
  assert.equal(u.dom.canvas.hasPointerCapture(9),false,'unmount layout cleanup releases pointer');
  u.unmountPassive();
});

function emit(element,type,props){const event=Object.assign(new Event(type,{cancelable:true}),props);element.dispatchEvent(event);return event;}
test('actual window binder cancels queued frames at replacement/reset/unmount layout',()=>{
  realBindings=true;
  try{for(const change of [{study:studyB},{plane:'coronal'},{viewResetVersion:1},'unmount']){
    frames.clear();const calls=[],h=new CommitHost();
    const first={...base,onWindowing:value=>calls.push(value)};
    h.render(first);h.commit();
    emit(h.dom.canvas,'pointerdown',{pointerId:11,button:2,buttons:2,clientX:0,clientY:0});
    emit(h.dom.canvas,'pointermove',{pointerId:11,buttons:2,clientX:40,clientY:20});
    assert.equal(frames.size,1);assert(h.dom.canvas.hasPointerCapture(11));
    const queued=[...frames.values()];
    if(change==='unmount')h.unmountLayout();else{h.render({...first,...change});h.commitLayout();}
    assert.equal(frames.size,0,'layout cancels rAF, not passive cleanup');
    assert.equal(h.dom.canvas.hasPointerCapture(11),false);
    queued.forEach(callback=>callback(0));assert.deepEqual(calls,[],'retired rAF cannot alter contrast');
    if(change!=='unmount'){h.commitPassive();h.unmountLayout();}h.unmountPassive();
  }}finally{realBindings=false;frames.clear();}
});

test('actual wheel binder keeps committed native axes and retires listeners on unmount',()=>{
  realBindings=true;
  const calls=[],h=new CommitHost(),first={...base,onCursor:value=>calls.push(value)};
  try{
    const before=[...studyA.data];h.render(first);h.commit();
    h.render({...first,cursor:[4,4,4]});h.abort();
    const event=emit(h.dom.area,'wheel',{deltaY:80,deltaX:0,deltaMode:0});
    assert(event.defaultPrevented);assert.deepEqual(calls,[[1,1,2]]);
    h.render({...first,cursor:[2,3,2],plane:'coronal'});h.commitLayout();
    emit(h.dom.area,'wheel',{deltaY:80,deltaX:0,deltaMode:0});
    assert.deepEqual(calls.at(-1),[2,4,2],'new committed plane uses its own fixed axis');
    h.commitPassive();h.unmountLayout();const count=calls.length;
    assert.equal(emit(h.dom.area,'wheel',{deltaY:80,deltaX:0,deltaMode:0}).defaultPrevented,false);
    assert.equal(calls.length,count);assert.deepEqual([...studyA.data],before);h.unmountPassive();
  }finally{realBindings=false;}
});
