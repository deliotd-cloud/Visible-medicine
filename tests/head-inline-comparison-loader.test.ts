import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {HEAD_LINK_REVISION,headConceptById} from '../lib/head-atlas-links.ts';
import {headInlineDestination} from '../lib/head-inline-comparison.ts';

const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/HeadAtlasInlineComparisonLoader.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
type Node={type:any;props:Record<string,any>};
type Effect={kind:'layout'|'passive';deps?:unknown[];create:()=>void|(()=>void);cleanup?:()=>void};
type Props={scope:object;conceptId:string;revision:string;modality:'CT'|'MRI';selectionReady:boolean;onSelectConcept:(id:string)=>void;onClose:()=>void;onPlaybackStatus:(status:unknown)=>void};

function deferred<T>(){
  let resolve!:(value:T)=>void,reject!:(reason:Error)=>void;
  const promise=new Promise<T>((yes,no)=>{resolve=yes;reject=no;});
  return {promise,resolve,reject};
}
function walk(value:unknown,predicate:(node:Node)=>boolean):Node|undefined{
  if(Array.isArray(value)){for(const item of value){const found=walk(item,predicate);if(found)return found;}return;}
  if(!value||typeof value!=='object'||!('props' in value))return;
  const node=value as Node;return predicate(node)?node:walk(node.props.children,predicate);
}
function harness(){
  const requests:Array<ReturnType<typeof deferred<{HeadAtlasInlineComparison:(props:Props)=>Node}>>>=[];
  const slots:unknown[]=[],effects=new Map<number,Effect>();
  let cursor=0,dirty=false,disposed=false,writesAfterDispose=0,currentProps!:Props,tree!:Node;
  const pending=new Map<number,Effect>();
  const same=(a?:unknown[],b?:unknown[])=>!!a&&!!b&&a.length===b.length&&a.every((value,index)=>Object.is(value,b[index]));
  class Component<P extends object,S extends object>{
    props:P;state!:S;
    constructor(props:P){this.props=props;}
    setState(update:Partial<S>){this.state={...this.state,...update};}
  }
  const hook=(kind:Effect['kind'],create:Effect['create'],deps?:unknown[])=>{pending.set(cursor++,{kind,create,deps});};
  const hooks={
    Component,createRef:()=>({current:null}),
    useRef(initial:unknown){const index=cursor++;if(!(index in slots))slots[index]={current:initial};return slots[index];},
    useState(initial:unknown){const index=cursor++;if(!(index in slots))slots[index]=initial;return [slots[index],(next:unknown)=>{
      if(disposed){writesAfterDispose++;return;}
      const value=typeof next==='function'?(next as (old:unknown)=>unknown)(slots[index]):next;
      if(!Object.is(value,slots[index])){slots[index]=value;dirty=true;}
    }];},
    useLayoutEffect:(create:Effect['create'],deps?:unknown[])=>hook('layout',create,deps),
    useEffect:(create:Effect['create'],deps?:unknown[])=>hook('passive',create,deps),
  };
  const imports=(id:string):unknown=>id==='react'?hooks:id==='react/jsx-runtime'?require('react/jsx-runtime'):id==='../lib/head-inline-comparison.ts'?{headInlineDestination}:id==='./HeadAtlasInlineComparison'?(()=>{
    const request=deferred<{HeadAtlasInlineComparison:(props:Props)=>Node}>();requests.push(request);return request.promise;
  })():require(id);
  const mod={exports:{} as {HeadAtlasInlineComparisonLoader:(props:Props)=>Node;HeadAtlasInlineComparisonBoundary:new(props:{children:Node;onRetry:()=>void;onClose:()=>void;fallback?:Node})=>{state:{failed:boolean};props:{children:Node;onRetry:()=>void;onClose:()=>void;fallback?:Node};render:()=>Node;componentDidCatch:()=>void}}};
  new Function('require','module','exports',compiled)(imports,mod,mod.exports);
  function phase(kind:Effect['kind']){
    for(const [index,next] of pending)if(next.kind===kind){const old=effects.get(index);if(same(old?.deps,next.deps))continue;
      old?.cleanup?.();const cleanup=next.create();effects.set(index,{...next,cleanup:typeof cleanup==='function'?cleanup:undefined});
    }
  }
  function flush(props=currentProps){currentProps=props;let rounds=0;do{
    assert(++rounds<20,'loader settles');dirty=false;cursor=0;pending.clear();tree=mod.exports.HeadAtlasInlineComparisonLoader(currentProps);
    phase('layout');phase('passive');
  }while(dirty);return tree;}
  async function settle(){await Promise.resolve();await Promise.resolve();await Promise.resolve();return flush();}
  function replayEffects(){
    assert(!disposed,'cannot replay an unmounted loader');
    for(const kind of ['layout','passive'] as const)for(const effect of effects.values())if(effect.kind===kind){effect.cleanup?.();effect.cleanup=undefined;}
    for(const kind of ['layout','passive'] as const)for(const effect of effects.values())if(effect.kind===kind){
      const cleanup=effect.create();effect.cleanup=typeof cleanup==='function'?cleanup:undefined;
    }
    if(dirty)flush();
  }
  function dispose(){if(disposed)return;disposed=true;for(const effect of effects.values())effect.cleanup?.();}
  return {requests,flush,settle,replayEffects,dispose,walk,Boundary:mod.exports.HeadAtlasInlineComparisonBoundary,get tree(){return tree;},get writesAfterDispose(){return writesAfterDispose;}};
}
function props(scope:object,events:{select:string[];close:string[];status:unknown[]}):Props{
  return {scope,conceptId:'brainstem-pons',revision:'synthetic-revision',modality:'CT',selectionReady:false,
    onSelectConcept:id=>events.select.push(id),onClose:()=>events.close.push('closed'),onPlaybackStatus:value=>events.status.push(value)};
}
const comparison=(received:Props):Node=>({type:'synthetic-comparison',props:received});
const eventLog=()=>({select:[] as string[],close:[] as string[],status:[] as unknown[]});
const button=(h:ReturnType<typeof harness>,label:string,value:Node=h.tree)=>{
  const result=h.walk(value,node=>node.type==='button'&&String(node.props.children).includes(label));assert(result,`missing ${label}`);return result;
};
const atlasLink=(h:ReturnType<typeof harness>,value:Node=h.tree)=>h.walk(value,node=>node.type==='a'&&String(node.props.href).startsWith('/atlas/head-neck-3d?'));
function assertNativeAtlasLink(h:ReturnType<typeof harness>,value:Node,conceptId:string){
  const link=atlasLink(h,value);assert(link,'failed comparison offers native full-Atlas recovery');
  assert.equal(link.props.href,headConceptById(conceptId)!.atlasHref);
  assert.equal(link.props.target,'_blank');
  assert.deepEqual(new Set(String(link.props.rel).split(/\s+/)),new Set(['noopener','noreferrer']));
  assert.equal(link.props.prefetch,undefined);
  assert.equal(link.props.onClick,undefined);
}

