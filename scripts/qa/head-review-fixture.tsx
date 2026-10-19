import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {HeadAtlasPracticeReview} from '../../components/HeadAtlasPracticeReview';
import {HEAD_LINK_REVISION} from '../../lib/head-atlas-links';
import type {HeadEntry} from '../../lib/head-atlas-import';
import type {HeadPracticeReviewItem} from '../../lib/head-atlas-practice';

// Invented, non-importable descriptors: never passed to an image/model loader.
const entry=(id:string,label:string,laterality='midline_or_unpaired'):HeadEntry=>({id,label,family:'synthetic',laterality,representation:'partial-mask',color:[1,0,0],opacity:{fill:.2,outline:.8}});
const original:HeadPracticeReviewItem[]=[
  {entry:entry('cth.bst.pons','Pons — regional mask'),outcome:'correct'},
  {entry:entry('synthetic.left','Left example — regional mask','left'),outcome:'incorrect'},
  {entry:entry('synthetic.right','Right example — regional mask','right'),outcome:'revealed'},
  {entry:entry('synthetic.unknown','Unanswered example — regional mask'),outcome:'unanswered'},
];
const followup:HeadPracticeReviewItem[]=[{entry:original[1].entry,outcome:'correct'}];
const replacement:HeadPracticeReviewItem[]=[{entry:entry('synthetic.replacement','Replacement example'),outcome:'incorrect'}];
function App(){
  const [active,setActive]=useState(false),[replaced,setReplaced]=useState(false),[result,setResult]=useState('No callback');
  return <><header><h1>Practice review · synthetic desktop acceptance</h1><p>Actual component and styles. No acquired images, masks, imports or clinical approval.</p></header>
    <main><section aria-label="Fixture controls">
      <label><input type="checkbox" checked={active} onChange={event=>setActive(event.target.checked)}/> Active question</label>
      <label><input type="checkbox" checked={replaced} onChange={event=>setReplaced(event.target.checked)}/> Replace original set</label>
      <p role="status">{result}</p>
    </section><aside aria-label="264-pixel review panel" className="imaging-info-panel">
      <HeadAtlasPracticeReview items={replaced?replacement:original} modality="CT" revision={HEAD_LINK_REVISION} active={active} finished={!active} label="Review original set" onReviewEntry={value=>setResult(`Review: ${value.id}`)} onReviewGuide={(position,value)=>setResult(`Guide: ${position.sequenceId}/${position.conceptId} · ${value.id}`)}/>
      <HeadAtlasPracticeReview items={followup} modality="CT" revision={HEAD_LINK_REVISION} active={active} finished={!active} label="Review follow-up set" onReviewEntry={value=>setResult(`Follow-up: ${value.id}`)}/>
    </aside></main></>;
}
createRoot(document.getElementById('root')!).render(<App/>);
