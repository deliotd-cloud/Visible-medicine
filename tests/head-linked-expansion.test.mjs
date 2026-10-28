import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {atlasRuntimeExpansionModule} from './atlas-runtime-expansion-loader.mjs';
import {HEAD_SELECTION_PROTOCOL,parseHeadSelection} from '../lib/head-live-selection.ts';
import {headConceptById} from '../lib/head-atlas-links.ts';
import {projectHeadExpansionRole} from './head-linked-expansion-adoption.mjs';

const require=createRequire(new URL('../package.json',import.meta.url));
const ts=require('typescript'),jsx=require('react/jsx-runtime');
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const code=ts.transpileModule(read('components/HeadAtlasLinkedModel.tsx'),{compilerOptions:{
  module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,
}}).outputText;
const revision='f'.repeat(40),origin='https://atlas.test';
const settle=async()=>{await Promise.resolve();await Promise.resolve();};
function find(value,predicate){
  if(Array.isArray(value)){for(const part of value){const found=find(part,predicate);if(found)return found;}return;}
  if(!value||typeof value!=='object'||!('props'in value))return;
  return predicate(value)?value:find(value.props.children,predicate);
}
function events(){
  const listeners=new Map();
  return {listeners,addEventListener(name,fn){const set=listeners.get(name)||new Set();set.add(fn);listeners.set(name,set);},
    removeEventListener(name,fn){listeners.get(name)?.delete(fn);},
    fire(name,event={}){for(const fn of [...listeners.get(name)||[]])fn(event);}};
}
function harness(){
  const descriptors=new Map(['window','document','crypto'].map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)]));
  const doc={...events(),fullscreenEnabled:true,fullscreenElement:null,body:{},activeElement:null};doc.activeElement=doc.body;
  const win={...events(),location:{origin},setTimeout(fn){timers.set(++timer,fn);return timer;},clearTimeout(id){timers.delete(id);}};
  let uuid=0,timer=0,dirty=true,disposed=false,current,props={src:'/atlas-runtime/head-neck/index.html?region=head-neck',sourceRevision:revision,coverage:'coverage'};
  let tree,controlTree,frameNode,frameElement,buttonNode,release,mode='native',requests=0,exits=0,focuses=0,mounts=0;
  const timers=new Map(),sent=[],instances=[{slots:[],effects:new Map()},{slots:[],effects:new Map()}];
  for(const [name,value] of [['document',doc],['window',win],['crypto',{randomUUID:()=>`session-${++uuid}`}]] )
    Object.defineProperty(globalThis,name,{configurable:true,value});
  function renderInstance(index,render){current=instances[index];current.cursor=0;current.pending=[];return render();}
  const same=(a,b)=>!!a&&!!b&&a.length===b.length&&a.every((value,index)=>Object.is(value,b[index]));
  const hooks={
    useRef(value){const instance=current,index=instance.cursor++;if(!(index in instance.slots))instance.slots[index]={current:value};return instance.slots[index];},
    useState(value){const instance=current,index=instance.cursor++;if(!(index in instance.slots))instance.slots[index]=value;
      return [instance.slots[index],next=>{assert(!disposed,'retired component must not receive updates');const value=typeof next==='function'?next(instance.slots[index]):next;if(!Object.is(value,instance.slots[index])){instance.slots[index]=value;dirty=true;}}];},
    useLayoutEffect:createEffect,useEffect:createEffect,
  };
  function createEffect(create,deps){const instance=current,index=instance.cursor++,prior=instance.effects.get(index);
    if(!same(prior?.deps,deps))instance.pending.push(()=>{prior?.cleanup?.();const cleanup=create();instance.effects.set(index,{deps,cleanup});});}
  const comparison=function Comparison(){},teaching=function Teaching(){};
  const imports={react:hooks,'react/jsx-runtime':jsx,
    '../lib/head-live-selection':{HEAD_SELECTION_PROTOCOL,parseHeadSelection},
    '../lib/head-atlas-import':{HEAD_MANIFEST_SHA256:revision},
    '../lib/head-link-availability.ts':{headLinksCurrent:()=>true},
    '../lib/head-learning-resource-availability.ts':{headReferenceLearningAvailable:()=>true},
    './HeadAtlasComparisonNavigation':{HeadAtlasComparisonNavigation:comparison},
    './HeadAtlasReferenceTeaching':{HeadAtlasReferenceTeaching:teaching},
    './useVerifiedFacialTeaching':{FACIAL_CONCEPTS:new Set(),useVerifiedFacialTeaching:()=>false},
    './AtlasBodyLearning':{AtlasBodyLearning:function BodyLearning(){}},
    './atlas-runtime-expansion':atlasRuntimeExpansionModule,
  };
  const module={exports:{}};
  new Function('require','module','exports',code)(id=>{assert(Object.hasOwn(imports,id),id);return imports[id];},module,module.exports);
  const native=element=>{doc.fullscreenElement=element;doc.fire('fullscreenchange');};
  const owner={ownerDocument:doc,requestFullscreen(){requests++;
    if(mode==='reject')return Promise.reject(Error('denied'));
    if(mode==='pending')return new Promise(resolve=>{release=resolve;});
    if(mode==='silent')return Promise.resolve();
    native(owner);return Promise.resolve();
  }};
  doc.exitFullscreen=()=>{exits++;native(null);return Promise.resolve();};
  const button={isConnected:true,focus(){focuses++;doc.activeElement=button;}};
  const tools={closest(selector){assert.equal(selector,'main.head-comparison-module-page');return owner;}};
  function makeFrame(node){mounts++;return {...events(),isConnected:true,ownerDocument:doc,_src:node.props.src,
    contentDocument:{...events(),readyState:'complete',body:{childElementCount:1,textContent:'model'}},
    contentWindow:{location:{href:origin+node.props.src},postMessage(packet,target){assert.equal(target,origin);sent.push(packet);}},
    getAttribute(name){assert.equal(name,'src');return this._src;}};}
  function flush(patch={}){props={...props,...patch};
    for(let round=0;round<20;round++){
      dirty=false;
      tree=renderInstance(0,()=>module.exports.HeadAtlasLinkedModel(props));
      const next=find(tree,node=>node.type==='iframe');assert(next);
      if(!frameNode||frameNode.key!==next.key){if(frameElement)frameElement.isConnected=false;frameElement=makeFrame(next);}
      frameNode=next;frameElement._src=props.src;frameNode.props.ref.current=frameElement;
      const control=find(tree,node=>typeof node.type==='function'&&node.type.name==='HeadAtlasExpansionTools');assert(control);
      controlTree=renderInstance(1,()=>control.type(control.props));
      controlTree.props.ref.current=tools;buttonNode=find(controlTree,node=>node.type==='button');buttonNode.props.ref.current=button;
      for(const instance of instances)for(const create of instance.pending)create();
      if(!dirty)return;
    }
    throw Error('Unstable render');
  }
  function dispose(){if(disposed)return;for(const instance of instances)for(const effect of instance.effects.values())effect.cleanup?.();disposed=true;button.isConnected=false;}
  const api={doc,owner,button,win,sent,timers,flush,native,dispose,
    close(){dispose();for(const [name,descriptor] of descriptors){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}},
    click(){buttonNode.props.onClick();flush();},
    get frame(){return frameElement;},get frameNode(){return frameNode;},get control(){return controlTree;},get buttonNode(){return buttonNode;},
    get nav(){return find(tree,node=>node.type===comparison).props;},
    get learning(){return find(tree,node=>node.type===imports['./AtlasBodyLearning'].AtlasBodyLearning);},
    get requests(){return requests;},get exits(){return exits;},get focuses(){return focuses;},get mounts(){return mounts;},
    mode(value){mode=value;},resolve(){release();},
    deliver(data){win.fire('message',{origin,source:frameElement.contentWindow,data});flush();},
    load(){frameElement.fire('load');frameNode.props.onLoad();flush();},
  };
  flush();return api;
}

