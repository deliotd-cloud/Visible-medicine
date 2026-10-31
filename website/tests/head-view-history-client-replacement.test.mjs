import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import * as links from '../lib/head-atlas-links.ts';
import * as navigation from '../lib/head-atlas-navigation.ts';
import * as imageLinks from '../lib/head-image-only-links.ts';
import * as viewport from '../lib/head-slice-viewport.ts';
import {headIndexKey,headIndexTabStop} from '../lib/head-index-keyboard.ts';
import {headDisclosureKeyDown} from '../lib/head-disclosure-keyboard.ts';
import {headMaskHits} from '../lib/head-mask-picking.ts';
import {focusImagingPane} from '../lib/imaging-pane-focus.ts';
import {createHeadFolderSession} from '../lib/head-folder-session.ts';
import {headViewHistory,HEAD_VIEW_ENTRY_KEY} from '../lib/head-view-history.ts';
import {AppBrowserHistoryController} from '../node_modules/vinext/dist/server/app-browser-history-controller.js';
import {createExternalHistoryStatePreservingMetadata,isAppOwnedHistoryState,readHistoryStateTraversalIndex} from '../node_modules/vinext/dist/server/app-history-state.js';

const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const ctPons={id:'cth.bst.pons',label:'Pons — regional mask',family:'bst',color:[1,0,0],representation:'partial-mask',laterality:'midline_or_unpaired',opacity:{fill:.3,outline:1}};
const ctMidbrain={...ctPons,id:'cth.bst.midbrain',label:'Midbrain — regional mask'};
const mriPons={...ctPons,id:'mrb.bst.pons'};
const definition=(modality)=>({image:{shape_kji:modality==='CT'?[3,3,100]:[3,3,200],sha256:(modality==='CT'?'a':'b').repeat(64),file:`${modality}/native.nii`,dtype:'int16'},entries:modality==='CT'?[ctPons,ctMidbrain]:[mriPons]});
const packageFixture=(configured=false)=>({manifest:{studies:{CT:definition('CT'),MRI:definition('MRI')}},files:new Map(),...(configured?{source:'configured-local'}:{})});
const nativeStudy=(pkg,modality)=>({definition:pkg.manifest.studies[modality],geometry:{shapeKJI:[...pkg.manifest.studies[modality].image.shape_kji],views:{axial:{fixedAxisIJK:2},coronal:{fixedAxisIJK:1},sagittal:{fixedAxisIJK:0}},rasToIjk:point=>point},range:[0,100],data:new Int16Array(0)});
const focusFor=entry=>entry.id.includes('midbrain')?[20,1,1]:entry.id.startsWith('mrb.')?[145,1,1]:[67,1,1];

function browser(initial,loopback=false){
  const origin=loopback?'http://127.0.0.1:3000':'https://example.test',stack=[{href:initial,state:{__NA:true,tree:{slot:'head'},nextInternal:17}}];let index=0;
  const listeners=new Set(),location={origin,hostname:'example.test',pathname:'',search:'',hash:''};
  location.hostname=loopback?'127.0.0.1':'example.test';
  function set(href){const url=new URL(href,origin);location.href=url.href;location.pathname=url.pathname;location.search=url.search;location.hash=url.hash;}
  set(initial);
  const history={get state(){return stack[index].state;},pushState(state,_unused,href){stack.splice(++index);stack.push({href,state:structuredClone(state)});set(href);},replaceState(state,_unused,href){stack[index]={href:href??stack[index].href,state:structuredClone(state)};set(stack[index].href);},back(){if(index>0){set(stack[--index].href);for(const listener of listeners)listener();}},forward(){if(index<stack.length-1){set(stack[++index].href);for(const listener of listeners)listener();}}};
  const window={location,history,addEventListener(name,listener){if(name==='popstate')listeners.add(listener);},removeEventListener(name,listener){if(name==='popstate')listeners.delete(listener);}};
  return {window,history,stack,location,get index(){return index;},link(href){history.pushState({...history.state},'',href);}};
}

