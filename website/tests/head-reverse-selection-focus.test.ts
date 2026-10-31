import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';

const repo=process.env.REPO_ROOT??fileURLToPath(new URL('..',import.meta.url));
const require=createRequire(repo+'/package.json');
const ts=require('typescript');
const {HEAD_LINK_REVISION}=await import(pathToFileURL(repo+'/lib/head-atlas-links.ts').href);
const {HEAD_SELECTION_PROTOCOL,parseHeadSelection}=await import(pathToFileURL(repo+'/lib/head-live-selection.ts').href);
const {HEAD_FOCUS_PROTOCOL,headFocusResult}=await import(pathToFileURL(repo+'/lib/head-guided-focus.ts').href);
const {headDisclosureKeyDown}=await import(pathToFileURL(repo+'/lib/head-disclosure-keyboard.ts').href);
const {headInlineDestination,headInlineMatches,headInlineReverseConcept}=await import(pathToFileURL(repo+'/lib/head-inline-comparison.ts').href);

type Node={type:any;key?:string;props:Record<string,any>};
type Effect={kind:'layout'|'passive';create:()=>void|(()=>void);deps?:unknown[];cleanup?:()=>void};
function walk(value:any,predicate:(node:Node)=>boolean):Node|undefined{
  if(Array.isArray(value)){for(const child of value){const found=walk(child,predicate);if(found)return found;}return;}
  if(!value||typeof value!=='object'||!('props'in value))return;
  return predicate(value)?value:walk(value.props.children,predicate);
}
function label(value:any):string{return Array.isArray(value)?value.map(label).join(''):value&&typeof value==='object'&&'props'in value?label(value.props.children):String(value??'');}

