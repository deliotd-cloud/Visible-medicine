import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {bindHeadWindowDrag,headWindowFromDrag} from '../lib/head-window-drag.ts';

test('window drag changes display width/level from a fixed origin, not image values',()=>{
  const initial:[number,number]=[40,80];
  assert.deepEqual(headWindowFromDrag(initial,50,25,{width:200,height:100}),[80,120]);
  assert.deepEqual(headWindowFromDrag(initial,-500,0,{width:200,height:100}),[40,1]);
  assert.deepEqual(headWindowFromDrag([900,1800],100,-50,{width:200,height:100}),[-900,3600]);
  assert.deepEqual(initial,[40,80]);
  for(const bad of [NaN,Infinity,-Infinity]){
    assert.equal(headWindowFromDrag([bad,80],1,1,{width:200,height:100}),null);
    assert.equal(headWindowFromDrag(initial,bad,1,{width:200,height:100}),null);
  }
  for(const width of [0,-1,NaN,Infinity])assert.equal(headWindowFromDrag([40,width],1,1,{width:200,height:100}),null);
  assert.equal(headWindowFromDrag(initial,1,1,{width:0,height:100}),null);
});

function harness(){
  const frames=new Map<number,FrameRequestCallback>(),values:Array<[number,number]>=[];
  let next=1,window:[number,number]=[40,80],focused=0;
  const captured=new Set<number>();
  class Canvas extends EventTarget{
    getBoundingClientRect(){return {width:200,height:100};}
    focus(){focused++;}
    setPointerCapture(id:number){captured.add(id);}
    hasPointerCapture(id:number){return captured.has(id);}
    releasePointerCapture(id:number){captured.delete(id);}
  }
  const canvas=new Canvas();
  const cleanup=bindHeadWindowDrag(canvas as unknown as HTMLElement,{getWindow:()=>window,onChange:value=>{values.push(value);window=value;}},{request:cb=>{const id=next++;frames.set(id,cb);return id;},cancel:id=>{frames.delete(id);}});
  const emit=(type:string,props:Record<string,unknown>={})=>{
    const event=Object.assign(new Event(type,{cancelable:true}),{pointerId:7,button:2,buttons:2,clientX:0,clientY:0,altKey:false,ctrlKey:false,metaKey:false,...props});
    canvas.dispatchEvent(event);return event;
  };
  const tick=()=>{for(const [id,callback]of [...frames]){frames.delete(id);callback(0);}};
  return {emit,tick,cleanup,values,frames,captured,getFocused:()=>focused,setWindow:(value:[number,number])=>{window=value;}};
}

test('left, middle and modified clicks are untouched; right drag coalesces per frame',()=>{
  const h=harness();
  for(const props of [{button:0},{button:1},{ctrlKey:true},{altKey:true},{metaKey:true}])assert.equal(h.emit('pointerdown',props).defaultPrevented,false);
  assert.equal(h.getFocused(),0);assert.equal(h.captured.size,0);
  assert.equal(h.emit('pointerdown').defaultPrevented,true);assert.equal(h.getFocused(),1);
  h.emit('pointermove',{clientX:20});h.emit('pointermove',{clientX:50,clientY:25});
  assert.equal(h.frames.size,1);assert.deepEqual(h.values,[]);h.tick();
  assert.deepEqual(h.values,[[80,120]]);
  h.emit('pointermove',{clientX:100,clientY:50});h.tick();
  assert.deepEqual(h.values[1],[120,160],'absolute delta uses original contrast, not accumulated frame values');
  h.emit('pointerup');assert.equal(h.captured.size,0);h.cleanup();
});

test('release flushes the last queued frame; unrelated pointers cannot finish a gesture',()=>{
  const h=harness();h.emit('pointerdown');
  h.emit('pointermove',{pointerId:8,clientX:100});assert.equal(h.frames.size,0);
  h.emit('pointerup',{pointerId:8});assert.equal(h.captured.size,1);
  h.emit('pointermove',{clientX:50});h.emit('pointerup');
  assert.deepEqual(h.values,[[40,120]]);assert.equal(h.frames.size,0);assert.equal(h.captured.size,0);
  h.emit('pointermove',{clientX:100});h.tick();assert.equal(h.values.length,1);h.cleanup();
});

test('cancel, capture loss and lost button stop pending updates; cleanup removes all listeners',()=>{
  for(const reason of ['pointercancel','lostpointercapture','buttons-lost','cleanup']){
    const h=harness();h.emit('pointerdown');h.emit('pointermove',{clientX:50});
    const queued=[...h.frames.values()];
    if(reason==='cleanup')h.cleanup();else if(reason==='buttons-lost')h.emit('pointermove',{buttons:0});else h.emit(reason);
    assert.equal(h.frames.size,0);assert.equal(h.captured.size,0);h.tick();assert.deepEqual(h.values,[],reason);
    h.cleanup();queued.forEach(callback=>callback(0));assert.deepEqual(h.values,[]);
    assert.equal(h.emit('contextmenu').defaultPrevented,false);assert.equal(h.emit('pointerdown').defaultPrevented,false);
  }
});

test('new gestures use current contrast and ordinary context menu is suppressed only while bound',()=>{
  const h=harness();assert.equal(h.emit('contextmenu').defaultPrevented,true);
  assert.equal(h.emit('contextmenu',{ctrlKey:true}).defaultPrevented,false);
  h.setWindow([500,2500]);h.emit('pointerdown');h.emit('pointermove',{clientX:20});h.emit('pointerup');
  assert.deepEqual(h.values,[[500,3000]]);h.cleanup();
});

test('native viewer wires shared contrast only and retains left-click/quiz and numeric controls',()=>{
  const source=readFileSync(new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
  assert(source.includes('windowing={windowing} onWindowing={setWindowing}'));
  assert(source.includes('bindHeadWindowDrag(canvas,{getWindow:()=>liveWindow.current,onChange:onWindowing})'));
  assert(source.includes('[study,plane,onWindowing,viewResetVersion]'));
  assert(source.includes('if(event.button!==0||panMode)return;const point=canvasVoxel'));
  assert(source.includes('if(onAnswer)onAnswer(point);else pickMask(point)'));
  assert(source.includes('MRI uses display intensity, not HU'));
  assert(source.includes('Reset window'));
});
