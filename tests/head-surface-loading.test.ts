import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';

const require=createRequire(import.meta.url);
const loaderPath=new URL('../components/HeadAtlasSurfaceLoader.tsx',import.meta.url);
type Node={type:unknown;props:Record<string,any>};
type Effect={deps:unknown[];create:()=>void|(()=>void);cleanup?:()=>void};
type BoundaryInstance={props:{children:Node};state:{failed:boolean};render:()=>Node;componentDidCatch:(error:Error)=>void;componentDidUpdate:(previousProps:{children:Node},previousState:{failed:boolean})=>void;setState:(value:unknown)=>void};
type BoundaryClass={new(props:{children:Node}):BoundaryInstance;getDerivedStateFromError:(error:Error)=>{failed:boolean}};

function deferred<T>(){
  let resolve!:(value:T)=>void,reject!:(error:Error)=>void;
  const promise=new Promise<T>((yes,no)=>{resolve=yes;reject=no;});
  return {promise,resolve,reject};
}

function harness(){
  const source=readFileSync(loaderPath,'utf8');
  const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const imports:Array<ReturnType<typeof deferred<{HeadAtlasSurface:(props:Record<string,unknown>)=>Node}>>>=[];
  const slots:unknown[]=[],effects=new Map<number,Effect>();
  let cursor=0,dirty=true,pending:Array<()=>void>=[],disposed=false,writesAfterDispose=0;
  let currentProps:Record<string,unknown>,tree:Node;
  const equal=(a:unknown[]|undefined,b:unknown[])=>!!a&&a.length===b.length&&a.every((value,index)=>Object.is(value,b[index]));
  class Component<P extends object,S extends object>{
    props:P;state!:S;
    constructor(props:P){this.props=props;}
    setState(value:Partial<S>|((state:S)=>Partial<S>)){this.state={...this.state,...(typeof value==='function'?value(this.state):value)};}
  }
  const hooks={
    Component,
    createRef:()=>({current:null}),
    useState(initial:unknown){const slot=cursor++;if(!(slot in slots))slots[slot]=typeof initial==='function'?(initial as ()=>unknown)():initial;return [slots[slot],(value:unknown)=>{if(disposed){writesAfterDispose++;return;}const next=typeof value==='function'?(value as (old:unknown)=>unknown)(slots[slot]):value;if(!Object.is(next,slots[slot])){slots[slot]=next;dirty=true;}}];},
    useEffect(create:()=>void|(()=>void),deps:unknown[]){const slot=cursor++,old=effects.get(slot);if(!equal(old?.deps,deps))pending.push(()=>{old?.cleanup?.();const cleanup=create();effects.set(slot,{deps,create,cleanup:typeof cleanup==='function'?cleanup:undefined});});},
    useRef(initial:unknown){const slot=cursor++;if(!(slot in slots))slots[slot]={current:initial};return slots[slot];},
  };
  const load=(name:string):unknown=>name==='react'?hooks:name==='react/jsx-runtime'?require('react/jsx-runtime'):name==='./HeadAtlasSurface'?(()=>{const request=deferred<{HeadAtlasSurface:(props:Record<string,unknown>)=>Node}>();imports.push(request);return request.promise;})():require(name);
  const mod={exports:{} as {HeadAtlasSurfaceLoader:(props:Record<string,unknown>)=>Node;HeadAtlasSurfaceBoundary:BoundaryClass;}};
  new Function('require','module','exports',compiled)(load,mod,mod.exports);
  function flush(props=currentProps){currentProps=props;let passes=0;do{assert(++passes<20,'loader effects settle');dirty=false;cursor=0;pending=[];tree=mod.exports.HeadAtlasSurfaceLoader(currentProps);for(const effect of pending)effect();}while(dirty);return tree!;}
  async function settle(){await Promise.resolve();await Promise.resolve();await Promise.resolve();return flush();}
  function walk(value:unknown,visit:(node:Node)=>boolean):Node|undefined{
    if(Array.isArray(value)){for(const child of value){const found=walk(child,visit);if(found)return found;}return;}
    if(!value||typeof value!=='object'||!('props'in value))return;
    const node=value as Node;if(visit(node))return node;
    return walk(node.props.children,visit);
  }
  function dispose(){disposed=true;for(const effect of effects.values())effect.cleanup?.();}
  function replayEffects(){for(const effect of effects.values()){effect.cleanup?.();const cleanup=effect.create();effect.cleanup=typeof cleanup==='function'?cleanup:undefined;}}
  return {flush,settle,walk,dispose,replayEffects,imports,Boundary:mod.exports.HeadAtlasSurfaceBoundary,get tree(){return tree!;},get writesAfterDispose(){return writesAfterDispose;}};
}