function vinextBrowser(initial){
  const origin='https://example.test',stack=[{href:initial,state:{__NA:true,__vinext_historyIndex:4,tree:{slot:'head'}}}];let index=0;
  const listeners=new Set(),location={origin,hostname:'example.test',pathname:'',search:'',hash:''};
  const set=href=>{const url=new URL(href,origin);location.pathname=url.pathname;location.search=url.search;location.hash=url.hash;};set(initial);
  const current=()=>stack[index].state;
  const rawPush=(state,href)=>{stack.splice(++index);stack.push({href,state:structuredClone(state)});set(href);};
  const rawReplace=(state,href)=>{stack[index]={href:href??stack[index].href,state:structuredClone(state)};set(stack[index].href);};
  const controller=new AppBrowserHistoryController({initialHistoryState:current(),maxHistoryStateSnapshots:8,
    readHistoryState:current,readCurrentHref:()=>new URL(stack[index].href,origin).href,
    pushHistoryState:rawPush,replaceHistoryState:rawReplace,readVisibleNavigationMetadata:()=>null});
  controller.rememberHistoryStateSnapshot({navigationSnapshot:{params:{}}});
  const history={get state(){return current();},pushState(data,_unused,href){
    const previous=current();
    if(isAppOwnedHistoryState(data)){rawPush(data,href);controller.commitAppOwnedHistoryStateWrite('push',previous);return;}
    rawPush(createExternalHistoryStatePreservingMetadata(data,previous),href);controller.claimCurrentHistoryTreeSnapshot('push',previous);
  },replaceState(data,_unused,href){
    const previous=current();
    if(isAppOwnedHistoryState(data)){rawReplace(data,href);controller.commitAppOwnedHistoryStateWrite('replace',previous);return;}
    rawReplace(createExternalHistoryStatePreservingMetadata(data,previous),href);controller.claimCurrentHistoryTreeSnapshot('replace',previous);
  },back(){if(index>0){set(stack[--index].href);controller.commitTraversalIndexFromHistoryState(current());for(const listener of listeners)listener();}},
    forward(){if(index<stack.length-1){set(stack[++index].href);controller.commitTraversalIndexFromHistoryState(current());for(const listener of listeners)listener();}}};
  const window={location,history,addEventListener(name,listener){if(name==='popstate')listeners.add(listener);},removeEventListener(name,listener){if(name==='popstate')listeners.delete(listener);}};
  return {window,history,stack,location,controller,get index(){return index;}};
}

