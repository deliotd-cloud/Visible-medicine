import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {HEAD_MANIFEST_SHA256,type HeadEntry,type LoadedStudy} from '../lib/head-atlas-import.ts';
import {HEAD_STUDY_PLAN_KEY as key,type HeadStudyPlan} from '../lib/head-study-plan.ts';
const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/HeadAtlasSavedStudyPlan.tsx',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
type Node={type:unknown;props:Record<string,any>};
const nodes=(v:any):Node[]=>Array.isArray(v)?v.flatMap(nodes):v?.props?[v,...nodes(v.props.children)]:[];
const text=(v:any):string=>Array.isArray(v)?v.map(text).join(''):v?.props?text(v.props.children):v==null?'':String(v);
const entry={id:'cth.bst.pons',label:'Pons — regional mask',representation:'partial-mask',laterality:'midline_or_unpaired',
 mask:{file:'private-synthetic.bin',sha256:'a'.repeat(64)}} as HeadEntry;
const plan:HeadStudyPlan={schema:1,headRevision:HEAD_MANIFEST_SHA256,conceptIds:['brainstem-pons']};
function lockQueue(){
 let tail=Promise.resolve();
 return {request(_key:string,action:()=>unknown){const run=tail.then(action);tail=run.then(()=>{},()=>{});return run;}};
}
function fixture(initial:string|null=null,blocked=false,options:{data?:Map<string,string>;locks?:ReturnType<typeof lockQueue>|null;failSet?:boolean;failRemove?:boolean}={}){
 const prior=Object.getOwnPropertyDescriptor(globalThis,'window'),priorNavigator=Object.getOwnPropertyDescriptor(globalThis,'navigator');
 const data=options.data??new Map<string,string>();if(initial!==null)data.set(key,initial);data.set('unrelated','keep');
 let writes=0,removed=0,deny=blocked,index=0,dirty=true,tree:Node,usable=true;
 const states:any[]=[],layouts:Array<()=>void>=[],effects:Array<()=>void>=[],cleanups:Array<()=>void>=[],listeners=new Set<(event:any)=>void>(),restores:HeadStudyPlan[]=[];
 let props:any={plan,entries:[entry],study:{definition:{entries:[entry]}} as LoadedStudy,modality:'CT',canUse:()=>usable,onRestore:(value:HeadStudyPlan)=>restores.push(value)};
 const window={localStorage:{getItem(k:string){if(deny)throw Error('Denied');return data.get(k)??null;},setItem(k:string,v:string){if(deny||options.failSet)throw Error('Full');writes++;data.set(k,v);},removeItem(k:string){if(deny||options.failRemove)throw Error('Denied');removed++;data.delete(k);}},
 addEventListener(_name:string,fn:(event:any)=>void){listeners.add(fn);},removeEventListener(_name:string,fn:(event:any)=>void){listeners.delete(fn);}};
 Object.defineProperty(globalThis,'window',{configurable:true,value:window});
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{locks:options.locks===undefined?lockQueue():options.locks}});
  const hooks={useState(value:any){const slot=index++;if(!(slot in states))states[slot]=value;return [states[slot],(next:any)=>{const value=typeof next==='function'?next(states[slot]):next;if(!Object.is(value,states[slot])){states[slot]=value;dirty=true;}}];},useRef(value:any){const slot=index++;return states[slot]??=( {current:value});},useLayoutEffect(fn:()=>void){index++;layouts.push(fn);},useEffect(fn:()=>()=>void){const slot=index++;if(!(slot in states)){states[slot]=true;effects.push(()=>cleanups.push(fn()));}}};
 const module={exports:{} as any};const jsx=(type:unknown,props:any)=>({type,props});
 new Function('require','module','exports',js)((name:string)=>name==='react'?hooks:name==='react/jsx-runtime'?{jsx,jsxs:jsx,Fragment:Symbol('fragment')}:require(name.replace('../lib/','../lib/')+'.ts'),module,module.exports);
 const flush=()=>{let guard=0;while(dirty||effects.length){assert(++guard<20);dirty=false;index=0;tree=module.exports.HeadAtlasSavedStudyPlan(props);layouts.splice(0).forEach(fn=>fn());effects.splice(0).forEach(fn=>fn());}return tree!;};flush();
 return {data,restores,get writes(){return writes;},get removed(){return removed;},get text(){return text(flush());},
 savedList(){const list=nodes(flush()).find(n=>n.type==='ol'&&n.props['aria-label']==='Saved anatomy concepts');return list?{label:list.props['aria-label'],items:nodes(list).filter(n=>n.type==='li').map(text)}:null;},
 button(label:string){const match=nodes(flush()).find(n=>n.type==='button'&&text(n)===label);assert(match,label);return match;},
  summary(){const match=nodes(flush()).find(n=>n.type==='summary');assert(match);return match;},
 update(next:Record<string,unknown>){props={...props,...next};dirty=true;flush();},deny(){deny=true;},retire(){usable=false;},
 abandon(next:Record<string,unknown>){index=0;const abandoned=module.exports.HeadAtlasSavedStudyPlan({...props,...next});layouts.length=0;
  return {button(label:string){const match=nodes(abandoned).find(n=>n.type==='button'&&text(n)===label);assert(match,label);return match;}};},
 storage(raw:string|null,event=true){if(raw===null)data.delete(key);else data.set(key,raw);if(event)listeners.forEach(fn=>fn({key}));flush();},
 async settle(){await new Promise(resolve=>setImmediate(resolve));flush();},
 close(){cleanups.forEach(fn=>fn?.());assert.equal(listeners.size,0);if(prior)Object.defineProperty(globalThis,'window',prior);else delete (globalThis as any).window;
  if(priorNavigator)Object.defineProperty(globalThis,'navigator',priorNavigator);else delete (globalThis as any).navigator;}};
}
test('saving is opt-in, concept-only and persists across remount without automatic restoration',async()=>{
 const f=fixture();let raw:string;
 try{assert.equal(f.writes,0);f.button('Save mapped plan').props.onClick();await f.settle();raw=f.data.get(key)!;
  assert.deepEqual(JSON.parse(raw),plan);assert(!raw.includes('private')&&!raw.includes('regional mask'));
  assert.equal(f.writes,1);assert(f.button('This mapped plan is saved').props.disabled);assert.deepEqual(f.restores,[]);
 }finally{f.close();}
 const resumed=fixture(raw!);try{resumed.update({entries:[],plan:null});assert.equal(resumed.writes,0);assert.deepEqual(resumed.restores,[]);
  resumed.button('Add saved concepts to this set (1)').props.onClick();assert.deepEqual(resumed.restores,[plan]);
  assert.match(resumed.text,/practice has not started/);
 }finally{resumed.close();}
});

