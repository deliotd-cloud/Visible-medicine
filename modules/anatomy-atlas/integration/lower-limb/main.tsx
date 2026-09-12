import { Component, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/app/globals.css';
import { KneeSpecimenView } from '@/app/um-knee-study';
import { SpecimenStudyLink } from '@/app/specimen-study-link';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { limbDefinitions, type LimbScope } from '@/lib/um-limb-studies';
import { resolveSpecimenLink } from '@/lib/um-limb-navigation';
import { parseSpecimenLink } from '@/lib/specimen-links';
import './panel-host.css';

const assetBase = '/atlas-runtime/lower-limb';
// Preserve duplicate query fields so the existing strict parser rejects them.
const params: Record<string, string | string[]> = Object.create(null);
new URLSearchParams(location.search).forEach((value, key) => {
  const previous = params[key];
  params[key] = previous === undefined ? value : [...(Array.isArray(previous) ? previous : [previous]), value];
});
const navigation = resolveSpecimenLink(parseSpecimenLink(params));
const scopes = ['hip-thigh', 'knee', 'calf', 'foot', 'whole'] as const;
const options = scopes.map(value => ({ value, label: limbDefinitions[value].label + (value === 'whole' ? ' · larger download' : '') }));

function LowerLimbModule() {
  const [scope, setScope] = useState<LimbScope>(navigation.status === 'ready' ? navigation.scope : 'knee');
  const [ignoreLink, setIgnoreLink] = useState(false);
  function changeScope(value: string | null) {
    if (!value || !scopes.includes(value as LimbScope)) return;
    setIgnoreLink(true); setScope(value as LimbScope);
    history.replaceState(null, '', location.pathname);
  }
  return <main className="limb-module">
    <header className="limb-region-bar">
      <label htmlFor="limb-region">Region</label>
      <Select value={scope} items={options} onValueChange={changeScope}>
        <SelectTrigger id="limb-region" aria-label="Lower limb region"><SelectValue /></SelectTrigger>
        <SelectContent>{options.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
      </Select>
      <span>Right limb · Review pending</span>
    </header>
    {navigation.status === 'rejected' && !ignoreLink ? <section className="limb-load-error" role="alert">
      <h1>This study link cannot be restored</h1>
      <p>The source, revision, structure or topic could not be verified. No substitute study has been opened.</p>
      <Button onClick={() => changeScope('knee')}>Open current knee source view</Button>
    </section> : <KneeSpecimenView key={scope} specimen={limbDefinitions[scope]} assetBase={assetBase}
      initialNavigation={!ignoreLink && navigation.status === 'ready' ? navigation : undefined}
      studyLink={(definition, selectedId, studyId, view) => <SpecimenStudyLink key={`${selectedId}:${studyId}:${view}`}
        definition={definition} selectedId={selectedId} studyId={studyId} view={view}
        basePath="/atlas-runtime/lower-limb/index.html" reviewAvailable={false} />} />}
  </main>;
}
class ModuleBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <main className="limb-load-error" role="alert">
      <h1>The anatomy view could not load</h1><p>Reload to try again. No clinical record or assessment is stored here.</p>
      <Button onClick={() => location.reload()}>Reload module</Button>
    </main> : this.props.children;
  }
}
createRoot(document.getElementById('root')!).render(<ModuleBoundary><LowerLimbModule /></ModuleBoundary>);
