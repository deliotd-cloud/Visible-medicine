import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import * as learning from '../lib/head-atlas-learning.ts';
import type {HeadEntry,LoadedStudy,Modality} from '../lib/head-atlas-import.ts';
import type {HeadLearningPosition} from '../lib/head-atlas-learning.ts';

const require=createRequire(import.meta.url);
const source=readFileSync(process.env.HEAD_COMPARISON_TOUR_BASELINE_SOURCE??new URL('../components/HeadComparisonTour.tsx',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
type Node={type:unknown;props:Record<string,any>};
type Props={study:LoadedStudy;modality:Modality;position:HeadLearningPosition;onNavigate:(position:HeadLearningPosition)=>void;onFinish:()=>void};
const study=(entries:HeadEntry[]=[])=>({definition:{entries}} as LoadedStudy);
const position=(conceptId:string|null,sequenceId='brainstem'):HeadLearningPosition=>({sequenceId,conceptId});

function harness(current=true){
  type Effect={kind:'layout'|'passive';create:()=>void|(()=>void);deps?:unknown[];cleanup?:()=>void};
  const slots:unknown[]=[],committed=new Map<number,Effect>();let cursor=0,pending=new Map<number,Effect>();
  function effect(kind:Effect['kind'],create:Effect['create'],deps?:unknown[]){pending.set(cursor++,{kind,create,deps});}
  function setup(item:Effect){const cleanup=item.create();item.cleanup=typeof cleanup==='function'?cleanup:undefined;}
  function cleanup(item:Effect){item.cleanup?.();item.cleanup=undefined;}
  function commit(){
    for(const kind of ['layout','passive'] as const){
      const changed=[...pending].filter(([index,item])=>item.kind===kind&&(!item.deps||!committed.get(index)?.deps||item.deps.length!==committed.get(index)!.deps!.length||item.deps.some((dep,i)=>!Object.is(dep,committed.get(index)!.deps![i]))));
      for(const [index] of changed){const previous=committed.get(index);if(previous)cleanup(previous);}
      for(const [index,item] of changed){committed.set(index,item);setup(item);}
    }
  }
  const hooks={useRef(initial:unknown){const index=cursor++;if(!(index in slots))slots[index]={current:initial};return slots[index];},
    useLayoutEffect:(create:Effect['create'],deps?:unknown[])=>effect('layout',create,deps),
    useEffect:(create:Effect['create'],deps?:unknown[])=>effect('passive',create,deps)};
  const mod={exports:{} as {HeadComparisonTour:(props:Props)=>Node|null}};
  const imports:Record<string,unknown>={react:hooks,'react/jsx-runtime':require('react/jsx-runtime'),
    '../lib/head-atlas-import':{HEAD_MANIFEST_SHA256:HEAD_LINK_REVISION},
    '../lib/head-link-availability.ts':{headLinksCurrent:()=>current},
    '../lib/head-atlas-learning':learning};
  new Function('require','module','exports',code)((id:string)=>{assert(Object.hasOwn(imports,id),id);return imports[id];},mod,mod.exports);
  return {render:(props:Props,shouldCommit=true)=>{cursor=0;pending=new Map();const tree=mod.exports.HeadComparisonTour(props);if(shouldCommit)commit();return tree;},
    setCurrent:(value:boolean)=>{current=value;},
    unmount:()=>{for(const kind of ['layout','passive'] as const)for(const item of committed.values())if(item.kind===kind)cleanup(item);committed.clear();},
    replay:()=>{for(const kind of ['layout','passive'] as const){const items=[...committed.values()].filter(item=>item.kind===kind);items.forEach(cleanup);items.forEach(setup);}}};
}
function buttons(tree:Node|null):Node[]{
  const found:Node[]=[];
  function walk(value:unknown){if(Array.isArray(value)){value.forEach(walk);return;}if(!value||typeof value!=='object'||!('props' in value))return;
    const node=value as Node;if(node.type==='button')found.push(node);walk(node.props.children);}
  walk(tree);return found;
}
const callbacks=()=>{const navigated:HeadLearningPosition[]=[];let finished=0;return {navigated,get finished(){return finished;},onNavigate:(next:HeadLearningPosition)=>navigated.push(next),onFinish:()=>{finished++;}};};

test('first and last controls retain canonical numbering and finish without navigation',()=>{
  const view=harness(),actions=callbacks();
  const first=view.render({study:study(),modality:'CT',position:position('brainstem-midbrain'),...actions});
  assert(first);const html=renderToStaticMarkup(first as React.ReactNode);
  assert.match(html,/class="head-comparison-tour"/);
  assert.match(html,/Brainstem orientation · Step 1\/3/);
  assert.match(html,/Midbrain/);
  assert.match(html,/This step is unavailable/);
  const firstButtons=buttons(first);assert.equal(firstButtons.length,2);
  assert.equal(firstButtons[0].props.disabled,true);
  assert.equal(firstButtons[1].props.children,'Next tour step');
  firstButtons[1].props.onClick();
  assert.deepEqual(actions.navigated,[position('brainstem-pons')]);
  const last=view.render({study:study(),modality:'CT',position:position('brainstem-medulla'),...actions});
  assert(last);assert.match(renderToStaticMarkup(last as React.ReactNode),/Step 3\/3/);
  const lastButtons=buttons(last);assert.equal(lastButtons[1].props.children,'Finish tour');
  lastButtons[0].props.onClick();lastButtons[1].props.onClick();
  assert.deepEqual(actions.navigated,[position('brainstem-pons'),position('brainstem-pons')]);
  assert.equal(actions.finished,1);
  assert.equal(lastButtons[1].type,firstButtons[1].type,'same native control can retain focus when its label changes');
});

test('missing canonical middle slot is visited in order and never substituted',()=>{
  const view=harness(),actions=callbacks();
  const middle=view.render({study:study(),modality:'CT',position:position('brainstem-pons'),...actions});
  assert(middle);assert.match(renderToStaticMarkup(middle as React.ReactNode),/Step 2\/3/);
  assert.match(renderToStaticMarkup(middle as React.ReactNode),/No other structure has been substituted/);
  const controls=buttons(middle);controls[0].props.onClick();controls[1].props.onClick();
  assert.deepEqual(actions.navigated,[position('brainstem-midbrain'),position('brainstem-medulla')]);
});

test('invalid source, sequence, position and revision render no navigation',()=>{
  const props={study:study(),modality:'CT' as const,position:position('brainstem-pons'),...callbacks()};
  assert.equal(harness(false).render(props),null);
  assert.equal(harness().render({...props,study:{} as LoadedStudy}),null);
  assert.equal(harness().render({...props,position:position(null)}),null);
  assert.equal(harness().render({...props,position:position('brainstem-pons','unknown')}),null);
  assert.equal(harness().render({...props,position:position('unknown')}),null);
  assert.equal(harness().render({...props,modality:'MRI',position:position('brainstem-pons','ct-bone')}),null);
});

test('callbacks from replaced study, modality or position and unmounted tour are inert',()=>{
  const view=harness(),actions=callbacks(),base={study:study(),modality:'CT' as Modality,...actions};
  const old=view.render({...base,position:position('brainstem-midbrain')});assert(old);
  const retained=buttons(old)[1].props.onClick;
  view.render({...base,study:study([]),modality:'MRI',position:position('brainstem-medulla')});
  retained();assert.deepEqual(actions.navigated,[]);
  const last=view.render({...base,position:position('brainstem-medulla')});assert(last);
  const retainedFinish=buttons(last)[1].props.onClick;
  view.unmount();retainedFinish();assert.equal(actions.finished,0);
});

for(const conceptId of ['brainstem-pons','brainstem-medulla'])test(`visible ${conceptId} controls remain responsive after an abandoned render`,()=>{
  const view=harness(),actions=callbacks(),base={study:study(),modality:'CT' as Modality,...actions};
  const visible=view.render({...base,position:position(conceptId)});assert(visible);
  view.render({...base,position:position('brainstem-midbrain')},false);
  const controls=buttons(visible);controls[0].props.onClick();controls[1].props.onClick();
  assert.deepEqual(actions.navigated,conceptId==='brainstem-pons'?[position('brainstem-midbrain'),position('brainstem-medulla')]:[position('brainstem-pons')]);
  assert.equal(actions.finished,conceptId==='brainstem-medulla'?1:0);
});

for(const conceptId of ['brainstem-pons','brainstem-medulla'])test(`committed ${conceptId} controls survive an abandoned replacement render`,()=>{
  const view=harness(),actions=callbacks(),base={study:study(),modality:'CT' as Modality,...actions};
  const visible=view.render({...base,position:position(conceptId)});assert(visible);
  const speculative=view.render({...base,position:position('brainstem-midbrain')},false);assert(speculative);
  buttons(speculative)[1].props.onClick();
  assert.deepEqual(actions.navigated,[],'speculative navigation is inert before commit');
  const controls=buttons(visible);controls[0].props.onClick();controls[1].props.onClick();
  assert.deepEqual(actions.navigated,conceptId==='brainstem-pons'?[position('brainstem-midbrain'),position('brainstem-medulla')]:[position('brainstem-pons')]);
  assert.equal(actions.finished,conceptId==='brainstem-medulla'?1:0);
});

test('abandoned navigation and Finish callbacks remain inert after a different commit',()=>{
  const view=harness(),actions=callbacks(),base={study:study(),modality:'CT' as Modality,...actions};
  view.render({...base,position:position('brainstem-midbrain')});
  const speculative=view.render({...base,position:position('brainstem-medulla')},false);assert(speculative);
  buttons(speculative).forEach(control=>control.props.onClick());
  assert.deepEqual(actions.navigated,[]);assert.equal(actions.finished,0);
  const replacement=view.render({...base,position:position('brainstem-pons')});assert(replacement);
  buttons(speculative).forEach(control=>control.props.onClick());
  assert.deepEqual(actions.navigated,[]);assert.equal(actions.finished,0);
  buttons(replacement).forEach(control=>control.props.onClick());
  assert.deepEqual(actions.navigated,[position('brainstem-midbrain'),position('brainstem-medulla')]);
});

for(const replacement of ['valid','invalid','unmount'])test(`all committed controls retire after ${replacement}`,()=>{
  const view=harness(),actions=callbacks(),base={study:study(),modality:'CT' as Modality,...actions};
  const middle=view.render({...base,position:position('brainstem-pons')});assert(middle);
  const retained=buttons(middle).map(control=>control.props.onClick);
  const last=view.render({...base,position:position('brainstem-medulla')});assert(last);
  retained.push(...buttons(last).map(control=>control.props.onClick));
  if(replacement==='valid')view.render({...base,position:position('brainstem-midbrain')});
  else if(replacement==='invalid'){view.setCurrent(false);assert.equal(view.render({...base,position:position('brainstem-medulla')}),null);}
  else view.unmount();
  retained.forEach(callback=>callback());assert.deepEqual(actions.navigated,[]);assert.equal(actions.finished,0);
  if(replacement==='invalid'){
    view.setCurrent(true);const restored=view.render({...base,position:position('brainstem-pons')});assert(restored);
    retained.forEach(callback=>callback());assert.deepEqual(actions.navigated,[]);assert.equal(actions.finished,0);
    buttons(restored)[1].props.onClick();assert.deepEqual(actions.navigated,[position('brainstem-medulla')]);
  }
});

test('StrictMode effect cleanup and setup replay preserves current controls and retires them on unmount',()=>{
  const view=harness(),actions=callbacks(),base={study:study(),modality:'CT' as Modality,...actions};
  const last=view.render({...base,position:position('brainstem-medulla')});assert(last);
  const controls=buttons(last);view.replay();
  controls[0].props.onClick();controls[1].props.onClick();
  assert.deepEqual(actions.navigated,[position('brainstem-pons')]);assert.equal(actions.finished,1);
  view.replay();controls[1].props.onClick();assert.equal(actions.finished,2,'active callbacks are not consumed per commit');
  view.unmount();controls.forEach(control=>control.props.onClick());
  assert.deepEqual(actions.navigated,[position('brainstem-pons')]);assert.equal(actions.finished,2);
});
