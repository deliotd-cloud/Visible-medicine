import type { InboxItem, InboxStatus } from './clinical-review-inbox-contract';

export type QuickReviewTrack = 'Anatomy' | 'Teaching';
export type QuickReviewSelection = {
  groups: string[];
  count: number;
  partial: boolean;
  item: InboxItem | null;
};

const priority: Partial<Record<InboxStatus, number>> = {
  'changes-required': 0,
  're-review': 1,
  'in-progress': 2,
  'not-started': 3,
};

/** Selects only loaded, validated structure decisions; never creates a review action. */
export function selectQuickReview(
  items: readonly InboxItem[],
  track: QuickReviewTrack,
  group: string | null,
  scanComplete: boolean,
): QuickReviewSelection {
  const eligible = items.filter(item => item.area === 'structures'
    && item.capability === 'decision'
    && /^[a-f0-9]{64}$/.test(item.revision ?? '')
    && item.trackLabel === track
    && Object.hasOwn(priority, item.status));
  const groups = [...new Set(eligible.map(item => item.scopeLabel))].sort((a, b) => a.localeCompare(b));
  const selected = group === null ? eligible : eligible.filter(item => item.scopeLabel === group);
  // Stable source order resolves equal status without inferring a clinical priority.
  const item = selected.reduce<InboxItem | null>((best, next) =>
    best === null || priority[next.status]! < priority[best.status]! ? next : best, null);
  return { groups, count: selected.length, partial: !scanComplete, item };
}
