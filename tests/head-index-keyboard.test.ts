import test from 'node:test';
import assert from 'node:assert/strict';
import {headIndexKey} from '../lib/head-index-keyboard.ts';

function fixture(count=4){
  let focused:unknown,prevented=0,stopped=0;
  const search={disabled:false,focus(options:unknown){assert.deepEqual(options,{preventScroll:true});focused=search;}};
  const entries=Array.from({length:count},(_,index)=>({disabled:false,top:102+index*40,bottom:142+index*40,
    focus(options:unknown){assert.deepEqual(options,{preventScroll:true});focused=entries[index];},
    getBoundingClientRect(){return {top:this.top,bottom:this.bottom};}}));
  const list={scrollTop:0,clientTop:2,clientHeight:80,getBoundingClientRect:()=>({top:100,bottom:184}),querySelectorAll:()=>entries};
  const root={querySelector:(selector:string)=>selector==='[data-head-index-search]'?search:selector==='[data-head-index-list]'?list:null};
  const send=(key:string,target:unknown,extra:Record<string,unknown>={})=>headIndexKey({key,target,currentTarget:root,preventDefault(){prevented++;},stopPropagation(){stopped++;},...extra} as unknown as Parameters<typeof headIndexKey>[0]);
  return {search,entries,list,send,get focused(){return focused;},get prevented(){return prevented;},get stopped(){return stopped;}};
}

test('search arrows enter the current first/last result without selecting it',()=>{
  const f=fixture();f.send('ArrowDown',f.search);assert.equal(f.focused,f.entries[0]);assert.equal(f.list.scrollTop,0);
  f.send('ArrowUp',f.search);assert.equal(f.focused,f.entries[3]);assert.equal(f.list.scrollTop,80);
  assert.equal(f.prevented,2);assert.equal(f.stopped,2);
});

test('results support bounded arrows and Home/End, not wraparound or page scroll',()=>{
  const f=fixture();f.send('ArrowDown',f.entries[0]);assert.equal(f.focused,f.entries[1]);
  f.send('ArrowUp',f.entries[1]);assert.equal(f.focused,f.entries[0]);
  f.send('ArrowUp',f.entries[0]);assert.equal(f.focused,f.entries[0]);
  f.send('End',f.entries[0]);assert.equal(f.focused,f.entries[3]);
  f.send('ArrowDown',f.entries[3]);assert.equal(f.focused,f.entries[3]);
  f.send('Home',f.entries[3]);assert.equal(f.focused,f.entries[0]);
  assert.equal(f.prevented,6);
});

test('Escape returns to the unchanged search without scrolling the index',()=>{
  const f=fixture();f.list.scrollTop=100;f.send('Escape',f.entries[2]);
  assert.equal(f.focused,f.search);assert.equal(f.list.scrollTop,100);assert.equal(f.prevented,1);
});

test('native activation, Tab, editing and modified/composing keys are never intercepted',()=>{
  const f=fixture();
  for(const key of ['Enter',' ','Tab','ArrowLeft','ArrowRight','x'])f.send(key,f.entries[1]);
  for(const key of ['Home','End','Escape','Enter',' '])f.send(key,f.search);
  for(const modifier of ['altKey','ctrlKey','metaKey','shiftKey'])f.send('ArrowDown',f.search,{[modifier]:true});
  f.send('ArrowDown',f.search,{nativeEvent:{isComposing:true}});
  f.send('ArrowDown',{});f.send('Escape',null);
  assert.equal(f.prevented,0);assert.equal(f.focused,undefined);assert.equal(f.list.scrollTop,0);
});

test('empty, disabled and replaced filtered results cannot be stale keyboard targets',()=>{
  const empty=fixture(0);empty.send('ArrowDown',empty.search);empty.send('ArrowUp',empty.search);assert.equal(empty.prevented,0);
  const f=fixture();f.entries[0].disabled=true;f.send('ArrowDown',f.search);assert.equal(f.focused,f.entries[1]);
  f.send('Home',f.entries[3]);assert.equal(f.focused,f.entries[1]);
  const removed=f.entries.pop()!;const before=f.prevented;f.send('Escape',removed);assert.equal(f.prevented,before);
  f.search.disabled=true;f.send('ArrowDown',f.entries[1]);assert.equal(f.prevented,before);
});

test('scroll adjustment stays inside the result list and handles tall entries',()=>{
  const f=fixture();f.list.scrollTop=200;f.entries[0].top=62;f.entries[0].bottom=102;
  f.send('Home',f.entries[1]);assert.equal(f.list.scrollTop,160);
  f.entries[3].top=140;f.entries[3].bottom=310;f.send('End',f.entries[0]);
  assert.equal(f.list.scrollTop,198,'align top of an oversized row rather than clipping its start');
});
