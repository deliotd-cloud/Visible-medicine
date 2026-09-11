'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { venousDrainageNeighbours } from '@/lib/venous-drainage';
import { makeStudyLink, type StudySide } from '@/lib/study-links';
import type { BodyCatalog } from './body-types';

export function VenousDrainage({
  catalog,
  region,
  side,
  selectedId,
  disabled,
  onSelect,
  onShow,
}: {
  catalog: BodyCatalog;
  region: string;
  side: string;
  selectedId: string;
  disabled: boolean;
  onSelect: (id: string) => void;
  onShow: () => void;
}) {
  const info = useMemo(
    () => venousDrainageNeighbours(catalog, region, side, selectedId, disabled),
    [catalog, region, side, selectedId, disabled],
  );
  if (!info) return null;
  const portal = info.territory === 'portal venous';
  const headings = { receives: 'Receives from', outlet: 'Drains towards' };
  const kinds = {
    tributary: 'Tributary',
    continuation: 'Continuation',
    confluence: 'Confluence',
    'via-unmodelled': 'Unmodelled part of route',
    variable: 'One pattern · variable termination',
  };
  return (
    <details className="body-study-tools body-motor-explorer">
      <summary>{portal ? 'Portal venous drainage' : 'Venous drainage'}</summary>
      <p>
        {info.selected.name} · common drainage relationships, not measured flow
        or verified donor junctions.
      </p>
      <p>{info.note}</p>
      <Button size="sm" variant="outline" onClick={onShow}>
        Show available veins & bones
      </Button>
      {(['receives', 'outlet'] as const).map((direction) => {
        const rows = info.rows.filter((r) => r.direction === direction);
        if (!rows.length) return null;
        return (
          <section key={direction} aria-label={headings[direction]}>
            <h4>{headings[direction]}</h4>
            <ul className="body-motor-targets">
              {rows.map((row) => {
                const href = !row.availableHere
                  ? makeStudyLink(
                      catalog,
                      'whole-body',
                      row.structure.id,
                      side as StudySide,
                    )
                  : null;
                return (
                  <li key={row.structure.id}>
                    {row.availableHere ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onSelect(row.structure.id)}
                      >
                        {row.structure.name}
                      </Button>
                    ) : href ? (
                      <Link href={href} prefetch={false}>
                        {row.structure.name} · open whole body
                      </Link>
                    ) : (
                      <span>
                        {row.structure.name} · unavailable in this region
                      </span>
                    )}
                    <p>
                      {kinds[row.kind]}. {row.note}
                    </p>
                    {!row.availableHere && (
                      <small>
                        Outside this regional view; opening the whole body
                        changes the study.
                      </small>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      {!info.rows.some((r) => r.direction === 'outlet') && (
        <p>
          The onward destination is not a selectable connection in this map;
          this does not mean the vein ends blindly.
        </p>
      )}
      <p>
        Missing tributaries are not presumed absent. No connecting tube, valve,
        reflux, thrombus or scan correspondence is generated.
      </p>
      <details>
        <summary>Limits & references</summary>
        <p>
          Specialist review pending.{' '}
          {portal
            ? 'Sinusoids, collaterals, smaller tributaries and a complete pancreaticoduodenal network are not supplied by this portal map. Hepatic venous outflow is a separate circuit.'
            : 'Intracranial sinuses, portal pathways, pulmonary and cardiac drainage are not supplied by this systemic map.'}
          Whole source surfaces stay unchanged.
        </p>
        <p>
          Show veins resets separation, cutaway and camera. Dissection Undo
          restores layers/removals, not camera or system switches. Selecting a
          neighbour restores it if hidden.
        </p>
        {Object.entries(info.references).map(([i, url]) => (
          <a key={url} href={url} target="_blank" rel="noreferrer">
            Reference {Number(i) + 1} ↗
          </a>
        ))}
      </details>
    </details>
  );
}
