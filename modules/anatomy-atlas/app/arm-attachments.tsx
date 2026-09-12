'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { armAttachmentInfo } from '@/lib/arm-attachments';
import { armAttachmentReference } from '@/content/arm-attachments';
import { makeStudyLink, type StudySide } from '@/lib/study-links';
import type { BodyCatalog } from './body-types';

export function ArmAttachments({
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
    () => armAttachmentInfo(catalog, region, side, selectedId, disabled),
    [catalog, region, side, selectedId, disabled],
  );
  if (!info) return null;
  const fullHref = !info.completeHere
    ? makeStudyLink(catalog, 'whole-body', selectedId, side as StudySide)
    : null;
  return (
    <details key={selectedId} className="body-study-tools body-motor-explorer">
      <summary>Muscle attachment relationships</summary>
      <p>
        {info.selected.name} · bony attachment teaching, not a verified donor
        footprint.
      </p>
      <Button size="sm" variant="outline" onClick={onShow}>
        {info.completeHere
          ? 'Show muscle with attachment bones'
          : 'Show muscle with available attachment bones'}
      </Button>
      {!info.completeHere && (
        <p>
          One attachment bone is outside this region.{' '}
          {fullHref && (
            <Link href={fullHref} prefetch={false}>
              Open this muscle in whole body
            </Link>
          )}{' '}
          to show both relationships.
        </p>
      )}
      <ul className="body-motor-targets">
        {info.rows.map((row) => (
          <li key={row.role}>
            <strong>
              {row.role === 'proximal'
                ? 'Proximal / origin'
                : 'Distal / insertion'}
            </strong>
            <p>{row.site}</p>
            {row.availableHere ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onSelect(row.structure.id)}
              >
                {row.structure.name}
              </Button>
            ) : (
              <span>{row.structure.name} · outside this region</span>
            )}
          </li>
        ))}
      </ul>
      <details>
        <summary>Scope, limits & reference</summary>
        <p>
          Whole bones are selected; these are not marked attachment coordinates.
          Tendon, fascia, capsule, labral and aponeurotic contributions are not
          exhaustively mapped. No new tissue, simulated motion, tear, or CT/MRI
          registration is generated. Specialist review pending.
        </p>
        <p>
          Show resets separation, cutaway and camera. Dissection Undo restores
          layers/removals, not camera or system switches. Selecting a bone
          restores it if hidden. Left/Right remains available.
        </p>
        <a href={armAttachmentReference.url} target="_blank" rel="noreferrer">
          {armAttachmentReference.title} ↗
        </a>
      </details>
    </details>
  );
}
