import React,{useState,useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {AtlasWorkspaceNavigation} from 'vm-exact-atlas-navigation';
import {HEAD_LINK_REVISION} from 'vm-exact-head-links';
const context=(conceptId,position=null,revision=HEAD_LINK_REVISION)=>({conceptId,position,revision});
const cases={
  'mri-concept':{modality:'mri',regionId:'head-neck',headNavigation:context('brainstem-pons')},
  'ct-tour':{modality:'ct',regionId:'head-neck',headNavigation:context('orbit-right-globe',{sequenceId:'globes',conceptId:'orbit-right-globe'})},
  'mri-only-mapped':{modality:'mri',regionId:'head-neck',headNavigation:context('limbic-left-amygdala')},
  'image-only':{modality:'mri',regionId:'head-neck',headNavigation:context('cerebellum-vermis')},
  'stale':{modality:'ct',regionId:'head-neck',headNavigation:context('brainstem-pons',null,'0'.repeat(64))},
  'chooser':{modality:'mri',regionId:'head-neck',headNavigation:context(null,{sequenceId:'brainstem',conceptId:null})},
  'whole-body':{modality:'3d',regionId:'whole-body'},
};
window.__navRouterCalls=[];window.__navActivations=[];window.__navReady=null;
function App(){
  const [name,setName]=useState('mri-concept');
  useEffect(()=>{window.__navReady=name;window.__navQA={set(value){if(!Object.hasOwn(cases,value))throw Error('Unknown fixture');setName(value);},state(){return {name,routerCalls:[...window.__navRouterCalls],activations:[...window.__navActivations]};}};},[name]);
  return <><aside>SYNTHETIC NAVIGATION TEST · no scans, models, accounts, decisions or navigation. Normal website unchanged.</aside>
    <label className="fixture-case">Synthetic navigation case<select value={name} onChange={event=>setName(event.target.value)}>{Object.keys(cases).map(key=><option key={key}>{key}</option>)}</select></label>
    <main onClick={event=>{
      const link=event.target.closest('a');if(!link)return;
      window.__navActivations.push({href:link.getAttribute('href'),defaultPreventedByProduct:event.defaultPrevented,clientLink:link.hasAttribute('data-client-link'),ctrl:event.ctrlKey,meta:event.metaKey});
      // Simulates an outer unsaved-work navigation guard. It must receive the
      // untouched ordinary anchor event; no target app or document is opened.
      event.preventDefault();
    }}><AtlasWorkspaceNavigation {...cases[name]}/></main>
    <p className="fixture-limit">Separate, unregistered subjects. This specimen checks route metadata and controls only, not scan/model rendering.</p></>;
}
createRoot(document.getElementById('app')).render(<App/>);
