'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { armAttachmentInfo } from '@/lib/arm-attachments';
import { thighAttachmentInfo } from '@/lib/thigh-attachments';
import { neckAttachmentInfo } from '@/lib/neck-attachments';
import { forearmAttachmentInfo } from '@/lib/forearm-attachments';
import { legAttachmentInfo } from '@/lib/leg-attachments';
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
    () =>
      armAttachmentInfo(catalog, region, side, selectedId, disabled) ??
      thighAttachmentInfo(catalog, region, side, selectedId, disabled) ??
      neckAttachmentInfo(catalog, region, side, selectedId, disabled) ??
      forearmAttachmentInfo(catalog, region, side, selectedId, disabled) ??
      legAttachmentInfo(catalog, region, side, selectedId, disabled),
    [catalog, region, side, selectedId, disabled],
  );
  if (!info) return null;
  const reference =
    'reference' in info ? info.reference : armAttachmentReference;
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
      <Button className="body-attachment-show" size="sm" variant="outline" onClick={onShow}>
        {info.completeHere
          ? 'Show muscle with attachment bones'
          : 'Show muscle with available attachment bones'}
      </Button>
      {!info.completeHere && (
        <p>
          Some attachment bones are outside this region.{' '}
          {fullHref && (
            <Link href={fullHref} prefetch={false}>
              Open this muscle in whole body
            </Link>
          )}{' '}
          then choose Show to see the complete bony relationship set.
        </p>
      )}
      <ul className="body-motor-targets">
        {info.rows.map((row) => (
          <li key={row.role}>
            <strong>
              {'label' in row
                ? row.label
                : row.role === 'proximal'
                  ? 'Proximal / origin'
                  : 'Distal / insertion'}
            </strong>
            <p>{row.site}</p>
            {('structures' in row ? row.structures : [row]).map((partner) => partner.availableHere ? (
              <Button
                key={partner.structure.id}
                size="sm"
                variant="ghost"
                onClick={() => onSelect(partner.structure.id)}
              >
                {partner.structure.name}
              </Button>
            ) : (
              <span className="body-attachment-unavailable" key={partner.structure.id}>{partner.structure.name} · outside this region</span>
            ))}
          </li>
        ))}
      </ul>
      {'note' in info && info.note && <p>{info.note}</p>}
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
        <a href={reference.url} target="_blank" rel="noreferrer">
          {reference.title} ↗
        </a>
        {'references' in info && info.references.filter(url => url !== reference.url).map((url, index) => (
          <p key={url}><a href={url} target="_blank" rel="noreferrer">Additional attachment reference {index + 1} ↗</a></p>
        ))}
      </details>
    </details>
  );
}
