'use client';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { limbDefinitions, type LimbScope } from '@/lib/um-limb-studies';
import { KneeSpecimenView } from './um-knee-study';

export default function LimbSpecimenDialog({ initialRegion, onClose }: { initialRegion: string; onClose: () => void }) {
  const [scope, setScope] = useState<LimbScope>(initialRegion === 'foot' ? 'foot' : ['pelvis', 'thigh'].includes(initialRegion) ? 'hip-thigh' : 'knee');
  const specimen = limbDefinitions[scope];
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="eye-layers-dialog um-knee-dialog" showCloseButton={false}>
      <div className="eye-layer-heading brain-study-heading">
        <div><DialogTitle>Lower limb · independent specimen</DialogTitle>
          <DialogDescription>Right-limb source · Clinical validation pending · Separate from the body atlas</DialogDescription></div>
        <Select value={scope} onValueChange={(next) => { if (next && Object.hasOwn(limbDefinitions, next)) setScope(next as LimbScope); }}>
          <SelectTrigger aria-label="Independent specimen region"><SelectValue /></SelectTrigger>
          <SelectContent>{Object.entries(limbDefinitions).map(([key, value]) => <SelectItem key={key} value={key}>{value.label}{key === 'whole' ? ' · larger download' : ''}</SelectItem>)}</SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={onClose}><ArrowLeft />Back to atlas</Button>
      </div>
      <KneeSpecimenView key={scope} specimen={specimen} />
    </DialogContent>
  </Dialog>;
}