function mount(browserState,{modality='CT',session,pkg,deferEntry=false}){
  const priorWindow=globalThis.window,priorDocument=globalThis.document;
  const priorElement=globalThis.Element,priorAnchor=globalThis.HTMLAnchorElement;
  const documentClicks=new Set();
  class TestElement {closest(selector){assert.equal(selector,'a[href]');return this;}}
  class TestAnchor extends TestElement {
    constructor(href){super();this.href=href;this.target='';}
    hasAttribute(name){assert.equal(name,'download');return false;}
  }
  globalThis.window=browserState.window;
  globalThis.Element=TestElement;globalThis.HTMLAnchorElement=TestAnchor;
  globalThis.document={
    addEventListener(name,listener,capture){assert.equal(name,'click');assert.equal(capture,true);documentClicks.add(listener);},
    removeEventListener(name,listener,capture){assert.equal(name,'click');assert.equal(capture,true);assert(documentClicks.delete(listener),'registered click guard removed');},
  };
  const clickLink=href=>{
    const event={target:new TestAnchor(href),button:0,defaultPrevented:false,
      metaKey:false,ctrlKey:false,shiftKey:false,altKey:false,
      preventDefault(){this.defaultPrevented=true;}};
    for(const listener of documentClicks)listener(event);
    return event;
  };
  const slots=[],effects=new Map(),layouts=new Map(),entryRequests=[];let cursor=0,dirty=true,pending=[],pendingLayout=[],tree,active=false,disposed=false;
  const equal=(a,b)=>!!a&&a.length===b.length&&a.every((value,index)=>Object.is(value,b[index]));
  const hooks={
    useState(initial){const slot=cursor++;if(!(slot in slots))slots[slot]=typeof initial==='function'?initial():initial;return [slots[slot],value=>{if(disposed)return;const next=typeof value==='function'?value(slots[slot]):value;if(!Object.is(next,slots[slot])){slots[slot]=next;dirty=true;}}];},
    useRef(initial){const slot=cursor++;if(!(slot in slots))slots[slot]={current:initial};return slots[slot];},
    useMemo(create,deps){const slot=cursor++,old=slots[slot];if(!equal(old?.deps,deps))slots[slot]={deps,value:create()};return slots[slot].value;},
    useEffect(create,deps){const slot=cursor++,old=effects.get(slot);if(!equal(old?.deps,deps))pending.push(()=>{old?.cleanup?.();const cleanup=create();effects.set(slot,{deps,cleanup:typeof cleanup==='function'?cleanup:undefined});});},
    useLayoutEffect(create,deps){const slot=cursor++,old=layouts.get(slot);if(!equal(old?.deps,deps))pendingLayout.push(()=>{old?.cleanup?.();const cleanup=create();layouts.set(slot,{deps,cleanup:typeof cleanup==='function'?cleanup:undefined});});},
  };
  const practice={get active(){return active;},finished:false,results:[],originalResults:null,mode:'locate',outcome:null,target:null,pick:null,clearPendingPick(){},end(){active=false;this.finished=false;this.results=[];dirty=true;},startTarget(){active=true;dirty=true;return true;},startTargets(){active=true;dirty=true;return true;}};
  const imports={HEAD_MANIFEST_SHA256:HEAD_LINK_REVISION,openLocalHeadPackage:async()=>pkg,canReuseHeadMask:()=>false,
    loadHeadStudy:async()=>nativeStudy(pkg,modality),
    loadHeadEntry:(_pkg,_study,entry,signal)=>deferEntry?new Promise((resolve,reject)=>entryRequests.push({entry,signal,resolve,reject})):Promise.resolve({entry,mask:new Uint8Array(0),focus:focusFor(entry)})};
  const overlays={groupHeadOverlays:()=>[],headOverlayBytes:()=>0,HEAD_OVERLAY_BYTE_LIMIT:268435456,layoutHeadLabels:()=>({labels:[],omitted:0}),visibleHeadOverlays:()=>[]};
  const load=name=>name==='react'?hooks:name==='next/link'?{default:'a'}:name==='./HeadFolderSessionContext'?{useHeadFolderSession:()=>session}:
    name==='../lib/head-atlas-import'?imports:name==='../lib/head-local-source'?{openConfiguredHeadPackage:async()=>pkg}:
    name==='../lib/head-atlas-links'?links:name==='../lib/head-atlas-navigation'?navigation:
    name==='../lib/head-atlas-overlays'?overlays:name==='../lib/head-atlas-display'?{...require('../lib/head-atlas-display.ts'),headLabel:item=>item.label,annotationInk:()=>''}:
    name==='../lib/head-atlas-practice'?{...require('../lib/head-atlas-practice.ts'),canvasVoxel:()=>null}:
    name==='../lib/head-mask-picking'?{headMaskHits}:name==='../lib/imaging-pane-focus'?{focusImagingPane}:name==='../lib/head-slice-viewport'?viewport:name==='../lib/head-index-keyboard'?{headIndexKey,headIndexTabStop}:
    name==='../lib/head-atlas-index'?require('../lib/head-atlas-index.ts'):name==='../lib/head-atlas-pairs'?require('../lib/head-atlas-pairs.ts'):
    name==='../lib/head-overlay-loading'?{loadHeadOverlayMasks:async()=>[]}:
    name==='../lib/slice-wheel.mjs'?{bindSliceWheel:()=>()=>{}}:name==='../lib/head-image-only-links'?imageLinks:
    name==='../lib/head-load-progress'?require('../lib/head-load-progress.ts'):
    name==='../lib/head-window-drag'?require('../lib/head-window-drag.ts'):
    name==='../lib/head-viewport-memory'?require('../lib/head-viewport-memory.ts'):
    name==='../lib/head-study-plan'?require('../lib/head-study-plan.ts'):
    name==='../lib/head-study-set'?require('../lib/head-study-set.ts'):
    name==='../lib/head-review-study-set'?require('../lib/head-review-study-set.ts'):
    name==='../lib/head-tour-study-set'?require('../lib/head-tour-study-set.ts'):
    name==='../lib/head-study-comparison'?require('../lib/head-study-comparison.ts'):
    name==='../lib/head-related-learning'?require('../lib/head-related-learning.ts'):
    name==='../lib/head-atlas-learning'?require('../lib/head-atlas-learning.ts'):
    name==='../lib/head-atlas-focus'?require('../lib/head-atlas-focus.ts'):
    name==='../lib/head-atlas-slice-controls'?require('../lib/head-atlas-slice-controls.ts'):
    name==='./LearningResourceStatus.ts'?require('../components/LearningResourceStatus.ts'):
    name==='./HeadImageLayoutControl'?{HeadImageLayoutControl:function HeadImageLayoutControl(){}}:
    name==='./ImagingAtlasShell'?{ImagingAtlasShell:function ImagingAtlasShell(){}}:
    name==='./AtlasIssueDetails'?{AtlasIssueDetails:function AtlasIssueDetails(){}}:
    name==='./HeadAtlasPractice'?{HeadAtlasPractice:function HeadAtlasPractice(){},useHeadAtlasPractice:()=>practice}:
    name==='./HeadFolderSharing'?{HeadFolderSharing:function HeadFolderSharing(){}}:
    name.startsWith('./Head')?{[name.slice(2)]:function Stub(){},default:function Stub(){}}:
    name==='../lib/head-disclosure-keyboard'?{headDisclosureKeyDown}:
    name.endsWith('.css')?{}:require(name);
  const mod={exports:{}};new Function('require','module','exports',compiled)(load,mod,mod.exports);
  function flush(){let passes=0;do{assert(++passes<35,'viewer effects settle');dirty=false;cursor=0;pending=[];pendingLayout=[];tree=mod.exports.HeadAtlasViewer({modality});for(const effect of pendingLayout)effect();for(const effect of pending)effect();}while(dirty);return tree;}
  async function settle(){await Promise.resolve();await Promise.resolve();return flush();}
  function walk(value,visit){if(Array.isArray(value)){for(const child of value){const found=walk(child,visit);if(found)return found;}return;}if(!value||typeof value!=='object'||!('props'in value))return;const node=value;if(visit(node))return node;for(const key of ['children','sidebar','info','actions','toolbar','comparison']){const found=walk(node.props[key],visit);if(found)return found;}}
  const content=value=>Array.isArray(value)?value.map(content).join(''):value&&typeof value==='object'&&'props'in value?content(value.props.children):typeof value==='string'||typeof value==='number'?String(value):'';
  const find=(kind,label)=>walk(tree,node=>node.type===kind&&content(node.props.children).includes(label));
  const native=()=>walk(tree,node=>typeof node.type==='function'&&node.type.name==='NativeSlice');
  const layout=()=>walk(tree,node=>typeof node.type==='function'&&node.type.name==='HeadImageLayoutControl');
  const act=label=>{if(['Coronal','Sagittal'].includes(label)){assert(layout());layout().props.onChange(label.toLowerCase());return flush();}const button=find('button',label);assert(button,`button ${label}`);button.props.onClick();return flush();};
  const choose=async()=>{const input=walk(tree,node=>node.type==='input'&&node.props.type==='file');assert(input);await input.props.onChange({target:{files:[{name:'synthetic'}],value:'synthetic'}});return settle();};
  const share=()=>{const control=walk(tree,node=>typeof node.type==='function'&&node.type.name==='HeadFolderSharing');assert(control);control.props.onChange(true);flush();};
  const dispose=()=>{disposed=true;for(const effect of layouts.values())effect.cleanup?.();for(const effect of effects.values())effect.cleanup?.();globalThis.window=priorWindow;globalThis.document=priorDocument;globalThis.Element=priorElement;globalThis.HTMLAnchorElement=priorAnchor;};
  return {layout,flush,settle,walk,find,native,act,choose,share,dispose,entryRequests,practice,clickLink,documentClickListeners:()=>documentClicks.size,get tree(){return tree;},setPractice(value){active=value;dirty=true;}};
}
async function opened(h){for(let attempt=0;attempt<12;attempt++){await h.settle();if(h.native()?.props.selected)return;}assert.fail('configured source and exact structure did not settle');}

