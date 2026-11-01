import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import ts from 'typescript';
import type {HeadEntry} from '../lib/head-atlas-import.ts';
import type {HeadPracticeReviewItem} from '../lib/head-atlas-practice.ts';

const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/HeadAtlasPracticeReview.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{reportDiagnostics:true,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}});
assert.equal(compiled.diagnostics?.filter(item=>item.category===ts.DiagnosticCategory.Error).length,0);
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
type Props={items:HeadPracticeReviewItem[];modality:'CT'|'MRI';revision:string;active:boolean;finished:boolean;
  label?:'Review original set'|'Review follow-up set';studySet?:{entries:readonly HeadEntry[];onAdd:(entries:HeadEntry[])=>number|false}};
const Review=loaded.exports.HeadAtlasPracticeReview as (props:Props)=>React.ReactElement|null;
const entry=(id:string):HeadEntry=>({id,label:id,laterality:'midline_or_unpaired',family:'synthetic',representation:'mask',color:[1,0,0],opacity:{fill:.2,outline:.8}});
const [correct,pons,medulla,vermis]=['correct','pons','medulla','vermis'].map(entry);
const items:HeadPracticeReviewItem[]=[
  {entry:correct,outcome:'correct'},{entry:pons,outcome:'incorrect'},{entry:medulla,outcome:'revealed'},
  {entry:pons,outcome:'incorrect'},{entry:vermis,outcome:'unanswered'},
];
const draw=(h:Host,props:Props)=>{h.cursor=0;h.effects=[];host=h;try{const tree=Review(props);for(const effect of h.effects)effect();return tree;}finally{host=undefined;}};
const all=(node:unknown):React.ReactElement<Record<string,unknown>>[]=>React.isValidElement(node)?[node as React.ReactElement<Record<string,unknown>>,...React.Children.toArray((node.props as {children?:React.ReactNode}).children).flatMap(all)]:[];
const named=(tree:unknown,type:string,name:string)=>{
  const node=all(tree).find(value=>value.type===type&&React.Children.toArray(value.props.children as React.ReactNode).some(child=>typeof child==='string'&&child.includes(name)));
  assert(node,`${type} ${name}`);return node;
};
const button=(tree:unknown)=>named(tree,'button','Add visible missed to My study set');
const change=(control:React.ReactElement<Record<string,unknown>>,value:string)=>{
  (control.props.onChange as (event:{currentTarget:{value:string}})=>void)({currentTarget:{value}});
};
const click=(control:React.ReactElement<Record<string,unknown>>)=>{(control.props.onClick as ()=>void)();};
const filter=(tree:unknown,label:string,value:string)=>change(all(named(tree,'label',label)).find(node=>node.type=== (label==='Outcome'?'select':'input'))!,value);
const text=(tree:unknown)=>all(tree).flatMap(node=>React.Children.toArray(node.props.children as React.ReactNode)).filter(item=>typeof item==='string').join(' ');
const attachFilterSummary=(tree:unknown,events:string[])=>{
  const summary=named(tree,'summary','Filter results');
  const ref=summary.props.ref as {current:HTMLElement|null};
  if(ref)ref.current={focus:(options:FocusOptions)=>{
    assert.deepEqual(options,{preventScroll:true});events.push('focus');
  }} as HTMLElement;
};

test('CT/MRI add only distinct visible missed results in displayed order; correct rows stay excluded',()=>{
  for(const modality of ['CT','MRI'] as const){
    const calls:HeadEntry[][]=[],h:Host={values:[],cursor:0};
    const props:Props={items,modality,revision:'revision',active:false,finished:true,studySet:{entries:[],onAdd:entries=>{calls.push(entries);return entries.length;}}};
    let tree=draw(h,props);assert.equal(button(tree).props.disabled,false);
    assert.equal(React.Children.toArray(button(tree).props.children as React.ReactNode).join(''),'Add visible missed to My study set (3)');
    click(button(tree));assert.deepEqual(calls,[ [pons,medulla,vermis] ]);
    tree=draw(h,props);assert.match(text(tree),/3 visible missed structures added/);
    props.studySet={entries:[pons,medulla,vermis],onAdd:props.studySet!.onAdd};
    tree=draw(h,props);assert.match(text(tree),/3 visible missed structures added/);
    filter(tree,'Outcome','correct');tree=draw(h,props);assert.equal(button(tree).props.disabled,true);click(button(tree));assert.equal(calls.length,1);
    filter(tree,'Outcome','needs-review');tree=draw(h,props);
    props.studySet={entries:[],onAdd:props.studySet.onAdd};tree=draw(h,props);
    filter(tree,'Search for structure','pons');tree=draw(h,props);click(button(tree));assert.deepEqual(calls.at(-1),[pons]);
  }
});

test('existing entries, full sets and partial capacity never evict or overpromise',()=>{
  const h:Host={values:[],cursor:0},calls:HeadEntry[][]=[];
  const add=(entries:HeadEntry[])=>{calls.push(entries);return entries.length;};
  let props:Props={items,modality:'CT',revision:'revision',active:false,finished:true,studySet:{entries:[pons],onAdd:add}};
  let tree=draw(h,props);assert.equal(React.Children.toArray(button(tree).props.children as React.ReactNode).join(''),'Add visible missed to My study set (2)');
  click(button(tree));assert.deepEqual(calls.at(-1),[medulla,vermis]);
  props={...props,studySet:{entries:[...Array.from({length:49},(_,index)=>entry(`prior-${index}`)),pons],onAdd:add}};
  tree=draw(h,props);assert.equal(button(tree).props.disabled,true);assert.match(text(tree),/My study set is full/);
  props={...props,studySet:{entries:[...Array.from({length:48},(_,index)=>entry(`prior-${index}`)),pons],onAdd:add}};
  tree=draw(h,props);assert.equal(React.Children.toArray(button(tree).props.children as React.ReactNode).join(''),'Add visible missed to My study set (1)');
  assert.match(text(tree),/1 of 2 new visible missed structures fit/);click(button(tree));assert.deepEqual(calls.at(-1),[medulla]);
  props={...props,studySet:{entries:[pons,medulla,vermis],onAdd:add}};
  tree=draw(h,props);assert.equal(button(tree).props.disabled,true);assert.match(text(tree),/1 visible missed structure added/);
  filter(tree,'Outcome','needs-review');tree=draw(h,props);assert.match(text(tree),/No new visible missed structures/);
});

