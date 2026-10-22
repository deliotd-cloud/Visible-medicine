// Isolated synthetic toolbar specimen. Not a website route, scan or authentication shim.
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Toolbar as CurrentToolbar,PaneButton,SurfaceButton} from './current-toolbar.tsx';
import {Toolbar as BeforeToolbar} from './before-toolbar.tsx';
import {headDisclosureKeyDown} from 'vm-head-disclosure-helper';
import 'vm-imaging-shell-css';
import 'vm-head-atlas-css';
window.fetch=async()=>{throw Error('Synthetic toolbar specimen has no network access');};
function App(){
 const [variant,setVariant]=useState('current'),[modality,setModality]=useState('CT'),[quiz,setQuiz]=useState(false),[supplementary,setSupplementary]=useState(true);
 const [overlay,setOverlay]=useState(true),[showCrosshair,setShowCrosshair]=useState(false),[regionalCourse,setRegionalCourse]=useState(false),[windowing,setWindowing]=useState([40,80]),[expanded,setExpanded]=useState('axial');
 const [activeId,setActiveId]=useState('synthetic'),[selected,setSelected]=useState({entry:{supplementary_geometries:[{id:'synthetic'}]}}),[position,setPosition]=useState({conceptId:'synthetic'});
 const context={study:{range:[0,100]},rightPanel:'info',quizActive:quiz,playbackStep:null,comparisonOpen:false,concept:{atlasHref:'/no-navigation'},linkedCount:0,
  planes:['axial','coronal','sagittal'],expanded,modality,overlay,showCrosshair,regionalCourse,windowing,activeId,
  selected:selected?{entry:{supplementary_geometries:supplementary?[{id:'synthetic'}]:[]}}:null,learningPosition:position,comparisonButtonRef:null,
  headDisclosureKeyDown,setOverlay,setShowCrosshair,setRegionalCourse,setWindowing,
  initialWindow:()=>[40,80],setActiveId,setSelected,setLearningPosition:setPosition,writeNavigation:()=>{},changeImageLayout:value=>setExpanded(value==='multiplanar'?null:value),
  toggleInlineComparison:()=>{},findLinkedStructures:()=>{}};
 const Toolbar=variant==='current'?CurrentToolbar:BeforeToolbar;
 return <><aside className="qa-banner">SYNTHETIC UI TEST ONLY · No scan data, identities, decisions or network. Normal website preview unchanged.
  <div><label>Test version <select aria-label="Test version" value={variant} onChange={e=>setVariant(e.target.value)}><option value="current">Compact toolbar</option><option value="before">Before change</option></select></label>
  <label>Test modality <select aria-label="Test modality" value={modality} onChange={e=>setModality(e.target.value)}><option>CT</option><option>MRI</option></select></label>
  <label><input type="checkbox" checked={quiz} onChange={e=>setQuiz(e.target.checked)}/> Test quiz mode</label>
  <label><input type="checkbox" checked={supplementary} onChange={e=>setSupplementary(e.target.checked)}/> Test supplementary geometry</label></div></aside>
  <div className="anatomy-site-frame"><div className="topbar">Visible Medicine · isolated control specimen</div><main id="main-content"><div className="imaging-workspace-page">
   <header className="imaging-workspace-titlebar"><div className="imaging-workspace-heading"><h1>{modality} head · control specimen</h1><p>No native image or clinical workflow is being tested here.</p></div></header>
   <div className="imaging-workspace-grid"><aside className="imaging-workspace-sidebar">Synthetic structure index placeholder</aside>
    <section className="imaging-workspace-viewer"><div className="imaging-workspace-toolbar"><Toolbar {...context}/></div><div className="imaging-workspace-stage">
     <p role="status" data-qa-state>Localizer: {showCrosshair?'on':'off'} · Centreline: {regionalCourse?'on':'off'} · Window: {windowing.join('/')} · Layout: {expanded??'multiplanar'}</p>
     {variant==='current'&&<div className="qa-pane-actions">{['axial','coronal','sagittal'].map(plane=><section key={plane}><h2>{plane} synthetic pane</h2><PaneButton plane={plane} expanded={expanded===plane} onExpand={()=>setExpanded(expanded===plane?null:plane)}/></section>)}<section><h2>Selected anatomy · synthetic surface controls</h2><SurfaceButton expanded={expanded} setExpanded={setExpanded}/></section></div>}
    </div></section><aside className="imaging-workspace-info">Synthetic learning panel placeholder</aside></div>
  </div></main></div></>;
}
createRoot(document.getElementById('app')).render(<App/>);
