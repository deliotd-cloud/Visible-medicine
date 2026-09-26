'use client';
import { useMemo, useState } from 'react';
import { Button } from '@/atlas-review/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/atlas-review/components/ui/select';
import { specimenMotorGroups } from '@/atlas-review/lib/um-limb-motor';
import { motorReference, motorVariationReference } from '@/atlas-review/content/um-limb-motor';
import type { SpecimenDefinition } from '@/atlas-review/lib/independent-specimen';

export function SpecimenMotorExplorer({ definition, selectedId, onSelect, onExplore }: {
  definition: SpecimenDefinition; selectedId: string | null; onSelect: (id: string) => void; onExplore: (nerve: string) => void;
}) {
  const groups = useMemo(() => specimenMotorGroups(definition), [definition]);
  const [choice, setChoice] = useState('');
  const group = groups.find(g => g.key === choice);
  if (!groups.length) return null;
  return <details className="um-knee-details um-limb-motor">
    <summary>Muscles by nerve</summary>
    <p>Explore typical motor supply. Nerves themselves are not modelled.</p>
    <Select value={group?.key ?? ''} onValueChange={v => { if (groups.some(g => g.key === v)) setChoice(v!); }}>
      <SelectTrigger aria-label="Motor nerve group"><SelectValue placeholder="Choose a nerve…" /></SelectTrigger>
      <SelectContent>{groups.map(g => <SelectItem key={g.key} value={g.key}>{g.label} · {g.targets.length}</SelectItem>)}</SelectContent>
    </Select>
    {group && <>
      <p>{group.note}</p>
      <p>{group.targets.length} source muscle selection{group.targets.length === 1 ? '' : 's'} available in this region. Not a complete nerve territory.</p>
      <Button size="sm" variant="outline" onClick={() => onExplore(group.key)}>Show these muscles & bones</Button>
      <ul className="eye-layer-list um-knee-list">{group.targets.map(({ surface, supply }) => <li key={surface.id}>
        <div><Button size="sm" variant={selectedId === surface.id ? 'secondary' : 'ghost'} aria-pressed={selectedId === surface.id} onClick={() => onSelect(surface.id)}>{surface.name}</Button>
          {supply.part && <p className="um-source-caution">{supply.part} only · whole source surface shown; territory is not segmented.</p>}
          {supply.caveat && <p>{supply.caveat}</p>}
        </div>
      </li>)}</ul>
      <p>Showing the group changes tissue visibility; Undo restores your dissection. Choose a muscle, then open Learn for its notes.</p>
    </>}
    <details><summary>Limits & references</summary>
      <p>Teaching draft. These are typical relationships, not findings in this donor. No nerve course, sensory map, lesion simulation, motor territory or scan alignment is supplied. The muscle notes contain further references.</p>
      <p><a href={motorReference} target="_blank" rel="noreferrer">Texas Tech Health El Paso · lower-limb anatomy</a></p>
      <p><a href={motorVariationReference} target="_blank" rel="noreferrer">Primary study · variations in deep-hip motor supply</a></p>
    </details>
  </details>;
}
