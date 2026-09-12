'use client';
import { useId, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { filterSpecimen, type SpecimenDefinition } from '@/lib/independent-specimen';

/** Filtering changes the list only; visibility and selection remain explicit actions. */
export function SpecimenStructureSearch({
  specimen, query, onQueryChange, selectedId, hidden, onSelect, onVisibility,
}: {
  specimen: SpecimenDefinition;
  query: string;
  onQueryChange: (query: string) => void;
  selectedId: string | null;
  hidden: string[];
  onSelect: (id: string) => void;
  onVisibility: (id: string, visible: boolean) => void;
}) {
  const statusId = useId();
  const input = useRef<HTMLInputElement>(null);
  const results = filterSpecimen(specimen, query);
  const hiddenMatches = results.filter((surface) => hidden.includes(surface.id)).length;
  return <>
    <Input ref={input} type="search"
      aria-label={`Search ${specimen.label.toLowerCase()} specimen structures`}
      aria-describedby={query ? statusId : undefined}
      placeholder="Name, side or anatomical ID…" value={query}
      onChange={(event) => onQueryChange(event.target.value)} />
    {query && <div className="um-specimen-search-status">
      <p id={statusId} role="status" aria-live="polite" aria-atomic="true">
        {results.length} of {specimen.surfaces.length} structures
        {hiddenMatches > 0 && ` · ${hiddenMatches} hidden`}
      </p>
      <Button size="sm" variant="ghost" onClick={() => {
        onQueryChange(''); input.current?.focus();
      }}>Clear search</Button>
    </div>}
    <ul className="eye-layer-list um-knee-list">{results.map((surface) => <li key={surface.id}>
      <Button size="sm" variant={selectedId === surface.id ? 'secondary' : 'ghost'}
        aria-pressed={selectedId === surface.id} onClick={() => onSelect(surface.id)}>
        {surface.name}
      </Button>
      <Switch checked={!hidden.includes(surface.id)} aria-label={`Show ${surface.name}`}
        onCheckedChange={(visible) => onVisibility(surface.id, visible)} />
    </li>)}</ul>
    {!results.length && <p>No matching tissue in this specimen. Try a name, side or an assigned anatomical ID.</p>}
  </>;
}
