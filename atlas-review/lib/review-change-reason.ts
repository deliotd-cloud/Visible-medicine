import { bodyReviewChanges, nestedReviewChanges, specimenReviewChanges, type ReviewChangeSummary } from './review-change-summary';
import type { BodyReviewContext, SavedBodyReview } from './body-review-decisions';
import type { NestedReviewContext, SavedNestedReview } from './nested-review';
import type { SpecimenReviewContext, SavedSpecimenReview } from './specimen-review';
import { canonicalSpecimenValue } from './specimen-links';
import type { ClinicalChangeReason } from './clinical-review-priority';

type Pair = [SavedBodyReview, BodyReviewContext] | [SavedNestedReview, NestedReviewContext] | [SavedSpecimenReview, SpecimenReviewContext];
async function digest(value: unknown, canonical: boolean) {
  const text = canonical ? canonicalSpecimenValue(JSON.parse(JSON.stringify(value))) : JSON.stringify(value);
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const state = (summary: ReviewChangeSummary, key: ReviewChangeSummary['comparisons'][number]['key']) =>
  summary.comparisons.find(item => item.key === key)?.state;

/** Recorded revision metadata only; never a content diff or clinical severity. */
export async function reviewChangeReason(kind: 'body' | 'nested' | 'specimen',
  saved: Pair[0], context: Pair[1], track: 'geometry' | 'teaching'): Promise<ClinicalChangeReason> {
  const summary = kind === 'body'
    ? bodyReviewChanges(saved as SavedBodyReview, context as BodyReviewContext, track)
    : kind === 'nested'
      ? nestedReviewChanges(saved as SavedNestedReview, context as NestedReviewContext, track)
      : specimenReviewChanges(saved as SavedSpecimenReview, context as SpecimenReviewContext, track);
  if (!summary || summary.comparisons.length !== 6) return 'unavailable';
  if (state(summary, 'source') === 'changed' || state(summary, 'teaching') === 'changed')
    return 'source-or-teaching';
  if (state(summary, 'source') !== 'same' || state(summary, 'teaching') !== 'same') return 'unavailable';
  if (state(summary, 'checklist') === 'changed') return 'other-review-material';
  if (state(summary, 'checklist') !== 'same') return 'unavailable';
  if (track !== 'geometry' || state(summary, 'renderer') !== 'changed' || state(summary, 'track') !== 'changed')
    return state(summary, 'material') === 'changed' ? 'other-review-material' : 'unavailable';
  if (!saved.revisionHash || !same(saved.checklist, context.checklists.geometry) ||
      saved.checklistVersion !== context.checklistVersion) return 'unavailable';
  if (kind === 'body') {
    const old = await digest({ catalogScope: context.catalogScope, structureId: context.structureId,
      checklistVersion: context.checklistVersion, source: context.sourceHash,
      renderer: saved.material.rendererHash, checks: context.checklists.geometry }, false);
    return old === saved.revisionHash && saved.material.materialHash === context.materialHash ? 'viewer-only' : 'unavailable';
  }
  const identity = kind === 'nested'
    ? { catalogScope: context.catalogScope, nestedKey: (context as NestedReviewContext).nestedKey,
      sourceFrame: (context as NestedReviewContext).sourceFrame, structureId: context.structureId,
      checklistVersion: context.checklistVersion }
    : { catalogScope: context.catalogScope, specimenKey: (context as SpecimenReviewContext).specimenKey,
      sourceFrame: (context as SpecimenReviewContext).sourceFrame, structureId: context.structureId,
      checklistVersion: context.checklistVersion };
  const oldRevision = await digest({ identity, sourceHash: context.sourceHash,
    renderer: saved.material.rendererHash, checklist: context.checklists.geometry }, true);
  const oldMaterial = await digest({ identity, sourceHash: context.sourceHash,
    teachingHash: context.teachingHash, renderer: saved.material.rendererHash,
    checklist: context.checklists }, true);
  return oldRevision === saved.revisionHash && oldMaterial === saved.material.materialHash
    ? 'viewer-only' : 'unavailable';
}
