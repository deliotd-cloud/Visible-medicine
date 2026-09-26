'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getReviewStatus } from '@/atlas-review/lib/review-status';
import { decisionLabel, type SavedReview } from '@/atlas-review/lib/review-workspace';

export function ReviewStatus({
  structureId,
  teachingDraft = false,
  connected = true,
}: {
  structureId: string;
  teachingDraft?: boolean;
  connected?: boolean;
}) {
  const review = getReviewStatus(structureId, teachingDraft);
  const [saved, setSaved] = useState<SavedReview[]>([]);
  const [state, setState] = useState<'loading' | 'loaded' | 'unavailable'>(
    'loading',
  );
  useEffect(() => {
    if (!teachingDraft || !connected) return;
    let active = true;
    fetch('/api/atlas-review/reviews', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unavailable');
        const data = (await response.json()) as { reviews: SavedReview[] };
        if (active) {
          setSaved(data.reviews);
          setState('loaded');
        }
      })
      .catch(() => {
        if (active) setState('unavailable');
      });
    return () => {
      active = false;
    };
  }, [teachingDraft, connected]);
  const status = (track: 'geometry' | 'teaching' | 'imaging') => {
    if (!teachingDraft) return review[track].status;
    if (!connected) return 'Review records are held in the separate atlas workspace';
    if (state === 'loading') return 'Loading saved status';
    if (state === 'unavailable') return 'Saved status unavailable';
    const record = saved.find(
      (r) => r.structureId === structureId && r.track === track,
    );
    return record ? decisionLabel(record) : review[track].status;
  };
  return (
    <details className="vm-review-status">
      <summary>Review status · not clinical certification</summary>
      <dl>
        <div>
          <dt>Geometry</dt>
          <dd>{status('geometry')}</dd>
        </div>
        <div>
          <dt>Teaching</dt>
          <dd>{status('teaching')}</dd>
        </div>
        <div>
          <dt>Imaging</dt>
          <dd>{status('imaging')}</dd>
        </div>
      </dl>
      <p>
        Source attribution is not clinical approval.{' '}
        {teachingDraft
          ? 'These are your private shoulder-pilot review records, not an atlas-wide release decision.'
          : 'The whole-body display is outside the shoulder review scope.'}
      </p>
      {teachingDraft && (
        <Link href={`/workspace/atlas-review/shoulder?structure=${encodeURIComponent(structureId)}`}>
          Open this structure’s review →
        </Link>
      )}
    </details>
  );
}
