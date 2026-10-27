import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHeadLearningFocusLease,focusHeadLearningContent} from '../lib/head-atlas-focus.ts';

function focusHost(){
  const listeners=new Map<string,Set<(event:{target?:unknown})=>void>>(),actions:unknown[]=[];
  const initial={name:'step-link'};
  let active=true,visibility='visible',style={display:'block',visibility:'visible'};
  const add=(type:string,listener:(event:{target?:unknown})=>void)=>{const group=listeners.get(type)??new Set();group.add(listener);listeners.set(type,group);};
  const remove=(type:string,listener:(event:{target?:unknown})=>void)=>listeners.get(type)?.delete(listener);
  const fire=(type:string,target?:unknown)=>{for(const listener of [...(listeners.get(type)??[])])listener({target});};
  const doc={activeElement:initial as unknown,hidden:false,get visibilityState(){return visibility;},hasFocus:()=>active,addEventListener:add,removeEventListener:remove};
  const win={addEventListener:add,removeEventListener:remove,getComputedStyle:()=>style};
  const pane={scrollTo:(options:unknown)=>actions.push(['scroll',options])};
  const heading={isConnected:true,ownerDocument:doc,hidden:false,inert:false,
    closest:(selector:string)=>selector==='.imaging-workspace-info'?pane:null,
    getClientRects:()=>[{}],
    focus:(options:unknown)=>{actions.push(['focus',options,listeners.get('focusin')?.size??0]);doc.activeElement=heading;fire('focusin',heading);}};
  return {doc,win,heading,actions,fire,listeners,setActive:(value:boolean)=>{active=value;},setVisibility:(value:string)=>{visibility=value;},setStyle:(value:typeof style)=>{style=value;}};
}

test('learning focus scrolls only the information pane, then focuses without page scrolling',()=>{
  const actions:unknown[]=[];
  const element={closest:(selector:string)=>{actions.push(selector);return{scrollTo:(options:unknown)=>actions.push(options)};},focus:(options:unknown)=>actions.push(options)};
  focusHeadLearningContent(element as unknown as HTMLElement);
  assert.deepEqual(actions,['.imaging-workspace-info',{top:0,behavior:'instant'},{preventScroll:true}]);
});
test('missing focus target or missing pane is safe and never uses a window scrolling fallback',()=>{
  focusHeadLearningContent(null);
  let focused=false;
  const element={closest:()=>null,focus:(options:unknown)=>{assert.deepEqual(options,{preventScroll:true});focused=true;}};
  focusHeadLearningContent(element as unknown as HTMLElement);assert.equal(focused,true);
});
test('guided lifecycle supplies accessible heading and sequence focus destinations',()=>{
  const guided=readFileSync(new URL('../components/HeadAtlasGuidedLearning.tsx',import.meta.url),'utf8');
  const viewer=readFileSync(process.env.HEAD_VIEWER_BASELINE_SOURCE??new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
  assert.match(guided,/<h3 ref=\{headingRef\} tabIndex=\{-1\}/);
  assert.match(guided,/createHeadLearningFocusLease\(document,window\)/);
  assert.match(guided,/\[modality,sequence,position\.conceptId\]/);
  assert.match(guided,/if\(autoPlaying\)focusLeaseRef\.current\?\.lease\.cancel\(\)/);
  assert.match(guided,/request\.lease\.settle\(headingRef\.current\)/);
  assert.match(guided,/focusHeadLearningContent\(sequenceRef.current\)/);
  // Return/replacement behavior is exercised through the real Viewer callbacks
  // in head-image-history.test.ts, rather than pinning a retired state variable.
  assert.match(viewer,/infoLabel="Anatomy learning panel"/);
});

test('ready explicit step focuses heading once after disposing listeners; finish still focuses sequence',()=>{
  const h=focusHost(),lease=createHeadLearningFocusLease(h.doc as unknown as Document,h.win as unknown as Window);
  assert.equal(lease.settle(h.heading as unknown as HTMLElement),true);
  assert.deepEqual(h.actions,[['scroll',{top:0,behavior:'instant'}],['focus',{preventScroll:true},0]]);
  assert.equal(lease.settle(h.heading as unknown as HTMLElement),false,'consumed focus cannot replay');
  const sequence={closest:(selector:string)=>selector==='.imaging-workspace-info'?{scrollTo:(options:unknown)=>h.actions.push(['sequence-scroll',options])}:null,
    focus:(options:unknown)=>h.actions.push(['sequence-focus',options])};
  focusHeadLearningContent(sequence as unknown as HTMLElement);
  assert.deepEqual(h.actions.slice(-2),[['sequence-scroll',{top:0,behavior:'instant'}],['sequence-focus',{preventScroll:true}]]);
});

test('later user focus, pointer, key, blur or hidden document cancels delayed focus',()=>{
  for(const event of ['focusin','pointerdown','keydown','blur','visibilitychange']){
    const h=focusHost(),lease=createHeadLearningFocusLease(h.doc as unknown as Document,h.win as unknown as Window);
    if(event==='visibilitychange'){h.doc.hidden=true;h.setVisibility('hidden');}
    if(event==='focusin')h.doc.activeElement={name:'other-control'};
    h.fire(event,h.doc.activeElement);
    assert.equal(lease.settle(h.heading as unknown as HTMLElement),false,event);
    assert.deepEqual(h.actions,[]);
    assert.equal([...h.listeners.values()].reduce((sum,group)=>sum+group.size,0),0,event+' listeners retired');
  }
});

test('replacement, unmount and playback cancel pending requests without catch-up focus',()=>{
  const h=focusHost(),first=createHeadLearningFocusLease(h.doc as unknown as Document,h.win as unknown as Window);
  first.cancel(); // committed step replaced or component unmounted
  const second=createHeadLearningFocusLease(h.doc as unknown as Document,h.win as unknown as Window);
  assert.equal(first.settle(h.heading as unknown as HTMLElement),false);
  second.cancel(); // autoplay begins before the study resolves
  assert.equal(second.settle(h.heading as unknown as HTMLElement),false);
  assert.deepEqual(h.actions,[]);
  const explicit=createHeadLearningFocusLease(h.doc as unknown as Document,h.win as unknown as Window);
  assert.equal(explicit.settle(h.heading as unknown as HTMLElement),true,'new explicit step may focus normally');
});

test('settle refuses disconnected, hidden, inert, invisible or unfocused targets',()=>{
  for(const mode of ['detached','hidden','inert','no-rect','css-hidden','background','changed-active']){
    const h=focusHost(),lease=createHeadLearningFocusLease(h.doc as unknown as Document,h.win as unknown as Window);
    if(mode==='detached')h.heading.isConnected=false;
    if(mode==='hidden')h.heading.hidden=true;
    if(mode==='inert')h.heading.inert=true;
    if(mode==='no-rect')h.heading.getClientRects=()=>[];
    if(mode==='css-hidden')h.setStyle({display:'none',visibility:'visible'});
    if(mode==='background')h.setActive(false);
    if(mode==='changed-active')h.doc.activeElement={name:'other'};
    assert.equal(lease.settle(h.heading as unknown as HTMLElement),false,mode);
    assert.deepEqual(h.actions,[]);
  }
});
