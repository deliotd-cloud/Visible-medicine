import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AtlasRegionNavigation} from './website/components/AtlasRegionNavigation';
import {headImageHref} from './website/lib/head-atlas-navigation';
import {HEAD_LINK_REVISION} from './website/lib/head-atlas-links';
import {headLearningSequencesForModality} from './website/lib/head-atlas-learning';
import './website/components/atlas-workspace-navigation.css';
import './website/app/atlas-navigation.css';

const ct=headImageHref('CT','brainstem-pons',null,HEAD_LINK_REVISION)!;
const sequence=headLearningSequencesForModality('MRI')[0];
const mri=headImageHref('MRI',null,{sequenceId:sequence.id,conceptId:null},HEAD_LINK_REVISION)!;
function App(){
  const [renders,setRenders]=useState(0),modality=window.location.pathname==='/atlas/ct-head'?'ct':'mri';
  return <main>
    <header><h1>{modality.toUpperCase()} head · region navigation</h1><p>Isolated actual-component test · no scans or signed-in account · normal preview unchanged.</p></header>
    <section className="atlas-workspace-navigation"><AtlasRegionNavigation modality={modality} selected="head-neck"/></section>
    <section aria-label="Current learning context"><h2>Head &amp; neck context</h2><p>The picker must return to Head &amp; neck after browser history restores this document. Selecting another region is a pending choice until Go.</p><output aria-label="Current linked URL">{window.location.pathname+window.location.search}</output></section>
    <section aria-label="History test controls"><button type="button" onClick={()=>setRenders(renders+1)}>Rerender current context</button><span>Renders: {renders}</span><a href="/away">Leave test page</a><a href={ct}>Open CT concept test</a><a href={mri}>Open MRI tour test</a></section>
  </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