test('same-tab expansion keeps mounted iframe, live request session, selection and learning owner',async()=>{
  const h=harness();try{
    const pons=headConceptById('brainstem-pons'),q=new URL(pons.atlasHref,origin).searchParams;
    const selection={kind:'nested',id:q.get('part'),source:q.get('partSource'),laterality:q.get('part').split(':')[4],parentId:q.get('structure'),parentSource:q.get('source'),study:q.get('detail')};
    const session=h.sent.at(-1).session;
    h.deliver({type:HEAD_SELECTION_PROTOCOL,version:1,revision,session,sequence:1,status:'selected',selection});
    assert.equal(h.nav.conceptId,pons.conceptId);const frame=h.frame,bodyKey=h.frameNode.key,requests=h.sent.length;
    const learningKey=h.learning.key,learningRef=h.learning.props.frame;
    assert.equal(h.buttonNode.props['aria-pressed'],false);
    h.click();await settle();h.flush();
    assert.equal(h.buttonNode.props.children,'Restore viewer');assert.equal(h.buttonNode.props['aria-pressed'],true);
    assert.equal(h.frame,frame);assert.equal(h.frameNode.key,bodyKey);assert.equal(h.mounts,1);assert.equal(h.sent.length,requests);
    assert.equal(h.learning.key,learningKey);assert.equal(h.learning.props.frame,learningRef);
    assert.equal(h.nav.conceptId,pons.conceptId);assert.equal(h.nav.liveState,'ready');
    h.native(null);await settle();h.flush();
    assert.equal(h.buttonNode.props.children,'Expand viewer');assert.equal(h.frame,frame);assert.equal(h.sent.length,requests);
    h.deliver({type:HEAD_SELECTION_PROTOCOL,version:1,revision,session,sequence:1,status:'blocked',reason:'unavailable'});
    assert.equal(h.nav.liveState,'ready','old sequence still rejected after expansion');
    h.deliver({type:HEAD_SELECTION_PROTOCOL,version:1,revision,session,sequence:2,status:'blocked',reason:'practice'});
    assert.equal(h.nav.liveState,'practice');
  }finally{h.close();}
});

