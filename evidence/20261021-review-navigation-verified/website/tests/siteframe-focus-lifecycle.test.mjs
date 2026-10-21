import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {isPublicFocusPath,shouldFocusPublicRoute,shouldFocusStudioPrimaryRoute} from '../lib/public-route-focus.ts';
import {reviewDestination,reviewDestinationActive} from '../lib/review-destination.ts';
import {registerStudioNavigationGuard} from '../lib/studio-navigation-guard.ts';

const checkoutRequire=createRequire(new URL('../package.json',import.meta.url));
const ts=checkoutRequire('typescript');
const source=readFileSync(new URL('../components/SiteFrame.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const jsx=(type,props)=>({type,props});

function harness(initialPath='/atlas',{observe=false}={}){
 let path=initialPath,refIndex=0,pendingEffect,cleanup,rafId=0,dialog=false,headingPresent=true;
 const refs=[],frames=new Map(),body={},focusCalls=[],observers=new Set(),timers=new Map(),clickListeners=new Set();let timerId=0,confirmResult=false,confirmCalls=0;
 const location={origin:'https://visible.test',href:'https://visible.test'+initialPath};
 const document={body,location,activeElement:body,querySelector:()=>dialog?{}:null,
  addEventListener(name,listener,capture){assert.equal(name,'click');assert.equal(capture,true);clickListeners.add(listener);},
  removeEventListener(name,listener,capture){assert.equal(name,'click');assert.equal(capture,true);clickListeners.delete(listener);}};
 const heading={attributes:new Map(),listeners:new Map(),
  hasAttribute(name){return this.attributes.has(name);},getAttribute(name){return this.attributes.get(name)??null;},
  setAttribute(name,value){this.attributes.set(name,value);},removeAttribute(name){this.attributes.delete(name);},
  addEventListener(name,fn){this.listeners.set(name,fn);},removeEventListener(name){this.listeners.delete(name);},
  focus(options){focusCalls.push(options);document.activeElement=this;},
  blur(){this.listeners.get('blur')?.();},
 };
 const main={attributes:new Map(),listeners:new Map(),querySelector:()=>headingPresent?heading:null,
  hasAttribute(name){return this.attributes.has(name);},getAttribute(name){return this.attributes.get(name)??null;},
  setAttribute(name,value){this.attributes.set(name,value);},removeAttribute(name){this.attributes.delete(name);},
  addEventListener(name,fn){this.listeners.set(name,fn);},removeEventListener(name){this.listeners.delete(name);},
  focus(options){focusCalls.push(options);document.activeElement=this;}};
 const root={querySelector:selector=>selector==='#main-content'?main:null};
 const react={
  useRef(initial){const index=refIndex++;return refs[index]??(refs[index]={current:initial});},
  useEffect(effect){pendingEffect=effect;},
 };
 const mocks={
  react,'react/jsx-runtime':{jsx,jsxs:jsx},'next/link':{default:()=>null},
  'next/navigation':{usePathname:()=>path},'./SiteHeader':{SiteHeader:()=>null},
  './SiteFooter':{SiteFooter:()=>null},'../lib/public-route-focus':{isPublicFocusPath,shouldFocusPublicRoute,shouldFocusStudioPrimaryRoute},
  '../lib/review-destination':{reviewDestination,reviewDestinationActive},
  './workspace-navigation.css':{},
 };
 const module={exports:{}};
 new Function('require','module','exports',compiled)((name)=>{assert(name in mocks,`unexpected import ${name}`);return mocks[name];},module,module.exports);
 const SiteFrame=module.exports.SiteFrame;
 function render(nextPath=path){
  path=nextPath;location.href=location.origin+path;refIndex=0;pendingEffect=undefined;
  const tree=SiteFrame({children:'body',signedIn:false});
  refs[0].current=root;
  cleanup?.();cleanup=undefined;
  cleanup=pendingEffect?.();
  return tree;
 }
 class Element {closest(){return null;}}
 class Anchor extends Element {
  constructor(href,target='',primary=false,download=false){super();this.href=href;this.target=target;this.primary=primary;this.download=download;}
  hasAttribute(name){return name==='download'&&this.download;}
  closest(selector){return selector==='.studio-primary-navigation'&&this.primary?{}:null;}
 }
 class Observer {constructor(callback){this.callback=callback;}observe(target,options){assert.equal(target,main);assert.deepEqual(options,{childList:true,subtree:true});observers.add(this);}disconnect(){observers.delete(this);}}
 const originals={document:globalThis.document,window:globalThis.window,Element:globalThis.Element,
  HTMLAnchorElement:globalThis.HTMLAnchorElement,requestAnimationFrame:globalThis.requestAnimationFrame,
  cancelAnimationFrame:globalThis.cancelAnimationFrame,MutationObserver:globalThis.MutationObserver,setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout};
 Object.assign(globalThis,{document,window:{location,confirm(){confirmCalls++;return confirmResult;}},
  Element,HTMLAnchorElement:Anchor,requestAnimationFrame:callback=>{const id=++rafId;frames.set(id,callback);return id;},
  cancelAnimationFrame:id=>frames.delete(id),MutationObserver:observe?Observer:undefined,
  setTimeout:callback=>{const id=++timerId;timers.set(id,callback);return id;},clearTimeout:id=>timers.delete(id)});
 return {render,document,body,heading,main,focusCalls,frames,observers,timers,setDialog(value){dialog=value;},setHeadingPresent(value){headingPresent=value;},setConfirm(value){confirmResult=value;},get confirmCalls(){return confirmCalls;},
  mutate(){for(const observer of [...observers])observer.callback([],observer);},expire(){const callbacks=[...timers.values()];timers.clear();for(const callback of callbacks)callback();},
  link(tree,href,options={}){const anchor=new Anchor(href,options.target??'',!!options.primary,!!options.download);const target=new Element();target.closest=()=>anchor;
   const event={button:options.button??0,metaKey:!!options.metaKey,ctrlKey:!!options.ctrlKey,altKey:!!options.altKey,shiftKey:!!options.shiftKey,target,isTrusted:options.trusted??true,defaultPrevented:!!options.defaultPrevented,preventDefault(){this.defaultPrevented=true;}};
   for(const listener of clickListeners)listener(event);
   tree.props.onClickCapture(event);return anchor;},
  flush(){const callbacks=[...frames.values()];frames.clear();for(const callback of callbacks)callback();},
  close(){cleanup?.();Object.assign(globalThis,originals);},
 };
}

test('initial render does not focus; matching committed link focuses heading without scroll and cleans tabindex',()=>{
 const h=harness();try{
  const atlas=h.render();assert.equal(h.frames.size,0);assert.equal(h.document.activeElement,h.body);
  h.link(atlas,'https://visible.test/atlas/guided-learning');
  h.render('/atlas/guided-learning');assert.equal(h.frames.size,1);
  h.flush();assert.equal(h.document.activeElement,h.heading);
  assert.deepEqual(h.focusCalls,[{preventScroll:true}]);assert.equal(h.heading.getAttribute('tabindex'),'-1');
  h.heading.blur();assert.equal(h.heading.hasAttribute('tabindex'),false);
 }finally{h.close();}
});

test('a still-focused navigation link transfers focus; route cleanup removes temporary tabindex',()=>{
 const h=harness();try{
  const atlas=h.render();const oldLink=h.link(atlas,'https://visible.test/atlas/guided-learning');
  h.document.activeElement=oldLink;h.render('/atlas/guided-learning');h.flush();
  assert.equal(h.document.activeElement,h.heading);assert.equal(h.heading.getAttribute('tabindex'),'-1');
  h.render('/courses');assert.equal(h.heading.hasAttribute('tabindex'),false);
 }finally{h.close();}
});

test('the existing skip target receives focus when a destination has no heading',()=>{
 const h=harness();try{
  const atlas=h.render();h.link(atlas,'https://visible.test/atlas/guided-learning');
  h.setHeadingPresent(false);h.render('/atlas/guided-learning');h.flush();
  assert.equal(h.document.activeElement,h.main);assert.deepEqual(h.focusCalls,[{preventScroll:true}]);
  assert.equal(h.main.getAttribute('tabindex'),'-1');
 }finally{h.close();}
});

test('same-path, external, modified, new-tab and viewer clicks do not queue a focus transfer',()=>{
 for(const [href,options] of [
  ['https://visible.test/atlas?filter=bone',{}],['https://other.test/atlas/guided-learning',{}],
  ['https://visible.test/atlas/guided-learning',{metaKey:true}],
  ['https://visible.test/atlas/guided-learning',{target:'_blank'}],
  ['https://visible.test/atlas/3d',{}],
 ]){
  const h=harness();try{const atlas=h.render();h.link(atlas,href,options);h.render('/atlas/guided-learning');
   assert.equal(h.frames.size,0,href);assert.equal(h.document.activeElement,h.body);
  }finally{h.close();}
 }
});

test('destination control or modal keeps focus; stale frame is cancelled after a second commit',()=>{
 for(const mode of ['control','dialog','cancel']){
  const h=harness();try{
   const atlas=h.render();h.link(atlas,'https://visible.test/atlas/guided-learning');h.render('/atlas/guided-learning');
   if(mode==='control')h.document.activeElement={};
   if(mode==='dialog')h.setDialog(true);
   if(mode==='cancel'){h.render('/courses');assert.equal(h.frames.size,0);}
   h.flush();assert.equal(h.focusCalls.length,0,mode);
  }finally{h.close();}
 }
});

test('streamed heading upgrades our fallback focus once, without repeated focus or lasting observers',()=>{
 const h=harness('/atlas',{observe:true});try{
  const atlas=h.render();h.link(atlas,'https://visible.test/atlas/guided-learning');
  h.setHeadingPresent(false);h.render('/atlas/guided-learning');h.flush();
  assert.equal(h.document.activeElement,h.main);assert.equal(h.observers.size,1);assert.equal(h.timers.size,1);
  h.mutate();h.mutate();assert.equal(h.frames.size,1);h.flush();assert.equal(h.focusCalls.length,1);
  h.setHeadingPresent(true);h.mutate();h.flush();
  assert.equal(h.document.activeElement,h.heading);assert.equal(h.focusCalls.length,2);
  assert(h.focusCalls.every(options=>options.preventScroll===true));
  assert.equal(h.main.hasAttribute('tabindex'),false);assert.equal(h.heading.getAttribute('tabindex'),'-1');
  assert.equal(h.observers.size,0);assert.equal(h.timers.size,0);
  h.heading.blur();assert.equal(h.heading.hasAttribute('tabindex'),false);
 }finally{h.close();}
});

test('a user-focused control or modal wins over a later streamed heading',()=>{
 for(const mode of ['control','dialog']){
  const h=harness('/atlas',{observe:true});try{
   const atlas=h.render();h.link(atlas,'https://visible.test/atlas/guided-learning');
   h.setHeadingPresent(false);h.render('/atlas/guided-learning');h.flush();
   const control={};if(mode==='control')h.document.activeElement=control;else h.setDialog(true);
   h.setHeadingPresent(true);h.mutate();h.flush();
   assert.equal(h.focusCalls.length,1,mode);assert.equal(h.document.activeElement,mode==='control'?control:h.main);
   assert.equal(h.observers.size,0);assert.equal(h.timers.size,0);
  }finally{h.close();}
 }
});

test('route cleanup cancels a queued streamed upgrade and removes its observer/timer',()=>{
 const h=harness('/atlas',{observe:true});try{
  const atlas=h.render();h.link(atlas,'https://visible.test/atlas/guided-learning');
  h.setHeadingPresent(false);h.render('/atlas/guided-learning');h.flush();
  h.setHeadingPresent(true);h.mutate();assert.equal(h.frames.size,1);
  h.render('/courses');assert.equal(h.frames.size,0);assert.equal(h.observers.size,0);assert.equal(h.timers.size,0);
  h.flush();assert.equal(h.focusCalls.length,1);
 }finally{h.close();}
});

test('a headingless route stops observing at the bounded deadline',()=>{
 const h=harness('/atlas',{observe:true});try{
  const atlas=h.render();h.link(atlas,'https://visible.test/atlas/guided-learning');
  h.setHeadingPresent(false);h.render('/atlas/guided-learning');h.flush();h.mutate();
  h.expire();assert.equal(h.frames.size,0);assert.equal(h.observers.size,0);assert.equal(h.timers.size,0);
  h.setHeadingPresent(true);h.mutate();h.flush();assert.equal(h.document.activeElement,h.main);assert.equal(h.focusCalls.length,1);
 }finally{h.close();}
});

test('explicit Studio primary links focus each committed destination without widening initial-load behavior',()=>{
 for(const destination of ['/studio/workspace','/studio/courses','/studio/workbooks','/studio/publishing']){
  const h=harness('/studio/courses/one');try{
   const tree=h.render();assert.equal(h.frames.size,0);
   h.link(tree,'https://visible.test'+destination,{primary:true});h.render(destination);h.flush();
   assert.equal(h.document.activeElement,h.heading,destination);
   assert.deepEqual(h.focusCalls,[{preventScroll:true}],destination);
  }finally{h.close();}
 }
});

test('a Studio streamed heading replaces only our own temporary skip-target focus',()=>{
 const h=harness('/studio/workspace',{observe:true});try{
  const tree=h.render();h.link(tree,'https://visible.test/studio/publishing',{primary:true});
  h.setHeadingPresent(false);h.render('/studio/publishing');h.flush();
  assert.equal(h.document.activeElement,h.main);assert.equal(h.observers.size,1);
  h.setHeadingPresent(true);h.mutate();h.flush();
  assert.equal(h.document.activeElement,h.heading);assert.equal(h.focusCalls.length,2);
  assert.equal(h.main.hasAttribute('tabindex'),false);assert.equal(h.observers.size,0);assert.equal(h.timers.size,0);
 }finally{h.close();}
});

test('Studio nonprimary, cancelled, download, modified, new-tab and foreign links never queue focus',()=>{
 for(const [href,options] of [
  ['/studio/publishing',{}],['/studio/courses/one',{primary:true}],['/workspace',{primary:true}],
  ['/studio/publishing',{primary:true,defaultPrevented:true}],['/studio/publishing',{primary:true,download:true}],
  ['/studio/publishing',{primary:true,trusted:false}],
  ['/studio/publishing',{primary:true,button:1}],['/studio/publishing',{primary:true,metaKey:true}],
  ['/studio/publishing',{primary:true,ctrlKey:true}],['/studio/publishing',{primary:true,altKey:true}],
  ['/studio/publishing',{primary:true,shiftKey:true}],['/studio/publishing',{primary:true,target:'_blank'}],
  ['https://foreign.test/studio/publishing',{primary:true}],
 ]){
  const h=harness('/studio/workspace');try{
   const tree=h.render();h.link(tree,new URL(href,'https://visible.test').href,options);h.render('/studio/publishing');h.flush();
   assert.equal(h.focusCalls.length,0,JSON.stringify([href,options]));
  }finally{h.close();}
 }
});

test('the actual unsaved Studio document guard cancels a primary link before focus capture',()=>{
 const h=harness('/studio/courses/one');let unregister;try{
  const tree=h.render();unregister=registerStudioNavigationGuard(h.document,()=>true);
  h.link(tree,'https://visible.test/studio/publishing',{primary:true});
  assert.equal(h.confirmCalls,1);assert.equal(h.frames.size,0);
  // A later unrelated matching commit must not revive the cancelled click.
  h.render('/studio/publishing');h.flush();assert.equal(h.focusCalls.length,0);
 }finally{unregister?.();h.close();}
});

test('confirming the actual unsaved Studio guard allows the normal explicit focus handoff',()=>{
 const h=harness('/studio/courses/one');let unregister;try{
  const tree=h.render();h.setConfirm(true);unregister=registerStudioNavigationGuard(h.document,()=>true);
  h.link(tree,'https://visible.test/studio/publishing',{primary:true});
  h.render('/studio/publishing');h.flush();assert.equal(h.confirmCalls,1);
  assert.equal(h.document.activeElement,h.heading);assert.equal(h.focusCalls.length,1);
 }finally{unregister?.();h.close();}
});

test('Studio background/back commits, same-path filters and authentication redirects cannot acquire focus',()=>{
 for(const mode of ['background','same-path','auth']){
  const h=harness('/studio/workspace');try{
   const tree=h.render();
   if(mode==='same-path')h.link(tree,'https://visible.test/studio/workspace?filter=x',{primary:true});
   if(mode==='auth')h.link(tree,'https://visible.test/studio/publishing',{primary:true});
   h.render(mode==='auth'?'/signin-with-chatgpt':mode==='same-path'?'/studio/workspace':'/studio/publishing');h.flush();
   assert.equal(h.focusCalls.length,0,mode);
  }finally{h.close();}
 }
});

test('user focus and modal state win over a delayed Studio heading',()=>{
 for(const mode of ['control','dialog']){
  const h=harness('/studio/workspace',{observe:true});try{
   const tree=h.render();h.link(tree,'https://visible.test/studio/publishing',{primary:true});
   h.setHeadingPresent(false);h.render('/studio/publishing');h.flush();assert.equal(h.document.activeElement,h.main);
   const control={};if(mode==='control')h.document.activeElement=control;else h.setDialog(true);
   h.setHeadingPresent(true);h.mutate();h.flush();
   assert.equal(h.focusCalls.length,1,mode);assert.equal(h.document.activeElement,mode==='control'?control:h.main);
   assert.equal(h.observers.size,0);assert.equal(h.timers.size,0);
  }finally{h.close();}
 }
});

test('Studio stream upgrades are cancelled on another commit or at the bounded deadline',()=>{
 for(const mode of ['cleanup','expiry']){
  const h=harness('/studio/workspace',{observe:true});try{
   const tree=h.render();h.link(tree,'https://visible.test/studio/publishing',{primary:true});
   h.setHeadingPresent(false);h.render('/studio/publishing');h.flush();assert.equal(h.document.activeElement,h.main);
   h.setHeadingPresent(true);h.mutate();assert.equal(h.frames.size,1);
   if(mode==='cleanup')h.render('/studio/courses');else h.expire();
   h.flush();assert.equal(h.frames.size,0);assert.equal(h.observers.size,0);assert.equal(h.timers.size,0);
   assert.equal(h.focusCalls.length,1,mode);
  }finally{h.close();}
 }
});