test('ordinary browsing does not import; opening mounts a status before the delayed component with exact current props',async()=>{
  const h=harness(),events=eventLog();try{
    assert.equal(h.requests.length,0,'evaluating the actual loader does not import the comparison');
    const scope={};const first=props(scope,events);h.flush(first);
    assert.equal(h.requests.length,0,'render does not request the comparison');
    assert(h.walk(h.tree,node=>node.props.role==='status'));
    await Promise.resolve();assert.equal(h.requests.length,1,'mount effect requests it');
    const latest={...first,conceptId:'brainstem-midbrain',modality:'MRI' as const,selectionReady:true,revision:'new-revision',onSelectConcept:(id:string)=>events.select.push(`latest:${id}`)};
    h.flush(latest);
    h.requests[0].resolve({HeadAtlasInlineComparison:comparison});await h.settle();
    const mounted=h.walk(h.tree,node=>node.type===comparison);assert(mounted);
    assert.equal(mounted.props.conceptId,latest.conceptId);assert.equal(mounted.props.revision,latest.revision);
    assert.equal(mounted.props.modality,latest.modality);assert.equal(mounted.props.selectionReady,true);
    mounted.props.onSelectConcept('next');assert.deepEqual(events.select,['latest:next']);
    mounted.props.onPlaybackStatus({conceptId:'next',status:'matched'});assert.equal(events.status.length,1);
    const newer={...latest,onSelectConcept:(id:string)=>events.select.push(`newer:${id}`)};
    h.flush(newer);
    mounted.props.onSelectConcept('obsolete');assert.deepEqual(events.select,['latest:next'],'old render callback is retired');
    h.walk(h.tree,node=>node.type===comparison)!.props.onSelectConcept('current');
    assert.deepEqual(events.select,['latest:next','newer:current']);
    assert.equal(h.requests.length,1,'prop changes do not reload the module');
  }finally{h.dispose();}
});

test('failed import has local retry and close; retained actions cannot affect the new attempt',async()=>{
  const h=harness(),events=eventLog();try{
    h.flush(props({},events));await Promise.resolve();
    h.requests[0].reject(new Error('synthetic private import detail'));await h.settle();
    assert(h.walk(h.tree,node=>node.props.role==='alert'));
    assert.doesNotMatch(JSON.stringify(h.tree),/synthetic private import detail/);
    const retiredClose=button(h,'Close comparison');
    button(h,'Retry 3D comparison').props.onClick();h.flush();await Promise.resolve();
    assert.equal(h.requests.length,2);
    retiredClose.props.onClick();assert.equal(events.close.length,0,'retained close action cannot retire a new attempt');
    h.requests[1].resolve({HeadAtlasInlineComparison:comparison});await h.settle();
    const mounted=h.walk(h.tree,node=>node.type===comparison);assert(mounted);
    mounted.props.onClose();
    assert.equal(events.close.length,1);
  }finally{h.dispose();}
});

