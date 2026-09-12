'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { footJointNeighbours } from '@/lib/foot-joints';
import { footJointReferences } from '@/content/foot-joints';
import { makeStudyLink, type StudySide } from '@/lib/study-links';
import type { BodyCatalog } from './body-types';

export function BoneJoints({
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
    () => footJointNeighbours(catalog, region, side, selectedId, disabled),
    [catalog, region, side, selectedId, disabled],
  );
  if (!info) return null;
  const references = [...new Set(info.rows.map((r) => r.reference))];
  return (
    <details className="body-study-tools body-motor-explorer">
      <summary>Ankle & foot joint partners</summary>
      <p>
        {info.selected.name} · anatomical teaching map, not verified donor
        contacts.
      </p>
      <Button size="sm" variant="outline" onClick={onShow}>
        Show available joint partners
      </Button>
      {(['synovial', 'syndesmosis', 'variable'] as const).map((kind) => {
        const rows = info.rows.filter((r) => r.kind === kind);
        if (!rows.length) return null;
        const heading = {
          synovial: 'Articulating bones',
          syndesmosis: 'Fibrous joint · not a synovial articulation',
          variable: 'Variable facets · donor pattern unresolved',
        }[kind];
        return (
          <section key={kind} aria-label={heading}>
            <h4>{heading}</h4>
            {kind === 'variable' && (
              <p>
                Not included by Show partners. Selecting a bone does not confirm
                this facet exists.
              </p>
            )}
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
                      <span>{row.structure.name} · unavailable here</span>
                    )}
                    <p>{row.label}</p>
                    {!row.availableHere && (
                      <small>
                        Outside this region; opens a different study.
                      </small>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      <details>
        <summary>Scope, limits & references</summary>
        <p>
          Ankle and foot only: knee and proximal tibiofibular relationships are
          outside this map. Bone pairs do not count separate facets or joint
          cavities. Hallux sesamoid partners remain unresolved in the source
          selection.
        </p>
        <p>
          No cartilage, ligament, joint-space measurement, motion or CT/MRI
          registration is generated. Talocalcaneal facets are not separated.
          Unlisted variants are not presumed absent. Specialist review pending.
        </p>
        <p>
          Show partners resets cutaway, separation and camera. Dissection Undo
          restores layers/removals, not camera or system switches. Selecting a
          partner restores that bone if hidden.
        </p>
        {references.map((key) => (
          <a
            key={key}
            href={footJointReferences[key].url}
            target="_blank"
            rel="noreferrer"
          >
            {footJointReferences[key].title} ↗
          </a>
        ))}
      </details>
    </details>
  );
}
