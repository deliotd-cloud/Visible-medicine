// Disposable real-component fixture. Synthetic read-only rows; no identity/service.
import React, {useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ClinicalReviewInbox} from '__INBOX_COMPONENT__';
let scenario='retain',requests=0;
const hash=(c:string)=>c.repeat(64);
globalThis.fetch=async(input:RequestInfo|URL)=>{
  if(!String(input).startsWith('/api/atlas-review/inbox?page='))throw Error('Fixture blocks all other fetches');
  const selected=++requests===1?'retain':scenario;
  await new Promise(resolve=>setTimeout(resolve,600));
  if(selected==='401')return new Response('{}',{status:401});
  return new Response(JSON.stringify({schema:'vm-clinical-inbox-1',scope:'private-to-signed-in-account-and-institution',catalogRevision:hash('b'),page:1,pageCount:1,selectionTotal:25,nextPage:null,approval:false,
    items:Array.from({length:25},(_,i)=>({key:'synthetic-'+i,title:'Synthetic structure '+String(i+1).padStart(2,'0'),area:'structures',scopeLabel:'Synthetic body',href:'/workspace/atlas-review',trackLabel:'Synthetic anatomy',revision:hash('c'),status:selected==='shrink'&&i===24?'approval-recorded':'not-started',capability:'decision'}))}),{headers:{'Content-Type':'application/json','X-Clinical-Review-Context':hash(selected==='context'?'d':'a')}});
};
function Fixture(){
 const [choice,setChoice]=useState('retain');
 useEffect(()=>{const recheck=(event:KeyboardEvent)=>{if(event.altKey&&event.key.toLowerCase()==='r'){event.preventDefault();window.dispatchEvent(new Event('blur'));window.dispatchEvent(new Event('focus'));}};document.addEventListener('keydown',recheck);return()=>document.removeEventListener('keydown',recheck);},[]);
 return <><header className="fixture-controls"><h1>Isolated review pager focus check</h1><p>Synthetic rows only. No sign-in, clinical endpoint, scan, saved decision or permission grant.</p><label>Next recheck <select value={choice} onChange={e=>{scenario=e.target.value;setChoice(e.target.value);}}><option value="retain">25 matching rows · pager retained</option><option value="shrink">24 matching rows · pager removed</option><option value="401">401 · access changed</option><option value="context">Changed context</option></select></label><p>Focus Next, then press Alt+R. The synthetic scan takes 600 ms; use Tab to test an intervening focus move.</p><button type="button">Independent focus target</button></header><div onClickCapture={e=>{if((e.target as Element).closest('a'))e.preventDefault();}}><ClinicalReviewInbox/></div></>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);
