// Test-only real React/actual component; never an auth or application route.
import React from 'react';
import {createRoot} from 'react-dom/client';
import {ClinicalReviewInbox} from 'vm-exact-review-inbox';

const makeEntries=()=>[
  ['source-change','Synthetic source change','re-review','decision','source-or-teaching'],
  ['viewer-change','Synthetic viewer update','re-review','decision','viewer-only'],
  ['needs-change','Synthetic correction','changes-required','decision'],
  ['in-progress','Synthetic draft','in-progress','decision'],
  ['not-started','Synthetic anatomy','not-started','decision'],
  ['inspection','Synthetic read-only inspection','inspection-required','inspection-only'],
  ['unavailable','Synthetic unavailable status','unavailable','inspection-only'],
  ['recorded','Synthetic previous decision','approval-recorded','decision'],
  ['a b','Synthetic unusual key A','not-started','decision'],
  ['a-b','Synthetic unusual key B','not-started','decision'],
].map(([key,title,status,capability,changeReason])=>({key,title,area:'structures',scopeLabel:'Synthetic body region',
  href:'/workspace/atlas-review/body?fixture='+encodeURIComponent(key),trackLabel:'Anatomy',
  revision:status==='unavailable'?null:'c'.repeat(64),status,capability,...(changeReason?{changeReason}:{})}));
let entries=makeEntries(),context='a'.repeat(64),revision='b'.repeat(64),httpStatus=200,hold=false,mount=0;
const requests=[];
const root=createRoot(document.getElementById('app'));
const render=()=>root.render(<ClinicalReviewInbox key={mount}/>);
window.fetch=(input,init={})=>{
  const url=new URL(String(input),location.href);
  if(url.origin!==location.origin||url.pathname!=='/api/atlas-review/inbox'||url.search!=='?page=1'||(init.method??'GET')!=='GET')
    return Promise.reject(Error('Synthetic specimen refuses all other network requests'));
  const body={schema:'vm-clinical-inbox-1',scope:'private-to-signed-in-account-and-institution',catalogRevision:revision,
    page:1,pageCount:1,selectionTotal:entries.length,nextPage:null,items:structuredClone(entries),approval:false};
  const code=httpStatus,token=context;
  const request={index:requests.length,signal:init.signal,settled:false,release:null};requests.push(request);
  return new Promise(resolve=>{
    request.release=()=>{if(request.settled)return;request.settled=true;
      // Deliberately unabortable synthetic replies exercise the component's own
      // generation/signal guards. No browser network ever occurs.
      resolve(code===200?Response.json(body,{headers:{'X-Clinical-Review-Context':token}}):new Response('Synthetic denied',{status:code}));};
    if(!hold)request.release();
  });
};
document.addEventListener('click',event=>{if(event.target instanceof Element&&event.target.closest('a'))event.preventDefault();},true);
window.__reviewReturnQA={
  state:()=>({requests:requests.map(({index,signal,settled})=>({index,aborted:!!signal?.aborted,settled})),hold,httpStatus,context,revision,
    items:entries.map(({key,status})=>({key,status})),visibility:document.visibilityState}),
  setStatus(key,status){const item=entries.find(item=>item.key===key);if(!item)throw Error('Unknown synthetic key');item.status=status;if(status!=='re-review')delete item.changeReason;},
  hold(value){hold=!!value;},
  setReply({status=200,nextContext=context,nextRevision=revision}={}){httpStatus=status;context=nextContext;revision=nextRevision;},
  release(index){const request=requests[index];if(!request)throw Error('Unknown synthetic request');request.release();},
  reset(){entries=makeEntries();context='a'.repeat(64);revision='b'.repeat(64);httpStatus=200;hold=false;mount++;
    history.replaceState(history.state,'','/workspace/clinical-review-inbox');render();},
};
render();
