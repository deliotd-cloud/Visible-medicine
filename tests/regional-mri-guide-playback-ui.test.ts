import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {GUIDED_PLAYBACK_RATES,guidedPlaybackDuration,isGuidedPlaybackRate} from '../atlas-review/lib/guided-playback.ts';

const source=readFileSync(new URL('../components/RegionalMriGuidePlayback.tsx',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
type Node={type:any;props:Record<string,any>};
function nodes(tree:any):Node[]{if(Array.isArray(tree))return tree.flatMap(nodes);if(!tree||typeof tree!=='object')return[];return[tree,...nodes(tree.props?.children)];}
function harness(){
  const jobs=new Map<number,{callback:()=>void;delay:number}>(),old=new Map<number,()=>void>();
  let id=0,cursor=0,slots:any[]=[],pending=new Map<number,any>(),effects=new Map<number,any>();
  let tree:Node,hidden=false,reduced=false,alive=true,writesAfterUnmount=0;
  const listeners=new Map<string,Set<()=>void>>();
  const on=(name:string,fn:()=>void)=>{if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name)!.add(fn);};
  const off=(name:string,fn:()=>void)=>listeners.get(name)?.delete(fn);
  const media={get matches(){return reduced;},addEventListener:(_name:string,fn:()=>void)=>on('motion',fn),removeEventListener:(_name:string,fn:()=>void)=>off('motion',fn)};
  const doc={get hidden(){return hidden;},addEventListener:on,removeEventListener:off};
  const win={matchMedia:()=>media,addEventListener:on,removeEventListener:off};
  const hooks={
    useState(initial:any){const i=cursor++;if(!(i in slots))slots[i]=initial;return[slots[i],(value:any)=>{if(!alive)writesAfterUnmount++;slots[i]=typeof value==='function'?value(slots[i]):value;}];},
    useRef(initial:any){const i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i];},
    useLayoutEffect(fn:()=>any,deps?:any[]){pending.set(cursor++,{kind:'layout',fn,deps});},
    useEffect(fn:()=>any,deps?:any[]){pending.set(cursor++,{kind:'effect',fn,deps});},
  };
  const module={exports:{} as any};
  const imports:Record<string,any>={react:hooks,'react/jsx-runtime':{jsx:(type:any,props:any)=>({type,props}),jsxs:(type:any,props:any)=>({type,props})},
    '../atlas-review/lib/guided-playback':{GUIDED_PLAYBACK_RATES,guidedPlaybackDuration,isGuidedPlaybackRate}};
  new Function('require','module','exports','setTimeout','clearTimeout','window','document',code)(
    (name:string)=>{assert(Object.hasOwn(imports,name),name);return imports[name];},module,module.exports,
    (callback:()=>void,delay:number)=>{const handle=++id;jobs.set(handle,{callback,delay});old.set(handle,callback);return handle;},
    (handle:number)=>jobs.delete(handle),win,doc);
  const pauseRef={current:null as null|(()=>void)};
  const context={id:1};
  const base={context,step:0,total:3,caption:'A short caption',ready:true,blocked:false,pauseRef,onAdvance:(_next:number)=>true};
  let currentProps=base;
  function commit(){for(const kind of ['layout','effect'])for(const[index,item]of pending){if(item.kind!==kind)continue;
    const prior=effects.get(index);
    if(!prior||!item.deps||item.deps.some((dep:any,i:number)=>!Object.is(dep,prior.deps[i]))){prior?.cleanup?.();effects.set(index,{...item,cleanup:item.fn()});}
  }}
  function render(props:Partial<typeof base>={},shouldCommit=true){cursor=0;pending=new Map();const next={...currentProps,...props};const result=module.exports.RegionalMriGuidePlayback(next);if(shouldCommit){currentProps=next;tree=result;commit();}return result;}
  function find(type:string,predicate:(n:Node)=>boolean=()=>true){const found=nodes(tree).find(n=>n.type===type&&predicate(n));assert(found,`missing ${type}`);return found;}
  const button=()=>find('button');
  const status=()=>find('span',n=>n.props.role==='status').props.children as string;
  const play=()=>button().props.onClick();
  const speed=(value:string)=>find('select').props.onChange({currentTarget:{value}});
  const tick=()=>{assert.equal(jobs.size,1);const [key,job]=[...jobs][0];jobs.delete(key);job.callback();};
  const fire=(name:string)=>{for(const fn of [...listeners.get(name)??[]])fn();};
  const cleanup=()=>{alive=false;for(const effect of effects.values())effect.cleanup?.();effects.clear();};
  const replay=()=>{for(const effect of effects.values())effect.cleanup?.();for(const kind of ['layout','effect'])for(const effect of effects.values())if(effect.kind===kind)effect.cleanup=effect.fn();};
  return{render,button,status,play,speed,tick,jobs,old,pauseRef,context,base,fire,cleanup,replay,
    setHidden:(value:boolean)=>{hidden=value;fire('visibilitychange');},setReduced:(value:boolean)=>{reduced=value;fire('motion');},isAlive:()=>alive,writesAfterUnmount:()=>writesAfterUnmount,
    select:()=>find('select')};
}

