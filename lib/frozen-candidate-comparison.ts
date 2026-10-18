import { validateCandidate, type ClinicalReviewCandidate, type PersonalReviewCandidate } from './clinical-review-candidate.ts';

export type FrozenComparisonPair = { current: PersonalReviewCandidate; previous: ClinicalReviewCandidate };

/** Both descriptors must be independently authentic before any relationship is trusted. */
export async function validateFrozenComparisonPair(current: unknown, previous: unknown): Promise<FrozenComparisonPair> {
  const [a, b] = await Promise.all([validateCandidate(current), validateCandidate(previous)]);
  if (a.decisionMode !== 'personal-review' || !a.supersedes || a.supersedes !== b.id || a.id === b.id)
    throw new Error('Invalid frozen comparison relationship.');
  const ids = (candidate: ClinicalReviewCandidate) => candidate.selections.map(s => s.structureId).sort();
  if (JSON.stringify(ids(a)) !== JSON.stringify(ids(b)))
    throw new Error('Frozen comparison selection scope differs.');
  return { current: a, previous: b };
}