test('mounted CT/MRI Back and Forward restore exact entries without transferring native coordinates',async()=>{
  headViewHistory.clear();const pkg=packageFixture(),session=createHeadFolderSession(HEAD_LINK_REVISION);
  const ctHref=navigation.headImageHref('CT','brainstem-pons',null,HEAD_LINK_REVISION),mriHref=navigation.headImageHref('MRI','brainstem-pons',null,HEAD_LINK_REVISION);
  const b=browser(ctHref);let h=mount(b,{session,pkg});
  try{
    h.flush();await h.choose();await opened(h);h.share();
    assert.deepEqual(h.native().props.cursor,[67,1,1]);h.native().props.onCursor([68,1,1]);h.flush();
    h.act('Coronal');h.act('Bone window');
    assert.equal(typeof b.history.state[HEAD_VIEW_ENTRY_KEY],'string');
    assert.deepEqual(b.history.state.tree,{slot:'head'});assert.equal(b.history.state.nextInternal,17);
    b.link(mriHref);h.dispose();h=mount(b,{modality:'MRI',session,pkg});h.flush();await opened(h);
    assert.deepEqual(h.native().props.cursor,[145,1,1],'new MRI link uses its own canonical focus');
    assert.deepEqual(h.native().props.windowing,[50,100]);
    h.native().props.onCursor([146,1,1]);h.flush();h.act('Sagittal');
    b.history.back();h.dispose();h=mount(b,{session,pkg});h.flush();await opened(h);
    assert.deepEqual(h.native().props.cursor,[68,1,1],'Back restores prior CT native position');
    assert.deepEqual(h.native().props.windowing,[500,2500]);assert.equal(h.layout().props.layout,'coronal');
    b.history.forward();h.dispose();h=mount(b,{modality:'MRI',session,pkg});h.flush();await opened(h);
    assert.deepEqual(h.native().props.cursor,[146,1,1],'Forward restores its distinct MRI entry');
    assert.equal(h.layout().props.layout,'sagittal');
    assert.equal(b.history.state.__NA,true);assert.deepEqual(b.history.state.tree,{slot:'head'});
  }finally{h.dispose();headViewHistory.clear();}
});