test('stale controls cannot add after filter, result, modality or callback replacement; refusal is reported',()=>{
  const h:Host={values:[],cursor:0},calls:HeadEntry[][]=[];
  const add=(entries:HeadEntry[])=>{calls.push(entries);return false as const;};
  const props:Props={items,modality:'CT',revision:'revision',active:false,finished:true,studySet:{entries:[],onAdd:add}};
  let tree=draw(h,props),stale=button(tree);
  filter(tree,'Search for structure','pons');tree=draw(h,props);click(stale);assert.equal(calls.length,0);
  stale=button(tree);tree=draw(h,{...props,items:[{entry:medulla,outcome:'revealed'}]});click(stale);assert.equal(calls.length,0);
  stale=button(tree);tree=draw(h,{...props,modality:'MRI'});click(stale);assert.equal(calls.length,0);
  stale=button(tree);tree=draw(h,{...props,studySet:{entries:[],onAdd:()=>1}});click(stale);assert.equal(calls.length,0);
  tree=draw(h,props);click(button(tree));assert.equal(calls.length,1);
  tree=draw(h,props);assert.match(text(tree),/Study set could not be updated/);
});

test('study-set control exists only for completed review with an explicit callback and does not touch storage',()=>{
  const h:Host={values:[],cursor:0};
  const props:Props={items,modality:'CT',revision:'revision',active:false,finished:true,studySet:{entries:[],onAdd:()=>1}};
  for(const patch of [{active:true},{finished:false},{items:[]},{studySet:undefined}]){
    const tree=draw(h,{...props,...patch});assert.equal(all(tree).some(node=>node.type==='button'&&String(node.props.children).includes('Add visible missed')),false);
  }
  assert.doesNotMatch(source,/localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|postMessage/);
});

test('accepted add focuses the stable filter summary before mutation without scrolling; duplicate and disabled calls do not focus',()=>{
  const h:Host={values:[],cursor:0},events:string[]=[];
  const props:Props={items,modality:'CT',revision:'revision',active:false,finished:true,
    studySet:{entries:[],onAdd:entries=>{events.push(`add:${entries.length}`);return entries.length;}}};
  let tree=draw(h,props);attachFilterSummary(tree,events);
  const accepted=button(tree);click(accepted);
  assert.deepEqual(events,['focus','add:3']);
  click(accepted);assert.deepEqual(events,['focus','add:3'],'same committed callback is claimed once');
  props.studySet={entries:[pons,medulla,vermis],onAdd:props.studySet!.onAdd};
  tree=draw(h,props);attachFilterSummary(tree,events);
  assert.equal(button(tree).props.disabled,true);click(button(tree));
  assert.deepEqual(events,['focus','add:3'],'disabled callback cannot move focus');
});

test('changed capacity, filters, identity and review lifecycle retire old add callbacks before focus',()=>{
  const h:Host={values:[],cursor:0},events:string[]=[];
  const props:Props={items,modality:'CT',revision:'revision',active:false,finished:true,
    studySet:{entries:[],onAdd:()=>{events.push('add');return 1;}}};
  let tree=draw(h,props);attachFilterSummary(tree,events);let old=button(tree);
  const full={...props,studySet:{entries:Array.from({length:50},(_,index)=>entry(`prior-${index}`)),onAdd:props.studySet!.onAdd}};
  tree=draw(h,full);attachFilterSummary(tree,events);click(old);click(button(tree));
  assert.deepEqual(events,[],'capacity replacement and disabled button cannot focus');
  tree=draw(h,props);attachFilterSummary(tree,events);old=button(tree);
  filter(tree,'Outcome','correct');tree=draw(h,props);attachFilterSummary(tree,events);click(old);
  assert.deepEqual(events,[],'filter change retires callback');
  filter(tree,'Outcome','needs-review');tree=draw(h,props);attachFilterSummary(tree,events);old=button(tree);
  tree=draw(h,{...props,modality:'MRI'});attachFilterSummary(tree,events);click(old);
  assert.deepEqual(events,[],'modality identity change retires callback');
  tree=draw(h,props);attachFilterSummary(tree,events);old=button(tree);
  draw(h,{...props,active:true});click(old);
  assert.deepEqual(events,[],'active review retires callback');
});

test('rejected addition focuses before onAdd but does not claim the retry',()=>{
  const h:Host={values:[],cursor:0},events:string[]=[];
  const props:Props={items,modality:'CT',revision:'revision',active:false,finished:true,
    studySet:{entries:[],onAdd:()=>{events.push('refused');return false;}}};
  let tree=draw(h,props);attachFilterSummary(tree,events);click(button(tree));
  assert.deepEqual(events,['focus','refused']);
  tree=draw(h,props);attachFilterSummary(tree,events);click(button(tree));
  assert.deepEqual(events,['focus','refused','focus','refused']);
  tree=draw(h,props);assert.match(text(tree),/Study set could not be updated/);
});