test('explicit play waits for painted annotation and advances once per committed step',()=>{
  const h=harness(),calls:number[]=[];
  const onAdvance=(next:number)=>{calls.push(next);return true;};
  h.render({ready:false,onAdvance});assert.equal(h.jobs.size,0);h.play();h.render({ready:false,onAdvance});
  assert.equal(h.jobs.size,0);assert.match(h.status(),/Waiting/);
  h.render({ready:true,onAdvance});assert.equal([...h.jobs.values()][0].delay,24000);
  h.tick();assert.deepEqual(calls,[1]);assert.equal(h.jobs.size,0);
  h.render({ready:false,onAdvance});assert.equal(h.jobs.size,0);
  h.render({step:1,ready:true,onAdvance});assert.equal(h.jobs.size,1);
  h.tick();assert.deepEqual(calls,[1,2]);h.render({step:2,ready:true,onAdvance});
  h.render();assert.equal(h.jobs.size,0);assert.match(h.status(),/Last step reached/);
});

test('speed uses shared caption timing, change pauses, and rejected next requests manual selection',()=>{
  const h=harness(),calls:number[]=[];
  h.render({onAdvance:next=>{calls.push(next);return false;}});h.speed('2');h.render();
  h.play();h.render();assert.equal([...h.jobs.values()][0].delay,guidedPlaybackDuration(h.base.caption,0,2));
  h.tick();h.render();assert.deepEqual(calls,[1]);assert.match(h.status(),/Manual step selection/);assert.equal(h.jobs.size,0);
  h.play();h.render();h.speed('0.5');h.render();assert.equal(h.jobs.size,0);assert.equal(h.button().props.children,'Play guide');
});

test('blocked, context, hidden tab, blur, motion and pauseRef stop without resume',()=>{
  for(const interrupt of ['blocked','context','hidden','blur','motion','ref'] as const){
    const h=harness();h.render();h.play();h.render();assert.equal(h.jobs.size,1,interrupt);
    if(interrupt==='blocked')h.render({blocked:true});
    if(interrupt==='context')h.render({context:{id:2}});
    if(interrupt==='hidden')h.setHidden(true);
    if(interrupt==='blur')h.fire('blur');
    if(interrupt==='motion')h.setReduced(true);
    if(interrupt==='ref')h.pauseRef.current?.();
    h.render(interrupt==='blocked'?{blocked:true}:interrupt==='context'?{context:{id:2}}:{});
    assert.equal(h.jobs.size,0,interrupt);assert.equal(h.button().props.children,'Play guide',interrupt);
  }
});

test('stale timers, speculative renders and reentrant pause cannot advance',()=>{
  const h=harness(),calls:number[]=[];
  h.render({onAdvance:next=>{calls.push(next);h.pauseRef.current?.();return true;}});h.play();h.render();
  const stale=[...h.old.values()].at(-1)!;
  h.render({step:1},false);assert.equal(h.jobs.size,1);
  h.tick();assert.deepEqual(calls,[1]);h.render();assert.equal(h.jobs.size,0);
  stale();assert.deepEqual(calls,[1]);
  h.play();h.render();const second=[...h.old.values()].at(-1)!;h.pauseRef.current?.();second();assert.deepEqual(calls,[1]);
});

