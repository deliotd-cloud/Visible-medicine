import { Component, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../app/globals.css';
import ShoulderExplorer from '../../app/shoulder-explorer';
import { structures } from '../../app/anatomy-data';
import './panel-host.css';
import { installShoulderEducationApi } from './education-api';

class ModuleBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <section className="module-recovery" role="alert"><h2>The shoulder could not be loaded</h2><p>Your place on the website is unchanged.</p><button onClick={() => window.location.reload()}>Reload shoulder</button></section> : this.props.children;
  }
}
const requested = new URLSearchParams(window.location.search).get('structure');
const selected = structures.find(s => s.id === requested)?.id ?? structures[0].id;
let disconnectEducation: (()=>void)|null = installShoulderEducationApi(window);
window.addEventListener('pagehide',()=>{disconnectEducation?.();disconnectEducation=null;});
window.addEventListener('pageshow',()=>{if(!disconnectEducation)disconnectEducation=installShoulderEducationApi(window);});
createRoot(document.getElementById('root')!).render(
  <ModuleBoundary><ShoulderExplorer initialSelectedId={selected} presentation="panel" assetBase="/atlas-runtime/shoulder" connectedReviews={false} /></ModuleBoundary>,
);
