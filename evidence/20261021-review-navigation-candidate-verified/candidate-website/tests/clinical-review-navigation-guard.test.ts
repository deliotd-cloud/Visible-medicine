import assert from 'node:assert/strict';
import test from 'node:test';
import {isClinicalReviewPageLeavingClick,registerClinicalReviewNavigationGuard} from '../lib/clinical-review-navigation-guard.ts';

const current='https://visiblemedicine.test/atlas/head-learning?mode=review#top';
const base={button:0,ctrlKey:false,metaKey:false,shiftKey:false,altKey:false,defaultPrevented:false};
const anchor=(href:string,options:{target?:string;download?:boolean}={})=>({href,target:options.target??'',hasAttribute:(name:string)=>name==='download'&&!!options.download});
const leaving=(event:object,link:ReturnType<typeof anchor>)=>isClinicalReviewPageLeavingClick(event as MouseEvent,link as HTMLAnchorElement,current);

test('only ordinary same-tab, same-origin page-changing links are guarded',()=>{
  assert(leaving(base,anchor('/clinical-review')));
  assert(leaving(base,anchor('/atlas/head-learning?mode=other')));
  for(const href of ['#section','/atlas/head-learning?mode=review#other','https://elsewhere.test/clinical-review','mailto:someone@example.test'])assert(!leaving(base,anchor(href)));
  for(const event of [{...base,button:1},{...base,ctrlKey:true},{...base,metaKey:true},{...base,shiftKey:true},{...base,altKey:true},{...base,defaultPrevented:true}])assert(!leaving(event,anchor('/clinical-review')));
  assert(!leaving(base,anchor('/clinical-review',{target:'_blank'})));
  assert(!leaving(base,anchor('/clinical-review',{download:true})));
});

test('one listener and one confirmation protect multiple dirty or uncertain copies',()=>{
  const listeners=new Set<(event:MouseEvent)=>void>();
  let confirmations=0,allow=false,firstProtected=true,secondProtected=true;
  const document={defaultView:{location:{href:current},confirm(){confirmations++;return allow;}},
    addEventListener(type:string,listener:(event:MouseEvent)=>void,capture:boolean){assert.equal(type,'click');assert.equal(capture,true);listeners.add(listener);},
    removeEventListener(type:string,listener:(event:MouseEvent)=>void,capture:boolean){assert.equal(type,'click');assert.equal(capture,true);listeners.delete(listener);}} as unknown as Document;
  const first=registerClinicalReviewNavigationGuard(document,()=>firstProtected);
  const second=registerClinicalReviewNavigationGuard(document,()=>secondProtected);
  assert.equal(listeners.size,1);
  const click=(href='/clinical-review')=>{
    const calls:string[]=[];
    const event={...base,target:{closest(){return anchor(href);}},preventDefault(){calls.push('default');},stopPropagation(){calls.push('propagation');},stopImmediatePropagation(){calls.push('immediate');}} as unknown as MouseEvent;
    for(const listener of listeners)listener(event);
    return calls;
  };
  assert.deepEqual(click(),['default','propagation','immediate']);
  assert.equal(confirmations,1);
  firstProtected=false;
  assert.deepEqual(click(),['default','propagation','immediate']);
  assert.equal(confirmations,2);
  allow=true;
  assert.deepEqual(click(),[]);
  assert.equal(confirmations,3);
  allow=false;
  secondProtected=false;
  assert.deepEqual(click(),[]);
  assert.equal(confirmations,3);
  assert.deepEqual(click('#other'),[]);
  first();assert.equal(listeners.size,1);
  second();assert.equal(listeners.size,0);
});
