'use client';
import { useMemo, useState } from 'react';
import type { BodyCatalog } from './body-types';
import type { NestedImagingTopic } from '@/content/nested-teaching';
import type { NestedRequest } from '@/lib/nested-anatomy';
import {
  componentImagingTargets,
  isComponentImagingTopic,
} from '@/lib/component-imaging-navigation';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import './component-imaging-notes.css';

export function ComponentImagingNotes({
  catalog,
  parentId,
  topic,
  side,
  disabled,
  onOpen,
}: {
  catalog: BodyCatalog;
  parentId: string;
  topic: string;
  side: string;
  disabled: boolean;
  onOpen: (
    request: NestedRequest,
    launcher: HTMLButtonElement,
    topic: NestedImagingTopic,
  ) => void;
}) {
  const targets = useMemo(
    () =>
      disabled ? [] : componentImagingTargets(catalog, parentId, topic, side),
    [catalog, parentId, topic, side, disabled],
  );
  const [choice, setChoice] = useState('');
  const keyOf = (target: NestedRequest) =>
    `${target.study}:${target.structureId}`;
  const target = targets.find((entry) => keyOf(entry) === choice) ?? targets[0];
  if (!target || disabled || !isComponentImagingTopic(topic)) return null;
  const label =
    topic === 'ultrasound'
      ? 'Ultrasound'
      : topic === 'xray'
        ? 'X-ray'
        : topic.toUpperCase();
  return (
    <details className="component-imaging-notes">
      <summary>
        {label} component notes · {targets.length}
      </summary>
      <p>
        Draft notes for individual parts, not a whole-organ lesson or scan
        access.
      </p>
      <Select
        value={keyOf(target)}
        onValueChange={(value) => {
          if (targets.some((entry) => keyOf(entry) === value))
            setChoice(value!);
        }}
      >
        <SelectTrigger aria-label={`${label} component lesson`}>
          <SelectValue>
            {target.structure.name} · {target.title}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {targets.map((entry) => (
            <SelectItem key={keyOf(entry)} value={keyOf(entry)}>
              {entry.structure.name} · {entry.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        variant="outline"
        onClick={(event) => {
          if (!disabled) onOpen(target, event.currentTarget, topic);
        }}
      >
        Open {label} notes in dissection
      </Button>
    </details>
  );
}
