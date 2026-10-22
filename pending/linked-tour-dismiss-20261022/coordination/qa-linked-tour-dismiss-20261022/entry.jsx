// Real picker and parent delegation; model/navigation effects are synthetic.
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {HeadAtlasLearningNavigation} from 'vm-head-tour-navigation';
import 'vm-head-learning-css';
window.__qaRouterPushes=[];window.__qaNavigations=[];window.__qaFocus=[];
window.fetch=async()=>{throw Error('No network in synthetic linked-tour specimen');};
document.addEventListener('focusin',event=>window.__qaFocus.push(event.target.matches('summary')?'summary':event.target.matches('[data-head-guided-heading]')?'heading':event.target.tagName));
function App(){
 const [blocked,setBlocked]=useState(true),[position,setPosition]=useState({sequenceId:'synthetic-tour',conceptId:'synthetic-alpha'});
 const navigate=href=>{const picker=document.querySelector('.head-linked-tour-picker');window.__qaNavigations.push({href,blocked,disclosureClosed:!picker.open,summaryFocused:document.activeElement===picker.querySelector('summary')});if(!blocked){const index=Number(new URL(href,location.href).searchParams.get('headStep'));if(index===0||index===1)setPosition({sequenceId:'synthetic-tour',conceptId:index?'synthetic-beta':'synthetic-alpha'});document.querySelector('[data-head-guided-heading]')?.focus({preventScroll:true});}return true;};
 return <><aside className="qa-banner">SYNTHETIC LINKED-TOUR UI TEST · No scans, sign-in, scoring, completion or storage. Normal website unchanged.
  <label><input type="checkbox" checked={blocked} onChange={event=>setBlocked(event.target.checked)}/>Test blocked-like navigation</label></aside><main>
  <HeadAtlasLearningNavigation position={position} onNavigate={navigate}/>
  <section className="qa-stage"><h1>Synthetic model placeholder</h1><p role="status" data-qa-status>{blocked?'Blocked-like callback · no navigation':'Accepted-like callback'} · {position.conceptId}</p><p>This tests the real child/parent click order, not a live model practice session.</p></section></main></>;
}
createRoot(document.getElementById('app')).render(<App/>);
