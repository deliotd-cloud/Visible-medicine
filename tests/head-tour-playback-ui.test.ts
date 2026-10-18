import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import * as playback from '../lib/head-tour-playback.ts';
import type {HeadTourPlaybackContext} from '../lib/head-tour-playback.ts';

type ElementNode={type:unknown;props:Record<string,any>};
type Effect={kind:'layout'|'passive';create:()=>void|(()=>void);deps?:unknown[];cleanup?:()=>void};
const code=ts.transpileModule(readFileSync(new URL('../components/HeadTourPlayback.tsx',import.meta.url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const require=createRequire(import.meta.url);
function walk(node:any):ElementNode[]{return Array.isArray(node)?node.flatMap(walk):node?.props?[node,...walk(node.props.children)]:[];}
function harness(run:(h:any)=>void){
  let cursor=0,tree:ElementNode,dirty=false,serial=0;
  const slots:any[]=[],effects=new Map<number,Effect>(),pending=new Map<number,Effect>();
  const timers=new Map<number,{callback:()=>void;delay:number}>(),allTimers=new Map<number,()=>void>();
  const events=new Map<string,Set<(event:any)=>void>>(),advances:string[]=[],playing:boolean[]=[];
  let hidden=false,inert=false,closed=false;
  const listen=(name:string,fn:(event:any)=>void)=>{if(!events.has(name))events.set(name,new Set());events.get(name)!.add(fn);};
  const unlisten=(name:string,fn:(event:any)=>void)=>events.get(name)?.delete(fn);
  const notes={open:false};
  const root={addEventListener:listen,removeEventListener:unlisten,querySelector:(selector:string)=>selector==='.imaging-comparison-learning'?notes:null};
  const controls={contains:(node:any)=>node==='inside',closest:(selector:string)=>selector==='.imaging-workspace-page, .head-guided-module-page'?root:selector==='details'?closed?{open:false}:null:inert?{}:null};
  const oldWindow=Object.getOwnPropertyDescriptor(globalThis,'window'),oldDocument=Object.getOwnPropertyDescriptor(globalThis,'document');
  Object.defineProperty(globalThis,'window',{configurable:true,value:{setTimeout(callback:()=>void,delay:number){timers.set(++serial,{callback,delay});allTimers.set(serial,callback);return serial;},clearTimeout(id:number){timers.delete(id);},addEventListener:listen,removeEventListener:unlisten}});
  Object.defineProperty(globalThis,'document',{configurable:true,value:{get hidden(){return hidden;},addEventListener:listen,removeEventListener:unlisten}});
  const effect=(kind:Effect['kind'])=>(create:Effect['create'],deps?:unknown[])=>{const i=cursor++,old=effects.get(i);if(!deps||!old?.deps||deps.length!==old.deps.length||deps.some((v,j)=>!Object.is(v,old.deps![j])))pending.set(i,{kind,create,deps});};
  const hooks={useRef(initial:any){const i=cursor++;return slots[i]??(slots[i]={current:initial});},useState(initial:any){const i=cursor++;if(!(i in slots))slots[i]=initial;return[slots[i],(next:any)=>{const value=typeof next==='function'?next(slots[i]):next;if(!Object.is(value,slots[i])){slots[i]=value;dirty=true;}}];},useEffect:effect('passive'),useLayoutEffect:effect('layout')};
  const mod={exports:{} as {HeadTourPlayback:(props:any)=>ElementNode}};
  new Function('require','module','exports',code)((name:string)=>name==='react'?hooks:name==='../lib/head-tour-playback'?playback:name.endsWith('.css')?{}:require(name),mod,mod.exports);
  let props={context:{identity:{},revision:'a'.repeat(64),sequenceId:'brainstem',stepId:'brainstem-midbrain',index:0,total:3,nextId:'brainstem-pons',ready:true,blocked:false,onAdvance:(id:string)=>advances.push(id)} satisfies HeadTourPlaybackContext,onPlayingChange:(value:boolean)=>playing.push(value)};
  function commit(kind:Effect['kind']){for(const[i,item]of [...pending])if(item.kind===kind){effects.get(i)?.cleanup?.();const cleanup=item.create();item.cleanup=typeof cleanup==='function'?cleanup:undefined;effects.set(i,item);pending.delete(i);}}
  function render(changes:any={},committed=true){const next={...props,...changes};cursor=0;pending.clear();const rendered=mod.exports.HeadTourPlayback(next);rendered.props.ref.current=controls;if(committed){props=next;tree=rendered;commit('layout');commit('passive');}return rendered;}
  function flush(){let n=0;while(dirty){assert(++n<15);dirty=false;render();}}
  const button=(from=tree)=>walk(from).find(n=>n.type==='button')!;
  const select=(from=tree)=>walk(from).find(n=>n.type==='select')!;
  const click=(from=tree)=>{button(from).props.onClick();flush();};
  function emit(name:string,event:any={target:'outside'}){for(const fn of events.get(name)??[])fn(event);flush();}
  function tick(){assert.equal(timers.size,1);const[id,task]=[...timers][0];timers.delete(id);task.callback();flush();}
  try{render();flush();run({render,flush,click,button,select,tick,timers,allTimers,advances,playing,notes,props:()=>props,tree:()=>tree,emit,setHidden:(v:boolean)=>{hidden=v;},setInert:(v:boolean)=>{inert=v;},setClosed:(v:boolean)=>{closed=v;},unmountLayout:()=>{for(const item of effects.values())if(item.kind==='layout')item.cleanup?.();},unmount:()=>{for(const kind of ['layout','passive'])for(const item of effects.values())if(item.kind===kind)item.cleanup?.();effects.clear();},replay:()=>{for(const kind of ['layout','passive']){const items=[...effects.values()].filter(i=>i.kind===kind);for(const item of items)item.cleanup?.();for(const item of items){const cleanup=item.create();item.cleanup=typeof cleanup==='function'?cleanup:undefined;}}flush();}});}
  finally{for(const kind of ['layout','passive'])for(const item of effects.values())if(item.kind===kind)item.cleanup?.();if(oldWindow)Object.defineProperty(globalThis,'window',oldWindow);else delete(globalThis as any).window;if(oldDocument)Object.defineProperty(globalThis,'document',oldDocument);else delete(globalThis as any).document;}
}

test('compact accessible controls start only explicitly, use selected speed and retain final notes',()=>harness(h=>{
  assert.equal(h.tree().props['aria-label'],'Guided tour playback');assert.equal(h.timers.size,0);
  assert.equal(h.select().props['aria-label'],'Guided tour speed');
  assert.equal(h.notes.open,false);h.select().props.onChange({target:{value:'2'}});h.flush();h.click();assert.equal(h.notes.open,true,'explicit play reveals folded comparison notes');
  assert.equal(h.button().props.children,'Pause tour');assert.equal([...h.timers.values()][0].delay,6000);
  h.tick();assert.deepEqual(h.advances,['brainstem-pons']);assert.equal(h.timers.size,0);
  h.render({context:{...h.props().context,stepId:'brainstem-pons',index:1,nextId:'brainstem-medulla',ready:false}});h.flush();assert.equal(h.timers.size,0);
  h.render({context:{...h.props().context,ready:true}});h.flush();h.tick();
  h.render({context:{...h.props().context,stepId:'brainstem-medulla',index:2,nextId:null}});h.flush();h.tick();
  assert.deepEqual(h.advances,['brainstem-pons','brainstem-medulla']);assert.equal(h.button().props.children,'Replay this step');
}));
for(const event of ['pointerdown','wheel','keydown','blur','pagehide','popstate'])test(`${event} pauses and retires a queued tick`,()=>harness(h=>{
  h.click();const stale=[...h.allTimers.values()].at(-1)!;h.emit(event);stale();h.flush();assert.equal(h.timers.size,0);assert.deepEqual(h.advances,[]);assert.equal(h.button().props.children,'Play tour');
}));
test('controls do not pause for their own pointer interaction; Escape explicitly pauses',()=>harness(h=>{
  h.click();h.emit('pointerdown',{target:'inside'});assert.equal(h.timers.size,1);
  h.tree().props.onKeyDown({key:'Escape'});h.flush();assert.equal(h.timers.size,0);
}));
test('hidden page pauses and becoming visible never restarts automatically',()=>harness(h=>{
  h.click();h.setHidden(true);h.emit('visibilitychange');h.setHidden(false);h.emit('visibilitychange');assert.equal(h.timers.size,0);
  h.setHidden(true);h.click();assert.equal(h.timers.size,0);
}));
test('queued tick cannot navigate after layout unmount, hidden/inert controls or closed container',()=>{
  for(const condition of ['unmount','inert','closed','hidden'])harness(h=>{h.click();if(condition==='unmount')h.unmountLayout();else if(condition==='inert')h.setInert(true);else if(condition==='closed')h.setClosed(true);else h.setHidden(true);h.tick();assert.deepEqual(h.advances,[]);});
});
test('an abandoned render neither replaces callbacks nor retires committed controls',()=>harness(h=>{
  const old=h.tree(),speculative=h.render({context:{...h.props().context,identity:{},onAdvance:()=>assert.fail('speculative callback')}},false);
  speculative.props.children[0].props.onClick();assert.equal(h.timers.size,0);h.click(old);h.tick();assert.deepEqual(h.advances,['brainstem-pons']);
}));
test('committed replacement and unmount retire old controls, speed and queued ticks',()=>harness(h=>{
  h.click();const old=h.tree(),stale=[...h.allTimers.values()].at(-1)!;
  h.render({context:{...h.props().context,identity:{}}});h.flush();h.click(old);h.select(old).props.onChange({target:{value:'2'}});stale();h.flush();assert.equal(h.timers.size,0);assert.deepEqual(h.advances,[]);
  const current=h.tree();h.unmount();h.click(current);assert.equal(h.timers.size,0);
}));
test('StrictMode replay pauses without stale automatic restart and allows a fresh explicit start',()=>harness(h=>{
  h.click();h.replay();assert.equal(h.timers.size,0);h.click();h.tick();assert.deepEqual(h.advances,['brainstem-pons']);
}));
test('unavailable canonical positions disable play rather than skip',()=>harness(h=>{
  h.render({context:{...h.props().context,ready:false,blocked:true}});h.flush();assert.equal(h.button().props.disabled,true);h.click();assert.equal(h.timers.size,0);assert.deepEqual(h.advances,[]);
}));
