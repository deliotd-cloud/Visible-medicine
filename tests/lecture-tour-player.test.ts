/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import React from 'react';
import ts from 'typescript';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {lectureRequestReturnPath,lectureSlideHref,parseLectureSlideRequest,type PublishedLectureNavigation} from '../lib/lecture-slide-navigation.ts';
import {createLectureTourContext,parseLectureTourContext,type LectureTourContext} from '../lib/lecture-tour-context.ts';

const requireNode=createRequire(import.meta.url);
const revision='a'.repeat(64),workbookId='lecture:guided',route='/learn/head/lecture%3Aguided';
const slides=[
  {id:'first',title:'First slide',body:'First body',referenceUrl:''},
  {id:'second',title:'Second slide',body:'Second body',referenceUrl:''},
  {id:'third',title:'Third slide',body:'Third body',referenceUrl:''},
];
const ct=createLectureTourContext({sequenceId:'brainstem',conceptId:'brainstem-pons'},'CT',HEAD_LINK_REVISION);
const mri=createLectureTourContext({sequenceId:'brainstem',conceptId:'brainstem-pons'},'MRI',HEAD_LINK_REVISION);
assert.equal(ct.kind,'ready');assert.equal(mri.kind,'ready');
function nav(tourContext:LectureTourContext=ct,request:PublishedLectureNavigation['request']={kind:'requested',slideId:'second',revision}):PublishedLectureNavigation{
  return {workbookId,courseSlug:'head',revision,request,tourContext};
}
type ElementNode=React.ReactElement<Record<string,any>>;
const children=(node:unknown):unknown[]=>React.isValidElement(node)?React.Children.toArray((node as ElementNode).props.children):[];
const descendants=(node:unknown):ElementNode[]=>React.isValidElement(node)?[node as ElementNode,...children(node).flatMap(descendants)]:[];
const textOf=(node:unknown):string=>typeof node==='string'||typeof node==='number'?String(node):children(node).map(textOf).join('');
function button(tree:ElementNode,label:string){const found=descendants(tree).find(node=>node.type==='button'&&textOf(node)===label);assert(found,`missing ${label}`);return found;}
function heading(tree:ElementNode){return textOf(descendants(tree).find(node=>node.type==='h3'));}

function browser(initial:string){
  let url=new URL(initial,'https://visible.invalid');
  const events=new Map<string,Set<()=>void>>();
  const calls:Array<{state:unknown;url:string}>=[];
  const state={carried:'keep'};
  const window={
    get location(){return url;},
    history:{state,replaceState(nextState:unknown,_unused:string,nextUrl:string){calls.push({state:nextState,url:nextUrl});url=new URL(nextUrl,url);}},
    addEventListener(name:string,handler:()=>void){const listeners=events.get(name)??new Set();listeners.add(handler);events.set(name,listeners);},
    removeEventListener(name:string,handler:()=>void){events.get(name)?.delete(handler);},
  };
  return {window,calls,current:()=>url.pathname+url.search,navigate:(href:string)=>{url=new URL(href,url);},
    dispatch:(name:string)=>{for(const handler of [...events.get(name)??[]])handler();}};
}

function harness(){
  const values:unknown[]=[],memos=new Map<number,{value:unknown;deps?:readonly unknown[]}>(),effects=new Map<number,{deps?:readonly unknown[];cleanup?:()=>void}>();
  let index=0;
  let queued:Array<{slot:number;effect:()=>void|(()=>void);deps?:readonly unknown[]}>=[];
  const changed=(a?:readonly unknown[],b?:readonly unknown[])=>!a||!b||a.length!==b.length||a.some((value,i)=>!Object.is(value,b[i]));
  const hooks={...React,
    useState(initial:unknown){const slot=index++;if(!(slot in values))values[slot]=typeof initial==='function'?(initial as ()=>unknown)():initial;
      return [values[slot],(next:unknown)=>{values[slot]=typeof next==='function'?(next as (old:unknown)=>unknown)(values[slot]):next;}];},
    useRef(initial:unknown){const slot=index++;if(!(slot in values))values[slot]={current:initial};return values[slot];},
    useMemo(factory:()=>unknown,deps?:readonly unknown[]){const slot=index++,old=memos.get(slot);if(old&&!changed(old.deps,deps))return old.value;
      const value=factory();memos.set(slot,{value,deps});return value;},
    useEffect(effect:()=>void|(()=>void),deps?:readonly unknown[]){const slot=index++,old=effects.get(slot);if(!old||changed(old.deps,deps))queued.push({slot,effect,deps});},
  } as unknown as typeof React;
  return {react:hooks,render(Component:(props:any)=>ElementNode,props:any){index=0;queued=[];const tree=Component(props);
      for(const item of queued){effects.get(item.slot)?.cleanup?.();const cleanup=item.effect();effects.set(item.slot,{deps:item.deps,cleanup:typeof cleanup==='function'?cleanup:undefined});}
      return tree;},unmount(){for(const item of effects.values())item.cleanup?.();effects.clear();}};
}

