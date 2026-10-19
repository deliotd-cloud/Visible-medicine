import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import React from 'react';
import ts from 'typescript';
import * as policy from '../lib/course-enrolment-policy.ts';
const require=createRequire(import.meta.url);
const source=readFileSync(process.env.COURSE_ENROLMENT_SOURCE??new URL('../components/CourseEnrolmentControl.tsx',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
console.log(JSON.stringify({sourceSha256:createHash('sha256').update(source).digest('hex'),policySha256:createHash('sha256').update(readFileSync(new URL('../lib/course-enrolment-policy.ts',import.meta.url))).digest('hex'),actualPolicy:policy.INVITATION_SELF_ENROLMENT_ENABLED,mode:'actual component and invitation hold; synthetic React host/fetch/navigation; no DB/HTTP'}));
type Element={type:unknown;props:Record<string,any>};
type Props={releaseId:string;slug:string;accessModel:string;enrolled:boolean;firstWorkbookId:string|null;signedIn:boolean;profileComplete:boolean;enrolmentOpen:boolean;invitationCode:string};
const defaults:Props={releaseId:'release-a',slug:'course-a',accessModel:'free',enrolled:false,firstWorkbookId:'workbook-a',signedIn:true,profileComplete:true,enrolmentOpen:true,invitationCode:''};
function deferred<T>(){let resolve!:(value:T)=>void,reject!:(reason:unknown)=>void;const promise=new Promise<T>((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};}
function harness(overrides:Partial<Props>={}){
 const props={...defaults,...overrides};const originalFetch=Object.getOwnPropertyDescriptor(globalThis,'fetch'),originalWindow=Object.getOwnPropertyDescriptor(globalThis,'window');
 const slots:any[]=[],effects:Array<()=>void>=[],setups:Array<()=>void|(()=>void)>=[],cleanups:Array<()=>void>=[];
 const calls:Array<{url:string;init:RequestInit;body:any;response:ReturnType<typeof deferred<any>>}>=[],routes:string[]=[];
 let cursor=0,unmounted=false,writesAfterUnmount=0,scheduledRenders=0;
 Object.defineProperty(globalThis,'fetch',{configurable:true,value:(url:string,init:RequestInit)=>{const response=deferred<any>();calls.push({url,init,body:JSON.parse(String(init.body)),response});return response.promise;}});
 Object.defineProperty(globalThis,'window',{configurable:true,value:{location:{assign:(href:string)=>routes.push(href)}}});
 const hooks={...React,
  useState(initial:unknown){const slot=cursor++;if(!(slot in slots))slots[slot]=typeof initial==='function'?(initial as ()=>unknown)():initial;return[slots[slot],(value:any)=>{if(unmounted)writesAfterUnmount++;const next=typeof value==='function'?value(slots[slot]):value;if(!Object.is(next,slots[slot]))scheduledRenders++;slots[slot]=next;}];},
  useRef(initial:unknown){const slot=cursor++;if(!(slot in slots))slots[slot]={current:initial};return slots[slot];},
  useEffect(effect:()=>void|(()=>void),deps?:unknown[]){const slot=cursor++;if(!(slot in slots)||!deps||deps.some((value,index)=>value!==slots[slot][index])){slots[slot]=deps;setups[slot]=effect;effects.push(()=>{cleanups[slot]?.();cleanups[slot]=effect()??(()=>{});});}},
 };
 const Link=(props:any)=>React.createElement('a',props,props.children);
 const module={exports:{} as {CourseEnrolmentControl:(props:Props)=>Element}};
 new Function('require','module','exports',code)((id:string)=>id==='react'?hooks:id==='next/link'?{__esModule:true,default:Link}:id==='@/lib/course-enrolment-policy'?policy:require(id),module,module.exports);
 const render=()=>{cursor=0;scheduledRenders=0;const tree=module.exports.CourseEnrolmentControl(props);for(const effect of effects.splice(0))effect();return tree;};
 const flushScheduled=()=>{assert.ok(scheduledRenders>0,'component must schedule its own lifecycle repair');return render();};
 const find=(root:any,predicate:(node:Element)=>boolean):Element|undefined=>{if(Array.isArray(root)){for(const child of root){const result=find(child,predicate);if(result)return result;}return;}if(!root?.props)return;return predicate(root)?root:find(root.props.children,predicate);};
 const button=(tree:Element)=>find(tree,node=>node.type==='button')!;
 const alert=(tree:Element)=>find(tree,node=>node.props.role==='alert');
 const link=(tree:Element)=>find(tree,node=>node.type===Link);
 const finish=(index:number,body:unknown,ok=true,status=ok?200:409,jsonThrows=false)=>calls[index].response.resolve({ok,status,json:async()=>{if(jsonThrows)throw Error('PRIVATE_PARSE_DETAIL');return body;}});
 const settle=async()=>{for(let i=0;i<10;i++)await Promise.resolve();};
 const unmount=()=>{unmounted=true;for(const cleanup of cleanups)cleanup?.();cleanups.length=0;};
 const replayEffects=()=>{unmount();unmounted=false;for(let index=0;index<setups.length;index++)if(setups[index])cleanups[index]=setups[index]()??(()=>{});};
 const dispose=()=>{unmount();for(const[name,old]of [['fetch',originalFetch],['window',originalWindow]]as const)if(old)Object.defineProperty(globalThis,name,old);else delete(globalThis as any)[name];};
 const text=(node:any):string=>Array.isArray(node)?node.map(text).join(''):node?.props?text(node.props.children):typeof node==='string'?node:'';
 return{props,render,find,button,alert,link,calls,routes,finish,settle,unmount,replayEffects,dispose,text,flushScheduled,get writesAfterUnmount(){return writesAfterUnmount;}};
}
const accepted=(slug='course-a',workbookId:string|null='workbook/a ?id')=>({enrolment:{slug,workbookId}});

for(const accessModel of ['free','institution'])for(const workbookId of ['workbook/a ?id',null])test(`${accessModel} enrolment is single-flight and uses only a confirmed encoded destination (${workbookId===null?'empty course':'workbook'})`,async()=>{
 const h=harness({accessModel});try{
  const click=h.button(h.render()).props.onClick;click();click();assert.equal(h.calls.length,1);
  assert.equal(h.calls[0].url,'/api/learner/account');assert.equal(h.calls[0].init.method,'POST');assert.deepEqual(h.calls[0].body,{action:'enrol',releaseId:'release-a',invitationCode:''});
  assert.equal(h.button(h.render()).props.disabled,true);h.finish(0,accepted('course-a',workbookId));await h.settle();
  const expected=workbookId===null?'/my-learning':'/learn/course-a/'+encodeURIComponent(workbookId);
  assert.deepEqual(h.routes,[expected]);assert.equal(h.link(h.render())?.props.href,expected);click();assert.equal(h.calls.length,1);
 }finally{h.dispose();}
});

test('malformed or foreign successful enrolment responses do not navigate, retry or claim completion',async()=>{
 const badBodies=[{},null,[],true,'saved',{enrolment:null},{enrolment:[]},{enrolment:{}},{enrolment:{slug:'course-a'}},accepted('other-course'),accepted('../foreign'),{...accepted(),error:'Contradiction'},{...accepted(),error:null},{enrolment:{slug:'course-a',workbookId:null,error:'Contradiction'}},
  ...[undefined,1,{},[],true,'',' ','.','..',' padded ','x'.repeat(201),'bad\nvalue','bad\u007fvalue'].map(workbookId=>({enrolment:{slug:'course-a',workbookId}}))];
 for(const body of badBodies){const h=harness();try{
  h.button(h.render()).props.onClick();h.finish(0,body);await h.settle();const tree=h.render();assert.equal(h.routes.length,0);assert.equal(h.calls.length,1);assert.equal(h.link(tree),undefined);
  assert.match(String(h.alert(tree)?.props.children),/could not be confirmed.*before trying again/);assert.equal(h.button(tree).props.disabled,false);
 }finally{h.dispose();}}
});
test('HTTP errors and invalid JSON show an alert without a false enrolment',async()=>{
 for(const status of [401,403,409,422,429,500])for(const body of [{error:'Exact safe error'},null,[],{error:42}]){
  const h=harness();try{h.button(h.render()).props.onClick();h.finish(0,body,false,status);await h.settle();const tree=h.render();assert.equal(h.routes.length,0);assert.equal(h.calls.length,1);assert.equal(h.alert(tree)?.props.children,(body as any)?.error==='Exact safe error'?'Exact safe error':'You could not be enrolled in this course.');assert.equal(h.button(tree).props.disabled,false);}finally{h.dispose();}
 }
 for(const ok of [true,false]){const h=harness();try{h.button(h.render()).props.onClick();h.finish(0,null,ok,ok?200:500,true);await h.settle();assert.equal(h.routes.length,0);assert.doesNotMatch(String(h.alert(h.render())?.props.children),/PRIVATE_/);}finally{h.dispose();}}
});
test('explicit retry after a failure uses the current request once',async()=>{
 const h=harness();try{h.button(h.render()).props.onClick();h.calls[0].response.reject(Error('Network unavailable'));await h.settle();assert.equal(h.alert(h.render())?.props.children,'Network unavailable');
  const click=h.button(h.render()).props.onClick;click();click();assert.equal(h.calls.length,2);h.finish(1,accepted());await h.settle();assert.equal(h.routes.length,1);
 }finally{h.dispose();}
});
for(const outcome of ['success','error','network']as const)test(`old ${outcome} cannot navigate, change feedback or release another source's pending lock`,async()=>{
 const h=harness();try{const oldClick=h.button(h.render()).props.onClick;oldClick();h.props.releaseId='release-b';h.props.slug='course-b';const click=h.button(h.render()).props.onClick;oldClick();click();click();assert.equal(h.calls.length,2);
  if(outcome==='network')h.calls[0].response.reject(Error('Old network error'));else h.finish(0,outcome==='success'?accepted():{error:'Old error'},outcome==='success');
  await h.settle();const tree=h.render();assert.equal(h.routes.length,0);assert.equal(h.alert(tree),undefined);assert.equal(h.button(tree).props.disabled,true);h.button(tree).props.onClick();assert.equal(h.calls.length,2);
  h.finish(1,accepted('course-b','workbook-b'));await h.settle();assert.deepEqual(h.routes,['/learn/course-b/workbook-b']);
 }finally{h.dispose();}
});
test('A to B to A visits retire both old handlers and old responses',async()=>{
 const h=harness();try{const oldClick=h.button(h.render()).props.onClick;oldClick();h.props.releaseId='release-b';h.render();h.props.releaseId='release-a';h.render();oldClick();assert.equal(h.calls.length,1);
  h.finish(0,accepted());await h.settle();assert.equal(h.routes.length,0);h.button(h.render()).props.onClick();assert.equal(h.calls.length,2);h.finish(1,accepted());await h.settle();assert.equal(h.routes.length,1);
 }finally{h.dispose();}
});
for(const outcome of ['success','error','network']as const)test(`unmounted ${outcome} does not navigate or write state`,async()=>{
 const h=harness();try{const click=h.button(h.render()).props.onClick;click();h.unmount();const writes=h.writesAfterUnmount;click();assert.equal(h.calls.length,1);
  if(outcome==='network')h.calls[0].response.reject(Error('Old failure'));else h.finish(0,outcome==='success'?accepted():{error:'Old error'},outcome==='success');
  await h.settle();assert.equal(h.routes.length,0);assert.equal(h.writesAfterUnmount,writes);
 }finally{h.dispose();}
});
test('effect replay retires callbacks, keeps the existing lock then allows an explicit new request',async()=>{
 const h=harness();try{const oldClick=h.button(h.render()).props.onClick;oldClick();h.replayEffects();oldClick();assert.equal(h.calls.length,1);const repaired=h.flushScheduled();assert.equal(h.button(repaired).props.disabled,true);h.button(repaired).props.onClick();assert.equal(h.calls.length,1);
  h.finish(0,accepted());await h.settle();assert.equal(h.routes.length,0);assert.equal(h.button(h.render()).props.disabled,false);h.button(h.render()).props.onClick();h.finish(1,accepted());await h.settle();assert.equal(h.routes.length,1);
 }finally{h.dispose();}
});
test('initial effect replay schedules repaired handlers rather than leaving enrolment inert',async()=>{
 const h=harness();try{const oldClick=h.button(h.render()).props.onClick;h.replayEffects();oldClick();assert.equal(h.calls.length,0);h.button(h.flushScheduled()).props.onClick();assert.equal(h.calls.length,1);h.finish(0,accepted());await h.settle();assert.equal(h.routes.length,1);}finally{h.dispose();}
});
test('confirmed enrolment remains a continuation link after effect replay without another mutation',async()=>{
 const h=harness();try{const oldClick=h.button(h.render()).props.onClick;oldClick();h.finish(0,accepted());await h.settle();h.render();h.replayEffects();const tree=h.flushScheduled();oldClick();assert.equal(h.calls.length,1);assert.equal(h.link(tree)?.props.href,'/learn/course-a/'+encodeURIComponent('workbook/a ?id'));}finally{h.dispose();}
});
for(const change of [{firstWorkbookId:'new-first-workbook'},{invitationCode:'new-context-code'}])test(`same-release context update ${Object.keys(change)[0]} retires pending navigation`,async()=>{
 const h=harness();try{h.button(h.render()).props.onClick();Object.assign(h.props,change);h.render();h.finish(0,accepted());await h.settle();assert.equal(h.routes.length,0);assert.equal(h.alert(h.render()),undefined);}finally{h.dispose();}
});
for(const[change,label]of [
 [{signedIn:false},'Create learner profile'],[{profileComplete:false},'Complete learner profile'],[{enrolmentOpen:false},'Enrolment closed'],[{accessModel:'paid'},'Checkout coming after private evaluation'],[{accessModel:'invitation'},'Invitation enrolment unavailable'],[{enrolled:true},'Continue course'],[{accessModel:'unknown'},'Enrolment unavailable'],[{releaseId:''},'Enrolment unavailable'],[{slug:'../foreign'},'Enrolment unavailable'],
]as const)test(`access/target change to ${label} retires an in-flight enrolment`,async()=>{
 const h=harness();try{const oldClick=h.button(h.render()).props.onClick;oldClick();Object.assign(h.props,change);const tree=h.render();assert.ok(h.text(tree).includes(label));oldClick();assert.equal(h.calls.length,1);
  h.finish(0,accepted());await h.settle();assert.equal(h.routes.length,0);assert.equal(h.alert(h.render()),undefined);
 }finally{h.dispose();}
});
test('current invitation hold is applied before any sign-in/profile path and never offers redemption',()=>{
 assert.equal(policy.INVITATION_SELF_ENROLMENT_ENABLED,false);
 for(const signedIn of [false,true])for(const profileComplete of [false,true]){const h=harness({accessModel:'invitation',signedIn,profileComplete,invitationCode:'ELV-ABCDEF123456'});try{
  const tree=h.render();assert.equal(h.button(tree).props.disabled,true);assert.equal(h.button(tree).props.onClick,undefined);assert.ok(h.text(tree).includes(policy.INVITATION_SELF_ENROLMENT_HOLD_MESSAGE));assert.equal(h.find(tree,node=>node.type==='input'),undefined);assert.equal(h.calls.length,0);
 }finally{h.dispose();}}
});
test('feedback from a previous visit is hidden without clearing that visit through stale callbacks',async()=>{
 const h=harness();try{h.button(h.render()).props.onClick();h.finish(0,{error:'Old error'},false);await h.settle();assert.equal(h.alert(h.render())?.props.children,'Old error');h.props.releaseId='release-b';assert.equal(h.alert(h.render()),undefined);}finally{h.dispose();}
});
