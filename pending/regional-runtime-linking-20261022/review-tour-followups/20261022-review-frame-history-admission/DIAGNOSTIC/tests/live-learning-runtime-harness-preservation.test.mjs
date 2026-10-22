import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {beforeExpansionFrame} from './review-frame-history-inverse.mjs';

const read=relative=>readFileSync(new URL(relative,import.meta.url),'utf8');
const original=read('./fixtures/live-learning-original-runtime-frame-test.mjs.raw');
const current=()=>beforeExpansionFrame(read('./atlas-runtime-frame.test.mjs'));
const digest=text=>createHash('sha256').update(text).digest('hex');
const seams=[
  ["import {liveLearningHookExports,attachLiveLearningHooks,attachLiveLearningBrowser,attachLiveLearningFrame} from './live-learning-runtime-harness-transition.mjs';\n",''],
  ["      ? liveLearningHookExports.react\n      : liveLearningHookExports.jsx, loader: 'js'}));",
   "      ? 'export const useState=(...a)=>globalThis.__atlasHooks.useState(...a); export const useRef=(...a)=>globalThis.__atlasHooks.useRef(...a); export const useEffect=(...a)=>globalThis.__atlasHooks.useEffect(...a);'\n      : 'export const jsx=(...a)=>globalThis.__atlasHooks.jsx(...a); export const jsxs=jsx;', loader: 'js'}));"],
  ['child = null, learning = null, element = null','child = null, element = null'],
  ['const timers = new Map(),learningTimers=new Map(),messages=[];','const timers = new Map();'],
  ["    setTimeout(callback,delay) { const id = ++nextTimer; const owner=delay===15000?learningTimers:timers; owner.set(id, () => { owner.delete(id); callback(); }); return id; },\n    clearTimeout(id) { timers.delete(id);learningTimers.delete(id); },",
   "    setTimeout(callback) { const id = ++nextTimer; timers.set(id, () => { timers.delete(id); callback(); }); return id; },\n    clearTimeout(id) { timers.delete(id); },"],
  ['  attachLiveLearningBrowser(globalThis.window,globalThis.document);\n',''],
  ['  attachLiveLearningHooks(globalThis.__atlasHooks,()=>current);\n',''],
  ["instanceToCommit.pending.splice(0).sort((a,b)=>(a.kind==='layout'?0:1)-(b.kind==='layout'?0:1))",
   'instanceToCommit.pending.splice(0)'],
  ['    if(instanceToRetire===child&&learning){retire(learning);learning=null;}\n',''],
  ['child.frame = {contentDocument: {readyState}, contentWindow: {location: {href: documentHref},postMessage(value,origin){messages.push({value,origin});}}};',
   'child.frame = {contentDocument: {readyState}, contentWindow: {location: {href: documentHref}}};'],
  ["    attachLiveLearningFrame(child.frame,childElement.props.src,globalThis.document);\n    const learningElement=element.props.children[1];\n    if(!learning||learning.type!==learningElement.type||learning.key!==learningElement.key){\n      retire(learning);learning=instance(learningElement.type,learningElement.key);\n    }\n    const learningTree=render(learning,learningElement.props);\n",''],
  ["    commit(learning);\n    return {frame: child.frame, iframe: frameElement, container: child.container, learning:learningTree, status: element.props.children[2], help: element.props.children[3]};",
   "    return {frame: child.frame, iframe: frameElement, container: child.container, status: element.props.children[1], help: element.props.children[2]};"],
  ['    learningTimers,messages,\n',''],
  ["      const actions = element.props.children[3]\n        ? element.props.children[3].props.children[2]\n        : element.props.children[2].props.children[4];",
   "      const actions = element.props.children[2]\n        ? element.props.children[2].props.children[2]\n        : element.props.children[1].props.children[4];"],
  ["test('real mounted learning child keeps an independent hook and timer lifecycle',()=>{\n  const src='/atlas-runtime/head-neck/index.html?region=thorax&study=1';\n  const h=componentHarness(src,`https://atlas.example${src}`);\n  try{\n    const view=h.flush();\n    assert.equal(view.learning.type,'details');\n    assert.equal(view.learning.props['data-learning-state'],'waiting');\n    assert.equal(h.messages.length,1);\n    assert.equal(h.messages[0].value.type,'vm-atlas-learning-selection-request');\n    assert.equal(h.messages[0].origin,'https://atlas.example');\n    assert.equal(h.timers.size,0,'Document timer is independent of the learning timer');\n    assert.equal(h.learningTimers.size,1);\n  }finally{h.dispose();}\n  assert.equal(h.learningTimers.size,0,'Learning child cleanup retires its own timer');\n});\n\n",''],
];
function inverse(value){
  for(const [addition,prior] of seams){
    assert.equal(value.split(addition).length,2,`Missing or duplicate declared runtime seam: ${addition.slice(0,80)}`);
    value=value.replace(addition,prior);
  }
  return value;
}

test('original runtime-frame test is frozen at its exact canonical byte hash',()=>{
  assert.equal(digest(original),'f4ebefd05a10639680e4c21c68c07a5ee31fbab380a3c4024c129d26872710b1');
});
test('only declared hook, browser and child-render seams changed the whole original source',()=>{
  assert.equal(inverse(current()),original);
});
test('mutated new adapter or original retry assertion cannot pass the inverse',()=>{
  assert.throws(()=>inverse(current().replace('attachLiveLearningHooks(globalThis.__atlasHooks,()=>current);',
    'attachLiveLearningHooks(globalThis.__atlasHooks,()=>null);')));
  assert.notEqual(inverse(current().replace(
    "assert.equal(h.document.activeElement, retried.container);",
    "assert.equal(h.document.activeElement, h.document.body);")),original);
});