test('scope changes and close retire both late imports and old child callbacks',async()=>{
  const h=harness(),events=eventLog();try{
    const firstScope={},secondScope={};h.flush(props(firstScope,events));await Promise.resolve();
    h.flush(props(secondScope,events));await Promise.resolve();assert.equal(h.requests.length,2);
    h.requests[0].resolve({HeadAtlasInlineComparison:comparison});await h.settle();
    assert.equal(h.walk(h.tree,node=>node.type===comparison),undefined,'retired scope cannot mount');
    h.requests[1].resolve({HeadAtlasInlineComparison:comparison});await h.settle();
    const child=h.walk(h.tree,node=>node.type===comparison);assert(child);
    child.props.onClose();assert.equal(events.close.length,1);
    child.props.onSelectConcept('retired');child.props.onPlaybackStatus({status:'matched'});child.props.onClose();
    assert.deepEqual(events.select,[]);assert.deepEqual(events.status,[]);assert.equal(events.close.length,1);
  }finally{h.dispose();}
});

test('a late failure from an earlier scope cannot replace the current comparison',async()=>{
  const h=harness(),events=eventLog();try{
    h.flush(props({},events));await Promise.resolve();
    h.flush(props({},events));await Promise.resolve();
    assert.equal(h.requests.length,2);
    h.requests[1].resolve({HeadAtlasInlineComparison:comparison});await h.settle();
    h.requests[0].reject(new Error('retired import failure'));await h.settle();
    assert(h.walk(h.tree,node=>node.type===comparison));
    assert.equal(h.walk(h.tree,node=>node.props.role==='alert'),undefined);
  }finally{h.dispose();}
});

test('StrictMode-style effect replay retires either obsolete outcome; current import, retry, and unmount remain usable',async()=>{
  for(const staleOutcome of ['success','failure'] as const){
    const h=harness(),events=eventLog();try{
      h.flush(props({},events));await Promise.resolve();assert.equal(h.requests.length,1);
      h.replayEffects();await Promise.resolve();assert.equal(h.requests.length,2,'reconnected passive effect starts a second import');
      h.requests[1].resolve({HeadAtlasInlineComparison:comparison});await h.settle();
      const current=h.walk(h.tree,node=>node.type===comparison);assert(current);
      current.props.onSelectConcept('current');assert.deepEqual(events.select,['current']);
      if(staleOutcome==='success')h.requests[0].resolve({HeadAtlasInlineComparison:()=>({type:'obsolete-comparison',props:{}})});
      else h.requests[0].reject(new Error('obsolete replay failure'));
      await h.settle();
      assert(h.walk(h.tree,node=>node.type===comparison),'current comparison survives stale replay outcome');
      assert.equal(h.walk(h.tree,node=>node.type==='obsolete-comparison'),undefined);
      assert.equal(h.walk(h.tree,node=>node.props.role==='alert'),undefined);
      const boundaryNode=h.walk(h.tree,node=>node.type===h.Boundary);assert(boundaryNode);
      const boundaryProps=boundaryNode.props as {children:Node;onRetry:()=>void;onClose:()=>void};
      assert.equal(typeof boundaryProps.onRetry,'function');assert.equal(typeof boundaryProps.onClose,'function');
      const boundary=new h.Boundary(boundaryProps);boundary.state={failed:true};
      button(h,'Retry 3D comparison',boundary.render()).props.onClick();h.flush();await Promise.resolve();
      assert.equal(h.requests.length,3,'retry remains active after effect replay');
      h.requests[2].resolve({HeadAtlasInlineComparison:comparison});await h.settle();
      const retried=h.walk(h.tree,node=>node.type===comparison);assert(retried);
      current.props.onClose();current.props.onSelectConcept('retired');
      assert.deepEqual(events.close,[]);assert.deepEqual(events.select,['current']);
      retried.props.onSelectConcept('retried');assert.deepEqual(events.select,['current','retried']);
      h.dispose();
      retried.props.onClose();retried.props.onSelectConcept('unmounted');retried.props.onPlaybackStatus({status:'matched'});
      assert.deepEqual(events.close,[]);assert.deepEqual(events.select,['current','retried']);assert.deepEqual(events.status,[]);
      assert.equal(h.writesAfterDispose,0);
    }finally{h.dispose();}
  }
});

