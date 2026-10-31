import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {HeadAtlasInlineComparison} from 'vm:comparison';
import {HEAD_LINK_REVISION} from 'vm:links';
import {headInlineDestination} from 'vm:inline';

const pons=headInlineDestination('brainstem-pons',HEAD_LINK_REVISION,'MRI')!;
const midbrain=headInlineDestination('brainstem-midbrain',HEAD_LINK_REVISION,'MRI')!;
(window as any).__fixtureTargets={sourceRevision:pons.sourceRevision,pons:pons.target,midbrain:midbrain.target,
  selectionProtocol:'vm-head-semantic-selection',focusProtocol:'vm-head-semantic-focus'};

function App(){
  const [conceptId,setConceptId]=useState('brainstem-pons');
  const [ready,setReady]=useState(true);
  const [hold,setHold]=useState(false);
  const [events,setEvents]=useState<string[]>([]);
  const note=(message:string)=>setEvents(previous=>[...previous.slice(-7),message]);
  useEffect(()=>{
    (window as any).qa={
      completeReady(){setReady(true);},
      holdNext(){setHold(true);},
      passiveMidbrain(){setConceptId('brainstem-midbrain');},
      reset(){setConceptId('brainstem-pons');setReady(true);setHold(false);},
      snapshot(){return {active:document.activeElement?.outerHTML?.slice(0,180)??document.activeElement?.tagName,
        status:document.querySelector('.head-inline-comparison [role="status"]')?.textContent,
        reverseVisible:!![...document.querySelectorAll('.head-inline-comparison button')].find(button=>button.textContent?.includes('Show Midbrain on MRI'))};}
    };
  },[]);
  return <main>
    <h1>Synthetic MRI comparison focus fixture</h1>
    <p>No scan, account, or clinical data is loaded. The model frame supplies exact synthetic protocol messages.</p>
    <div className="controls"><button onClick={()=>{setConceptId('brainstem-pons');setReady(true);setHold(false);note('reset');}}>Reset Pons</button>
      <button onClick={()=>{setHold(true);note('next reverse waits for readiness');}}>Hold next target readiness</button>
      <button onClick={()=>{setReady(true);note('target ready');}}>Complete readiness</button>
      <button onClick={()=>{setConceptId('brainstem-midbrain');note('passive target change');}}>Passive Midbrain selection</button>
      <button id="elsewhere">Other focus target</button></div>
    <p>Current MRI concept: <strong id="concept">{conceptId}</strong> · annotation ready: <strong id="ready">{String(ready)}</strong></p>
    <HeadAtlasInlineComparison conceptId={conceptId} revision={HEAD_LINK_REVISION} modality="MRI" selectionReady={ready}
      onSelectConcept={id=>{note(`explicit reverse ${id}`);setConceptId(id);if(hold){setReady(false);setHold(false);}}}
      onClose={()=>note('comparison closed')} />
    <h2>Fixture events</h2><ol>{events.map((event,index)=><li key={index}>{event}</li>)}</ol>
  </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
