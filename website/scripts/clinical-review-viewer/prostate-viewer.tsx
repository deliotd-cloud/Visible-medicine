import { useRef, useState } from 'react';
import ProstateZones from '../../atlas-review/app/prostate-zones';
import raw from '../../atlas-review/public/models/bodyparts3d/full-body/catalog.json';
import type { BodyCatalog } from '../../atlas-review/app/body-types';
import { bodyDisplayCatalog } from '../../atlas-review/lib/body-display-catalog';
import { prostateZonesAvailable } from '../../atlas-review/lib/prostate-zones';
import { parseProstateReviewLink } from '../../lib/prostate-review-link';
import './prostate-viewer.css';

const parents = bodyDisplayCatalog(raw as unknown as BodyCatalog).structures.filter(prostateZonesAvailable);

/** Inspection reuses the real study; it does not connect a learner imaging session. */
export default function ProstateReviewViewer({ search }: { search: string }) {
  const [open, setOpen] = useState(true);
  const reopen = useRef<HTMLButtonElement>(null);
  if (!parseProstateReviewLink(search) || parents.length !== 1)
    return <p role="alert">This prostate review link is stale or its exact parent is unavailable. Return to the review inbox; no substitute model was loaded.</p>;
  return <main className="body-app review-prostate-model" data-presentation="panel">{open ? <ProstateZones parent={parents[0]} onClose={() => {
    setOpen(false); requestAnimationFrame(() => reopen.current?.focus({ preventScroll: true }));
  }} /> : <button ref={reopen} type="button" onClick={() => setOpen(true)}>Reopen prostate model</button>}</main>;
}
