import assert from 'node:assert/strict';
import {test} from 'node:test';
import {dissectionShortcut,handleDissectionHistoryKey} from '../lib/dissection-shortcuts.ts';

const ready={enabled:true,canUndo:true,canRedo:true};
const key=(name,changes={})=>({key:name,ctrlKey:true,metaKey:false,altKey:false,
  shiftKey:false,repeat:false,defaultPrevented:false,isComposing:false,...changes});

test('Common Windows/Linux and macOS history chords',()=>{
  for(const modifier of [{},{ctrlKey:false,metaKey:true}])for(const z of ['z','Z']){
    assert.equal(dissectionShortcut(key(z,modifier),ready),'undo');
    assert.equal(dissectionShortcut(key(z,{...modifier,shiftKey:true}),ready),'redo');
  }
  for(const y of ['y','Y'])assert.equal(dissectionShortcut(key(y),ready),'redo');
  assert.equal(dissectionShortcut(key('y',{ctrlKey:false,metaKey:true}),ready),null);
  assert.equal(dissectionShortcut(key('y',{shiftKey:true}),ready),null);
});
test('Disabled, consumed, IME, repeat and unrelated keys are untouched',()=>{
  for(const name of ['z','y'])for(const shiftKey of [false,true]){
    const event=key(name,{shiftKey});
    for(const block of [{defaultPrevented:true},{isComposing:true},{repeat:true},
      {altKey:true},{ctrlKey:false},{metaKey:true}])
      assert.equal(dissectionShortcut({...event,...block},ready),null);
    assert.equal(dissectionShortcut(event,{...ready,enabled:false}),null);
  }
  for(const name of ['Escape','ArrowLeft','Enter','a','Backspace'])
    assert.equal(dissectionShortcut(key(name),ready),null);
});
test('Consume only an available history action',()=>{
  for(const canUndo of [false,true])for(const canRedo of [false,true]){
    const state={enabled:true,canUndo,canRedo};
    assert.equal(dissectionShortcut(key('z'),state),canUndo?'undo':null);
    assert.equal(dissectionShortcut(key('z',{shiftKey:true}),state),canRedo?'redo':null);
    assert.equal(dissectionShortcut(key('y'),state),canRedo?'redo':null);
  }
});

test('Workspace boundary and editor/dialog exclusions do not consume events',()=>{
  // Small DOM protocol fixture; real input/select/portal cases also run in Chromium.
  const previous=globalThis.Element;
  class TestElement {
    constructor(owner,inside=true,protectedControl=false){Object.assign(this,{owner,inside,protectedControl});}
    closest(selector){return selector==='.body-app'?this.owner:this.protectedControl?this:null;}
  }
  globalThis.Element=TestElement;
  try{
    const root={contains:target=>target.inside};
    const target=new TestElement(root),calls=[];
    const run=(target,changes={},state=ready)=>{
      calls.length=0;
      handleDissectionHistoryKey({...key('z'),target,currentTarget:root,nativeEvent:{isComposing:false},
        preventDefault:()=>calls.push('prevent'),stopPropagation:()=>calls.push('stop'),...changes},
      state,()=>calls.push('undo'),()=>calls.push('redo'));
      return [...calls];
    };
    assert.deepEqual(run(target),['prevent','stop','undo']);
    assert.deepEqual(run(target,{shiftKey:true}),['prevent','stop','redo']);
    for(const blocked of [null,{},new TestElement(root,false),new TestElement({}),new TestElement(root,true,true)])
      assert.deepEqual(run(blocked),[]);
    assert.deepEqual(run(target,{nativeEvent:{isComposing:true}}),[]);
    assert.deepEqual(run(target,{}, {...ready,enabled:false}),[]);
    assert.deepEqual(run(target,{}, {...ready,canUndo:false}),[]);
  }finally{
    if(previous===undefined)delete globalThis.Element;else globalThis.Element=previous;
  }
});
