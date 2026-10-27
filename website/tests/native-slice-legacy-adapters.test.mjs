import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {restoreViewportHarness,restoreViewportTransition} from './head-viewport-harness-inverse.mjs';

const current=name=>{
  const bytes=readFileSync(new URL(`./${name}`,import.meta.url));
  return (name==='head-pan-source-transition.test.ts'?restoreViewportTransition(bytes):restoreViewportHarness(name,bytes)).toString('utf8');
};
const preimage=name=>readFileSync(new URL(`../../before/tests/${name}`,import.meta.url),'utf8');
const normal=text=>text.replaceAll('\r\n','\n');
const sha=text=>createHash('sha256').update(text).digest('hex');
const originals={
  'head-slice-keyboard.test.ts':'3e3994b1bb5f82cf0480e18e199a4acbd7e6b72fc97aff1a7df8d6a2d3804820',
  'head-mask-picking-ui.test.ts':'635e74753f3467f8b85b4d1f431955e8fb921e8d5a5c377af0023e95ffc48022',
  'head-slice-zoom.test.ts':'1459b99870881d5d568b259cfb02ff84813102194c586a4bb6d9f2abd79482c1',
  'head-pan-source-transition.test.ts':'80670c3b9adaf2c3178a64ddcc97eec5682c0abe813e7da73f7a93d3d8cdfcc8',
};
function inverse(text,after,before){
  assert.equal(text.split(after).length,2,`exact unique adapter seam: ${after.slice(0,55)}`);
  return text.replace(after,before);
}
function recover(name,text){
  if(name==='head-slice-keyboard.test.ts'){
    text=inverse(text,'  let currentCursor=[...cursor] as Vec3,hookIndex=0,layoutIndex=0,tree:Node,canvas:Node;','  let currentCursor=[...cursor] as Vec3,hookIndex=0,tree:Node,canvas:Node;');
    text=inverse(text,'  const layoutEffects=new Map<number,{deps:unknown[];cleanup?:()=>void}>(),pendingLayout:Array<()=>void>=[];\n  const same=(a:unknown[]|undefined,b:unknown[])=>!!a&&a.length===b.length&&a.every((value,index)=>Object.is(value,b[index]));\n','');
    text=inverse(text,"    useLayoutEffect(create:()=>void|(()=>void),deps:unknown[]){const index=layoutIndex++,old=layoutEffects.get(index);if(!same(old?.deps,deps))pendingLayout.push(()=>{old?.cleanup?.();const cleanup=create();layoutEffects.set(index,{deps,cleanup:typeof cleanup==='function'?cleanup:undefined});});},\n",'');
    text=inverse(text,'    hookIndex=0;layoutIndex=0;pendingLayout.length=0;','    hookIndex=0;');
    return inverse(text,'    for(const effect of pendingLayout)effect();\n','');
  }
  if(name==='head-mask-picking-ui.test.ts'){
    return inverse(text,'    useEffect:()=>{},\n    useLayoutEffect:()=>{},','    useEffect:()=>{},');
  }
  if(name==='head-slice-zoom.test.ts'){
    text=inverse(text,'    const pendingLayout:Array<()=>void>=[],pending:Array<()=>void>=[];','    const pending:Array<()=>void>=[];');
    text=inverse(text,"      useLayoutEffect(create:()=>void|(()=>void),deps:unknown[]){const index=hook++,old=effects.get(index);if(!same(old?.deps,deps))pendingLayout.push(()=>{old?.cleanup?.();const cleanup=create();effects.set(index,{deps,cleanup:typeof cleanup==='function'?cleanup:undefined});});},\n",'');
    text=inverse(text,'      hook=0;pendingLayout.length=0;pending.length=0;','      hook=0;pending.length=0;');
    return inverse(text,'      for(const effect of pendingLayout)effect();\n      for(const effect of pending)effect();','      for(const effect of pending)effect();');
  }
  if(name==='head-pan-source-transition.test.ts'){
    const start='// NATIVE_SLICE_ADAPTER_BEGIN';
    const end='// NATIVE_SLICE_ADAPTER_END\n';
    assert.equal(text.split(start).length,2);
    assert.equal(text.split(end).length,2);
    const from=text.indexOf(start),to=text.indexOf(end,from);
    assert(from>=0&&to>from);
    text=text.slice(0,from)+text.slice(to+end.length);
    return inverse(text,
      " const keyboard=unwindKeyboard(normal(read('tests/head-slice-keyboard.test.ts'))),zoom=unwindZoom(normal(read('tests/head-slice-zoom.test.ts')));",
      " const keyboard=normal(read('tests/head-slice-keyboard.test.ts')),zoom=normal(read('tests/head-slice-zoom.test.ts'));"
    );
  }
  throw Error(`No adapter inverse for ${name}`);
}

for(const [name,hash] of Object.entries(originals))test(`${name}: exact full-file adapter inverse preserves every prior assertion`,()=>{
  const before=preimage(name),after=current(name);
  assert.equal(sha(before),hash,'byte-exact immutable parent preimage');
  assert.notEqual(normal(after),normal(before),'adapter must be present');
  assert.equal(recover(name,normal(after)),normal(before),'complete original file reconstructs');
});