test('pending and silent requests never claim expansion before native fullscreenchange',async()=>{
  const h=harness();try{
    h.mode('pending');h.click();h.click();assert.equal(h.requests,1);
    assert.equal(h.buttonNode.props.disabled,true);assert.equal(h.buttonNode.props['aria-pressed'],false);
    h.resolve();await settle();h.flush();assert.equal(h.buttonNode.props['aria-pressed'],false);
    h.mode('silent');h.click();await settle();h.flush();assert.equal(h.buttonNode.props['aria-pressed'],false);
    h.native(h.owner);h.flush();assert.equal(h.buttonNode.props['aria-pressed'],true);
  }finally{h.close();}
});

test('unsupported, rejected and unrelated fullscreen keep a truthful recoverable control',async()=>{
  const h=harness();try{
    h.doc.fullscreenEnabled=false;h.click();assert.equal(h.requests,0);assert.match(find(h.control,node=>node.type==='p').props.children,/unavailable/);
    h.doc.fullscreenEnabled=true;const other={};h.native(other);h.click();assert.equal(h.requests,0);assert.equal(h.exits,0);
    assert.match(find(h.control,node=>node.type==='p').props.children,/Another view/);
    h.native(null);h.mode('reject');h.click();await settle();h.flush();
    assert.equal(h.buttonNode.props['aria-pressed'],false);assert.equal(h.buttonNode.props.disabled,false);
    assert.match(find(h.control,node=>node.type==='p').props.children,/could not change/);
    h.mode('native');h.click();await settle();h.flush();assert.equal(h.buttonNode.props['aria-pressed'],true);
    h.doc.exitFullscreen=()=>Promise.reject(Error('cannot exit'));
    h.click();await settle();h.flush();assert.equal(h.buttonNode.props['aria-pressed'],true,'rejected exit retains actual owned state');
    assert.equal(h.buttonNode.props.disabled,false);
  }finally{h.close();}
});

test('iframe Escape respects consumed keys, refreshes after navigation and preserves existing load reconnect',async()=>{
  const h=harness();try{
    h.click();await settle();h.flush();const old=h.frame.contentDocument;
    const consumed={key:'Escape',defaultPrevented:false};old.fire('keydown',consumed);consumed.defaultPrevented=true;
    await settle();assert.equal(h.exits,0);
    const next={...events(),readyState:'complete',body:{childElementCount:1,textContent:'next'}};
    h.frame.contentDocument=next;const before=h.sent.length;h.load();
    assert.equal(h.sent.length,before+1,'navigation keeps its original reconnect behavior');
    assert.equal(old.listeners.get('keydown').size,0);assert.equal(next.listeners.get('keydown').size,1);
    next.fire('keydown',{key:'Escape'});await settle();h.flush();
    assert.equal(h.exits,1);assert.equal(h.buttonNode.props['aria-pressed'],false);
  }finally{h.close();}
});

test('focus restores only after an owned exit with body focus and never after source retirement',async()=>{
  const h=harness();try{
    h.click();await settle();h.flush();h.native(null);await settle();h.flush();assert.equal(h.focuses,1);
    h.click();await settle();h.flush();h.doc.activeElement={};h.native(null);await settle();h.flush();assert.equal(h.focuses,1);
    h.click();await settle();h.flush();h.doc.activeElement=h.doc.body;h.native(null);
    h.flush({src:'/atlas-runtime/head-neck/index.html?region=head-neck&study=1'});
    await settle();h.flush();assert.equal(h.focuses,1,'queued focus cannot target a retired source');
    assert.equal(h.buttonNode.props['aria-pressed'],false);assert.equal(h.requests,3);
  }finally{h.close();}
});

