import assert from 'node:assert/strict';
import test from 'node:test';
import {harness,props,surface} from './head-surface-loading.test.ts';

function focusHarness(){
 const previous=Object.getOwnPropertyDescriptor(globalThis,'document');
 const document={body:{id:'body'},activeElement:null};document.activeElement=document.body;
 Object.defineProperty(globalThis,'document',{configurable:true,value:document});
 const h=harness(),calls=[];
 const view={focus(options){calls.push(options);document.activeElement=view;}};
 function attach(){const node=h.walk(h.tree,n=>n.props['aria-label']==='3D scan loading and recovery');if(node)node.props.ref.current=view;return node;}
 return {h,document,view,calls,attach,dispose(){h.dispose();if(previous)Object.defineProperty(globalThis,'document',previous);else delete globalThis.document;}};
}
async function failFirst(f){f.h.flush(props);f.attach();await Promise.resolve();f.h.imports[0].reject(Error('synthetic import failure'));await f.h.settle();f.attach();return f.h.walk(f.h.tree,n=>n.type==='button');}

test('focused import retry preserves a stable local target through loading and success',async()=>{
 const f=focusHarness();try{
  const retry=await failFirst(f);assert(retry);const button={id:'retry'};f.document.activeElement=button;
  retry.props.onClick({currentTarget:button});
  assert.equal(f.document.activeElement,f.view,'restore before removing the focused button');
  f.h.flush();const loading=f.attach();assert(loading);assert.equal(loading.props.tabIndex,-1);assert.deepEqual(loading.props.style,{width:'100%',height:'100%'});
  await Promise.resolve();const latest={...props,regionalCourse:true};f.h.flush(latest);f.attach();
  f.h.imports[1].resolve({HeadAtlasSurface:surface});await f.h.settle();f.attach();
  assert.equal(f.document.activeElement,f.view);assert.deepEqual(f.calls,[{preventScroll:true}]);
  assert.equal(f.h.walk(f.h.tree,n=>n.type===surface)?.props.regionalCourse,true);
 }finally{f.dispose();}
});
test('outside focus is not stolen by initial failure, unfocused retry or eventual success',async()=>{
 const f=focusHarness();try{
  const outside={id:'slice controls'};f.document.activeElement=outside;const retry=await failFirst(f);assert(retry);
  assert.equal(f.document.activeElement,outside);retry.props.onClick({currentTarget:{id:'not focused'}});f.h.flush();f.attach();await Promise.resolve();
  f.h.imports[1].resolve({HeadAtlasSurface:surface});await f.h.settle();f.attach();
  assert.equal(f.document.activeElement,outside);assert.deepEqual(f.calls,[]);
 }finally{f.dispose();}
});
test('a later focus move survives repeated import failure and the next retry',async()=>{
 const f=focusHarness();try{
  let retry=await failFirst(f);const button={id:'retry'};f.document.activeElement=button;retry.props.onClick({currentTarget:button});f.h.flush();f.attach();await Promise.resolve();
  const outside={id:'anatomy index'};f.document.activeElement=outside;f.h.imports[1].reject(Error('repeat synthetic rejection'));await f.h.settle();f.attach();
  assert.equal(f.document.activeElement,outside);retry=f.h.walk(f.h.tree,n=>n.type==='button');assert(retry);
  retry.props.onClick({currentTarget:{id:'not focused'}});f.h.flush();f.attach();await Promise.resolve();f.h.imports[2].resolve({HeadAtlasSurface:surface});await f.h.settle();
  assert.equal(f.document.activeElement,outside);assert.equal(f.calls.length,1);
 }finally{f.dispose();}
});