test('redraw and unmount invalidate timers; StrictMode replay stays stopped',()=>{
  const h=harness(),calls:number[]=[];h.render({onAdvance:n=>{calls.push(n);return true;}});h.play();h.render();
  const stale=[...h.old.values()].at(-1)!;
  h.render({ready:false});assert.equal(h.jobs.size,0);stale();assert.deepEqual(calls,[]);
  h.render({ready:true});assert.equal(h.jobs.size,1);h.replay();assert.equal(h.jobs.size,0);
  h.render();assert.equal(h.jobs.size,0);h.cleanup();assert.equal(h.pauseRef.current,null);
  for(const callback of h.old.values())callback();assert.deepEqual(calls,[]);
  assert.equal(h.writesAfterUnmount(),0);
});

test('harmless commits preserve the original dwell timer and use the latest committed callback',()=>{
 const h=harness(),calls:string[]=[];h.render({onAdvance:()=>{calls.push('old');return true;}});h.play();h.render();
 const handle=[...h.jobs.keys()][0],job=h.jobs.get(handle);h.render({onAdvance:()=>{calls.push('latest');return true;}});h.render();
 assert.equal(h.jobs.size,1);assert.equal(h.jobs.get(handle),job,'No restarted deadline from a harmless rerender');h.tick();
 assert.deepEqual(calls,['latest']);h.cleanup();
});
test('caption changes pause rather than silently restart an active step',()=>{
 const h=harness(),calls:number[]=[];h.render({onAdvance:n=>{calls.push(n);return true;}});h.play();h.render();const old=[...h.old.values()].at(-1)!;
 h.render({caption:'Changed revision wording'});h.render();assert.equal(h.jobs.size,0);old();assert.deepEqual(calls,[]);assert.equal(h.button().props.children,'Play guide');h.cleanup();
});
test('stale Play, Pause and speed handlers cannot mutate a newer committed guide or an unmounted control',()=>{
 const h=harness();h.render();const oldPlay=h.button().props.onClick,oldRate=h.select().props.onChange;
 h.play();h.render();const oldPause=h.button().props.onClick;h.render({context:{id:2}});h.render();
 oldPlay();oldPause();oldRate({currentTarget:{value:'3'}});h.render();assert.equal(h.jobs.size,0);assert.equal(h.select().props.value,1);
 h.play();h.render();oldPause();assert.equal(h.jobs.size,1);const currentRate=h.select().props.onChange,currentPause=h.button().props.onClick;
 h.cleanup();currentRate({currentTarget:{value:'2'}});currentPause();assert.equal(h.writesAfterUnmount(),0);
});
test('malformed indices and totals cannot start, survive commit, or dispatch an automatic step',()=>{
 for(const values of [{step:NaN},{step:.5},{step:-1},{total:Infinity},{total:2.5},{total:0},{step:3}]){
  const h=harness(),calls:number[]=[];h.render({...values,onAdvance:n=>{calls.push(n);return true;}});assert.equal(h.button().props.disabled,true);h.play();h.render();assert.equal(h.jobs.size,0);assert.deepEqual(calls,[]);h.cleanup();
 }
 const h=harness();h.render();h.play();h.render();h.render({total:NaN});h.render();assert.equal(h.jobs.size,0);assert.equal(h.button().props.children,'Play guide');h.cleanup();
});
test('a throwing next-step callback pauses and requires an explicit new Play',()=>{
 const h=harness();h.render({onAdvance:()=>{throw new Error('Synthetic refusal');}});h.play();h.render();h.tick();h.render();
 assert.equal(h.jobs.size,0);assert.equal(h.button().props.children,'Play guide');assert.match(h.status(),/Select a step manually/);h.render();assert.equal(h.jobs.size,0);h.cleanup();
});
test('a same-step commit stays waiting and the accepted next step waits for its own paint',()=>{
 const h=harness(),calls:number[]=[];h.render({onAdvance:n=>{calls.push(n);return true;}});h.play();h.render();h.tick();
 h.render();assert.equal(h.jobs.size,0);assert.match(h.status(),/Waiting/);h.render({step:1,ready:false});h.render();assert.equal(h.jobs.size,0);
 h.render({ready:true});assert.equal(h.jobs.size,1);assert.deepEqual(calls,[1]);h.cleanup();
});
test('reduced motion exposes an explanation and returning to normal never auto-resumes',()=>{
 const h=harness();h.setReduced(true);h.render();h.render();assert.equal(h.button().props.disabled,true);assert.match(h.status(),/Reduced motion/);
 h.setReduced(false);h.render();assert.equal(h.button().props.disabled,false);assert.equal(h.jobs.size,0);h.play();h.render();assert.equal(h.jobs.size,1);h.cleanup();
});
