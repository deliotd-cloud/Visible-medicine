import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

type Node={type:any;props:Record<string,any>};
type Effect={fn:()=>void|(()=>void);deps?:any[]};
const all=(value:any):Node[]=>Array.isArray(value)?value.flatMap(all):value?.props?[value,...all(value.props.children)]:[];
const words=(value:any):string=>Array.isArray(value)?value.map(words).join(''):value?.props?words(value.props.children):value==null?'':String(value);
const source=readFileSync(new URL('../components/RegionalMriStructureCheck.tsx',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;

function harness(){
  let cursor=0,slots:any[]=[],prepared=new Map<number,{kind:'layout'|'passive';effect:Effect}>(),installed=new Map<number,{kind:'layout'|'passive';effect:Effect;cleanup?:()=>void}>();
  let tree:Node,props:any,connected=true,focuses:string[]=[],scrolls=0;
  const hosts=new WeakMap<Node,HTMLElement>();
  const listeners=new Map<string,Set<(event:any)=>void>>();
  class HTMLElement {isConnected=true;disabled=false;name:string;constructor(name:string){this.name=name;}focus(options?:any){if(!this.isConnected)return;if(options?.preventScroll!==true)scrolls++;document.activeElement=this;focuses.push(this.name);fire(this);}}
  const body=new HTMLElement('body'),launcher=new HTMLElement('launcher'),outside=new HTMLElement('viewer control'),answer=new HTMLElement('answer'),heading=new HTMLElement('heading');
  const document={body,activeElement:body as any,addEventListener(type:string,fn:(event:any)=>void){const set=listeners.get(type)??new Set();set.add(fn);listeners.set(type,set);},removeEventListener(type:string,fn:(event:any)=>void){listeners.get(type)?.delete(fn);}};
  const fire=(target:any)=>{for(const fn of [...(listeners.get('focusin')??[])])fn({target});};
  const hooks={
    useRef(value:any){const i=cursor++;return slots[i]??={current:value};},
    useState(value:any){const i=cursor++;if(!(i in slots))slots[i]=value;return[slots[i],(next:any)=>{slots[i]=typeof next==='function'?next(slots[i]):next;}];},
    useLayoutEffect(fn:Effect['fn'],deps?:any[]){prepared.set(cursor++,{kind:'layout',effect:{fn,deps}});},
    useEffect(fn:Effect['fn'],deps?:any[]){prepared.set(cursor++,{kind:'passive',effect:{fn,deps}});},
  };
  const runtime={jsx:(type:any,props:any)=>({type,props}),jsxs:(type:any,props:any)=>({type,props})};
  const api={gradeRegionalMriStructureCheck:()=> 'incorrect',revealRegionalMriStructureCheck:()=>null,gradeRegionalMriLocationCheck:()=> 'incorrect',revealRegionalMriLocationCheck:()=>null};
  const module={exports:{} as any};
  new Function('require','module','exports','document','HTMLElement',code)((id:string)=>({'react':hooks,'react/jsx-runtime':runtime,'../lib/regional-mri-structure-check':api}[id]??assert.fail(id)),module,module.exports,document,HTMLElement);
  let counter=0;
  function context(){return{pkg:{},study:{},overlay:{},check:{key:`question-${++counter}`,revision:'synthetic',prompt:'Which annotation?',options:[{id:'wrong',label:'Distractor'},{id:'right',label:'Target'}]},location:{key:'location',revision:'synthetic',prompt:'Locate it',targetLabel:'Target'}};}
  props={...context(),retired:false,imageReady:false,annotationVisible:true,onClose:()=>{},onFocus:()=>{},onModeChange:()=>{}};
  function prepare(next?:any){if(next)props={...props,...next};cursor=0;prepared=new Map();return module.exports.RegionalMriStructureCheck(props) as Node;}
  function flush(kind:'layout'|'passive'){
    for(const [index,{kind:stage,effect}] of prepared){if(stage!==kind)continue;
      const old=installed.get(index),same=old?.kind===stage&&effect.deps&&old.effect.deps&&effect.deps.length===old.effect.deps.length&&effect.deps.every((v,i)=>Object.is(v,old.effect.deps![i]));
      if(same)continue;old?.cleanup?.();const cleanup=effect.fn();installed.set(index,{kind:stage,effect,cleanup:typeof cleanup==='function'?cleanup:undefined});
    }
  }
  function commit(value:Node,passive=true){tree=value;const title=all(tree).find(n=>n.type==='h3');if(title)title.props.ref.current=heading;
    for(const node of all(tree))if(node.type==='button')hosts.set(node,words(node)==='Distractor'?answer:new HTMLElement(words(node)));
    flush('layout');if(passive)flush('passive');}
  function render(next?:any,passive=true){const value=prepare(next);commit(value,passive);return value;}
  function replay(){for(const {cleanup} of installed.values())cleanup?.();const entries=[...installed.entries()];installed.clear();for(const [i,{kind,effect}] of entries){const cleanup=effect.fn();installed.set(i,{kind,effect,cleanup:typeof cleanup==='function'?cleanup:undefined});}}
  function unmount(){for(const {cleanup} of installed.values())cleanup?.();installed.clear();connected=false;heading.isConnected=false;}
  function button(label:string){const node=all(tree).find(n=>n.type==='button'&&words(n)===label);assert(node,label);return node;}
  function move(target:any){document.activeElement=target;fire(target);}
  return{render,prepare,commit,flush,replay,unmount,context,button,host:(node:Node)=>{const host=hosts.get(node);assert(host,'committed button host');return host;},move,body,launcher,outside,answer,heading,document,HTMLElement,focuses,scrolls:()=>scrolls,connected:()=>connected,props:()=>props};
}

test('new committed question and mode focus once when ready without scrolling; launcher focus stays eligible',()=>{
  const h=harness();h.move(h.launcher);h.render();h.render({imageReady:true});assert.deepEqual(h.focuses,['heading']);assert.equal(h.scrolls(),0);
  h.render();h.render({slice:1});assert.deepEqual(h.focuses,['heading']);
  h.render({...h.context(),imageReady:false});h.render({imageReady:true});assert.deepEqual(h.focuses,['heading','heading']);
  h.render({mode:'locate',imageReady:false});h.render({imageReady:true});assert.deepEqual(h.focuses,['heading','heading','heading']);h.unmount();
});

test('a new mode first committed while retired focuses when it becomes active and ready',()=>{
  const h=harness();h.render({retired:true,mode:'locate',imageReady:true});assert.deepEqual(h.focuses,[]);
  h.render({retired:false});assert.deepEqual(h.focuses,['heading']);h.render();assert.deepEqual(h.focuses,['heading']);h.unmount();
});

test('deliberate connected viewer-control focus during image wait prevents late heading focus',()=>{
  const h=harness();h.render();h.move(h.outside);h.render({imageReady:true});assert.deepEqual(h.focuses,[]);assert.equal(h.document.activeElement,h.outside);h.unmount();
});

test('focus on an actual committed answer between layout and passive effect prevents late focus',()=>{
  const h=harness();h.render();h.render({imageReady:true},false);const answer=h.host(h.button('Distractor'));assert.equal(answer,h.answer);h.move(answer);h.flush('passive');assert.deepEqual(h.focuses,[]);assert.equal(h.document.activeElement,answer);h.unmount();
});

test('body/document blur after launcher disables, detached targets and non-HTMLElement events do not cancel',()=>{
  for(const target of ['body','document','detached','non-element'] as const){const h=harness();h.move(h.launcher);h.render();h.launcher.disabled=true;
    if(target==='detached'){const node=new h.HTMLElement('detached');node.isConnected=false;h.move(node);}
    else if(target==='non-element')h.move({isConnected:true});
    else if(target==='document')h.move(h.document);
    else h.move(h.body);
    h.render({imageReady:true});assert.deepEqual(h.focuses,['heading'],target);h.unmount();
  }
});

test('retired, replaced, unmounted and speculative renders cannot focus late',()=>{
  const h=harness();h.render();const abandoned=h.prepare({imageReady:true});assert.deepEqual(h.focuses,[]);h.render({retired:true,imageReady:true});assert.deepEqual(h.focuses,[]);
  h.render({retired:false,imageReady:false});h.render({imageReady:true},false);h.render({...h.context(),imageReady:false});h.flush('passive');assert.deepEqual(h.focuses,[]);
  h.render({imageReady:true},false);h.unmount();h.flush('passive');assert.deepEqual(h.focuses,[]);assert(abandoned);
});

test('cancellation survives same-question rerenders and StrictMode replay; new question gets fresh intent',()=>{
  const h=harness();h.render();h.move(h.outside);h.render({imageReady:true});h.render({imageReady:false});h.render({imageReady:true});h.replay();assert.deepEqual(h.focuses,[]);
  h.render({...h.context(),imageReady:false});h.render({imageReady:true});assert.deepEqual(h.focuses,['heading']);h.render({slice:2});h.render({annotationVisible:false});h.render({annotationVisible:true});h.replay();assert.deepEqual(h.focuses,['heading']);h.unmount();
});

test('feedback rerender cannot refocus a consumed question',()=>{
  const h=harness();h.render({imageReady:true});assert.deepEqual(h.focuses,['heading']);h.move(h.answer);h.button('Distractor').props.onClick();h.render();assert.deepEqual(h.focuses,['heading']);assert.equal(h.document.activeElement,h.answer);h.unmount();
});