test('configured source reverified on each route remount restores only the same pinned CT entry',async()=>{
  headViewHistory.clear();const session=createHeadFolderSession(HEAD_LINK_REVISION);
  const ctHref=navigation.headImageHref('CT','brainstem-pons',null,HEAD_LINK_REVISION),mriHref=navigation.headImageHref('MRI','brainstem-pons',null,HEAD_LINK_REVISION);
  const b=browser(ctHref,true);let h=mount(b,{session,pkg:packageFixture(true)});
  try{
    h.flush();await opened(h);
    h.native().props.onCursor([68,1,1]);h.flush();
    b.link(mriHref);h.dispose();h=mount(b,{modality:'MRI',session,pkg:packageFixture(true)});
    h.flush();await opened(h);
    assert.deepEqual(h.native().props.cursor,[145,1,1]);
    b.history.back();h.dispose();h=mount(b,{session,pkg:packageFixture(true)});
    h.flush();await opened(h);
    assert.deepEqual(h.native().props.cursor,[68,1,1]);
    h.act('Close atlas');
    assert.equal(headViewHistory.size(),0,'explicit close clears every configured receipt');
  }finally{h.dispose();headViewHistory.clear();}
});

test('fresh same-route concept keeps canonical focus; Back restores prior view after a delayed mask',async()=>{
  headViewHistory.clear();const pkg=packageFixture(),session=createHeadFolderSession(HEAD_LINK_REVISION);
  const href=navigation.headImageHref('CT','brainstem-pons',null,HEAD_LINK_REVISION),b=browser(href);
  const h=mount(b,{session,pkg,deferEntry:true});try{
    h.flush();await h.choose();await h.settle();await h.settle();
    const first=h.entryRequests.shift();assert(first);first.resolve({entry:ctPons,mask:new Uint8Array(0),focus:[67,1,1]});await h.settle();
    h.native().props.onCursor([68,1,1]);h.flush();h.act('Midbrain — regional mask');
    const next=h.entryRequests.shift();assert(next);next.resolve({entry:ctMidbrain,mask:new Uint8Array(0),focus:[20,1,1]});await h.settle();
    assert.deepEqual(h.native().props.cursor,[20,1,1],'explicit new concept uses its canonical focus');
    b.history.back();h.flush();
    const returned=h.entryRequests.shift();assert(returned);assert.equal(returned.entry,ctPons);
    assert.deepEqual(h.native().props.cursor,[68,1,1]);
    returned.resolve({entry:ctPons,mask:new Uint8Array(0),focus:[67,1,1]});await h.settle();
    assert.deepEqual(h.native().props.cursor,[68,1,1],'late saved-mask focus does not overwrite Back restore');
    h.act('Close atlas');assert.equal(headViewHistory.read(b.history.state,href,{pkg,study:nativeStudy(pkg,'CT'),modality:'CT',revision:HEAD_LINK_REVISION}),null);
  }finally{h.dispose();headViewHistory.clear();}
});