const selected={entry:{id:'synthetic.surface',label:'Synthetic geometry'},positions:new Float32Array([0,0,0])};
const onPick=()=>{};
const props={selected,regionalCourse:false,onPick};
const surface=(received:Record<string,unknown>)=>({type:'synthetic-surface',props:received});

// Shared only by complementary import-retry focus tests; original cases stay intact.
export {harness,props,surface};

test('3D renderer import begins after mount and receives the latest selected props',async()=>{
  const h=harness();try{
    assert.equal(h.imports.length,0,'evaluating loader module is safe for slice-only routes');
    h.flush(props);assert.equal(h.imports.length,0,'render is synchronous and lightweight');
    await Promise.resolve();assert.equal(h.imports.length,1,'effect requests the renderer');
    const latest={selected:{...selected,entry:{id:'synthetic.new',label:'New selection'}},regionalCourse:true,onPick:()=>{}};
    h.flush(latest);
    h.imports[0].resolve({HeadAtlasSurface:surface});await h.settle();
    const node=h.walk(h.tree,item=>item.type===surface);assert(node,'deferred component is mounted');
    const boundary=h.walk(h.tree,item=>item.type===h.Boundary);assert(boundary,'loaded renderer is inside the exported error boundary');
    assert.equal(boundary.props.children.type,surface,'boundary wraps only the renderer');
    assert.equal(node.props.selected,latest.selected);assert.equal(node.props.regionalCourse,true);assert.equal(node.props.onPick,latest.onPick);
    assert.equal(h.imports.length,1,'prop updates do not reimport the renderer');
  }finally{h.dispose();}
});

test('render failure is announced without raw details and stays failed until Retry 3D scan view',async()=>{
  const h=harness();try{
    assert.equal(typeof h.Boundary,'function','error boundary is exported');
    const first={type:surface,props};
    const boundary=new h.Boundary({children:first});
    assert.equal(boundary.state.failed,false);
    const normal=boundary.render();
    assert.equal(normal.props.role,'group');
    assert.equal(normal.props['aria-label'],'3D scan view');
    assert.equal(normal.props.tabIndex,-1);
    assert.deepEqual(normal.props.style,{width:'100%',height:'100%'},'preserve full-size Canvas in centered grid');
    assert.equal(normal.props.children,first);
    let viewFocusCount=0;
    assert(normal.props.ref&&typeof normal.props.ref==='object','persistent view is focus target');
    normal.props.ref.current={focus:()=>{viewFocusCount++;}};

    const updated={type:surface,props:{...props,regionalCourse:true}};
    const previousProps=boundary.props;
    boundary.props={children:updated};
    boundary.componentDidUpdate(previousProps,{failed:false});
    assert.equal(viewFocusCount,0,'normal prop updates do not steal focus');
    assert.equal(boundary.render().props.children,updated);

    const error=new Error('private synthetic renderer stack detail');
    boundary.state={...boundary.state,...h.Boundary.getDerivedStateFromError(error)};
    const failed=boundary.render();
    assert.equal(failed.props.role,'group','failure retains the view container');
    assert.equal(failed.props.ref,normal.props.ref,'focus target is stable across failure');
    assert.equal(failed.props.children.props.role,'alert');
    const heading=h.walk(failed,node=>node.type==='h3');assert(heading);
    assert.equal(heading.props.children,'3D scan view unavailable');
    assert.equal(heading.props.tabIndex,-1);
    assert.match(JSON.stringify(failed),/slices|controls/i);
    assert.doesNotMatch(JSON.stringify(failed),/private synthetic renderer stack detail/);
    let focusCount=0;
    assert(heading.props.ref&&typeof heading.props.ref==='object','heading is focus target');
    heading.props.ref.current={focus:()=>{focusCount++;}};
    boundary.componentDidCatch(error);
    assert.equal(focusCount,1);

    const latest={type:surface,props:{...props,selected:{...selected,entry:{id:'synthetic.latest',label:'Latest'}}}};
    boundary.props={children:latest};
    assert.equal(boundary.render().props.children.props.role,'alert','new props do not clear a render failure');
    const retry=h.walk(boundary.render(),node=>node.type==='button'&&node.props.children==='Retry 3D scan view');assert(retry);
    const failedState={...boundary.state};
    retry.props.onClick();
    boundary.componentDidUpdate({children:latest},failedState);
    assert.equal(boundary.state.failed,false);
    assert.equal(boundary.render().props.children,latest,'retry remounts the latest child');
    assert.equal(viewFocusCount,1,'restored view receives focus after retry');
    boundary.state={...boundary.state,...h.Boundary.getDerivedStateFromError(new Error('second synthetic failure'))};
    assert.equal(boundary.render().props.children.props.role,'alert','a repeated failure has the same safe fallback');
  }finally{h.dispose();}
});

