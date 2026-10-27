import './lecture-context-fixture.mjs';
/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import React from 'react';
import ts from 'typescript';
import {expectedStudioContext} from './lecture-context-fixture.mjs';

const require=createRequire(import.meta.url);
type Node=React.ReactElement<Record<string,any>>;
const children=(node:unknown):unknown[]=>React.isValidElement(node)?React.Children.toArray((node as Node).props.children):[];
const nodes=(node:unknown):Node[]=>React.isValidElement(node)?[node as Node,...children(node).flatMap(nodes)]:[];
const label=(node:unknown):string=>typeof node==='string'||typeof node==='number'?String(node):children(node).map(label).join('');

function editor(react:typeof React){
  const source=readFileSync(new URL('../components/LectureEditor.tsx',import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const module={exports:{} as Record<string,any>};
  const lineage={WorkbookCorrectionLineage:()=>null,createWorkbookCorrectionLineageContext:()=>({begin:()=>Symbol(),finish(){},invalidate(){}})};
  new Function('require','module','exports',code)((name:string)=>{
    if(name==='react')return react;
    if(name.endsWith('.css'))return {};
    if(name==='./WorkbookCorrectionLineage')return lineage;
    if(name==='../lib/learning-draft-navigation.ts')return {registerLearningDraftGuard:()=>Object.assign(()=>{}, {refresh(){}})};
    if(['./LecturePlayer','./WorkbookRetirement','./WorkbookCorrection'].includes(name))return {[name.slice(2)]:()=>null};
    if(name==='./lecture-save-presentation')return {lectureSavePresentation:()=>({state:'draft',label:'Draft',detail:''})};
    return require(name);
  },module,module.exports);
  return module.exports.LectureEditor;
}

function harness(){
  const values:unknown[]=[];let index=0;
  const pending:Array<()=>void>=[];
  const doc={body:{} as any,activeElement:null as any};doc.activeElement=doc.body;
  const focusLog:string[]=[];
  const elements=new Map<string,any>();
  const make=(name:string)=>({name,isConnected:true,disabled:false,ownerDocument:doc,
    focus(){doc.activeElement=this;focusLog.push(name);},
    contains(target:any){return target===this||name==='root';}});
  const react={...React,
    useEffect:()=>undefined,
    useMemo:(factory:()=>unknown,deps:unknown[])=>{const i=index++,old=values[i] as {deps:unknown[];value:unknown}|undefined;if(!old||deps.some((v,j)=>!Object.is(v,old.deps[j])))values[i]={deps,value:factory()};return (values[i] as {value:unknown}).value;},
    useRef:(initial:unknown)=>{const i=index++;if(!(i in values))values[i]={current:initial};return values[i];},
    useState:(initial:unknown)=>{const i=index++;if(!(i in values))values[i]=typeof initial==='function'?(initial as ()=>unknown)():initial;return [values[i],(next:any)=>{values[i]=typeof next==='function'?next(values[i]):next;}];},
    useLayoutEffect:(create:()=>void|(()=>void),deps:unknown[])=>{const i=index++,old=values[i] as {deps:unknown[];cleanup?:()=>void}|undefined;if(!old||deps.some((v,j)=>!Object.is(v,old.deps[j])))pending.push(()=>{old?.cleanup?.();const cleanup=create();values[i]={deps,cleanup:typeof cleanup==='function'?cleanup:undefined};});},
  } as unknown as typeof React;
  const LectureEditor=editor(react);
  let tree:Node;
  function findButton(name:string){return nodes(tree).find(node=>node.type==='button'&&label(node)===name)!;}
  function render(props:any){
    index=0;pending.length=0;tree=LectureEditor(props);
    for(const element of elements.values())element.isConnected=false;
    elements.clear();
    const root=nodes(tree).find(node=>node.type==='section'&&node.props.className==='lecture-editor')!;
    const selectedTitle=nodes(tree).find(node=>node.type==='input'&&node.props.maxLength===160&&node.props.value!==props.initial.title);
    const empty=findButton('Add first slide');
    for(const [key,node] of [['root',root],['title',selectedTitle],['empty',empty]] as const){
      if(!node)continue;
      const element=make(key);elements.set(key,element);node.props.ref.current=element;
    }
    if(doc.activeElement?.isConnected===false)doc.activeElement=doc.body;
    for(const effect of pending)effect();
    return tree;
  }
  return {render,findButton,doc,focusLog,elements,get tree(){return tree;}};
}

const initial={id:'lecture-1',title:'Anatomy lecture',version:1,status:'draft',courseId:'course-1',courseTitle:'Anatomy',
  slides:[{id:'a',title:'First',body:'Content',referenceUrl:''},{id:'b',title:'Second',body:'Content',referenceUrl:''}],
  canEdit:true,canReview:false,canPublish:false,reviews:[],published:null};
const props={initial,courseOutline:[],expectedStudioContext};

test('adding a slide focuses its title, unless focus moved before commit',()=>{
  const h=harness();h.render(props);
  h.findButton('Add').props.onClick();h.render(props);
  assert.deepEqual(h.focusLog,['title']);
  const add=h.findButton('Add');add.props.onClick();
  h.doc.activeElement={isConnected:true};h.render(props);
  assert.deepEqual(h.focusLog,['title']);
});

test('confirmed removal focuses the remaining title or the empty add control; cancellation leaves focus alone',()=>{
  const oldWindow=Object.getOwnPropertyDescriptor(globalThis,'window');
  let confirmed=false;
  Object.defineProperty(globalThis,'window',{configurable:true,value:{confirm:()=>confirmed}});
  try{
    const h=harness();h.render(props);
    h.findButton('Remove').props.onClick();h.render(props);
    assert.equal(h.focusLog.length,0);
    confirmed=true;h.findButton('Remove').props.onClick();h.render(props);
    assert.deepEqual(h.focusLog,['title']);
    h.doc.activeElement=h.doc.body;
    h.findButton('Remove').props.onClick();h.render(props);
    assert.deepEqual(h.focusLog,['title','empty']);
  }finally{if(oldWindow)Object.defineProperty(globalThis,'window',oldWindow);else Reflect.deleteProperty(globalThis,'window');}
});

test('stale add callback and eighty slide limit do not mutate the draft',()=>{
  const h=harness();h.render(props);
  const staleAdd=h.findButton('Add').props.onClick;
  staleAdd();h.render(props);
  const before=nodes(h.tree).filter(node=>node.type==='li'&&label(node).includes('Untitled slide')).length;
  staleAdd();h.render(props);
  assert.equal(nodes(h.tree).filter(node=>node.type==='li'&&label(node).includes('Untitled slide')).length,before);
  const capped={...initial,slides:Array.from({length:80},(_,i)=>({...initial.slides[0],id:`slide-${i}`}))};
  const other=harness();other.render({...props,initial:capped});
  assert.equal(other.findButton('Add').props.disabled,true);
  other.findButton('Add').props.onClick();other.render({...props,initial:capped});
  assert.match(label(nodes(other.tree).find(node=>node.type==='aside'&&node.props['aria-label']==='Slide outline')),/80 total/);
});
