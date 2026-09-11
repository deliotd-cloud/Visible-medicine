'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { arterialNeighbours } from '@/lib/arterial';
import { makeStudyLink, type StudySide } from '@/lib/study-links';
import type { BodyCatalog } from './body-types';

export function ArterialConnections({
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
    () => arterialNeighbours(catalog, region, side, selectedId, disabled),
    [catalog, region, side, selectedId, disabled],
  );
  if (!info) return null;
  const headings = {
    upstream: 'Upstream',
    downstream: 'Downstream',
    communication: 'Communicating artery',
    alternative: 'Alternative origins · donor pattern unresolved',
  };
  const kinds = {
    branch: 'Branch',
    continuation: 'Continuation',
    'via-unmodelled': 'Via unmodelled segment',
    anastomosis: 'Anastomosis · no flow direction assigned',
    variant: 'Alternative route · not simultaneous connections',
  };
  return (
    <details className="body-study-tools body-motor-explorer">
      <summary>Arterial connections</summary>
      <p>
        {info.selected.name} · typical {info.territory} relationships, not
        verified donor connections.
      </p>
      <p>{info.note}</p>
      <Button size="sm" variant="outline" onClick={onShow}>
        Show available connections & bones
      </Button>
      {(
        ['upstream', 'downstream', 'communication', 'alternative'] as const
      ).map((direction) => {
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
      <p>
        Only listed source selections are included. Unlisted branches are not
        presumed absent. No new connecting tube, vessel lumen, flow, stenosis or
        scan registration is generated.
      </p>
      <details>
        <summary>Limits & references</summary>
        <p>
          Specialist review pending. Show connections resets cutaway, separation
          and camera; Dissection Undo restores layers/removals, not camera or
          system switches. Selecting a neighbour restores that source if hidden.
          Other regions open through a source-bound link.
        </p>
        {info.references.map((url, i) => (
          <a key={url} href={url} target="_blank" rel="noreferrer">
            Reference {i + 1} ↗
          </a>
        ))}
      </details>
    </details>
  );
}