function harness(){
  const source=readFileSync(process.env.COMPONENT_PATH??repo+'/components/HeadAtlasInlineComparison.tsx','utf8');
  const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const origin='https://atlas.example.test',messages=new Set<(event:any)=>void>(),sent:any[]=[],navigation:string[]=[];
  const oldWindow=Object.getOwnPropertyDescriptor(globalThis,'window'),oldCrypto=Object.getOwnPropertyDescriptor(globalThis,'crypto');
  let cursor=0,dirty=false,key:string|null=null,slots:any[]=[],committed=new Map<number,Effect>(),pending=new Map<number,Effect>();
  let tree!:Node,frameElement:any,reverseElement:any,timeout=0;
  const body={name:'body'},statusElement={isConnected:true,focusCalls:0,focus(){this.focusCalls++;document.activeElement=this;}};
  const view={listeners:new Map<string,Set<Function>>(),addEventListener(name:string,fn:Function){const set=this.listeners.get(name)??new Set();set.add(fn);this.listeners.set(name,set);},removeEventListener(name:string,fn:Function){this.listeners.get(name)?.delete(fn);},dispatch(name:string){for(const fn of this.listeners.get(name)??[])fn();}};
  const document={body,activeElement:body,visibilityState:'visible',focused:true,hasFocus(){return this.focused;},defaultView:view,listeners:new Map<string,Set<Function>>(),addEventListener(name:string,fn:Function){const set=this.listeners.get(name)??new Set();set.add(fn);this.listeners.set(name,set);},removeEventListener(name:string,fn:Function){this.listeners.get(name)?.delete(fn);},dispatch(name:string,target:unknown){for(const fn of this.listeners.get(name)??[])fn({target});}};
  const window={location:{origin},setTimeout(){return ++timeout;},clearTimeout(){},addEventListener(_name:string,fn:(event:any)=>void){messages.add(fn);},removeEventListener(_name:string,fn:(event:any)=>void){messages.delete(fn);}};
  Object.defineProperty(globalThis,'window',{configurable:true,value:window});
  Object.defineProperty(globalThis,'crypto',{configurable:true,value:{randomUUID:()=>`reverse-session-${++timeout}-abcd`}});
  const hooks={useRef(initial:unknown){const index=cursor++;return slots[index]??(slots[index]={current:initial});},useState(initial:unknown){const index=cursor++;if(!(index in slots))slots[index]=initial;return [slots[index],(next:any)=>{const value=typeof next==='function'?next(slots[index]):next;if(!Object.is(value,slots[index])){slots[index]=value;dirty=true;}}];},useLayoutEffect(create:Effect['create'],deps?:unknown[]){pending.set(cursor++,{kind:'layout',create,deps});},useEffect(create:Effect['create'],deps?:unknown[]){pending.set(cursor++,{kind:'passive',create,deps});}};
  const imports:Record<string,unknown>={react:hooks,'react/jsx-runtime':require('react/jsx-runtime'),'../lib/head-live-selection.ts':{HEAD_SELECTION_PROTOCOL,parseHeadSelection},'../lib/head-guided-focus.ts':{HEAD_FOCUS_PROTOCOL,headFocusResult},'../lib/head-disclosure-keyboard.ts':{headDisclosureKeyDown},'../lib/head-inline-comparison.ts':{headInlineDestination,headInlineMatches,headInlineReverseConcept}};
  const mod={exports:{} as {HeadAtlasInlineComparison:(props:any)=>Node}};
  new Function('require','module','exports',code)((name:string)=>{assert(Object.hasOwn(imports,name),name);return imports[name];},mod,mod.exports);
  let props={conceptId:'brainstem-pons',revision:HEAD_LINK_REVISION,modality:'MRI',selectionReady:true,onSelectConcept:(value:string)=>navigation.push(value),onClose:()=>{}};
  function cleanup(){for(const effect of committed.values())effect.cleanup?.();committed.clear();}
  function render(next=props){props=next;let rounds=0;do{
    assert(++rounds<20);dirty=false;cursor=0;pending=new Map();
    const outer=mod.exports.HeadAtlasInlineComparison(props);
    if(key!==outer.key){cleanup();key=outer.key??null;slots=[];frameElement={contentWindow:{postMessage(packet:any,target:string){assert.equal(target,origin);sent.push(packet);}}};}
    tree=(outer.type as (props:any)=>Node)(outer.props);
    const frame=walk(tree,node=>node.type==='iframe');assert(frame);frame.props.ref.current=frameElement;
    const status=walk(tree,node=>node.props.role==='status');assert(status);if(status.props.ref)status.props.ref.current=statusElement;
    const reverse=button('Show Midbrain on MRI');
    if(!reverse&&reverseElement?.isConnected){reverseElement.isConnected=false;if(document.activeElement===reverseElement)document.activeElement=body;}
    for(const kind of ['layout','passive'] as const)for(const [index,effect] of pending)if(effect.kind===kind){
      const old=committed.get(index),same=old&&effect.deps&&old.deps&&effect.deps.length===old.deps.length&&effect.deps.every((value,i)=>Object.is(value,old.deps![i]));
      if(same)continue;old?.cleanup?.();const result=effect.create();committed.set(index,{...effect,cleanup:typeof result==='function'?result:undefined});
    }
  }while(dirty);return tree;}
  function button(name:string){return walk(tree,node=>node.type==='button'&&label(node.props.children).includes(name));}
  function selected(conceptId:string,sequence:number){const d=headInlineDestination(conceptId,HEAD_LINK_REVISION,'MRI');assert(d);return {type:HEAD_SELECTION_PROTOCOL,version:1,revision:d.sourceRevision,session:String(sent.at(-1).session),sequence,status:'selected',selection:d.target};}
  function deliver(packet:unknown){for(const fn of [...messages])fn({data:packet,origin,source:frameElement.contentWindow});render();}
  function ready(){render();const frame=walk(tree,node=>node.type==='iframe')!;frame.props.onLoad({currentTarget:frameElement});render();deliver(selected('brainstem-pons',1));deliver(selected('brainstem-midbrain',2));assert(button('Show Midbrain on MRI'));}
  function click(){const reverse=button('Show Midbrain on MRI');assert(reverse);reverseElement={ownerDocument:document,isConnected:true};document.activeElement=reverseElement;reverse.props.onClick({currentTarget:reverseElement});assert.deepEqual(navigation,['brainstem-midbrain']);}
  function close(){cleanup();if(oldWindow)Object.defineProperty(globalThis,'window',oldWindow);else delete (globalThis as any).window;if(oldCrypto)Object.defineProperty(globalThis,'crypto',oldCrypto);else delete (globalThis as any).crypto;}
  return {ready,click,render,deliver,selected,close,button,document,statusElement,navigation,get props(){return props;},get reverseElement(){return reverseElement;}};
}

