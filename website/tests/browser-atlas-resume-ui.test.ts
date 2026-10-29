import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

type Node={type:unknown;props:Record<string,any>};
const nodes=(value:any):Node[]=>Array.isArray(value)?value.flatMap(nodes):value?.props?[value,...nodes(value.props.children)]:[];
const content=(value:any):string=>Array.isArray(value)?value.map(content).join(''):value?.props?content(value.props.children):value==null?'':String(value);
const source=readFileSync(new URL('../components/BrowserAtlasResume.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
const key='vm.head-learning-bookmark.v1',planKey='vm.head-study-plan.v1';

function fixture(initial:Record<string,string>={},blocked=false,imported?:(resolver:unknown)=>unknown){
  const priorWindow=Object.getOwnPropertyDescriptor(globalThis,'window');
  const priorDocument=Object.getOwnPropertyDescriptor(globalThis,'document');
  const data=new Map(Object.entries(initial));
  const windowListeners=new Map<string,Set<(event:any)=>void>>(),documentListeners=new Map<string,Set<(event:any)=>void>>();
  const listen=(map:Map<string,Set<(event:any)=>void>>,name:string,fn:(event:any)=>void)=>{
    if(!map.has(name))map.set(name,new Set());map.get(name)!.add(fn);
  };
  const unlisten=(map:Map<string,Set<(event:any)=>void>>,name:string,fn:(event:any)=>void)=>map.get(name)?.delete(fn);
  const window={localStorage:{getItem(name:string){if(blocked)throw Error('Denied');return data.get(name)??null;},
    setItem(){throw Error('Read-only component wrote storage');},removeItem(){throw Error('Read-only component removed storage');}},
    addEventListener:(name:string,fn:(event:any)=>void)=>listen(windowListeners,name,fn),
    removeEventListener:(name:string,fn:(event:any)=>void)=>unlisten(windowListeners,name,fn)};
  const document={visibilityState:'visible',addEventListener:(name:string,fn:(event:any)=>void)=>listen(documentListeners,name,fn),
    removeEventListener:(name:string,fn:(event:any)=>void)=>unlisten(documentListeners,name,fn)};
  Object.defineProperty(globalThis,'window',{configurable:true,value:window});
  Object.defineProperty(globalThis,'document',{configurable:true,value:document});
  let index=0,dirty=true,tree:Node,reads=0,writes=0;
  const states:any[]=[],effects:Array<()=>void>=[],cleanups:Array<()=>void>=[];
  const hooks={useState(initial:any){const slot=index++;if(!(slot in states))states[slot]=initial;
      return [states[slot],(next:any)=>{writes++;states[slot]=typeof next==='function'?next(states[slot]):next;dirty=true;}]},
    useRef(initial:any){const slot=index++;return states[slot]??={current:initial};},
    useEffect(fn:()=>void|(()=>void)){const slot=index++;if(!(slot in states)){states[slot]=true;effects.push(()=>{const cleanup=fn();if(cleanup)cleanups.push(cleanup);});}}};
  const jsx=(type:unknown,props:Record<string,any>)=>({type,props});
  const resolver={resolveBrowserAtlasResume:(bookmark:string|null,plan:string|null)=>{
    reads++;
    return {tour:{kind:bookmark?'unavailable':'empty'},plan:{kind:plan?'unavailable':'empty'}};
  }};
  const module={exports:{} as any};
  new Function('require','module','exports',compiled)((name:string)=>
    name==='react'?hooks:name==='react/jsx-runtime'?{jsx,jsxs:jsx,Fragment:Symbol('fragment')}:
    name==='../lib/browser-atlas-resume'?(imported?imported(resolver):resolver):name.endsWith('.css')?{}:(()=>{throw Error(`Unexpected import ${name}`)})(),module,module.exports);
  const flush=()=>{let guard=0;while(dirty||effects.length){assert(++guard<15);dirty=false;index=0;
    tree=module.exports.BrowserAtlasResume();effects.splice(0).forEach(fn=>fn());}return tree!;};
  flush();
  return {data,get text(){return content(flush());},get links(){return nodes(flush()).filter(n=>n.type==='a').map(n=>n.props.href);},
    get reads(){return reads;},get writes(){return writes;},async settle(){await new Promise(resolve=>setImmediate(resolve));flush();},
    emit(name:string,event:any={}){windowListeners.get(name)?.forEach(fn=>fn(event));flush();},
    unblock(){blocked=false;},
    retry(){nodes(flush()).find(n=>n.type==='button'&&content(n)==='Try again')!.props.onClick();flush();},
    visibility(){documentListeners.get('visibilitychange')?.forEach(fn=>fn({}));flush();},
    close(){cleanups.forEach(fn=>fn());assert([...windowListeners.values()].every(s=>s.size===0));
      assert([...documentListeners.values()].every(s=>s.size===0));
      if(priorWindow)Object.defineProperty(globalThis,'window',priorWindow);else delete (globalThis as any).window;
      if(priorDocument)Object.defineProperty(globalThis,'document',priorDocument);else delete (globalThis as any).document;}};
}

test('empty and disabled storage render safely without importing the resolver',()=>{
  const empty=fixture();try{assert.match(empty.text,/No tour step saved/);assert.equal(empty.reads,0);
    assert(empty.links.includes('/atlas/guided-learning?region=head-neck'));}finally{empty.close();}
  const denied=fixture({},true);try{assert.match(denied.text,/Browser storage may be unavailable/);assert.equal(denied.reads,0);
    denied.unblock();denied.retry();assert.match(denied.text,/No tour step saved/);assert.equal(denied.reads,0);
  }finally{denied.close();}
});

test('a late catalogue import cannot replace a newer empty storage snapshot',async()=>{
  let release!:(value:unknown)=>void,loaded:unknown;
  const pending=new Promise(resolve=>{release=resolve;});
  const f=fixture({[key]:'old'},false,resolver=>{loaded=resolver;return pending;});
  try{
    await f.settle();f.data.clear();f.emit('storage',{key:null});
    assert.match(f.text,/No tour step saved/);release(loaded);await f.settle();
    assert.match(f.text,/No tour step saved/);assert.equal(f.reads,0);
  }finally{f.close();}
});

test('unmount retires a pending import without state writes',async()=>{
  let release!:(value:unknown)=>void,loaded:unknown;
  const pending=new Promise(resolve=>{release=resolve;});
  const f=fixture({[key]:'old'},false,resolver=>{loaded=resolver;return pending;});
  await f.settle();f.close();const before=f.writes;release(loaded);
  await new Promise(resolve=>setImmediate(resolve));assert.equal(f.writes,before);assert.equal(f.reads,0);
});

test('storage, same-tab bookmark, focus and visibility refresh; unmount retires handlers',async()=>{
  const f=fixture({[key]:'{bad'});
  try{
    await f.settle();assert.match(f.text,/outdated or invalid/);assert.equal(f.reads,1);
    f.data.delete(key);f.emit('storage',{key});assert.match(f.text,/No tour step saved/);
    f.data.set(planKey,'{bad');f.emit('storage',{key:planKey});await f.settle();assert.match(f.text,/plan is outdated or invalid/);
    f.data.delete(planKey);f.emit('vm-head-learning-bookmark-changed');assert.match(f.text,/No plan saved/);
    f.emit('focus');f.visibility();f.emit('storage',{key:null});assert.equal(f.reads,2);
  }finally{f.close();}
});
