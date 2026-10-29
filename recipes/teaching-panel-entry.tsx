import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {HeadAtlasTeaching} from '../20261029-review-delivery-repair/website/components/HeadAtlasTeaching';
import {HeadAtlasConceptTeaching} from '../20261029-review-delivery-repair/website/components/HeadAtlasConceptTeaching';
import {HeadAtlasReferenceTeaching} from '../20261029-review-delivery-repair/website/components/HeadAtlasReferenceTeaching';
import {HEAD_LINK_REVISION} from '../20261029-review-delivery-repair/website/lib/head-atlas-links';
import '../20261029-review-delivery-repair/website/components/imaging-atlas-shell.css';
import '../20261029-review-delivery-repair/website/components/head-atlas.css';
import '../20261029-review-delivery-repair/website/app/atlas/head-neck-3d/head-learning.css';
function App(){const [mode,setMode]=useState('scan'),[concept,setConcept]=useState('brainstem-pons');
return <main className="imaging-workspace-page"><h1>Teaching panel verification</h1><p>Synthetic host · actual teaching components · no scans, stored decisions or account data.</p><nav aria-label="Test panel"><label>Panel <select value={mode} onChange={e=>setMode(e.target.value)}><option value="scan">Scan teaching</option><option value="concept">Unmatched concept</option><option value="reference">3D linked teaching</option><option value="caption">Tour caption</option></select></label><label>Concept <select value={concept} onChange={e=>setConcept(e.target.value)}><option value="brainstem-pons">Pons</option><option value="brainstem-midbrain">Midbrain</option></select></label></nav><div id="panel" style={{width:'min(360px, 100%)',boxSizing:'border-box',padding:16,border:'1px solid #d6dfdc',background:'#fff',marginTop:20}}>
{mode==='scan'?<HeadAtlasTeaching conceptId={concept} modality="MRI" revision={HEAD_LINK_REVISION}/>:mode==='concept'?<HeadAtlasConceptTeaching conceptId={concept} modality="MRI" revision={HEAD_LINK_REVISION}/>:<HeadAtlasReferenceTeaching conceptId={concept} revision={HEAD_LINK_REVISION} compact={mode==='caption'}/>}
</div></main>};createRoot(document.getElementById('root')!).render(<App/>);
