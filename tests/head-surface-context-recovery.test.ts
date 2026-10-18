import assert from 'node:assert/strict';
import test from 'node:test';
import {existsSync,readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import ts from 'typescript';

const require=createRequire(import.meta.url);
const sourceRoot=process.env.VM_SURFACE_SOURCE_ROOT;
const sourcePath=(path:string)=>sourceRoot?resolve(sourceRoot,path):new URL('../'+path,import.meta.url);
const helperPath=sourcePath('lib/head-surface-context.ts');
const helperAvailable=existsSync(helperPath);
const compile=(path:string|URL)=>ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
type Bind=(canvas:HTMLCanvasElement,context:Pick<WebGLRenderingContext,'isContextLost'>,onState:(lost:boolean)=>void)=>()=>void;
function loadHelper():Bind {
  assert(helperAvailable,'current source must contain the context observer helper');
  const mod={exports:{} as {bindHeadSurfaceContext:Bind}};
  new Function('require','module','exports',compile(helperPath))(require,mod,mod.exports);
  assert.equal(typeof mod.exports.bindHeadSurfaceContext,'function');
  return mod.exports.bindHeadSurfaceContext;
}

class CanvasTarget extends EventTarget {
  active=new Map<string,Set<EventListenerOrEventListenerObject>>();
  captured=new Map<string,EventListenerOrEventListenerObject[]>();
  override addEventListener(type:string,listener:EventListenerOrEventListenerObject|null,options?:AddEventListenerOptions|boolean){
    if(listener){if(!this.active.has(type))this.active.set(type,new Set());this.active.get(type)!.add(listener);if(!this.captured.has(type))this.captured.set(type,[]);this.captured.get(type)!.push(listener);}
    super.addEventListener(type,listener,options);
  }
  override removeEventListener(type:string,listener:EventListenerOrEventListenerObject|null,options?:EventListenerOptions|boolean){
    if(listener)this.active.get(type)?.delete(listener);super.removeEventListener(type,listener,options);
  }
  emit(type:string){const event=new Event(type,{cancelable:true});this.dispatchEvent(event);return event;}
  late(type:string,event:Event){for(const listener of this.captured.get(type)??[])typeof listener==='function'?listener.call(this,event):listener.handleEvent(event);}
  get listenerCount(){return [...this.active.values()].reduce((sum,listeners)=>sum+listeners.size,0);}
}

const helperTest=(name:string,run:()=>void)=>test(name,{skip:!helperAvailable&&!!sourceRoot?'historical baseline has no helper; UI regressions still run':false},run);
helperTest('context binding reports initial readiness or loss and observes repeated recovery',()=>{
  for(const initiallyLost of [false,true]){
    const canvas=new CanvasTarget(),states:boolean[]=[];let lost=initiallyLost;
    const cleanup=loadHelper()(canvas as unknown as HTMLCanvasElement,{isContextLost:()=>lost},value=>states.push(value));
    assert.deepEqual(states,[initiallyLost]);assert.equal(canvas.listenerCount,2);
    const foreign=new CanvasTarget().emit('webglcontextlost');canvas.late('webglcontextlost',foreign);assert.equal(foreign.defaultPrevented,false);assert.deepEqual(states,[initiallyLost],'foreign canvas events do not change this renderer');
    lost=true;const loss=canvas.emit('webglcontextlost');assert.equal(loss.defaultPrevented,true);assert.equal(states.at(-1),true);
    const before=states.length;canvas.emit('webglcontextrestored');assert.equal(states.length,before,'restore notification cannot claim a still-lost context is usable');
    lost=false;canvas.emit('webglcontextrestored');assert.equal(states.at(-1),false);
    lost=true;canvas.emit('webglcontextlost');assert.equal(states.at(-1),true);
    lost=false;canvas.emit('webglcontextrestored');assert.equal(states.at(-1),false);
    cleanup();assert.equal(canvas.listenerCount,0);
  }
});
helperTest('context cleanup retires captured handlers and supports cleanup/setup replay',()=>{
  const canvas=new CanvasTarget(),states:boolean[]=[];let lost=false;
  const bind=loadHelper(),context={isContextLost:()=>lost};
  const cleanup=bind(canvas as unknown as HTMLCanvasElement,context,value=>states.push(value));
  lost=true;const loss=canvas.emit('webglcontextlost');cleanup();cleanup();
  const saved=[...states];canvas.late('webglcontextlost',loss);canvas.late('webglcontextrestored',loss);assert.deepEqual(states,saved);
  assert.equal(canvas.emit('webglcontextlost').defaultPrevented,false,'removed listeners leave future events untouched');
  const next:boolean[]=[];const second=bind(canvas as unknown as HTMLCanvasElement,context,value=>next.push(value));
  assert.deepEqual(next,[true]);assert.equal(canvas.listenerCount,2);
  lost=false;canvas.emit('webglcontextrestored');assert.equal(next.at(-1),false);assert.deepEqual(states,saved);
  second();assert.equal(canvas.listenerCount,0);
});

type Node={type:any;key?:string|null;props:Record<string,any>};
type Props={selected:any;regionalCourse:boolean;onPick:(point:number[])=>void};
type Effect={deps:unknown[]|undefined;create:()=>void|(()=>void);cleanup?:()=>void};
type Instance={slots:any[];effects:Map<number,Effect>;mounted:boolean};
const same=(a:unknown[]|undefined,b:unknown[]|undefined)=>!!a&&!!b&&a.length===b.length&&a.every((value,index)=>Object.is(value,b[index]));
function walk(value:unknown,match:(node:Node)=>boolean):Node|undefined {
  if(Array.isArray(value)){for(const child of value){const found=walk(child,match);if(found)return found;}return;}
  if(!value||typeof value!=='object'||!('props'in value))return;
  const node=value as Node;return match(node)?node:walk(node.props.children,match);
}
function harness(initiallyLost=false){
  const oldDocument=Object.getOwnPropertyDescriptor(globalThis,'document');
  const document={activeElement:null as any};Object.defineProperty(globalThis,'document',{value:document,configurable:true});
  const root:Instance={slots:[],effects:new Map(),mounted:true};
  let observer:Instance|null=null,current=root,hook=0,dirty=false,disposed=false,writesAfterDispose=0;
  let pendingLayout:Array<()=>void>=[],pendingPassive:Array<()=>void>=[],tree:Node,props:Props,canvasKey:unknown=Symbol('unmounted');
  let renderer:{canvas:CanvasTarget;lost:boolean;invalidations:number;state:any};
  const renderers:Array<typeof renderer>=[];
  const Canvas=()=>null,Bounds=()=>null,OrbitControls=()=>null;
  function newRenderer(){
    const next={canvas:new CanvasTarget(),lost:initiallyLost,invalidations:0,state:null as any};
    const context={isContextLost:()=>next.lost};
    next.state={gl:{domElement:next.canvas,getContext:()=>context},invalidate:()=>next.invalidations++};
    renderers.push(next);return next;
  }
  function effect(create:Effect['create'],deps:unknown[]|undefined,queue:Array<()=>void>){
    const owner=current,index=hook++,previous=owner.effects.get(index);
    if(!same(previous?.deps,deps))queue.push(()=>{previous?.cleanup?.();const cleanup=create();owner.effects.set(index,{deps,create,cleanup:typeof cleanup==='function'?cleanup:undefined});});
  }
  const hooks={
    useState(initial:any){const owner=current,index=hook++;if(!(index in owner.slots))owner.slots[index]=typeof initial==='function'?initial():initial;return [owner.slots[index],(value:any)=>{if(!owner.mounted||disposed){writesAfterDispose++;return;}const next=typeof value==='function'?value(owner.slots[index]):value;if(!Object.is(next,owner.slots[index])){owner.slots[index]=next;dirty=true;}}];},
    useRef(initial:any){const index=hook++;if(!(index in current.slots))current.slots[index]={current:initial};return current.slots[index];},
    useMemo(create:()=>any,deps:unknown[]){const index=hook++,previous=current.slots[index];if(!previous||!same(previous.deps,deps))current.slots[index]={deps,value:create()};return current.slots[index].value;},
    useCallback(callback:any,deps:unknown[]){return hooks.useMemo(()=>callback,deps);},
    useEffect(create:Effect['create'],deps?:unknown[]){effect(create,deps,pendingPassive);},
    useLayoutEffect(create:Effect['create'],deps?:unknown[]){effect(create,deps,pendingLayout);},
  };
  const fiber={Canvas,useThree:(selector?:any)=>selector?selector(renderer.state):renderer.state};
  const mod={exports:{} as {HeadAtlasSurface:(props:Props)=>Node}};
  new Function('require','module','exports',compile(sourcePath('components/HeadAtlasSurface.tsx')))((name:string)=>{
    if(name==='react')return hooks;if(name==='react/jsx-runtime')return require(name);
    if(name==='@react-three/fiber')return fiber;if(name==='@react-three/drei')return {Bounds,OrbitControls};
    if(name==='three')return {};
    if(name.includes('head-surface-context'))return {bindHeadSurfaceContext:loadHelper()};
    if(name.includes('head-atlas-display'))return {headLabel:(entry:any)=>entry.label};
    return {};
  },mod,mod.exports);
  const refs=new Map<any,any>();
  const domNodes=new WeakMap<Node,any>();
  function commitRefs(value:any,parent:any=null,live=new Set<any>()){
    if(Array.isArray(value)){value.forEach(child=>commitRefs(child,parent,live));return live;}
    if(!value||typeof value!=='object'||!value.props)return live;
    const node=value as Node;
    let dom=parent;
    if(typeof node.type==='string'){
      dom={parent,focus(){document.activeElement=this;},contains(other:any){for(let at=other;at;at=at.parent)if(at===this)return true;return false;},querySelector(){return null;}};
      if(node.props.ref&&typeof node.props.ref==='object'){
        const ref=node.props.ref;live.add(ref);dom=refs.get(ref)??dom;dom.parent=parent;refs.set(ref,dom);ref.current=dom;
      }
      domNodes.set(node,dom);
    }
    commitRefs(node.props.children,dom,live);return live;
  }
  function cleanup(instance:Instance|null){if(!instance)return;instance.mounted=false;for(const item of instance.effects.values())item.cleanup?.();instance.effects.clear();}
  function flush(next=props){
    assert(!disposed,'cannot render a disposed surface');props=next;let passes=0;
    do{
      assert(++passes<30,'surface hook lifecycle must settle');dirty=false;pendingLayout=[];pendingPassive=[];current=root;hook=0;
      tree=mod.exports.HeadAtlasSurface(props);
      const canvas=walk(tree,node=>node.type===Canvas);assert(canvas,'native surface retains its Canvas');
      if(!Object.is(canvas.key,canvasKey)){cleanup(observer);observer={slots:[],effects:new Map(),mounted:true};canvasKey=canvas.key;renderer=newRenderer();}
      const child=walk(canvas.props.children,node=>typeof node.type==='function'&&node.type!==Bounds&&node.type!==OrbitControls&&node.type.name!=='Surface'&&node.type.name!=='RegionalCourse');
      if(child){current=observer!;hook=0;child.type(child.props);}
      const live=commitRefs(tree);for(const [ref]of refs)if(!live.has(ref)){ref.current=null;refs.delete(ref);}
      for(const run of pendingLayout)run();for(const run of pendingPassive)run();
    }while(dirty);
    return tree!;
  }
  function lose(){renderer.lost=true;const event=renderer.canvas.emit('webglcontextlost');flush();return event;}
  function restore(){renderer.lost=false;renderer.canvas.emit('webglcontextrestored');flush();}
  function replay(){for(const instance of [root,observer])if(instance)for(const item of instance.effects.values()){item.cleanup?.();const result=item.create();item.cleanup=typeof result==='function'?result:undefined;}flush();}
  function dispose(){if(disposed)return;cleanup(observer);cleanup(root);disposed=true;for(const [ref]of refs)ref.current=null;if(oldDocument)Object.defineProperty(globalThis,'document',oldDocument);else delete (globalThis as any).document;}
  const alert=()=>walk(tree,node=>node.props.role==='alert');
  const retry=()=>walk(tree,node=>node.type==='button'&&node.props.children==='Retry 3D scan view');
  const surface=()=>walk(tree,node=>typeof node.type==='function'&&node.type.name==='Surface');
  return {flush,lose,restore,replay,dispose,alert,retry,surface,renderers,document,dom:(node:Node)=>domNodes.get(node),get renderer(){return renderer!;},get tree(){return tree!;},get writesAfterDispose(){return writesAfterDispose;}};
}

function sample(id='synthetic-one'):Props {
  return {selected:{entry:{id,label:id,color:[1,.6,.2]},positions:new Float32Array([0,0,0,1,0,0,0,1,0]),indices:new Uint32Array([0,1,2])},regionalCourse:false,onPick:()=>{}};
}
test('native surface announces context loss, genuine restoration and repeated loss without parent mutation',()=>{
  const h=harness();try{
    const props=sample(),selected=props.selected,bytes=new Uint8Array(selected.positions.buffer).slice(),picks:number[][]=[];props.onPick=point=>picks.push(point);h.flush(props);
    assert.equal(h.alert(),undefined);assert.equal(h.renderer.canvas.listenerCount,2,'actual Canvas child observes the real context helper');assert(h.renderer.invalidations>0,'initial ready observation invalidates the renderer');
    const outside={name:'slice controls'};h.document.activeElement=outside;
    assert.equal(h.lose().defaultPrevented,true);assert(h.alert(),'context loss needs a visible accessible notice');assert(h.retry());assert.equal(h.document.activeElement,outside,'loss does not steal slice focus');
    h.renderer.canvas.emit('webglcontextrestored');h.flush();assert(h.alert(),'a false restore must leave the loss notice visible');
    const count=h.renderer.invalidations;h.restore();assert.equal(h.alert(),undefined);assert(walk(h.tree,node=>node.props.role==='status'),'restoration is announced');assert(h.renderer.invalidations>count,'restoration invalidates the rendering frame');assert.equal(h.document.activeElement,outside);
    h.lose();assert(h.alert());h.restore();assert.equal(h.alert(),undefined);
    assert.equal(h.surface()?.props.selected,selected);h.surface()!.props.onPick([1,2,3]);assert.deepEqual(picks,[[1,2,3]],'ready surface forwards the original native pick');assert.deepEqual(new Uint8Array(selected.positions.buffer),bytes);assert.equal(h.renderers.length,1,'automatic restore preserves the mounted renderer');
  }finally{h.dispose();}
});
test('initially lost native context announces its state and recovers automatically',()=>{
  const h=harness(true);try{h.flush(sample());assert(h.alert());assert(h.retry());h.restore();assert.equal(h.alert(),undefined);assert.equal(h.renderers.length,1);}finally{h.dispose();}
});
test('explicit context retry remounts once with latest props and retires old controls and events',()=>{
  const h=harness();try{
    h.flush(sample());h.lose();const old=h.renderer,loss=old.canvas.emit('webglcontextlost'),retry=h.retry();assert(retry);
    const latest=sample('synthetic-latest'),picks:number[][]=[];latest.onPick=point=>picks.push(point);latest.regionalCourse=true;latest.selected.entry.supplementary_geometries=[{part_id:'synthetic-course',sampled_path_ras_mm:[[0,0,0],[1,1,1]]}];h.flush(latest);
    const oldPick=h.surface()!.props.onPick;oldPick([9,9,9]);assert.deepEqual(picks,[],'interrupted surface cannot navigate the native image');
    const currentRetry=h.retry();assert(currentRetry);currentRetry.props.onClick();currentRetry.props.onClick();h.flush();
    assert.equal(h.renderers.length,2,'a duplicated retry reserves just one replacement Canvas');assert.equal(old.canvas.listenerCount,0);assert.equal(h.alert(),undefined);
    assert.equal(h.surface()?.props.selected,latest.selected);h.surface()!.props.onPick([1,2,3]);oldPick([9,9,9]);assert.deepEqual(picks,[[1,2,3]],'replacement uses latest pick callback and retires the old one');
    const regional=walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='RegionalCourse');assert(regional,'latest regionalCourse prop is retained');assert.equal(regional.props.points,latest.selected.entry.supplementary_geometries[0].sampled_path_ras_mm);
    const oldInvalidations=old.invalidations;
    retry.props.onClick();currentRetry.props.onClick();old.canvas.late('webglcontextlost',loss);old.canvas.late('webglcontextrestored',loss);h.flush();
    assert.equal(old.invalidations,oldInvalidations,'retired notifications cannot invalidate the old renderer');
    assert.equal(h.renderers.length,2);assert.equal(h.alert(),undefined,'retired source events cannot mark the replacement lost');assert.equal(h.writesAfterDispose,0);
    const active=h.renderer,late=active.canvas.emit('webglcontextlost');h.flush();const retired=h.retry();assert(retired);h.dispose();
    retired.props.onClick();active.canvas.late('webglcontextlost',late);active.canvas.late('webglcontextrestored',late);assert.equal(h.writesAfterDispose,0);assert.equal(active.canvas.listenerCount,0);
  }finally{h.dispose();}
});
test('context effect cleanup/setup replay retains exactly one live observer',()=>{
  const h=harness();try{
    h.flush(sample());assert.equal(h.renderer.canvas.listenerCount,2);h.replay();assert.equal(h.renderer.canvas.listenerCount,2);
    h.lose();assert(h.alert());h.restore();assert.equal(h.alert(),undefined);assert.equal(h.writesAfterDispose,0);
  }finally{h.dispose();}
});
test('restoration and retry return focus locally only when they displace notice focus',()=>{
  for(const action of ['restore','retry']){
    const h=harness();try{
      h.flush(sample());h.lose();const retry=h.retry();assert(retry);const retryDom=h.dom(retry);retryDom.focus();
      if(action==='restore')h.restore();else{retry.props.onClick();h.flush();}
      assert.notEqual(h.document.activeElement,retryDom,'removed notice cannot retain focus');
      const group=walk(h.tree,node=>node.props.ref?.current===h.document.activeElement);assert(group,'focus returns to an existing local surface target');
    }finally{h.dispose();}
  }
});
