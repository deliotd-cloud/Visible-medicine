import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import ts from 'typescript';
import type {HeadEntry} from '../lib/head-atlas-import.ts';
import type {HeadPracticeReviewItem,PracticeMode} from '../lib/head-atlas-practice.ts';

const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/HeadAtlasPracticeReview.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{reportDiagnostics:true,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}});
assert.equal(compiled.diagnostics?.filter(d=>d.category===ts.DiagnosticCategory.Error).length,0);
type Host={values:unknown[];cursor:number;effects?:(()=>void|(()=>void))[]};
let host:Host|undefined;
const hooks={
  useLayoutEffect(effect:()=>void|(()=>void)){host?.effects?.push(effect);},
  useState(initial:unknown){
    if(!host)return [typeof initial==='function'?(initial as ()=>unknown)():initial,()=>{}];
    const current=host,index=current.cursor++;
    if(index>=current.values.length)current.values.push(typeof initial==='function'?(initial as ()=>unknown)():initial);
    return [current.values[index],(next:unknown)=>{current.values[index]=typeof next==='function'?(next as (value:unknown)=>unknown)(current.values[index]):next;}];
  },
  useRef(initial:unknown){
    if(!host)return {current:initial};
    const current=host,index=current.cursor++;
    if(index>=current.values.length)current.values.push({current:initial});
    return current.values[index];
  },
};
const loaded={exports:{} as Record<string,unknown>};
new Function('require','module','exports',compiled.outputText)((name:string)=>{
  if(name==='react')return hooks;
  if(name==='./HeadAtlasTeaching')return {HeadAtlasTeaching:()=>null};
  return require(name.startsWith('.')?`${name}.ts`:name);
},loaded,loaded.exports);
type Props={items:HeadPracticeReviewItem[];modality:'CT'|'MRI';revision:string;active:boolean;finished:boolean;label?:'Review original set'|'Review follow-up set';onPracticeEntries?:(entries:HeadEntry[],mode:PracticeMode)=>boolean};
const Review=loaded.exports.HeadAtlasPracticeReview as (props:Props)=>React.ReactElement|null;
const entry=(id:string,label:string):HeadEntry=>({id,label,laterality:'midline_or_unpaired',family:'synthetic',representation:'mask',color:[1,0,0],opacity:{fill:.2,outline:.8}});
const correct=entry('correct','Correct structure'),incorrect=entry('incorrect','Missed pons'),revealed=entry('revealed','Revealed pons'),unanswered=entry('unanswered','Unanswered structure');
const items:HeadPracticeReviewItem[]=[
  {entry:correct,outcome:'correct'},{entry:incorrect,outcome:'incorrect'},
  {entry:revealed,outcome:'revealed'},{entry:unanswered,outcome:'unanswered'},
  {entry:incorrect,outcome:'incorrect'},
];
const draw=(h:Host,props:Props)=>{h.cursor=0;h.effects=[];host=h;try{const tree=Review(props);for(const effect of h.effects)effect();return tree;}finally{host=undefined;}};
const all=(node:unknown):React.ReactElement<Record<string,unknown>>[]=>React.isValidElement(node)?[node as React.ReactElement<Record<string,unknown>>,...React.Children.toArray((node.props as {children?:React.ReactNode}).children).flatMap(all)]:[];
const named=(tree:unknown,type:string,name:string)=>{
  const node=all(tree).find(value=>value.type===type&&React.Children.toArray((value.props as {children?:React.ReactNode}).children).some(child=>typeof child==='string'&&child.includes(name)));
  assert(node,`${type} ${name}`);return node as React.ReactElement<Record<string,unknown>>;
};
const change=(control:React.ReactElement<Record<string,unknown>>,value:string)=>{
  (control.props.onChange as (event:{currentTarget:{value:string}})=>void)({currentTarget:{value}});
};
const click=(control:React.ReactElement<Record<string,unknown>>)=>{
  (control.props.onClick as ()=>void)();
};
const base=(onPracticeEntries:NonNullable<Props['onPracticeEntries']>):Props=>({items,modality:'CT',revision:'revision',active:false,finished:true,onPracticeEntries});
const button=(tree:unknown)=>named(tree,'button','Practise visible missed structures');

