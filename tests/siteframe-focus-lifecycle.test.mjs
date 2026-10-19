import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {isPublicFocusPath,shouldFocusPublicRoute} from '../lib/public-route-focus.ts';

const checkoutRequire=createRequire(new URL('../package.json',import.meta.url));
const ts=checkoutRequire('typescript');
const source=readFileSync(new URL('../components/SiteFrame.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const jsx=(type,props)=>({type,props});

function harness(initialPath='/atlas',{observe=false}={}){
 let path=initialPath,refIndex=0,pendingEffect,cleanup,rafId=0,dialog=false,headingPresent=true;
 const refs=[],frames=new Map(),body={},focusCalls=[],observers=new Set(),timers=new Map();let timerId=0;
 const document={body,activeElement:body,querySelector:()=>dialog?{}:null};
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
  './SiteFooter':{SiteFooter:()=>null},'../lib/public-route-focus':{isPublicFocusPath,shouldFocusPublicRoute},
  './workspace-navigation.css':{},
 };
 const module={exports:{}};
 new Function('require','module','exports',compiled)((name)=>{assert(name in mocks,`unexpected import ${name}`);return mocks[name];},module,module.exports);
 const SiteFrame=module.exports.SiteFrame;
 function render(nextPath=path){
  path=nextPath;refIndex=0;pendingEffect=undefined;
  const tree=SiteFrame({children:'body',signedIn:false});
  refs[0].current=root;
  cleanup?.();cleanup=undefined;
  cleanup=pendingEffect?.();
  return tree;
 }
 class Element {closest(){return null;}}
 class Anchor extends Element {constructor(href,target=''){super();this.href=href;this.target=target;}hasAttribute(){return false;}}
 class Observer {constructor(callback){this.callback=callback;}observe(target,options){assert.equal(target,main);assert.deepEqual(options,{childList:true,subtree:true});observers.add(this);}disconnect(){observers.delete(this);}}
 const originals={document:globalThis.document,window:globalThis.window,Element:globalThis.Element,
  HTMLAnchorElement:globalThis.HTMLAnchorElement,requestAnimationFrame:globalThis.requestAnimationFrame,
  cancelAnimationFrame:globalThis.cancelAnimationFrame,MutationObserver:globalThis.MutationObserver,setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout};
 Object.assign(globalThis,{document,window:{location:{origin:'https://visible.test',href:'https://visible.test'+initialPath}},
  Element,HTMLAnchorElement:Anchor,requestAnimationFrame:callback=>{const id=++rafId;frames.set(id,callback);return id;},
  cancelAnimationFrame:id=>frames.delete(id),MutationObserver:observe?Observer:undefined,
  setTimeout:callback=>{const id=++timerId;timers.set(id,callback);return id;},clearTimeout:id=>timers.delete(id)});
 return {render,document,body,heading,main,focusCalls,frames,observers,timers,setDialog(value){dialog=value;},setHeadingPresent(value){headingPresent=value;},
  mutate(){for(const observer of [...observers])observer.callback([],observer);},expire(){const callbacks=[...timers.values()];timers.clear();for(const callback of callbacks)callback();},
  link(tree,href,options={}){const anchor=new Anchor(href,options.target??'');const target=new Element();target.closest=()=>anchor;
   tree.props.onClickCapture({button:options.button??0,metaKey:!!options.metaKey,ctrlKey:false,altKey:false,shiftKey:false,target});return anchor;},
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
