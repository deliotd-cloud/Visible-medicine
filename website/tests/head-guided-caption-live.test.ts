import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

// Run against the immutable candidate's dependencies while loading the overlay component.
const base=process.env.HEAD_GUIDED_TEST_BASE??fileURLToPath(new URL('../',import.meta.url));
const require=createRequire(join(base,'package.json'));
const ts=require('typescript');
const {headLearningLinks}=await import(pathToFileURL(join(base,'lib/head-atlas-learning.ts')).href);
const focus=await import(pathToFileURL(join(base,'lib/head-guided-focus.ts')).href);
const selection=await import(pathToFileURL(join(base,'lib/head-live-selection.ts')).href);
const playback=await import(pathToFileURL(join(base,'lib/head-guided-playback.ts')).href);
const source=readFileSync(process.env.HEAD_GUIDED_COMPONENT_SOURCE??new URL('../components/HeadAtlasGuidedModel.tsx',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
type Node={type:any;props:Record<string,any>};
const href=(conceptId:string)=>{const value=headLearningLinks({sequenceId:'brainstem',conceptId})?.atlasHref;assert(value);return value;};
const first=href('brainstem-midbrain'),second=href('brainstem-pons');
const revision='f'.repeat(40),manifest='a'.repeat(64),origin='https://atlas.example.test';

test('live teaching follows only confirmed transitions and retires on waiting, blocked and divergence',()=>{
  const sent:any[]=[],listeners=new Map<string,Set<(event:any)=>void>>();
  let currentHref=first,uuid=0;
  const location={origin,get pathname(){return new URL(currentHref,origin).pathname;},get search(){return new URL(currentHref,origin).search;},get hash(){return '';},assign:()=>assert.fail('unexpected navigation')};
  const history={state:null,pushState(_state:any,_unused:string,href:string){currentHref=href;}};
  const timers=new Map<number,()=>void>();let timerId=0;
  const mockWindow={location,history,setTimeout(fn:()=>void){timers.set(++timerId,fn);return timerId;},clearTimeout(id:number){timers.delete(id);},
    addEventListener(name:string,fn:(event:any)=>void){if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name)!.add(fn);},
    removeEventListener(name:string,fn:(event:any)=>void){listeners.get(name)?.delete(fn);}};
  const oldWindow=(globalThis as any).window,oldCrypto=Object.getOwnPropertyDescriptor(globalThis,'crypto');
  Object.defineProperty(globalThis,'window',{configurable:true,value:mockWindow});
  Object.defineProperty(globalThis,'crypto',{configurable:true,value:{randomUUID:()=>`test-session-${++uuid}-abcd`}});
  const contentWindow={postMessage(packet:any){sent.push(packet);}};
  const slots:any[]=[],effects=new Map<number,{deps?:unknown[];cleanup?:()=>void}>();let cursor=0,dirty=true,tree:Node,frame:Node,disposed=false;
  const pending:Array<()=>void>=[];const same=(a?:unknown[],b?:unknown[])=>!!a&&!!b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
  const hooks={
    useState(initial:any){const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],(next:any)=>{if(!Object.is(slots[i],next)){slots[i]=next;dirty=true;}}];},
    useRef(initial:any){const i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i];},
    useLayoutEffect(create:()=>void|(()=>void)){const i=cursor++,old=effects.get(i);pending.push(()=>{old?.cleanup?.();const cleanup=create();effects.set(i,{deps:[],cleanup:typeof cleanup==='function'?cleanup:undefined});});},
    useEffect(create:()=>void|(()=>void),deps?:unknown[]){const i=cursor++,old=effects.get(i);if(!same(old?.deps,deps))pending.push(()=>{old?.cleanup?.();const cleanup=create();effects.set(i,{deps,cleanup:typeof cleanup==='function'?cleanup:undefined});});},
  };
  const navigation=()=>null,teaching=()=>null;
  const imports:Record<string,any>={react:hooks,'react/jsx-runtime':require('react/jsx-runtime'),
    './HeadAtlasLearningNavigation':{HeadAtlasLearningNavigation:navigation},'./HeadAtlasReferenceTeaching':{HeadAtlasReferenceTeaching:teaching},
    './HeadTourPlayback':{HeadTourPlayback:()=>null},'./AtlasBodyLearning':{AtlasBodyLearning:()=>null},
    '../lib/head-guided-playback':playback,'../lib/head-atlas-import':{HEAD_MANIFEST_SHA256:manifest},
    '../lib/head-link-availability':{headLinksCurrent:()=>true},'../lib/head-live-selection':selection,'../lib/head-guided-focus':focus};
  const mod={exports:{} as {HeadAtlasGuidedModel:(props:any)=>Node}};
  new Function('require','module','exports',code)((id:string)=>{assert(Object.hasOwn(imports,id),id);return imports[id];},mod,mod.exports);
  function walk(value:any,predicate:(node:Node)=>boolean):Node|undefined{
    if(Array.isArray(value)){for(const child of value){const found=walk(child,predicate);if(found)return found;}return;}
    if(!value||typeof value!=='object'||!('props'in value))return;
    const node=value as Node;return predicate(node)?node:walk(node.props.children,predicate);
  }
  function flush(){let loops=0;do{assert(++loops<20);dirty=false;cursor=0;pending.length=0;
    tree=mod.exports.HeadAtlasGuidedModel({initialHref:first,sourceRevision:revision,coverage:'Coverage'});
    frame=walk(tree,n=>n.type==='iframe')!;assert(frame);frame.props.ref.current={contentWindow,parentElement:{querySelector:()=>null}};
    for(const effect of pending)effect();
  }while(dirty);}
  const nav=()=>walk(tree,n=>n.type===navigation)!.props;
  const live=()=>{const region=walk(nav().status,n=>n.props['aria-live']==='polite');assert(region,'persistent polite live region');return region.props.children;};
  const caption=()=>walk(nav().status,n=>n.type===teaching&&n.props.compact);
  const emit=(conceptId:string,anatomy:string,expectedRevision=manifest)=>{
    const callback=caption()?.props.onCompactNote;assert.equal(typeof callback,'function');
    callback({conceptId,revision:expectedRevision,label:conceptId==='brainstem-pons'?'Pons':'Midbrain',anatomy});flush();
  };
  const readyNotice=()=>walk(nav().status,n=>n.type==='p'&&n.props.children==='Model selection matches this step.')?.props.role;
  const session=()=>sent.filter(p=>p.type===selection.HEAD_SELECTION_PROTOCOL+'-request').at(-1)?.session;
  const deliver=(data:any)=>{for(const fn of listeners.get('message')??[])fn({data,source:contentWindow,origin});flush();};
  const selected=(conceptId:string,sequence:number)=>({type:selection.HEAD_SELECTION_PROTOCOL,version:1,revision,session:session(),sequence,status:'selected',selection:focus.headGuidedDestination(href(conceptId))!.target});
  const command=()=>sent.filter(p=>p.type===focus.HEAD_FOCUS_PROTOCOL).at(-1)?.command;
  const ack=(number:number)=>({type:focus.HEAD_FOCUS_PROTOCOL+'-result',version:1,revision,session:session(),command:number,status:'accepted'});
  try{
    flush();assert.equal(live(),'','persistent region starts empty');
    deliver(selected('brainstem-midbrain',1));emit('brainstem-midbrain','The midbrain is the rostral brainstem.');assert.match(live(),/Step 1.*Midbrain.*rostral brainstem/);assert.equal(readyNotice(),undefined);
    const initial=live(),priorCallback=caption()?.props.onCompactNote;assert.equal(typeof priorCallback,'function');
    deliver(selected('brainstem-midbrain',2));assert.equal(live(),initial,'repeat confirmation stays silent');
    assert.equal(nav().onNavigate(second),true);flush();assert.equal(live(),'','pending focus retires prior note');
    priorCallback({conceptId:'brainstem-midbrain',revision:manifest,label:'Midbrain',anatomy:'Unconfirmed note must stay silent.'});flush();assert.equal(live(),'');
    deliver(selected('brainstem-pons',3));assert.equal(live(),'','matching snapshot before acknowledgement cannot announce');
    deliver(ack(command()));assert.equal(live(),'','acknowledgement alone cannot announce');
    deliver(selected('brainstem-pons',4));assert.equal(nav().comparisonReady,true,'second exact selection confirms');emit('brainstem-pons','The dorsal pons contributes to the floor of the fourth ventricle.');assert.match(live(),/Step 2.*Pons.*fourth ventricle/);
    const next=live(),secondCallback=caption()?.props.onCompactNote;assert.equal(typeof secondCallback,'function');
    deliver(selected('brainstem-pons',5));assert.equal(live(),next,'same confirmed step is stable');
    deliver(selected('brainstem-midbrain',6));assert.equal(live(),'','divergent model selection retires caption');
    secondCallback({conceptId:'brainstem-pons',revision:manifest,label:'Pons',anatomy:'Stale note must stay silent.'});flush();assert.equal(live(),'');
    deliver({type:selection.HEAD_SELECTION_PROTOCOL,version:1,revision,session:session(),sequence:7,status:'blocked',reason:'practice'});assert.equal(live(),'');
    deliver(selected('brainstem-pons',8));emit('brainstem-pons','The dorsal pons contributes to the floor of the fourth ventricle.');assert.match(live(),/fourth ventricle/,'current step may be confirmed again after practice');
    deliver({type:selection.HEAD_SELECTION_PROTOCOL+'-ready',version:1,revision});assert.equal(live(),'','new source session retires announcement');
  }finally{
    for(const effect of effects.values())effect.cleanup?.();disposed=true;
    if(oldWindow===undefined)delete (globalThis as any).window;else Object.defineProperty(globalThis,'window',{configurable:true,value:oldWindow});
    if(oldCrypto)Object.defineProperty(globalThis,'crypto',oldCrypto);else delete (globalThis as any).crypto;
    assert(disposed);
  }
});
