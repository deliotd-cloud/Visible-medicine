// Isolated interaction fixture only. Not an identity, clinical decision or Website route.
import React, {useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ClinicalReviewInbox} from '__INBOX_COMPONENT__';

let next='valid',requests=0;
const hash=(character:string)=>character.repeat(64);
// This deliberately replaces fetch only inside this disposable fixture bundle.
// No real Clinical Review endpoint, identity, database or patient data is reached.
globalThis.fetch=async()=>{
  const scenario=++requests===1?'valid':next;
  if(scenario==='409'||scenario==='500')return new Response('{}',{status:Number(scenario)});
  return new Response(JSON.stringify(scenario==='malformed'?{unexpected:true}:{
    schema:'vm-clinical-inbox-1',scope:'private-to-signed-in-account-and-institution',catalogRevision:hash('b'),
    page:1,pageCount:1,selectionTotal:1,nextPage:null,approval:false,
    items:[{key:'synthetic-pons',title:'Synthetic Pons',area:'head-learning',scopeLabel:'Synthetic head',
      href:'/workspace/atlas-review/head-learning',trackLabel:'Synthetic teaching',revision:hash('c'),
      status:'not-started',capability:'inspection-only'}],
  }),{headers:{'Content-Type':'application/json','X-Clinical-Review-Context':hash(scenario==='context'?'d':'a')}});
};

function Fixture(){
  const [scenario,setScenario]=useState('valid');
  useEffect(()=>{
    const recheck=(event:KeyboardEvent)=>{
      if(!event.altKey||event.key.toLowerCase()!=='r')return;
      event.preventDefault();window.dispatchEvent(new Event('blur'));window.dispatchEvent(new Event('focus'));
    };
    document.addEventListener('keydown',recheck);return()=>document.removeEventListener('keydown',recheck);
  },[]);
  return <>
    <header className="fixture-controls">
      <h1>Isolated focus regression fixture</h1>
      <p>Synthetic rows only · no sign-in, clinical service, scan, saved decision or permission grant.</p>
      <label>Next recheck response <select value={scenario} onChange={event=>{next=event.target.value;setScenario(next);}}>
        <option value="valid">Valid synthetic response</option><option value="409">409 · changed review context</option>
        <option value="500">500 · retryable failure</option><option value="context">Changed context token</option><option value="malformed">Malformed batch</option>
      </select></label>
      <p>Choose a response, focus a row or filter, then press Alt+R to exercise the actual inbox's return/recheck handler. Reload this disposable fixture to start over.</p>
    </header>
    <div onClickCapture={event=>{if((event.target as Element).closest('a'))event.preventDefault();}}><ClinicalReviewInbox/></div>
  </>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);