test('revision/attempt retirement cleans fullscreen keys, preserves retry reset and does not auto-expand',async()=>{
  const h=harness();try{
    h.click();await settle();h.flush();const oldDoc=h.frame.contentDocument;
    h.flush({sourceRevision:'a'.repeat(40)});await settle();h.flush();
    assert.equal(h.exits,1);assert.equal(oldDoc.listeners.get('keydown').size,0);assert.equal(h.requests,1);
    h.flush({sourceRevision:revision});h.click();await settle();h.flush();
    h.frame.contentWindow.location.href='about:blank';h.frame.contentDocument.body={childElementCount:0,textContent:''};
    h.frameNode.props.onError();h.flush();assert.equal(typeof h.nav.onRetryOpeningModel,'function');
    h.nav.onRetryOpeningModel();h.flush();await settle();h.flush();
    assert.equal(h.mounts,2,'existing blank retry still replaces only its intended iframe attempt');
    assert.equal(h.exits,2);assert.equal(h.requests,2);assert.equal(h.buttonNode.props['aria-pressed'],false);
    assert.equal(h.nav.liveState,'connecting');
  }finally{h.close();}
});

test('pending transition and queued focus cannot update or steal focus after teardown',async()=>{
  const h=harness();try{
    h.mode('pending');h.click();h.dispose();h.native(h.owner);h.resolve();await settle();
    assert.equal(h.exits,1);assert.equal(h.focuses,0);assert.equal(h.doc.listeners.get('fullscreenchange').size,0);
    assert.equal(h.frame.listeners.get('load').size,0);
  }finally{h.close();}
  const owned=harness();try{
    owned.click();await settle();owned.flush();owned.native(null);owned.dispose();await settle();assert.equal(owned.focuses,0);
  }finally{owned.close();}
});

test('all declared additive roles recover complete authenticated originals and reject drift',()=>{
  const roles=JSON.parse(read('tests/head-linked-expansion-adoption.json'));
  for(const [path,role] of Object.entries(roles)){
    const current=read(path).replaceAll('\r\n','\n');
    const prior=projectHeadExpansionRole(path,current);
    assert.notEqual(current,prior,path);
    assert.equal(projectHeadExpansionRole(path,prior),prior,'exact baseline role remains explicitly admitted');
    assert.throws(()=>projectHeadExpansionRole(path,current+'\n// drift\n'));
    for(const seam of role.seams){
      const missing=current.replace(seam.current,'');
      if(missing===prior)assert.equal(projectHeadExpansionRole(path,missing),prior,'removing the sole addition exactly recovers the declared original');
      else assert.throws(()=>projectHeadExpansionRole(path,missing),path+' missing seam');
      assert.throws(()=>projectHeadExpansionRole(path,current+seam.current),path+' duplicated seam');
    }
  }
});

test('scoped fullscreen layout retains direct-grid children and scroll access for short viewports',()=>{
  const css=read('app/atlas/head-neck-3d/head-learning.css');require('postcss').parse(css);
  const baseline=projectHeadExpansionRole('app/atlas/head-neck-3d/head-learning.css',css.replaceAll('\r\n','\n'));
  assert(css.replaceAll('\r\n','\n').startsWith(baseline),'all previous rules remain an exact prefix');
  assert.match(css,/\.shoulder-module-page\.head-comparison-module-page:fullscreen\s*\{[^}]*display: flex;[^}]*height: 100dvh;[^}]*min-height: 0;[^}]*overflow: auto;/);
  assert.match(css,/\.head-comparison-module-page:fullscreen > \.shoulder-module-frame\s*\{[^}]*flex: 1 0 280px;[^}]*height: auto;/);
  assert.match(css,/\.head-comparison-module-page:has\(> \.head-linked-viewer-tools\) > \.atlas-body-learning-flow \{ grid-column: 1; grid-row: 5;/);
  assert.match(css,/\.head-comparison-module-page > \.head-linked-viewer-tools \{ grid-column: 1; grid-row: 6;/);
  assert.match(css,/\.head-comparison-module-page:has\(> \.head-linked-viewer-tools\) > \.shoulder-module-notes \{ grid-column: 1; grid-row: 7;/);
});