test('render errors stay local, and unmount ignores late success or failure',async()=>{
  const h=harness(),events=eventLog();try{
    h.flush(props({},events));await Promise.resolve();h.requests[0].resolve({HeadAtlasInlineComparison:comparison});await h.settle();
    const node=h.walk(h.tree,item=>item.type===h.Boundary);assert(node);
    const boundaryProps=node.props as {children:Node;onRetry:()=>void;onClose:()=>void};
    assert.equal(typeof boundaryProps.onRetry,'function');assert.equal(typeof boundaryProps.onClose,'function');
    const boundary=new h.Boundary(boundaryProps);
    boundary.state={failed:true};
    const fallback=boundary.render();assert.equal(fallback.props.role,'alert');
    assert.match(JSON.stringify(fallback),/slice controls/);
    const retry=button(h,'Retry 3D comparison',fallback);retry.props.onClick();h.flush();await Promise.resolve();
    assert.equal(h.requests.length,2);
  }finally{h.dispose();}
  for(const outcome of ['success','failure']){
    const pending=harness(),log=eventLog();pending.flush(props({},log));await Promise.resolve();pending.dispose();
    if(outcome==='success')pending.requests[0].resolve({HeadAtlasInlineComparison:comparison});
    else pending.requests[0].reject(new Error('late failure'));
    await Promise.resolve();await Promise.resolve();assert.equal(pending.writesAfterDispose,0);
  }
});

for(const modality of ['CT','MRI'] as const){
  test(`${modality} import and render failures offer exact native full-Atlas recovery for a validated current destination`,async()=>{
    const h=harness(),events=eventLog();try{
      const current={...props({},events),revision:HEAD_LINK_REVISION,modality,selectionReady:true};
      assert(headInlineDestination(current.conceptId,current.revision,current.modality));
      h.flush(current);assert.equal(atlasLink(h),undefined,'loading has no recovery link');
      await Promise.resolve();h.requests[0].reject(new Error('synthetic import failure'));await h.settle();
      assertNativeAtlasLink(h,h.tree,current.conceptId);
      button(h,'Retry 3D comparison').props.onClick();h.flush();
      assert.equal(atlasLink(h),undefined,'retry loading removes the failed-state link');
      await Promise.resolve();h.requests[1].resolve({HeadAtlasInlineComparison:comparison});await h.settle();
      const boundaryNode=h.walk(h.tree,node=>node.type===h.Boundary);assert(boundaryNode);
      assert.equal(atlasLink(h,h.tree),undefined,'healthy comparison has no recovery link');
      const boundary=new h.Boundary(boundaryNode.props as {children:Node;onRetry:()=>void;onClose:()=>void;fallback?:Node});
      boundary.state={failed:true};
      assertNativeAtlasLink(h,boundary.render(),current.conceptId);
    }finally{h.dispose();}
  });
}

test('loader never offers full-Atlas recovery for unready or invalid source and scope',async()=>{
  for(const change of [{selectionReady:false},{revision:'invalid-revision'},{conceptId:'invalid-concept'}]){
    const h=harness(),events=eventLog();try{
      const current={...props({},events),revision:HEAD_LINK_REVISION,selectionReady:true,...change};
      if(current.selectionReady)assert.equal(headInlineDestination(current.conceptId,current.revision,current.modality),null);
      h.flush(current);assert.equal(atlasLink(h),undefined);
      await Promise.resolve();h.requests[0].reject(new Error('synthetic import failure'));await h.settle();
      assert.equal(atlasLink(h),undefined);
      button(h,'Retry 3D comparison').props.onClick();h.flush();await Promise.resolve();
      h.requests[1].resolve({HeadAtlasInlineComparison:comparison});await h.settle();
      const boundaryNode=h.walk(h.tree,node=>node.type===h.Boundary);assert(boundaryNode);
      const boundary=new h.Boundary(boundaryNode.props as {children:Node;onRetry:()=>void;onClose:()=>void;fallback?:Node});
      boundary.state={failed:true};assert.equal(atlasLink(h,boundary.render()),undefined);
    }finally{h.dispose();}
  }
});

test('loader failure link follows the current concept and retires the previous scope',async()=>{
  const h=harness(),events=eventLog();try{
    const first={...props({},events),revision:HEAD_LINK_REVISION,selectionReady:true};
    h.flush(first);await Promise.resolve();
    h.flush({...first,scope:{},conceptId:'brainstem-midbrain'});await Promise.resolve();
    h.requests[0].reject(new Error('retired scope failure'));await h.settle();
    assert.equal(atlasLink(h),undefined,'old failure cannot reveal an obsolete link');
    h.requests[1].reject(new Error('current scope failure'));await h.settle();
    assertNativeAtlasLink(h,h.tree,'brainstem-midbrain');
  }finally{h.dispose();}
});
