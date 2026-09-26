'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ClinicalReviewEntry } from '@/lib/clinical-review-index';
import { clinicalStatusLabels, parseClinicalStatusPage, type ClinicalStatusItem } from '@/lib/clinical-review-status';

export function ClinicalReviewResults({ entries, query }: { entries: ClinicalReviewEntry[]; query: string }) {
  const [attempt, setAttempt] = useState(0);
  const [snapshot, setSnapshot] = useState<{ items: ClinicalStatusItem[]; message: string; loading: boolean }>({
    items: [], message: 'Loading your saved decisions…', loading: true,
  });
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    void (async () => {
      try {
        const response = await fetch('/api/review-overview' + query, {
          credentials: 'same-origin', cache: 'no-store', signal: controller.signal,
        });
        if (!active) return;
        if (response.status === 401) {
          setSnapshot({ items: [], message: 'Sign in through a review workspace to see your saved decisions.', loading: false });
          return;
        }
        if (!response.ok) throw Error('Status request failed');
        const items = parseClinicalStatusPage(await response.json(), entries.map(entry => entry.key));
        if (active) setSnapshot({ items, message: 'Your saved decisions — a snapshot, not institutional or publication approval.', loading: false });
      } catch {
        if (active) setSnapshot({ items: [], message: 'Saved status is unavailable. Open the review workspace or retry; no decisions have changed.', loading: false });
      }
    })();
    return () => { active = false; controller.abort(); };
  }, [query, entries, attempt]);

  return <>
    <div className="clinical-review-status-bar">
      <output>{snapshot.message}</output>
      <button type="button" onClick={() => {
        setSnapshot({ items: [], message: 'Loading your saved decisions…', loading: true });
        setAttempt(value => value + 1);
      }} disabled={snapshot.loading}>Refresh status</button>
    </div>
    <ul className="clinical-review-results">
      {entries.map((entry, index) => {
        const saved = snapshot.items[index];
        return <li key={entry.key}>
          <Link href={entry.href}>
            <span><strong>{entry.name}</strong><small>{entry.context} · {entry.laterality}</small>
              <span className="clinical-review-statuses">
                {(['geometry', 'teaching'] as const).map(track => <span key={track} data-status={saved?.[track] ?? 'unavailable'}>
                  {track === 'geometry' ? 'Anatomy' : 'Teaching'}: {saved ? clinicalStatusLabels[saved[track]] : 'Status not loaded'}
                </span>)}
              </span>
            </span>
            <span className="clinical-review-open">Open review <span aria-hidden="true">→</span></span>
          </Link>
        </li>;
      })}
    </ul>
    <p className="clinical-review-imaging-note">Acquired-image sign-off is separate; these anatomy and teaching statuses do not approve CT, MRI, X-ray or ultrasound images.</p>
  </>;
}
