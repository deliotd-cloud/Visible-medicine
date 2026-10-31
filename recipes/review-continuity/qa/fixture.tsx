import React from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {ClinicalReviewInbox} from 'vm-under-test';

// Disposable browser fixture: no real account, scans, decisions or API traffic.
let approved=false;
const item=()=>({key:'synthetic-shoulder',title:'Synthetic review item',area:'structures',scopeLabel:'Dedicated shoulder · shoulder · muscle · FMA123 · right',href:'/workspace/atlas-review/shoulder',trackLabel:'Anatomy',revision:'c'.repeat(64),status:approved?'approval-recorded':'not-started',capability:'decision'});
window.fetch=async(input,init)=>{
 if(!String(input).startsWith('/api/atlas-review/inbox'))throw Error('Unexpected fixture request');
 await new Promise(resolve=>setTimeout(resolve,30));
 if(init?.signal?.aborted)throw new DOMException('Aborted','AbortError');
 return Response.json({schema:'vm-clinical-inbox-1',scope:'private-to-signed-in-account-and-institution',catalogRevision:'b'.repeat(64),page:1,pageCount:1,selectionTotal:1,nextPage:null,items:[item()],approval:false},{headers:{'X-Clinical-Review-Context':'a'.repeat(64)}});
};
const element=document.getElementById('app')!;let root=createRoot(element);
const wait=()=>new Promise(resolve=>setTimeout(resolve,100));
const render=()=>flushSync(()=>root.render(<ClinicalReviewInbox/>));render();
async function run(mode:string){
 const result=document.getElementById('result')!;result.textContent='Checking…';result.removeAttribute('data-pass');
 root.unmount();approved=false;root=createRoot(element);render();await wait();
 const link=element.querySelector<HTMLAnchorElement>('.clinical-review-quick-start-result a');if(!link)throw Error('Fixture link missing');
 link.focus();approved=mode!=='survives';window.dispatchEvent(new Event('blur'));window.dispatchEvent(new Event('focus'));
 if(mode==='moved')document.getElementById('outside')!.focus();
 await wait();
 const active=document.activeElement,expected=mode==='removed'?'clinical-review-quick-start-title':mode==='moved'?'outside':null;
 const passed=mode==='survives'?active===link:active?.id===expected;
 result.dataset.pass=String(passed);result.textContent=`${passed?'PASS':'FAIL'}: ${mode}; focus is ${active?.id||active?.tagName}.`;
}
for(const button of document.querySelectorAll<HTMLButtonElement>('[data-case]'))button.addEventListener('click',()=>void run(button.dataset.case!).catch(error=>{document.getElementById('result')!.textContent='ERROR: '+error.message;}));
