import assert from 'node:assert/strict';
import test from 'node:test';
import {isStudioPageLeavingClick,registerStudioNavigationGuard} from '../lib/studio-navigation-guard.ts';

const current='https://visiblemedicine.test/studio/courses?tab=a#top';
const basic={button:0,ctrlKey:false,metaKey:false,shiftKey:false,altKey:false,defaultPrevented:false};
function anchor(href:string, options:{target?:string;download?:boolean}={}){return {href,target:options.target??'',hasAttribute:(name:string)=>name==='download'&&!!options.download};}

test('only ordinary in-app page-changing anchor clicks qualify',()=>{
 assert(isStudioPageLeavingClick(basic,anchor('/studio/workspace'),current));
 assert(isStudioPageLeavingClick(basic,anchor('/studio/courses?tab=b'),current));
 for(const href of ['#section','/studio/courses?tab=a#other','https://elsewhere.test/studio/workspace'])assert(!isStudioPageLeavingClick(basic,anchor(href),current));
 for(const event of [{...basic,button:1},{...basic,ctrlKey:true},{...basic,metaKey:true},{...basic,shiftKey:true},{...basic,altKey:true},{...basic,defaultPrevented:true}])assert(!isStudioPageLeavingClick(event,anchor('/studio/workspace'),current));
 assert(!isStudioPageLeavingClick(basic,anchor('/studio/workspace',{target:'_blank'}),current));
 assert(!isStudioPageLeavingClick(basic,anchor('/studio/workspace',{download:true}),current));
});

test('several mounted forms share one capture listener and one confirmation',()=>{
 const listeners=new Set<(event:any)=>void>();let confirmations=0;
 const originalElement=Object.getOwnPropertyDescriptor(globalThis,'Element'),originalWindow=Object.getOwnPropertyDescriptor(globalThis,'window');
 class LinkTarget {closest(){return anchor('/studio/workspace');}}
 Object.defineProperty(globalThis,'Element',{value:LinkTarget,configurable:true});
 Object.defineProperty(globalThis,'window',{value:{confirm(){confirmations++;return false;}},configurable:true});
 const document={location:{href:current},addEventListener(_name:string,listener:(event:any)=>void,capture:boolean){assert(capture);listeners.add(listener);},removeEventListener(_name:string,listener:(event:any)=>void,capture:boolean){assert(capture);listeners.delete(listener);}};
 try{
  let firstUnsafe=true,secondUnsafe=true;
  const first=registerStudioNavigationGuard(document as unknown as Document,()=>firstUnsafe);
  const second=registerStudioNavigationGuard(document as unknown as Document,()=>secondUnsafe);
  assert.equal(listeners.size,1);
  const click=()=>{const event={...basic,target:new LinkTarget(),prevented:false,preventDefault(){this.prevented=true;}};for(const listener of listeners)listener(event);return event.prevented;};
  assert(click());assert.equal(confirmations,1);
  firstUnsafe=false;assert(click());assert.equal(confirmations,2);
  secondUnsafe=false;assert(!click());assert.equal(confirmations,2);
  first();assert.equal(listeners.size,1);second();assert.equal(listeners.size,0);
 }finally{
  if(originalElement)Object.defineProperty(globalThis,'Element',originalElement);else delete (globalThis as any).Element;
  if(originalWindow)Object.defineProperty(globalThis,'window',originalWindow);else delete (globalThis as any).window;
 }
});