test('CT and MRI offer exact, deduplicated visible misses in all three practice styles',()=>{
  for(const modality of ['CT','MRI'] as const){
    const calls:Array<{entries:HeadEntry[];mode:PracticeMode}>=[];
    const props={...base((entries,mode)=>{calls.push({entries,mode});return true;}),modality};
    const h:Host={values:[],cursor:0};let tree=draw(h,props);
    assert.equal(button(tree).props.disabled,false);
    assert.equal(React.Children.toArray(button(tree).props.children as React.ReactNode).join(''),'Practise visible missed structures (3)');
    click(button(tree));assert.deepEqual(calls.at(-1),{entries:[incorrect,revealed,unanswered],mode:'locate'});
    for(const mode of ['label','recall'] as const){
      change(all(named(tree,'label','Practice style')).find(node=>node.type==='select') as React.ReactElement<Record<string,unknown>>,mode);
      tree=draw(h,props);click(button(tree));
      assert.deepEqual(calls.at(-1),{entries:[incorrect,revealed,unanswered],mode});
    }
    change(all(named(tree,'label','Search for structure')).find(node=>node.type==='input') as React.ReactElement<Record<string,unknown>>,'pons');
    tree=draw(h,props);click(button(tree));assert.deepEqual(calls.at(-1),{entries:[incorrect,revealed],mode:'recall'});
    change(all(named(tree,'label','Outcome')).find(node=>node.type==='select') as React.ReactElement<Record<string,unknown>>,'correct');
    tree=draw(h,props);assert.equal(button(tree).props.disabled,true);
    assert.equal(React.Children.toArray(button(tree).props.children as React.ReactNode).join(''),'Practise visible missed structures (0)');
    assert.equal(calls.length,4);
  }
});

test('identity replacement resets style, rejects a stale click and reports refused starts',()=>{
  const calls:Array<{entries:HeadEntry[];mode:PracticeMode}>=[];
  let accept=false;
  const callback:NonNullable<Props['onPracticeEntries']>=(entries,mode)=>{calls.push({entries,mode});return accept;};
  const h:Host={values:[],cursor:0},props=base(callback);
  let tree=draw(h,props);
  const unfiltered=button(tree);
  change(all(named(tree,'label','Search for structure')).find(node=>node.type==='input') as React.ReactElement<Record<string,unknown>>,'revealed');
  tree=draw(h,props);click(unfiltered);assert.equal(calls.length,0);
  change(all(named(tree,'label','Practice style')).find(node=>node.type==='select') as React.ReactElement<Record<string,unknown>>,'recall');
  tree=draw(h,props);const stale=button(tree);
  const replaced={...props,items:[{entry:revealed,outcome:'revealed' as const}],label:'Review follow-up set' as const};
  tree=draw(h,replaced);
  click(stale);assert.equal(calls.length,0);
  assert.equal((all(named(tree,'label','Practice style')).find(node=>node.type==='select') as React.ReactElement<{value:string}>).props.value,'locate');
  click(button(tree));assert.deepEqual(calls.at(-1),{entries:[revealed],mode:'locate'});
  tree=draw(h,replaced);
  assert(all(tree).some(node=>node.props.role==='status'&&React.Children.toArray(node.props.children as React.ReactNode).join('').includes('could not start')));
  accept=true;click(button(tree));
  tree=draw(h,replaced);
  assert(all(tree).some(node=>node.props.role==='status'&&node.props.children===''));
});

test('practice controls do not leak before completed feedback or without callback',()=>{
  const callback:NonNullable<Props['onPracticeEntries']>=()=>true;
  for(const changes of [{active:true},{finished:false},{items:[]},{onPracticeEntries:undefined}]){
    const tree=draw({values:[],cursor:0},{...base(callback),...changes});
    assert.equal(all(tree).some(node=>node.type==='button'&&React.Children.toArray(node.props.children as React.ReactNode).join('').includes('Practise visible')),false);
  }
  assert.doesNotMatch(source,/localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|postMessage/);
});
