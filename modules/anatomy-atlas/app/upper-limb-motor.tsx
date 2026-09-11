'use client';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { upperLimbMotorGroups } from '@/lib/upper-limb-motor';
import type { BodyCatalog } from './body-types';

export function UpperLimbMotorExplorer({
  catalog,
  region,
  side,
  selectedId,
  disabled,
  onSelect,
  onExplore,
}: {
  catalog: BodyCatalog;
  region: string;
  side: string;
  selectedId: string | null;
  disabled: boolean;
  onSelect: (id: string) => void;
  onExplore: (key: string) => void;
}) {
  const groups = useMemo(
    () => upperLimbMotorGroups(catalog, region, side),
    [catalog, region, side],
  );
  const [choice, setChoice] = useState('');
  const group = groups.find((g) => g.key === choice);
  if (!groups.length || disabled) return null;
  return (
    <details className="body-study-tools body-motor-explorer">
      <summary>Muscles by nerve</summary>
      <p>Typical motor supply · nerves are not modelled.</p>
      <Select
        value={group?.key ?? ''}
        onValueChange={(v) => {
          if (groups.some((g) => g.key === v)) setChoice(v!);
        }}
      >
        <SelectTrigger aria-label="Upper-limb motor nerve group">
          <SelectValue placeholder="Choose a nerve…" />
        </SelectTrigger>
        <SelectContent>
          {groups.map((g) => (
            <SelectItem key={g.key} value={g.key}>
              {g.label} · {g.targets.length}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {group && (
        <UpperLimbMotorDetails
          group={group}
          selectedId={selectedId}
          onSelect={onSelect}
          onExplore={onExplore}
        />
      )}
    </details>
  );
}

export function UpperLimbMotorDetails({
  group,
  selectedId,
  onSelect,
  onExplore,
}: {
  group: ReturnType<typeof upperLimbMotorGroups>[number];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onExplore: (key: string) => void;
}) {
  return (
    <>
      <p>{group.note}</p>
      <Button size="sm" variant="outline" onClick={() => onExplore(group.key)}>
        Show muscles & bones
      </Button>
      <p>
        {group.targets.length} source selections in this region and side filter;
        not a complete nerve territory.
      </p>
      <ul className="body-motor-targets">
        {group.targets.map(({ structure, supply }) => (
          <li key={structure.id}>
            <Button
              size="sm"
              variant={selectedId === structure.id ? 'secondary' : 'ghost'}
              aria-pressed={selectedId === structure.id}
              onClick={() => onSelect(structure.id)}
            >
              {structure.name}
            </Button>
            {supply.part && (
              <p>
                {supply.part}. Whole source shown, not a separately mapped
                territory.
              </p>
            )}
            {supply.caveat && <p>{supply.caveat}</p>}
          </li>
        ))}
      </ul>
      <p>
        Choose a muscle for its notes. Dissection Undo restores layers and
        removals; camera and system switches stay as set.
      </p>
      <details>
        <summary>Limits & references</summary>
        <p>
          Draft relationships, not findings in this donor. No nerve course,
          sensory field, lesion simulation or patient-scan mapping. Only muscles
          available in this region are listed.
        </p>
        {group.references.map((url, i) => (
          <a key={url} href={url} target="_blank" rel="noreferrer">
            Reference {i + 1} ↗
          </a>
        ))}
      </details>
    </>
  );
}
