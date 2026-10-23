import test from 'node:test';
import assert from 'node:assert/strict';
import {bindHeadWindowDrag} from '../lib/head-window-drag.ts';

function harness(){
 class Tracked extends EventTarget{
  listeners=new Map<string,Set<unknown>>();
  addEventListener(name:string,fn:any,options?:any){if(fn){if(!this.listeners.has(name))this.listeners.set(name,new Set());this.listeners.get(name)!.add(fn);}super.addEventListener(name,fn,options);}
  removeEventListener(name:string,fn:any,options?:any){this.listeners.get(name)?.delete(fn);super.removeEventListener(name,fn,options);}
  count(){return [...this.listeners.values()].reduce((n,set)=>n+set.size,0);}
 }
 const realm=new Tracked(),foreign=new Tracked(),doc=Object.assign(new Tracked(),{hidden:false,defaultView:realm});
 const captures=new Set<number>(),frames=new Map<number,FrameRequestCallback>(),values:Array<[number,number]>=[];
 let next=1,window:[number,number]=[40,80],afterChange:(()=>void)|null=null;
 class Canvas extends EventTarget{
  ownerDocument=doc;
  getBoundingClientRect(){return {width:200,height:100};}
  focus(){}
  setPointerCapture(id:number){captures.add(id);}
  hasPointerCapture(id:number){return captures.has(id);}
  releasePointerCapture(id:number){captures.delete(id);}
 }
 const canvas=new Canvas();
 const cleanup=bindHeadWindowDrag(canvas as unknown as HTMLElement,{getWindow:()=>window,onChange:value=>{values.push(value);window=value;afterChange?.();}},{request:cb=>{const id=next++;frames.set(id,cb);return id;},cancel:id=>{frames.delete(id);}});
 const emit=(type:string,props:Record<string,unknown>={})=>{const e=Object.assign(new Event(type,{cancelable:true}),{pointerId:7,button:2,buttons:2,clientX:0,clientY:0,altKey:false,ctrlKey:false,metaKey:false,...props});canvas.dispatchEvent(e);return e;};
 const tick=()=>{for(const[id,cb]of [...frames]){frames.delete(id);cb(0);}};
 return {realm,foreign,doc,captures,frames,values,emit,tick,cleanup,afterChange:(fn:(()=>void)|null)=>{afterChange=fn;}};
}

test('a cancelled old animation callback cannot consume the next gesture update',()=>{
 const h=harness();h.emit('pointerdown');h.emit('pointermove',{clientX:50});const old=[...h.frames.values()][0];
 h.emit('pointercancel');h.emit('pointerdown');h.emit('pointermove',{clientX:25});assert.equal(h.frames.size,1);
 old(0);assert.deepEqual(h.values,[],'retired callback cannot flush another gesture');assert.equal(h.frames.size,1);
 h.tick();assert.deepEqual(h.values,[[40,100]]);h.cleanup();
});

test('a completed old animation callback cannot consume a later gesture update',()=>{
 const h=harness();h.emit('pointerdown');h.emit('pointermove',{clientX:50});const old=[...h.frames.values()][0];h.emit('pointerup');
 assert.deepEqual(h.values,[[40,120]]);h.emit('pointerdown');h.emit('pointermove',{clientX:20});old(0);
 assert.deepEqual(h.values,[[40,120]]);assert.equal(h.frames.size,1);h.tick();assert.deepEqual(h.values,[[40,120],[40,144]]);h.cleanup();
});

for(const reason of ['blur','pagehide','hidden'])test(`${reason} cancels the owning document's gesture and queued display update`,()=>{
 const h=harness();h.emit('pointerdown');h.emit('pointermove',{clientX:50});const old=[...h.frames.values()][0];
 if(reason==='hidden'){h.doc.hidden=true;h.doc.dispatchEvent(new Event('visibilitychange'));}else h.realm.dispatchEvent(new Event(reason));
 assert.equal(h.frames.size,0);assert.equal(h.captures.size,0);old(0);assert.deepEqual(h.values,[]);h.emit('pointerup');assert.deepEqual(h.values,[]);
 if(reason==='hidden'){assert.equal(h.emit('pointerdown').defaultPrevented,false);h.doc.hidden=false;h.doc.dispatchEvent(new Event('visibilitychange'));}
 h.emit('pointerdown');h.emit('pointermove',{clientX:25});h.emit('pointerup');assert.deepEqual(h.values,[[40,100]]);h.cleanup();
});

test('queued updates and new gestures are refused while their document is hidden',()=>{
 const h=harness();h.emit('pointerdown');h.emit('pointermove',{clientX:50});const old=[...h.frames.values()][0];h.doc.hidden=true;
 old(0);assert.deepEqual(h.values,[]);assert.equal(h.captures.size,0);assert.equal(h.emit('pointerdown').defaultPrevented,false);h.cleanup();
});

test('visible events and other windows do not cancel; cleanup removes realm listeners',()=>{
 const h=harness();assert.equal(h.realm.count(),2);assert.equal(h.doc.count(),1);
 h.emit('pointerdown');h.emit('pointermove',{clientX:25});h.foreign.dispatchEvent(new Event('blur'));h.doc.dispatchEvent(new Event('visibilitychange'));
 h.tick();assert.deepEqual(h.values,[[40,100]]);h.cleanup();assert.equal(h.realm.count(),0);assert.equal(h.doc.count(),0);
});

test('a release callback that starts another gesture cannot release its pointer capture',()=>{
 const h=harness();h.emit('pointerdown');h.emit('pointermove',{clientX:25});
 h.afterChange(()=>{h.afterChange(null);h.emit('pointerdown');h.emit('pointermove',{clientX:20});});h.emit('pointerup');
 assert.equal(h.captures.size,1,'the new gesture still owns the captured pointer');assert.equal(h.frames.size,1);
 h.tick();assert.deepEqual(h.values,[[40,100],[40,120]]);h.cleanup();
});
