import assert from 'node:assert/strict';import test from 'node:test';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFileSync} from 'node:fs';
import {loadHeadBookmark} from './head-bookmark-ui-loader.ts';
import {HEAD_LEARNING_BOOKMARK_KEY as key,createHeadLearningBookmark} from '../lib/head-learning-bookmark.ts';
import type {HeadLearningPosition} from '../lib/head-atlas-learning.ts';
const pons={sequenceId:'brainstem',conceptId:'brainstem-pons'};
test('imaging bookmark uses explicit dark-surface text and controls, not inherited light-panel contrast',()=>{
 const css=readFileSync(new URL('../components/head-learning-bookmark.css',import.meta.url),'utf8');
 assert.match(css,/\.head-practice \.head-learning-bookmark-panel :is\(p,strong\) \{ color:#d2e4de/);
 assert.match(css,/\.head-practice \.head-learning-bookmark-panel :is\(button,a\) \{ background:#193c33; color:#e5f3ef/);
});
type Node={type:any;props:Record<string,any>};
function nodes(tree:any,predicate:(n:Node)=>boolean):Node[]{if(Array.isArray(tree))return tree.flatMap(n=>nodes(n,predicate));if(!tree?.props)return [];return [...(predicate(tree)?[tree]:[]),...nodes(tree.props.children,predicate)];}
function fixture(raw:string|null=null,position:HeadLearningPosition|undefined=pons,blocked=false,locks=true,
 resume?:{modality:'CT'|'MRI';onOpenCurrent:(position:HeadLearningPosition)=>boolean}){
 const prior=Object.getOwnPropertyDescriptor(globalThis,'window'),data=new Map<string,string>();if(raw!==null)data.set(key,raw);data.set('unrelated','retained');
 let writes=0,removes=0,index=0,dirty=true,tree:Node,failed=blocked,holdLocks=false;const state:any[]=[],effects:Array<()=>void>=[],cleanups:Array<()=>void>=[],listeners=new Map<string,Set<(event:any)=>void>>(),queue:Array<()=>void>=[];
 const window={localStorage:{getItem(k:string){if(failed)throw Error('Denied');return data.get(k)??null;},setItem(k:string,v:string){if(failed)throw Error('Full');writes++;data.set(k,v);},removeItem(k:string){if(failed)throw Error('Denied');removes++;data.delete(k);}},
  navigator:{locks:locks?{request(_name:string,callback:()=>void){return new Promise<void>((resolve,reject)=>{const run=()=>{try{callback();resolve();}catch(error){reject(error);}};if(holdLocks)queue.push(run);else run();});}}:undefined},
  addEventListener(name:string,fn:(e:any)=>void){if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name)!.add(fn);},removeEventListener(name:string,fn:(e:any)=>void){listeners.get(name)?.delete(fn);},dispatchEvent(e:any){listeners.get(e.type)?.forEach(fn=>fn(e));}};
 Object.defineProperty(globalThis,'window',{configurable:true,value:window});
 const hooks={useState(initial:any){const i=index++;if(!(i in state))state[i]=initial;return[state[i],(value:any)=>{const next=typeof value==='function'?value(state[i]):value;if(!Object.is(state[i],next)){state[i]=next;dirty=true;}}];},useRef(initial:any){const i=index++;if(!(i in state))state[i]={current:initial};return state[i];},useEffect(create:()=>()=>void){const i=index++;if(!(i in state)){state[i]=true;effects.push(()=>cleanups.push(create()));}}};
 const {HeadLearningBookmark}=loadHeadBookmark(hooks);
 const flush=()=>{let guard=0;while(dirty||effects.length){assert(++guard<15);dirty=false;index=0;tree=HeadLearningBookmark({position,...resume}) as Node;effects.splice(0).forEach(fn=>fn());}return tree!;};
 flush();
 return{data,window,get writes(){return writes;},get removes(){return removes;},get html(){return renderToStaticMarkup(flush() as any);},get tree(){return flush();},
  button(label:string){const b=nodes(flush(),n=>n.type==='button'&&n.props.children===label)[0];assert(b,label);return b;},
  link(label:string){const a=nodes(flush(),n=>n.props['aria-label']===label)[0];assert(a,label);return a;},
  setPosition(p:HeadLearningPosition){position=p;dirty=true;flush();},failStorage(){failed=true;},
  hold(){holdLocks=true;},release(){queue.splice(0).forEach(run=>run());},async settle(){await Promise.resolve();await Promise.resolve();flush();},
  close(){cleanups.forEach(fn=>fn?.());if(prior)Object.defineProperty(globalThis,'window',prior);else delete (globalThis as any).window;assert([...listeners.values()].every(set=>set.size===0));}};
}
test('bookmark is opt-in, explicit replacement, survives remount and removal preserves other storage',async()=>{
 const f=fixture();let saved:string;
 try{assert.equal(f.writes,0);assert.match(f.html,/No step saved yet/);f.button('Save this step').props.onClick();await f.settle();assert.equal(f.writes,1);
  saved=f.data.get(key)!;assert.deepEqual(JSON.parse(saved),createHeadLearningBookmark(pons));assert.equal(f.button('This step is saved').props.disabled,true);
  f.setPosition({sequenceId:'brainstem',conceptId:'brainstem-medulla'});assert.equal(f.writes,1);assert.match(f.html,/Pons/);f.button('Replace with this step').props.onClick();await f.settle();assert.equal(f.writes,2);
  f.button('Remove saved step').props.onClick();await f.settle();assert.equal(f.removes,1);assert.equal(f.data.get('unrelated'),'retained');assert.match(f.html,/Saved step removed/);
 }finally{f.close();}
 const resumed=fixture(saved!,undefined);try{assert.match(resumed.html,/Open saved Pons step in CT/);assert.match(resumed.html,/headStep=1/);assert.equal(resumed.writes,0);}finally{resumed.close();}
});
test('valid reordered bookmark fields still identify the saved step',async()=>{
 const saved=createHeadLearningBookmark(pons)!;
 const raw=JSON.stringify({sequenceRevision:saved.sequenceRevision,headRevision:saved.headRevision,
  conceptId:saved.conceptId,sequenceId:saved.sequenceId,schema:saved.schema});
 const f=fixture(raw);
 try{
  assert.match(f.html,/Open saved Pons step in CT/);
  assert.equal(f.button('This step is saved').props.disabled,true);
  assert.equal(f.writes,0);
  f.setPosition({sequenceId:'brainstem',conceptId:'brainstem-medulla'});
  assert.equal(f.button('Replace with this step').props.disabled,false);
  f.button('Replace with this step').props.onClick();await f.settle();
  assert.equal(f.writes,1);
  assert.equal(f.data.get(key),JSON.stringify(createHeadLearningBookmark({sequenceId:'brainstem',conceptId:'brainstem-medulla'})));
 }finally{f.close();}
});
test('outdated or injected bookmarks offer no links, remain removable, and are never silently rewritten',async()=>{
 for(const raw of ['{bad',JSON.stringify({...createHeadLearningBookmark(pons),headRevision:'old'}),JSON.stringify({...createHeadLearningBookmark(pons),url:'https://evil.test'})]){
  const f=fixture(raw);try{assert.match(f.html,/outdated or invalid/);assert.equal(nodes(f.tree,n=>!!n.props.href).length,0);assert.equal(f.writes,0);f.button('Remove saved step').props.onClick();await f.settle();assert.equal(f.data.has(key),false);}finally{f.close();}
 }
});
test('blocked and full storage stay usable without claiming success',async()=>{
 const blocked=fixture(null,pons,true);try{assert.match(blocked.html,/storage is unavailable/);assert.equal(blocked.button('Save this step').props.disabled,true);assert.equal(blocked.writes,0);}finally{blocked.close();}
 const full=fixture();try{full.failStorage();full.button('Save this step').props.onClick();await full.settle();assert.match(full.html,/could not be saved/);assert.equal(full.writes,0);}finally{full.close();}
});
test('cross-tab updates and clearing update labels without writes; listeners clean up',()=>{
 const f=fixture();try{f.data.set(key,JSON.stringify(createHeadLearningBookmark(pons)));f.window.dispatchEvent({type:'storage',key});assert.match(f.html,/Open saved Pons step/);assert.equal(f.writes,0);
  f.data.delete(key);f.window.dispatchEvent({type:'storage',key:null});assert.match(f.html,/No step saved yet/);
 }finally{f.close();}
});
test('stale save and removal refuse newer bytes before a storage notification',async()=>{
 const newer=JSON.stringify(createHeadLearningBookmark({sequenceId:'brainstem',conceptId:'brainstem-medulla'}));
 const old=JSON.stringify(createHeadLearningBookmark(pons));
 const save=fixture(old,{sequenceId:'brainstem',conceptId:'brainstem-medulla'});
 try{save.data.set(key,newer);save.button('Replace with this step').props.onClick();await save.settle();
  assert.equal(save.writes,0);assert.equal(save.data.get(key),newer);assert.match(save.html,/changed in another tab/);
 }finally{save.close();}
 const remove=fixture(old);
 try{remove.data.set(key,newer);remove.button('Remove saved step').props.onClick();await remove.settle();
  assert.equal(remove.removes,0);assert.equal(remove.data.get(key),newer);assert.match(remove.html,/Open saved Medulla/);
 }finally{remove.close();}
});
test('queued mutations retire on position and storage changes, while equivalent renders retain their command',async()=>{
 const medulla={sequenceId:'brainstem',conceptId:'brainstem-medulla'};
 const f=fixture();try{
  f.hold();f.button('Save this step').props.onClick();f.button('Save this step').props.onClick();
  assert.equal(f.button('Save this step').props.disabled,true);
  f.setPosition(medulla);f.release();await f.settle();assert.equal(f.writes,0);
  assert.match(f.html,/bookmark action was cancelled/);assert.doesNotMatch(f.html,/Checking the saved step/);
 }finally{f.close();}
 const equivalent=fixture();try{
  equivalent.hold();equivalent.button('Save this step').props.onClick();equivalent.setPosition({...pons});
  equivalent.release();await equivalent.settle();assert.equal(equivalent.writes,1);
 }finally{equivalent.close();}
 const changedRaw=fixture();try{
  changedRaw.hold();changedRaw.button('Save this step').props.onClick();
  changedRaw.data.set(key,JSON.stringify(createHeadLearningBookmark(medulla)));
  changedRaw.window.dispatchEvent({type:'storage',key});changedRaw.release();await changedRaw.settle();
  assert.equal(changedRaw.writes,0);assert.match(changedRaw.html,/Open saved Medulla/);
 }finally{changedRaw.close();}
});
test('queued removal and save retire after unmount; double clicks produce one mutation',async()=>{
 const old=JSON.stringify(createHeadLearningBookmark(pons));
 const remove=fixture(old);remove.hold();remove.button('Remove saved step').props.onClick();remove.button('Remove saved step').props.onClick();
 remove.close();remove.release();await remove.settle();assert.equal(remove.removes,0);
 const save=fixture();save.hold();save.button('Save this step').props.onClick();save.button('Save this step').props.onClick();
 save.release();await save.settle();assert.equal(save.writes,1);save.close();
});
test('without Web Locks mutation fails with explanation and saved resume links remain',async()=>{
 const old=JSON.stringify(createHeadLearningBookmark(pons));
 const f=fixture(old,{sequenceId:'brainstem',conceptId:'brainstem-medulla'},false,false);
 try{assert.match(f.html,/Open saved Pons step in CT/);
  f.button('Replace with this step').props.onClick();f.button('Remove saved step').props.onClick();await f.settle();
  assert.equal(f.writes,0);assert.equal(f.removes,0);assert.equal(f.data.get(key),old);
  assert.match(f.html,/Safe cross-tab bookmark storage is unavailable/);
  assert.match(f.html,/Open saved Pons step in CT/);
 }finally{f.close();}
});
test('saved destinations keep modality limits, client routing without prefetch, and no native folder data',()=>{
 const f=fixture(JSON.stringify(createHeadLearningBookmark({sequenceId:'brainstem',conceptId:'brainstem-pons'})));
 try{const anchors=nodes(f.tree,n=>!!n.props.href);assert.equal(anchors.length,3);for(const n of anchors){assert(n.props.href.startsWith('/atlas/'));assert(!/file|patient|score|answer/i.test(n.props.href));if(n.type!=='a')assert.equal(n.props.prefetch,false);}
  assert.match(f.html,/No scans, scores or completion saved/);assert.match(f.html,/Shared-device users/);
 }finally{f.close();}
});
test('same-modality saved step invokes validated in-view callback; other links keep normal navigation',()=>{
 const raw=JSON.stringify(createHeadLearningBookmark(pons)),opened:HeadLearningPosition[]=[];
 const f=fixture(raw,{sequenceId:'brainstem',conceptId:'brainstem-medulla'},false,true,{modality:'MRI',onOpenCurrent:position=>{opened.push(position);return true;}});
 const click=(label:string,extra:Record<string,unknown>={})=>{
  const event:any={button:0,defaultPrevented:false,metaKey:false,ctrlKey:false,shiftKey:false,altKey:false,
   currentTarget:{target:'',hasAttribute:()=>false},preventDefault(){this.defaultPrevented=true;},...extra};
  f.link(label).props.onClick(event);return event.defaultPrevented;
 };
 try{
  assert.equal(click('Open saved Pons step in MRI'),true);
  assert.deepEqual(opened,[pons]);assert.match(f.link('Open saved Pons step in MRI').props.href,/headStep=1/);
  assert.equal(click('Open saved Pons step in CT'),false,'other modality follows its real link');
  assert.deepEqual(opened,[pons]);
  for(const extra of [{ctrlKey:true},{metaKey:true},{shiftKey:true},{altKey:true},{button:1},
   {currentTarget:{target:'_blank',hasAttribute:()=>false}},
   {currentTarget:{target:'',hasAttribute:(name:string)=>name==='download'}}]){
   assert.equal(click('Open saved Pons step in MRI',extra),false);
  }
  assert.deepEqual(opened,[pons]);
 }finally{f.close();}
});
test('saved-step callback only prevents default when accepted and refuses stale, invalid or retired data',()=>{
 const raw=JSON.stringify(createHeadLearningBookmark(pons)),opened:HeadLearningPosition[]=[];
 const makeEvent=()=>({button:0,defaultPrevented:false,metaKey:false,ctrlKey:false,shiftKey:false,altKey:false,
  currentTarget:{target:'',hasAttribute:()=>false},preventDefault(){this.defaultPrevented=true;}});
 const declined=fixture(raw,pons,false,true,{modality:'CT',onOpenCurrent:position=>{opened.push(position);return false;}});
 try{const event=makeEvent();declined.link('Open saved Pons step in CT').props.onClick(event);assert.equal(event.defaultPrevented,false);assert.deepEqual(opened,[pons]);}finally{declined.close();}
 const stale=fixture(raw,pons,false,true,{modality:'CT',onOpenCurrent:position=>{(opened as HeadLearningPosition[]).push(position);return true;}});
 let closed=false;
 try{
  const old=stale.link('Open saved Pons step in CT');
  stale.data.set(key,JSON.stringify(createHeadLearningBookmark({sequenceId:'brainstem',conceptId:'brainstem-medulla'})));
  const event=makeEvent();old.props.onClick(event);assert.equal(event.defaultPrevented,true);
  assert.deepEqual(opened,[pons]);assert.match(stale.html,/saved step changed/i);
  const retired=stale.link('Open saved Medulla oblongata step in CT');stale.close();closed=true;
  const afterClose=makeEvent();retired.props.onClick(afterClose);assert.equal(afterClose.defaultPrevented,true);
  assert.deepEqual(opened,[pons]);
 }finally{if(!closed)stale.close();}
 for(const invalid of [null,'{bad',JSON.stringify({...createHeadLearningBookmark(pons),headRevision:'stale'})]){
  const f=fixture(invalid,pons,false,true,{modality:'CT',onOpenCurrent:position=>{(opened as HeadLearningPosition[]).push(position);return true;}});
  try{assert.equal(nodes(f.tree,n=>!!n.props.href).length,0);}finally{f.close();}
 }
 assert.deepEqual(opened,[pons]);
});
test('Escape closes bookmark disclosure and returns focus',()=>{
 const f=fixture();try{let focus=0,prevent=0;const el={open:true,querySelector:()=>({focus:()=>focus++})};f.tree.props.onKeyDown({key:'Escape',currentTarget:el,preventDefault:()=>prevent++,stopPropagation:()=>{}});assert.equal(el.open,false);assert.equal(focus,1);assert.equal(prevent,1);}finally{f.close();}
});