test('save and restore retain summary focus before their triggering button becomes disabled',async()=>{
 const saving=fixture();let focused=0;
 try{
  saving.summary().props.ref.current={focus(){focused++;assert.equal(saving.writes,0);}};
  saving.button('Save mapped plan').props.onClick();assert.equal(focused,1);
  await saving.settle();assert.equal(saving.writes,1);assert(saving.button('This mapped plan is saved').props.disabled);
  assert.equal(focused,1);assert.deepEqual(saving.restores,[]);
 }finally{saving.close();}
 const restoring=fixture(JSON.stringify(plan));
 try{
  restoring.update({entries:[],plan:null});
  restoring.summary().props.ref.current={focus(){focused++;assert.deepEqual(restoring.restores,[]);}};
  restoring.button('Add saved concepts to this set (1)').props.onClick();
  assert.equal(focused,2);assert.deepEqual(restoring.restores,[plan]);assert.equal(restoring.writes,0);
  restoring.update({entries:[entry],plan});assert(restoring.button('Add saved concepts to this set (0)').props.disabled);
 }finally{restoring.close();}
});

test('failed saves retain stable focus and stale restores never move it or restore concepts',async()=>{
 const failed=fixture(null,false,{failSet:true});let focused=0;
 try{
  failed.summary().props.ref.current={focus(){focused++;}};
  failed.button('Save mapped plan').props.onClick();await failed.settle();
  assert.equal(focused,1);assert.equal(failed.writes,0);assert.match(failed.text,/could not be saved/);
 }finally{failed.close();}
 const stale=fixture(JSON.stringify(plan));
 try{
  stale.update({entries:[],plan:null});
  stale.summary().props.ref.current={focus(){focused++;}};
  const restore=stale.button('Add saved concepts to this set (1)');stale.retire();restore.props.onClick();
  assert.equal(focused,1);assert.deepEqual(stale.restores,[]);assert.equal(stale.writes,0);
 }finally{stale.close();}
});
test('invalid or stale saved data is not restored or rewritten and remains removable',async()=>{
 for(const raw of ['{bad',JSON.stringify({...plan,headRevision:'old'}),JSON.stringify({...plan,url:'https://evil.invalid'})]){
  const f=fixture(raw);try{assert.match(f.text,/invalid or outdated/);assert.equal(f.savedList(),null);assert.doesNotMatch(f.text,/Pons — /);assert.equal(f.writes,0);let focused=0;f.button('Remove saved plan').props.onClick({currentTarget:{closest:()=>({querySelector:()=>({focus:()=>focused++})})}});await f.settle();assert.equal(focused,1);assert(!f.data.has(key));assert.equal(f.data.get('unrelated'),'keep');assert.deepEqual(f.restores,[]);}finally{f.close();}
 }
});
test('saved-order canonical labels distinguish present, available, over-limit and unavailable concepts',()=>{
 const left={...entry,id:'cth.cer.cerebellar_hemisphere.left',label:'Left cerebellar hemisphere — regional mask',representation:'mask',laterality:'left',mask:{...entry.mask!,sha256:'b'.repeat(64)}} as HeadEntry;
 const right={...entry,id:'cth.cer.cerebellar_hemisphere.right',label:'Right cerebellar hemisphere — regional mask',representation:'mask',laterality:'right',mask:{...entry.mask!,sha256:'c'.repeat(64)}} as HeadEntry;
 const mixed:HeadStudyPlan={...plan,conceptIds:['brainstem-pons','cerebellum-left-hemisphere','cerebellum-right-hemisphere','cerebellum-vermis']};
 const f=fixture(JSON.stringify(mixed));
 try{
  f.update({entries:[entry,...Array.from({length:48},(_,i)=>({...entry,id:`other-${i}`}))],plan:null,study:{definition:{entries:[entry,left,right]}}});
  assert.deepEqual(f.savedList(),{label:'Saved anatomy concepts',items:[
   'Pons — Already in this set','Left cerebellar hemisphere — Available to add',
   'Right cerebellar hemisphere — Over the current set limit','Cerebellar vermis — Unavailable in this scan']});
  assert.equal(f.button('Add saved concepts to this set (1)').props.disabled,false);
  f.update({entries:[entry],plan:null});
  assert.deepEqual(f.savedList()?.items,[
   'Pons — Already in this set','Left cerebellar hemisphere — Available to add',
   'Right cerebellar hemisphere — Available to add','Cerebellar vermis — Unavailable in this scan']);
  assert.equal(f.button('Add saved concepts to this set (2)').props.disabled,false);
  assert.equal(f.writes,0);
  f.storage(JSON.stringify({...plan,conceptIds:['brainstem-pons']}));
  assert.deepEqual(f.savedList()?.items,['Pons — Already in this set']);
  assert.equal(f.button('Add saved concepts to this set (0)').props.disabled,true);
 }finally{f.close();}
});
test('blocked storage and retired contexts do not mutate saved or current sets',async()=>{
 const blocked=fixture(null,true);try{assert.match(blocked.text,/storage is unavailable/);assert(blocked.button('Save mapped plan').props.disabled);assert.equal(blocked.writes,0);}finally{blocked.close();}
 const f=fixture();try{const save=f.button('Save mapped plan');f.retire();save.props.onClick();assert.equal(f.writes,0);}finally{f.close();}
 const denied=fixture();try{denied.deny();denied.button('Save mapped plan').props.onClick();await denied.settle();assert.equal(denied.writes,0);assert.match(denied.text,/storage is unavailable/);}finally{denied.close();}
});
test('changed props and cross-tab races retire captured restore and save actions',()=>{
 const f=fixture(JSON.stringify(plan));try{f.update({entries:[],plan:null});const old=f.button('Add saved concepts to this set (1)');
  f.update({study:{definition:{entries:[]}}});old.props.onClick();assert.deepEqual(f.restores,[]);
  assert(f.button('Add saved concepts to this set (0)').props.disabled);
  f.update({study:{definition:{entries:[entry]}}});const beforeStorage=f.button('Add saved concepts to this set (1)');
  f.storage(null,false);beforeStorage.props.onClick();assert.deepEqual(f.restores,[]);assert.match(f.text,/changed in another tab/);
  f.storage(JSON.stringify(plan));assert.match(f.text,/1 saved concepts/);assert.equal(f.writes,0);
 }finally{f.close();}
});
test('partial mapping and full sets are explicit and never claim all entries saved',()=>{
 const f=fixture(JSON.stringify(plan));try{f.update({entries:Array.from({length:50},(_,i)=>({...entry,id:'unmapped-'+i})),plan:null});
  assert(f.button('Add saved concepts to this set (0)').props.disabled);assert.match(f.text,/0 of 50 study-set entries/);assert.match(f.text,/Unmapped entries are not saved/);assert.match(f.text,/50-item limit/);
  assert.match(f.text,/Shared-device users/);assert.match(f.text,/No scans, filenames, scores or annotations/);
 }finally{f.close();}
});
test('competing tab writes and removals compare captured bytes inside the same key lock',async()=>{
 for(const initial of [null,JSON.stringify(plan)]){
  const data=new Map<string,string>(),locks=lockQueue();
  if(initial!==null)data.set(key,initial);
  let release!:()=>void;
  const gate=new Promise<void>(resolve=>{release=resolve;});
  const held=locks.request(key,()=>gate);
  const first=fixture(null,false,{data,locks}),second=fixture(null,false,{data,locks});
  try{
   const label=initial===null?'Save mapped plan':'Remove saved plan';
   const click=(f:ReturnType<typeof fixture>)=>f.button(label).props.onClick(initial===null?undefined:{currentTarget:{closest:()=>null}});
   click(first);click(second);
   assert(first.button(label).props.disabled);assert(second.button(label).props.disabled);
   assert.equal(data.get(key)??null,initial);
   release();await held;await first.settle();await second.settle();
   assert.equal(data.has(key),initial===null);
   assert.match(second.text,/changed in another tab/);
   assert.equal(initial===null?second.writes:second.removed,1);
  }finally{second.close();first.close();}
 }
});
test('queued actions retire on changed context, storage event, or unmount',async()=>{
 for(const retirement of ['props','storage','unmount'] as const){
  const locks=lockQueue();let release!:()=>void;
  const gate=new Promise<void>(resolve=>{release=resolve;});const held=locks.request(key,()=>gate);
  const f=fixture(null,false,{locks});
  try{
   f.button('Save mapped plan').props.onClick();assert(f.button('Save mapped plan').props.disabled);
   if(retirement==='props')f.update({plan:null});
   if(retirement==='storage')f.storage(JSON.stringify(plan));
   if(retirement==='unmount')f.close();
   release();await held;
   if(retirement!=='unmount')await f.settle();
   assert.equal(f.writes,0);
  }finally{if(retirement!=='unmount')f.close();}
 }
});
test('equivalent viewer rerenders keep queued save and remove actions valid',async()=>{
  for(const initial of [null,JSON.stringify(plan)]){
    const locks=lockQueue();let release!:()=>void;
    const gate=new Promise<void>(resolve=>{release=resolve;});const held=locks.request(key,()=>gate);
    const f=fixture(initial,false,{locks});
    try{
      const label=initial===null?'Save mapped plan':'Remove saved plan';
      f.button(label).props.onClick(initial===null?undefined:{currentTarget:{closest:()=>null}});
      f.update({}); // A cursor/window change gives this child new parent props.
      f.update({entries:[entry],plan:{...plan,conceptIds:[...plan.conceptIds]}});
      release();await held;await f.settle();
      assert.equal(f.data.has(key),initial===null);
      assert.doesNotMatch(f.text,/Checking the saved plan/);
    }finally{f.close();}
  }
});
test('queued save retires after a changed context or stored value even if it returns to the original',async()=>{
  for(const change of ['plan','entries','storage'] as const){
    const locks=lockQueue();let release!:()=>void;
    const gate=new Promise<void>(resolve=>{release=resolve;});const held=locks.request(key,()=>gate);
    const f=fixture(null,false,{locks});
    try{
      f.button('Save mapped plan').props.onClick();
      if(change==='plan'){f.update({plan:null});f.update({plan:{...plan,conceptIds:[...plan.conceptIds]}});}
      if(change==='entries'){f.update({entries:[]});f.update({entries:[entry]});}
      if(change==='storage'){f.storage(JSON.stringify(plan));f.storage(null);}
      release();await held;await f.settle();
      assert.equal(f.writes,0,change);
      assert.doesNotMatch(f.text,/Checking the saved plan/,change);
      if(change!=='storage')assert.match(f.text,/cancelled/i,change);
    }finally{f.close();}
  }
});
test('unsupported Web Locks refuse mutation while read-only restore remains available',async()=>{
 const f=fixture(JSON.stringify(plan),false,{locks:null});
 try{
  f.update({entries:[],plan:null});
  f.button('Add saved concepts to this set (1)').props.onClick();
  assert.deepEqual(f.restores,[plan]);
  f.button('Remove saved plan').props.onClick({currentTarget:{closest:()=>null}});
  assert.equal(f.removed,0);assert(f.data.has(key));
  assert.match(f.text,/Safe cross-tab plan storage is unavailable/);
 }finally{f.close();}
});
test('storage write and removal failures keep the captured plan unchanged',async()=>{
 const saving=fixture(null,false,{failSet:true});
 try{saving.button('Save mapped plan').props.onClick();await saving.settle();
  assert.equal(saving.writes,0);assert(!saving.data.has(key));assert.match(saving.text,/could not be saved/);
 }finally{saving.close();}
 const removing=fixture(JSON.stringify(plan),false,{failRemove:true});
 try{removing.button('Remove saved plan').props.onClick({currentTarget:{closest:()=>null}});await removing.settle();
  assert.equal(removing.removed,0);assert(removing.data.has(key));assert.match(removing.text,/could not be removed/);
 }finally{removing.close();}
});
test('an abandoned replacement render cannot retire a queued action from the visible plan',async()=>{
 const locks=lockQueue();let release!:()=>void;
 const gate=new Promise<void>(resolve=>{release=resolve;});const held=locks.request(key,()=>gate);
 const f=fixture(null,false,{locks});
 try{
  f.button('Save mapped plan').props.onClick();
  f.abandon({study:{definition:{entries:[]}},plan:null});
  release();await held;await f.settle();
  assert.equal(f.writes,1);assert.deepEqual(JSON.parse(f.data.get(key)!),plan);
 }finally{f.close();}
});
test('actions captured from an uncommitted render refuse focus, storage and restoration',async()=>{
 const saving=fixture();let focused=0;
 try{
  saving.summary().props.ref.current={focus(){focused++;}};
  const abandoned=saving.abandon({study:{definition:{entries:[entry]}}});
  abandoned.button('Save mapped plan').props.onClick();await saving.settle();
  assert.equal(focused,0);assert.equal(saving.writes,0);
  saving.button('Save mapped plan').props.onClick();await saving.settle();
  assert.equal(focused,1);assert.equal(saving.writes,1);
 }finally{saving.close();}
 const restoring=fixture(JSON.stringify(plan));
 try{
  restoring.update({entries:[],plan:null});
  restoring.summary().props.ref.current={focus(){focused++;}};
  const abandoned=restoring.abandon({study:{definition:{entries:[entry]}}});
  abandoned.button('Add saved concepts to this set (1)').props.onClick();
  assert.equal(focused,1);assert.deepEqual(restoring.restores,[]);
  restoring.button('Add saved concepts to this set (1)').props.onClick();
  assert.equal(focused,2);assert.deepEqual(restoring.restores,[plan]);
 }finally{restoring.close();}
 const removing=fixture(JSON.stringify(plan));
 try{
  const target={currentTarget:{closest:()=>({querySelector:()=>({focus:()=>focused++})})}};
  const abandoned=removing.abandon({study:{definition:{entries:[entry]}}});
  abandoned.button('Remove saved plan').props.onClick(target);await removing.settle();
  assert.equal(focused,2);assert.equal(removing.removed,0);
  removing.button('Remove saved plan').props.onClick(target);await removing.settle();
  assert.equal(focused,3);assert.equal(removing.removed,1);
 }finally{removing.close();}
});
