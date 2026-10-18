import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {HeadAtlasTeaching} from '../../components/HeadAtlasTeaching';
import {HeadAtlasReferenceTeaching} from '../../components/HeadAtlasReferenceTeaching';
import {HEAD_LINK_REVISION} from '../../lib/head-atlas-links';
import {headAnatomyCheckContent} from '../../lib/head-anatomy-checks';

function Fixture(){
  const [conceptId,setConceptId]=useState('brainstem-pons'),[modality,setModality]=useState<'CT'|'MRI'>('MRI'),[stale,setStale]=useState(false);
  const revision=stale?'stale-fixture-revision':HEAD_LINK_REVISION;
  return <>
    <header><h1>Linked anatomy checks · synthetic acceptance</h1><p>Actual teaching components · no scans, masks, accounts or clinical decisions.</p>
      <label>Test structure <select value={conceptId} onChange={event=>setConceptId(event.target.value)}>{headAnatomyCheckContent.questions.map(question=><option key={question.conceptId} value={question.conceptId}>{question.label}</option>)}</select></label>
      <label>Native modality <select value={modality} onChange={event=>setModality(event.target.value as 'CT'|'MRI')}><option>CT</option><option>MRI</option></select></label>
      <button onClick={()=>setStale(value=>!value)}>{stale?'Restore current source':'Use stale source'}</button>
    </header>
    <main><aside aria-label="Native teaching"><h2>{modality} structure panel</h2><HeadAtlasTeaching conceptId={conceptId} modality={modality} revision={revision}/></aside>
      <section aria-label="Existing 3D linked teaching"><HeadAtlasReferenceTeaching conceptId={conceptId} revision={revision} live/></section></main>
  </>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);
