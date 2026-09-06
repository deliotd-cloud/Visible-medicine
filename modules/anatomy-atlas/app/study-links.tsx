'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  makeStudyLink,
  studyDestinations,
  type StudySide,
} from '../lib/study-links';
import type { BodyCatalog, BodyStructure } from './body-types';

export function StudyLinks({
  catalog,
  selected,
  region,
  side,
  focusId,
}: {
  catalog: BodyCatalog;
  selected: BodyStructure;
  region: string;
  side: StudySide;
  focusId: string | null;
}) {
  const [copyState, setCopyState] = useState<{
    href: string;
    copied: boolean;
  } | null>(null);
  const destinations = useMemo(
    () => studyDestinations(catalog, selected, region, side),
    [catalog, selected, region, side],
  );
  const current =
    makeStudyLink(catalog, region, selected.id, side, focusId) ??
    makeStudyLink(catalog, region, selected.id, side);
  async function copyLink() {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(
        new URL(current, window.location.origin).href,
      );
      setCopyState({ href: current, copied: true });
    } catch {
      setCopyState({ href: current, copied: false });
    }
  }
  return (
    <details className="anatomy-study-links">
      <summary>Continue this dissection</summary>
      <p>
        Keep <strong>{selected.name}</strong> selected when moving between the
        whole body and its available regions.
      </p>
      <ul className="anatomy-study-destinations">
        {destinations.map((destination) => (
          <li key={destination.region}>
            <Link href={destination.href} prefetch={false}>
              {destination.name} · keep selection
            </Link>
            {destination.focuses.length > 0 && (
              <details>
                <summary>
                  {destination.focuses.length} focused study{' '}
                  {destination.focuses.length === 1 ? 'view' : 'views'}
                </summary>
                <ul>
                  {destination.focuses.map((view) => (
                    <li key={view.focusId}>
                      <Link href={view.href} prefetch={false}>
                        {view.title}
                        <small>Selection is a study {view.role}</small>
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </li>
        ))}
      </ul>
      <p className="anatomy-study-link-note">
        Links open assembled anatomy or a named focus. Use Saved study views to
        preserve custom removals, cutaways and camera positions. Links never
        contain practice results or review records. Access stays private.
      </p>
      {current && (
        <div className="anatomy-study-link-copy">
          <Button size="sm" variant="outline" onClick={copyLink}>
            Copy this study link
          </Button>
          <a href={current}>Open linked view</a>
          <output aria-live="polite">
            {copyState?.href === current
              ? copyState.copied
                ? 'Study link copied. It does not grant access.'
                : 'Copy is unavailable. Use Open linked view, then copy the address.'
              : ''}
          </output>
        </div>
      )}
    </details>
  );
}
