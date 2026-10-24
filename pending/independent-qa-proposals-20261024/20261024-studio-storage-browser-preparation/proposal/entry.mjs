import React, {useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {StudioCourseEditor} from '../../20261024-pancreatic-us-website/website/components/StudioCourseEditor.tsx';
import Link, {navigate, usePathname} from './router.mjs';
import './fixture.css';

const h = React.createElement;
const initial = {
  one: {id:'one', code:'SYN-ONE', title:'Synthetic course one', description:'A synthetic teaching course for local QA only.', status:'draft', moduleId:null, workbookCount:0, releaseCount:0, enrolledLearners:0},
  two: {id:'two', code:'SYN-TWO', title:'Synthetic course two', description:'A separate synthetic teaching course for local QA.', status:'draft', moduleId:null, workbookCount:0, releaseCount:0, enrolledLearners:0},
};
const records = new Map(Object.entries(initial));
const actorA = {actorId:'edu:synthetic-a', organizationId:'synthetic-org'};
const actorB = {actorId:'edu:synthetic-b', organizationId:'synthetic-org'};
let actor = actorA, failNext = null, heldSave = null, holdNext = false, checks = 0, posts = 0;
function result(body, status=200) { return new Response(JSON.stringify(body), {status, headers:{'Content-Type':'application/json'}}); }
function sameScope(value) { return value?.actorId===actor.actorId && value?.organizationId===actor.organizationId; }
window.fetch = async (resource, options={}) => {
  const url = new URL(resource, location.href);
  if (url.origin!==location.origin || url.pathname!=='/api/studio') throw new Error('Fixture blocks unexpected fetch');
  if (options.method==='GET' && url.searchParams.get('mutationContext')==='1') {
    checks++;
    let expected; try {expected=JSON.parse(options.headers?.['X-Studio-Mutation-Context']);} catch {}
    return sameScope(expected) ? result({ok:true, action:'verify-studio-mutation-context'}) : result({ok:false,code:'STUDIO_CONTEXT_CHANGED'},409);
  }
  if (options.method!=='POST') throw new Error('Unexpected synthetic Studio method');
  posts++;
  const payload=JSON.parse(options.body);
  if (!sameScope(payload.expectedStudioContext)) return result({ok:false,code:'STUDIO_CONTEXT_CHANGED'},409);
  if (payload.action!=='update-course') throw new Error(`Fixture permits only update-course, received ${payload.action}`);
  const course=records.get(payload.courseId);
  if (!course) return result({ok:false,error:'Unknown synthetic course'},404);
  if (failNext) {const status=failNext;failNext=null;return result({ok:false,error:status===409?'Synthetic saved version changed':'Synthetic save could not be confirmed'},status);}
  if (payload.expectedTitle!==course.title || payload.expectedDescription!==course.description)
    return result({ok:false,error:'Synthetic saved version changed'},409);
  records.set(course.id,{...course,title:payload.title,description:payload.description});
  // Hold an accepted server result without exposing it as new React props.
  // The actual EditCourseDetailsForm calls router.refresh after response.
  if (holdNext) {holdNext=false;await new Promise(resolve=>{heldSave=resolve;});}
  return result({ok:true,action:'update-course',courseId:course.id});
};

// Fail only Studio draft persistence. Browser assets and unrelated storage are untouched.
const nativeGet=Storage.prototype.getItem, nativeSet=Storage.prototype.setItem, nativeRemove=Storage.prototype.removeItem;
const isDraft=key=>String(key).startsWith('visible-medicine-studio-draft:');
for (const [name,native] of [['getItem',nativeGet],['setItem',nativeSet],['removeItem',nativeRemove]]) {
  Object.defineProperty(Storage.prototype,name,{configurable:true,writable:true,value:function(key,...rest) {
    if (this===window.localStorage && isDraft(key)) throw new DOMException('Synthetic unavailable draft storage','QuotaExceededError');
    return native.call(this,key,...rest);
  }});
}
let storageFailureConfirmed=false;
try {localStorage.getItem('visible-medicine-studio-draft:fixture-probe');} catch {storageFailureConfirmed=true;}
if (!storageFailureConfirmed) throw new Error('Synthetic storage failure did not take effect');

window.__studioQA = Object.freeze({
  get state() {return {route:location.pathname+location.search,actor:actor.actorId,checks,posts,heldSave:!!heldSave,storageFailureConfirmed,courseOne:records.get('one'),courseTwo:records.get('two')};},
  navigate,
  back:()=>history.back(), forward:()=>history.forward(),
  switchActor(name) {actor=name==='b'?actorB:actorA;window.dispatchEvent(new Event('qa-actor-changed'));},
  holdNextSave() {holdNext=true;}, releaseSave() {if (!heldSave) throw new Error('No held save');const resolve=heldSave;heldSave=null;resolve();},
  failNextSave(status=409) {if(status!==409&&status!==500)throw new Error('Use 409 or 500');failNext=status;},
  forcePendingEdit(title,description) {
    if(!heldSave)throw new Error('Hold a save first; this is a synthetic race probe, not user typing');
    const form=document.querySelector('#course-details-editor form');
    if(!form)throw new Error('Details form is not mounted');
    const set=(element,value,prototype)=>{Object.getOwnPropertyDescriptor(prototype,'value').set.call(element,value);element.dispatchEvent(new Event('input',{bubbles:true}));element.dispatchEvent(new Event('change',{bubbles:true}));};
    set(form.elements.namedItem('title'),title,HTMLInputElement.prototype);
    set(form.elements.namedItem('description'),description,HTMLTextAreaElement.prototype);
  },
  inspect() {
    const form=document.querySelector('#course-details-editor form');
    return {url:location.href,actor:actor.actorId,detailsHidden:document.getElementById('course-details-editor')?.hidden,
      title:form?.elements.namedItem('title')?.value, description:form?.elements.namedItem('description')?.value,
      expectedTitle:form?.elements.namedItem('expectedTitle')?.value,
      selectedPane:document.querySelector('[role="tab"][aria-selected="true"]')?.getAttribute('data-course-pane'),
      warning:form?.querySelector('.draft-safety')?.textContent,
      message:[...document.querySelectorAll('.studio-form-message')].map(node=>node.textContent),
      active:document.activeElement?.id||document.activeElement?.getAttribute('name')||document.activeElement?.tagName};
  },
});

function App() {
  const path=usePathname();
  const [,refresh]=useState(0);
  useEffect(()=>{const update=()=>refresh(v=>v+1);window.addEventListener('qa-router-refresh',update);window.addEventListener('qa-actor-changed',update);return()=>{window.removeEventListener('qa-router-refresh',update);window.removeEventListener('qa-actor-changed',update);};},[]);
  const courseId=/^\/studio\/courses\/(one|two)$/.exec(path)?.[1];
  const course=courseId?records.get(courseId):null;
  return h(React.Fragment,null,
    h('header',null,h('strong',null,'Synthetic Studio draft transition QA'),h('p',null,'Actual frozen React course editor, form, draft and guard modules. Synthetic courses, actor and transport. No real account or backend.')),
    h('nav',{'aria-label':'Fixture routes'},h(Link,{href:'/studio/courses'},'Course list'),h(Link,{href:'/studio/courses/one'},'Course one'),h(Link,{href:'/studio/courses/two'},'Course two'),h('button',{onClick:()=>{actor=actor===actorA?actorB:actorA;window.dispatchEvent(new Event('qa-actor-changed'));}},`Actor: ${actor.actorId}`)),
    h('main',null,course ? h(React.Fragment,null,h('h1',null,course.title),h(StudioCourseEditor,{key:course.id+actor.actorId,course,workbooks:[],releases:[],recoveryScope:actor})) : h(React.Fragment,null,h('h1',null,'Synthetic course list'),h('p',null,'Return to a course to check tab-only recovery. Browser Back/Forward uses native history.'))));
}
createRoot(document.getElementById('app')).render(h(App));
