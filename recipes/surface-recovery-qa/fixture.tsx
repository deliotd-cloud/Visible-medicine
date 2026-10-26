import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {HeadAtlasSurface} from './components/HeadAtlasSurface.tsx';
import type {LoadedEntry} from './lib/head-atlas-import.ts';

// Only synthetic coordinates: a small tetrahedron, with no image, mask or source URL.
function makeEntry(id: string): LoadedEntry {
  return {
    entry: {id, label: `Synthetic tetrahedron ${id}`, family: 'fixture',
      representation: 'mesh', color: [0.35, 0.8, 0.65], opacity: {fill: 1, outline: 1}},
    positions: new Float32Array([0, 0, 6, -6, -5, -4, 6, -5, -4, 0, 7, -4]),
    indices: new Uint16Array([0, 1, 2, 0, 2, 3, 0, 3, 1, 1, 3, 2]),
  };
}

function App() {
  const [mounted, setMounted] = useState(true);
  const [id, setId] = useState('A');
  const [picks, setPicks] = useState(0);
  const selected = React.useMemo(() => makeEntry(id), [id]);
  const canvas = () => document.querySelector<HTMLCanvasElement>('.head-surface-renderer canvas');
  const lossExtension = () => {
    const element = canvas();
    const context = element?.getContext('webgl2') ?? element?.getContext('webgl');
    return context?.getExtension('WEBGL_lose_context') ?? null;
  };
  Object.assign(window, {surfaceFixture: {
    canvas,
    lossExtension,
    loseContext: () => lossExtension()?.loseContext(),
    restoreContext: () => lossExtension()?.restoreContext(),
    selectedId: () => id,
    pickCount: () => picks,
  }});
  return <main>
    <h1>Head surface recovery fixture</h1>
    <p>Synthetic tetrahedron only. Real React, React Three Fiber and Three.js component.</p>
    <div className="fixture-controls">
      <label>Independent control <input id="independent-control" type="text" /></label>
      <button id="replace-selection" type="button" onClick={() => setId(v => v === 'A' ? 'B' : 'A')}>Replace selection</button>
      <button id="unmount-surface" type="button" onClick={() => setMounted(false)}>Unmount surface</button>
      <button id="remount-surface" type="button" onClick={() => setMounted(true)}>Remount surface</button>
      <button id="lose-context" type="button" onClick={() => lossExtension()?.loseContext()}>Lose context</button>
      <button id="restore-context" type="button" onClick={() => lossExtension()?.restoreContext()}>Restore context</button>
    </div>
    <output id="fixture-state">Selected ID: <span id="selected-id">{id}</span>; picks: <span id="pick-count">{picks}</span>; mounted: <span id="mounted-state">{String(mounted)}</span></output>
    <div className="fixture-surface" id="fixture-surface">
      {mounted && <HeadAtlasSurface selected={selected} regionalCourse={false} onPick={() => setPicks(v => v + 1)} />}
    </div>
  </main>;
}

createRoot(document.getElementById('root')!).render(<App />);