test('failed import exposes a retry and a later successful import clears the alert',async()=>{
  const h=harness();try{
    h.flush(props);await Promise.resolve();assert.equal(h.imports.length,1);
    h.imports[0].reject(new Error('synthetic module failure'));await h.settle();
    assert(h.walk(h.tree,item=>item.props.role==='alert'),'failure is announced');
    const retry=h.walk(h.tree,item=>item.type==='button'&&String(item.props.children).includes('Retry 3D scan view'));assert(retry);
    retry.props.onClick();h.flush();await Promise.resolve();assert.equal(h.imports.length,2);
    h.imports[1].resolve({HeadAtlasSurface:surface});await h.settle();
    assert.equal(h.walk(h.tree,item=>item.props.role==='alert'),undefined);
    assert(h.walk(h.tree,item=>item.type===surface));
  }finally{h.dispose();}
});

test('unmounted import success and failure cause no state writes',async()=>{
  for(const result of ['success','failure']){
    const h=harness();h.flush(props);await Promise.resolve();assert.equal(h.imports.length,1);h.dispose();
    if(result==='success')h.imports[0].resolve({HeadAtlasSurface:surface});
    else h.imports[0].reject(new Error('late failure'));
    await Promise.resolve();await Promise.resolve();await Promise.resolve();
    assert.equal(h.writesAfterDispose,0,`${result} after cleanup is ignored`);
  }
});

test('effect cleanup and setup replay ignores superseded import outcomes',async()=>{
  for(const late of ['success','failure']){
    const h=harness();try{
      h.flush(props);await Promise.resolve();assert.equal(h.imports.length,1);
      h.replayEffects();await Promise.resolve();assert.equal(h.imports.length,2,'replayed setup requests a current import');
      const current=(received:Record<string,unknown>)=>({type:'current-surface',props:received});
      h.imports[1].resolve({HeadAtlasSurface:current});await h.settle();
      assert(h.walk(h.tree,item=>item.type===current));
      if(late==='success')h.imports[0].resolve({HeadAtlasSurface:surface});
      else h.imports[0].reject(new Error('obsolete module failure'));
      await h.settle();
      assert(h.walk(h.tree,item=>item.type===current),'current renderer remains installed');
      assert.equal(h.walk(h.tree,item=>item.type===surface),undefined,'obsolete renderer is ignored');
      assert.equal(h.walk(h.tree,item=>item.props.role==='alert'),undefined,'obsolete failure is ignored');
    }finally{h.dispose();}
  }
});