function loadPlayer(react:typeof React){
  const source=readFileSync(new URL('../components/LecturePlayer.tsx',import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const module={exports:{} as Record<string,any>};
  new Function('require','module','exports',code)((name:string)=>name==='react'?react:name.endsWith('.css')?{}:requireNode(name),module,module.exports);
  return module.exports.LecturePlayer as (props:any)=>ElementNode;
}
function withWindow<T>(fake:ReturnType<typeof browser>,action:()=>T):T{
  const old=Object.getOwnPropertyDescriptor(globalThis,'window');
  Object.defineProperty(globalThis,'window',{configurable:true,value:fake.window});
  try{return action();}finally{if(old)Object.defineProperty(globalThis,'window',old);else Reflect.deleteProperty(globalThis,'window');}
}

test('actual Next and Previous replaceState retain the exact CT tour and published slide revision',()=>{
  const source=nav(),initial=lectureSlideHref(source,'second')!;
  const fake=browser(initial),hooks=harness(),Player=loadPlayer(hooks.react);
  withWindow(fake,()=>{
    let tree=hooks.render(Player,{title:'Lecture',slides,navigation:source});
    assert.equal(heading(tree),'Second slide');
    button(tree,'Next').props.onClick();
    tree=hooks.render(Player,{title:'Lecture',slides,navigation:source});
    assert.equal(heading(tree),'Third slide');
    assert.deepEqual(fake.calls,[{state:fake.window.history.state,url:lectureSlideHref(source,'third')}]);
    button(tree,'Previous').props.onClick();
    tree=hooks.render(Player,{title:'Lecture',slides,navigation:source});
    assert.equal(heading(tree),'Second slide');
    assert.deepEqual(fake.calls.map(call=>call.url),[lectureSlideHref(source,'third'),initial]);
    for(const call of fake.calls){
      const url=new URL(call.url,'https://visible.invalid');
      assert.deepEqual(parseLectureTourContext(url.searchParams),ct);
      assert.equal(parseLectureSlideRequest(url.searchParams).kind,'requested');
    }
    hooks.unmount();
  });
});

test('reload of a moved slide parses the same context and sign-in return path',()=>{
  const source=nav(),moved=lectureSlideHref(source,'third')!;
  const query=new URL(moved,'https://visible.invalid').searchParams;
  const request=parseLectureSlideRequest(query),context=parseLectureTourContext(query);
  assert.deepEqual(context,ct);
  assert.equal(lectureRequestReturnPath(workbookId,'head',request,context),moved);
  const fake=browser(moved),hooks=harness(),Player=loadPlayer(hooks.react);
  withWindow(fake,()=>{
    const tree=hooks.render(Player,{title:'Lecture',slides,navigation:nav(context,request)});
    assert.equal(heading(tree),'Third slide');
    assert.deepEqual(fake.calls,[]);
    hooks.unmount();
  });
});

test('changed URL tour metadata blocks stale controls even when the slide route remains identical',()=>{
  const source=nav(),fake=browser(lectureSlideHref(source,'second')!),hooks=harness(),Player=loadPlayer(hooks.react);
  withWindow(fake,()=>{
    const tree=hooks.render(Player,{title:'Lecture',slides,navigation:source});
    const oldNext=button(tree,'Next').props.onClick;
    fake.navigate(lectureSlideHref(nav(mri),'second')!);
    oldNext();
    assert.deepEqual(fake.calls,[]);
    assert.equal(fake.current(),lectureSlideHref(nav(mri),'second'));
    hooks.unmount();
  });
});

test('changed origin context props retire captured controls before they can rewrite the new context',()=>{
  const source=nav(),nextSource=nav(mri),fake=browser(lectureSlideHref(source,'second')!),hooks=harness(),Player=loadPlayer(hooks.react);
  withWindow(fake,()=>{
    let tree=hooks.render(Player,{title:'Lecture',slides,navigation:source});
    const oldNext=button(tree,'Next').props.onClick;
    fake.navigate(lectureSlideHref(nextSource,'second')!);
    tree=hooks.render(Player,{title:'Lecture',slides,navigation:nextSource});
    oldNext();
    assert.equal(fake.calls.length,0);
    tree=hooks.render(Player,{title:'Lecture',slides,navigation:nextSource});
    assert.equal(heading(tree),'Second slide');
    button(tree,'Next').props.onClick();
    assert.deepEqual(fake.calls.map(call=>call.url),[lectureSlideHref(nextSource,'third')]);
    hooks.unmount();
  });
});

test('invalid origin context keeps the bounded invalid marker through recovery and later navigation',()=>{
  const invalid={kind:'invalid'} as const,source=nav(invalid,{kind:'invalid'});
  const initial=lectureRequestReturnPath(workbookId,'head',{kind:'invalid'},invalid);
  assert.deepEqual(parseLectureTourContext(new URL(initial,'https://visible.invalid').searchParams),invalid);
  const fake=browser(initial),hooks=harness(),Player=loadPlayer(hooks.react);
  withWindow(fake,()=>{
    let tree=hooks.render(Player,{title:'Lecture',slides,navigation:source});
    button(tree,'Start current lecture').props.onClick();
    tree=hooks.render(Player,{title:'Lecture',slides,navigation:source});
    assert.equal(heading(tree),'First slide');
    button(tree,'Next').props.onClick();
    tree=hooks.render(Player,{title:'Lecture',slides,navigation:source});
    assert.equal(heading(tree),'Second slide');
    assert.deepEqual(fake.calls.map(call=>call.url),[lectureSlideHref(source,'first'),lectureSlideHref(source,'second')]);
    for(const call of fake.calls)assert.deepEqual(parseLectureTourContext(new URL(call.url,'https://visible.invalid').searchParams),invalid);
    hooks.unmount();
  });
});