test('explicit reverse selection returns lost focus to the stable comparison status after exact ready commit',()=>{
  const h=harness();try{h.ready();h.click();h.render({...h.props,conceptId:'brainstem-midbrain',selectionReady:false});assert.equal(h.statusElement.focusCalls,0);
    h.deliver(h.selected('brainstem-midbrain',3));assert.equal(h.statusElement.focusCalls,0,'model can report while scan annotation is loading');
    h.render({...h.props,selectionReady:true});assert.equal(h.statusElement.focusCalls,1);assert.equal(h.document.activeElement,h.statusElement);
    h.render();assert.equal(h.statusElement.focusCalls,1);
  }finally{h.close();}
});
test('reverse request preserves focus deliberately moved elsewhere',()=>{
  const h=harness();try{h.ready();h.click();const other={};h.document.activeElement=other;h.document.dispatch('focusin',other);
    h.render({...h.props,conceptId:'brainstem-midbrain'});assert.equal(h.statusElement.focusCalls,0);assert.equal(h.document.activeElement,other);
  }finally{h.close();}
});
test('passive or mismatched destination changes never receive reverse focus',()=>{
  const h=harness();try{h.ready();h.render({...h.props,conceptId:'brainstem-midbrain'});assert.equal(h.statusElement.focusCalls,0);}finally{h.close();}
  const j=harness();try{j.ready();j.click();j.render({...j.props,conceptId:'brainstem-medulla'});j.render({...j.props,conceptId:'brainstem-midbrain'});assert.equal(j.statusElement.focusCalls,0);}finally{j.close();}
});
test('new model selection retires a pending reverse handoff',()=>{
  const h=harness();try{h.ready();h.click();h.deliver(h.selected('brainstem-pons',3));h.render({...h.props,conceptId:'brainstem-midbrain'});assert.equal(h.statusElement.focusCalls,0);}finally{h.close();}
});
test('later keyboard input and unmount retire the pending handoff',()=>{
  const h=harness();try{h.ready();h.click();h.document.dispatch('keydown',h.reverseElement);
    h.render({...h.props,conceptId:'brainstem-midbrain'});assert.equal(h.statusElement.focusCalls,0);
  }finally{h.close();}
  const j=harness();j.ready();j.click();j.close();assert.equal(j.document.listeners.get('focusin')?.size??0,0);
});

test('window blur and tab visibility changes cancel the handoff even after returning',()=>{
  for(const event of ['blur','visibilitychange']){
    const h=harness();try{h.ready();h.click();h.render({...h.props,conceptId:'brainstem-midbrain',selectionReady:false});
      if(event==='blur')h.document.defaultView.dispatch('blur');else h.document.dispatch('visibilitychange',h.document);
      h.render({...h.props,selectionReady:true});assert.equal(h.statusElement.focusCalls,0,event);
      assert.equal(h.document.defaultView.listeners.get('blur')?.size??0,0);
      assert.equal(h.document.listeners.get('visibilitychange')?.size??0,0);
    }finally{h.close();}
  }
});

test('late ready commits cannot focus an inactive or hidden document without an observed event',()=>{
  for(const state of ['hidden','unfocused']){
    const h=harness();try{h.ready();h.click();h.render({...h.props,conceptId:'brainstem-midbrain',selectionReady:false});
      if(state==='hidden')h.document.visibilityState='hidden';else h.document.focused=false;
      h.render({...h.props,selectionReady:true});assert.equal(h.statusElement.focusCalls,0,state);
      h.document.visibilityState='visible';h.document.focused=true;h.render();assert.equal(h.statusElement.focusCalls,0,'no replay on return');
    }finally{h.close();}
  }
});
