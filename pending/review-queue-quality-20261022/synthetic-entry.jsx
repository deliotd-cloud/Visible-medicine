// Synthetic browser specimen only; this is not an application route or auth adapter.
import React from 'react';
import {createRoot} from 'react-dom/client';
import {ClinicalReviewInbox} from 'vm-exact-review-inbox';

const revision='c'.repeat(64);
const entries=[
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
 revision:status==='unavailable'?null:revision,status,capability,...(changeReason?{changeReason}:{})}));
const batch={schema:'vm-clinical-inbox-1',scope:'private-to-signed-in-account-and-institution',catalogRevision:'b'.repeat(64),
 page:1,pageCount:1,selectionTotal:entries.length,nextPage:null,items:entries,approval:false};
// No actual network, cookie, identity, private records or server permission changes.
window.fetch=async(input,init={})=>{
 const url=new URL(String(input),location.href);
 if(url.origin!==location.origin||url.pathname!=='/api/atlas-review/inbox'||url.search!=='?page=1'||(init.method??'GET')!=='GET')throw Error('Synthetic specimen refuses network access');
 if(init.signal?.aborted)throw new DOMException('Aborted','AbortError');
 return Response.json(batch,{headers:{'X-Clinical-Review-Context':'a'.repeat(64)}});
};
document.addEventListener('click',event=>{if(event.target instanceof Element&&event.target.closest('a'))event.preventDefault();},true);
createRoot(document.getElementById('app')).render(<ClinicalReviewInbox/>);
