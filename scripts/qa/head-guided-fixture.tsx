import React, {useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {HeadAtlasGuidedLearning} from '../../components/HeadAtlasGuidedLearning';
import type {HeadEntry, LoadedStudy, Modality} from '../../lib/head-atlas-import';
import type {HeadLearningPosition} from '../../lib/head-atlas-learning';

// Component-only fixture: these are invented descriptors, not importable masks.
// No image loader, raw scan, private manifest or approval record is used.
function App() {
  const [modality, setModality] = useState<Modality>('CT');
  const [missing, setMissing] = useState(false);
  const [position, setPosition] = useState<HeadLearningPosition>({sequenceId:'brainstem', conceptId:null});
  const [result, setResult] = useState('No set started');
  const [selection, setSelection] = useState('None');
  const study = useMemo(() => {
    const parts = [['midbrain','Midbrain'], ['pons','Pons'], ['medulla_oblongata','Medulla oblongata']];
    const entries = parts.filter(([part]) => !missing || part !== 'pons').map(([part, label]) => ({
      id:`${modality === 'CT' ? 'cth' : 'mrb'}.bst.${part}`, label:`${label} — regional mask`,
      family:'bst', laterality:'midline_or_unpaired', representation:'partial-mask',
      color:[1,0,0], opacity:{fill:.2,outline:1}, mask:{sha256:`synthetic-${part}`},
    })) as HeadEntry[];
    // Guided learning only consumes the definition. Never pass this to a viewer.
    return {definition:{entries}} as LoadedStudy;
  }, [modality, missing]);
  return <>
    <header><h1>Guided learning · synthetic desktop acceptance</h1><p>Actual component and CSS. No images, clinical masks or package import. Callback verification only.</p></header>
    <main><section aria-label="Fixture controls">
      <label>Fixture modality <select value={modality} onChange={event => setModality(event.target.value as Modality)}><option>CT</option><option>MRI</option></select></label>
      <label><input type="checkbox" checked={missing} onChange={event => setMissing(event.target.checked)}/> Omit middle step</label>
      <p role="status">{result}</p><p>Selected: {selection}</p><p>Tour position: {position.conceptId ?? 'not started'}</p>
    </section><aside aria-label="264-pixel guided panel" className="imaging-info-panel">
      <HeadAtlasGuidedLearning study={study} modality={modality} position={position} onPositionChange={setPosition}
        onSelect={entry => setSelection(entry.id)} onPractice={entry => setResult(`Single: ${entry.id}`)}
        onPracticeSequence={(entries, mode) => setResult(`${mode}: ${entries.map(entry => entry.id).join(', ')}`)}/>
    </aside></main>
  </>;
}
createRoot(document.getElementById('root')!).render(<App/>);
