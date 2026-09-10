'use client';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { limbDefinitions, type LimbScope } from '@/lib/um-limb-studies';
import { KneeSpecimenView } from './um-knee-study';
import { noSpecimenLink, type ParsedSpecimenLink } from '@/lib/specimen-links';
import { resolveSpecimenLink } from '@/lib/um-limb-navigation';

export default function LimbSpecimenDialog({ initialRegion, initialLink = noSpecimenLink, onClose }: { initialRegion: string; initialLink?: ParsedSpecimenLink; onClose: () => void }) {
  const resolved = resolveSpecimenLink(initialLink);
  const [ignoreLink, setIgnoreLink] = useState(false);
  const [scope, setScope] = useState<LimbScope>(initialLink.status === 'requested' && Object.hasOwn(limbDefinitions, initialLink.request.scope) ? initialLink.request.scope : initialRegion === 'foot' ? 'foot' : ['pelvis', 'thigh'].includes(initialRegion) ? 'hip-thigh' : 'knee');
  const specimen = limbDefinitions[scope];
  const blocked = !ignoreLink && resolved.status === 'rejected';
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="eye-layers-dialog um-knee-dialog" showCloseButton={false}>
      <div className="eye-layer-heading brain-study-heading">
        <div><DialogTitle>Lower limb · independent specimen</DialogTitle>
          <DialogDescription>Right-limb source · Clinical validation pending · Separate from the body atlas</DialogDescription></div>
        <Select value={scope} onValueChange={(next) => { if (next && Object.hasOwn(limbDefinitions, next)) { setIgnoreLink(true); setScope(next as LimbScope); } }}>
          <SelectTrigger aria-label="Independent specimen region"><SelectValue /></SelectTrigger>
          <SelectContent>{Object.entries(limbDefinitions).map(([key, value]) => <SelectItem key={key} value={key}>{value.label}{key === 'whole' ? ' · larger download' : ''}</SelectItem>)}</SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={onClose}><ArrowLeft />Back to atlas</Button>
      </div>
      {blocked ? <section className="um-specimen-link-warning" role="alert">
        <h2>This specimen link cannot be opened</h2>
        <p>{resolved.reason === 'source-changed' || resolved.reason === 'revision-changed' ? 'Its source model or study revision differs from the current specimen.' : 'It is incomplete or does not match the specified structure and study.'} No alternative structure has been selected.</p>
        <p>Choose another region above, or explicitly open the current source view to make a new link.</p>
        <Button variant="outline" onClick={() => setIgnoreLink(true)}>Open current source view</Button>
      </section> : <KneeSpecimenView key={scope} specimen={specimen} initialNavigation={!ignoreLink && resolved.status === 'ready' ? resolved : undefined} />}
    </DialogContent>
  </Dialog>;
}
