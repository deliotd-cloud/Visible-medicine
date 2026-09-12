import { Component, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/app/globals.css';
import { KneeSpecimenView } from '@/app/um-knee-study';
import { createHraPelvisSupplement } from '@/app/hra-pelvis-supplement';
import { hraPelvisDefinition } from '@/lib/hra-pelvis';
import './panel-host.css';

const assetBase = '/atlas-runtime/female-pelvis';
const supplement = createHraPelvisSupplement({ assetBase });
class ModuleBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <main className="pelvis-load-error" role="alert">
      <h1>The anatomy view could not load</h1>
      <p>Reload this module to try again. No clinical record or assessment is stored here.</p>
      <button onClick={() => location.reload()}>Reload module</button>
    </main> : this.props.children;
  }
}
createRoot(document.getElementById('root')!).render(<ModuleBoundary>
  <KneeSpecimenView specimen={hraPelvisDefinition} supplement={supplement} assetBase={assetBase} />
</ModuleBoundary>);