test('mounted Viewer pushes distinct Vinext indices and restores exact same-route Back/Forward views',async()=>{
  headViewHistory.clear();const pkg=packageFixture(),session=createHeadFolderSession(HEAD_LINK_REVISION);
  const href=navigation.headImageHref('CT','brainstem-pons',null,HEAD_LINK_REVISION),b=vinextBrowser(href),h=mount(b,{session,pkg});
  try{
    h.flush();await h.choose();await opened(h);
    h.native().props.onCursor([68,1,1]);h.flush();
    const prior=b.history.state;
    assert.equal(readHistoryStateTraversalIndex(prior),4);
    assert.equal(typeof prior[HEAD_VIEW_ENTRY_KEY],'string');
    h.act('Midbrain — regional mask');await opened(h);
    assert.deepEqual(h.native().props.cursor,[20,1,1],'fresh concept uses canonical focus');
    assert.deepEqual(b.stack.map(entry=>readHistoryStateTraversalIndex(entry.state)),[4,5]);
    assert.equal(b.controller.currentHistoryTraversalIndex,5);
    assert.equal(b.history.state.__vinext_externalHistoryState,true);
    assert.equal(b.history.state.__NA,true);assert.deepEqual(b.history.state.tree,{slot:'head'});
    assert.equal('cursor' in b.history.state,false);
    assert.equal('windowing' in b.history.state,false);
    assert.doesNotMatch(b.location.search,/cursor|slice|window|ijk/i);
    h.native().props.onCursor([21,1,1]);h.flush();
    b.history.back();h.flush();await opened(h);
    assert.equal(b.controller.currentHistoryTraversalIndex,4);
    assert.deepEqual(h.native().props.cursor,[68,1,1]);
    b.history.forward();h.flush();await opened(h);
    assert.equal(b.controller.currentHistoryTraversalIndex,5);
    assert.deepEqual(h.native().props.cursor,[21,1,1]);
    assert.deepEqual(b.stack.map(entry=>readHistoryStateTraversalIndex(entry.state)),[4,5]);
  }finally{h.dispose();headViewHistory.clear();}
});

