'use client';
import { useState } from 'react';
import { WorkspaceOnly } from './atlas-workspace';
import { ChevronRight, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { bodySystems, type BodyStructure } from './body-types';
import { vesselVisibilityGroups } from '@/lib/vessel-visibility';
import type { VesselKind } from '@/lib/anatomy-vessels';

type VesselControlsProps = {
  structures: BodyStructure[]; visibleIds: string[]; enabled: boolean; disabled: boolean;
  onEnabled: (value: boolean) => void;
  onVisibility: (kind: VesselKind, show: boolean) => void;
  canUndo: boolean; canRedo: boolean; onUndo: () => void; onRedo: () => void;
};
export function VesselVisibilityOptions({ structures, visibleIds, enabled, disabled, onVisibility, canUndo, canRedo, onUndo, onRedo }: VesselControlsProps) {
  const groups = vesselVisibilityGroups(structures, visibleIds);
  return <div className="vessel-system-options" role="group" aria-label="Vessel visibility">
    {groups.map(group => <label key={group.kind} className="vessel-system-option">
      <Checkbox checked={group.shown === group.total} indeterminate={group.shown > 0 && group.shown < group.total}
        disabled={disabled || !enabled} aria-label={`Show ${group.label.toLowerCase()}`}
        onCheckedChange={value => { if (!disabled && enabled) onVisibility(group.kind, value); }} />
      <span>{group.label}</span><small>{group.shown}/{group.total}</small>
    </label>)}
    <WorkspaceOnly modes={['dissect']}><div className="vessel-system-history">
      <Button type="button" size="sm" variant="outline" disabled={disabled || !canUndo}
        onClick={() => { if (!disabled && canUndo) onUndo(); }}>Undo</Button>
      <Button type="button" size="sm" variant="outline" disabled={disabled || !canRedo}
        onClick={() => { if (!disabled && canRedo) onRedo(); }}>Redo</Button>
    </div></WorkspaceOnly>
    <p>{enabled ? 'Show or hide this vessel type in the current region and side.' : 'Turn on Vessels to change these groups.'}</p>
  </div>;
}
export function VesselSystemControl(props: VesselControlsProps) {
  const { structures, visibleIds, enabled, disabled, onEnabled } = props;
  const [open, setOpen] = useState(false);
  const groups = vesselVisibilityGroups(structures, visibleIds);
  const total = groups.reduce((n, group) => n + group.total, 0);
  return <div className={`body-vessel-system ${enabled ? 'active' : ''}`}>
    <Network style={{ color: bodySystems.vessels.color }} />
    <Button type="button" variant="ghost" className="vessel-system-expand"
      aria-label="Vessels: artery and vein controls" aria-expanded={open}
      disabled={disabled || total === 0} onClick={() => { if (!disabled) setOpen(value => !value); }}>
      <span>Vessels <small>{total}</small></span>
      <ChevronRight aria-hidden="true" className={open ? 'expanded' : ''} />
    </Button>
    <Switch checked={enabled} disabled={disabled || total === 0}
      onCheckedChange={value => { if (!disabled) onEnabled(value); }} aria-label="Show Vessels" />
    {open && <VesselVisibilityOptions {...props} />}
  </div>;
}