test('abandoned selection completion cannot overwrite a restored prior entry',async()=>{
  headViewHistory.clear();const pkg=packageFixture(),session=createHeadFolderSession(HEAD_LINK_REVISION);
  const href=navigation.headImageHref('CT','brainstem-pons',null,HEAD_LINK_REVISION),b=browser(href),h=mount(b,{session,pkg,deferEntry:true});
  try{
    h.flush();await h.choose();await h.settle();await h.settle();
    const pons=h.entryRequests.shift();assert(pons);pons.resolve({entry:ctPons,mask:new Uint8Array(0),focus:[67,1,1]});await h.settle();
    h.native().props.onCursor([68,1,1]);h.flush();
    h.act('Midbrain — regional mask');const abandoned=h.entryRequests.shift();assert(abandoned);
    b.history.back();h.flush();assert.equal(abandoned.signal.aborted,true);
    abandoned.resolve({entry:ctMidbrain,mask:new Uint8Array(0),focus:[20,1,1]});await h.settle();
    assert.deepEqual(h.native().props.cursor,[68,1,1]);
    const restored=h.entryRequests.shift();assert(restored);assert.equal(restored.entry,ctPons);
    restored.resolve({entry:ctPons,mask:new Uint8Array(0),focus:[67,1,1]});await h.settle();
    assert.deepEqual(h.native().props.cursor,[68,1,1]);
  }finally{h.dispose();headViewHistory.clear();}
});

test('practice and guided navigation never overwrite an ordinary receipt; revocation clears it',async()=>{
  headViewHistory.clear();const pkg=packageFixture(),session=createHeadFolderSession(HEAD_LINK_REVISION);
  const href=navigation.headImageHref('CT','brainstem-pons',null,HEAD_LINK_REVISION),b=browser(href),h=mount(b,{session,pkg});
  try{
    h.flush();await h.choose();await opened(h);h.share();
    h.native().props.onCursor([68,1,1]);h.flush();
    const scope={pkg,study:h.native().props.study,modality:'CT',revision:HEAD_LINK_REVISION},state=b.history.state;
    const saved=()=>headViewHistory.read(state,href,scope);
    assert.deepEqual(saved()?.cursor,[68,1,1]);
    h.setPractice(true);h.flush();assert.equal(h.documentClickListeners(),1);
    let confirmCalls=0;b.window.confirm=()=>{confirmCalls++;return false;};
    const refused=h.clickLink('https://example.test/learn');
    assert.equal(confirmCalls,1,'ordinary same-tab navigation asks before leaving active practice');
    assert.equal(refused.defaultPrevented,true,'refused navigation is cancelled by document capture');
    assert.deepEqual(saved()?.cursor,[68,1,1]);
    h.native().props.onCursor([5,1,1]);h.flush();
    assert.deepEqual(saved()?.cursor,[68,1,1]);
    h.setPractice(false);h.flush();assert.equal(h.documentClickListeners(),0);assert.deepEqual(saved()?.cursor,[68,1,1]);
    h.act('Guided learning');h.native().props.onCursor([6,1,1]);h.flush();
    assert.deepEqual(saved()?.cursor,[68,1,1]);
    const control=h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='HeadFolderSharing');assert(control);
    control.props.onChange(false);h.flush();assert.equal(saved(),null);
    assert.equal(session.read(HEAD_LINK_REVISION),null);
  }finally{h.dispose();headViewHistory.clear();}
});
