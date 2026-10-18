import { bodyReviewStale, type BodyReviewContext, type BodyReviewTrack, type SavedBodyReview } from './body-review-decisions';
import { nestedReviewStale, type NestedReviewContext, type NestedReviewTrack, type SavedNestedReview } from './nested-review';
import { specimenReviewStale, type SpecimenReviewContext, type SpecimenReviewTrack, type SavedSpecimenReview } from './specimen-review';

type Context = BodyReviewContext | NestedReviewContext | SpecimenReviewContext;
type Saved = SavedBodyReview | SavedNestedReview | SavedSpecimenReview;
type Track = BodyReviewTrack;
type Kind = 'body' | 'nested' | 'specimen';
export type ReviewChangeSummary = {
  headline: string;
  explanation: string;
  comparisons: {
    key: 'source' | 'teaching' | 'renderer' | 'checklist' | 'material' | 'track';
    label: string;
    state: 'same' | 'changed' | 'unavailable';
  }[];
};

const unavailable = (): ReviewChangeSummary => ({
  headline: 'Saved review cannot be compared',
  explanation: 'Refresh saved records for this exact selection and track. The saved metadata is unavailable or belongs to a different review scope; no prior contents or approval are inferred.',
  comparisons: [],
});
const hash = (value: unknown) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const tabs = (value: unknown): value is string[] => Array.isArray(value) && value.length <= 64 && value.every(tab => typeof tab === 'string');
const checklist = (value: unknown) => Array.isArray(value) && value.length <= 64 && value.every(item => item && typeof item.id === 'string' && typeof item.label === 'string');
const equals = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Presentation only. Existing stale rules decide whether a notice is needed.
 * Never authorizes a review, transfers approval, mutates a draft or reads storage. */
function compare(kind: Kind, saved: Saved | undefined, context: Context, track: Track, stale: () => boolean): ReviewChangeSummary | null {
  if (!saved) return null;
  const scope = { body: 'body-display-catalog', nested: 'nested-dissection', specimen: 'independent-specimen' }[kind];
  if (saved.eventSchema !== `vm-${kind}-review-event-1` || saved.catalogScope !== scope || context.catalogScope !== scope ||
      saved.structureId !== context.structureId || saved.track !== track || !['geometry', 'teaching', 'imaging'].includes(track)) return unavailable();
  if (kind === 'nested' && (!('nestedKey' in saved) || !('nestedKey' in context) || saved.nestedKey !== context.nestedKey || saved.sourceFrame !== context.sourceFrame)) return unavailable();
  if (kind === 'specimen' && (!('specimenKey' in saved) || !('specimenKey' in context) || saved.specimenKey !== context.specimenKey || saved.sourceFrame !== context.sourceFrame)) return unavailable();
  if (!saved.material || !context.revisions || !context.checklists ||
      ![saved.material.sourceHash, saved.material.teachingHash, saved.material.rendererHash, saved.material.materialHash,
        context.sourceHash, context.teachingHash, context.rendererHash, context.materialHash].every(hash) ||
      !(saved.revisionHash === null || hash(saved.revisionHash)) || !(context.revisions[track] === null || hash(context.revisions[track])) ||
      typeof saved.checklistVersion !== 'string' || typeof context.checklistVersion !== 'string' ||
      !checklist(saved.checklist) || !checklist(context.checklists[track]) || !tabs(saved.material.teachingTabs) || !tabs(context.teachingTabs)) return unavailable();
  if (!stale()) return null;

  const changed = {
    source: saved.material.sourceHash !== context.sourceHash,
    teaching: saved.material.teachingHash !== context.teachingHash || !equals(saved.material.teachingTabs, context.teachingTabs),
    renderer: saved.material.rendererHash !== context.rendererHash,
    checklist: saved.checklistVersion !== context.checklistVersion || !equals(saved.checklist, context.checklists[track]),
    material: saved.material.materialHash !== context.materialHash,
    track: saved.revisionHash !== context.revisions[track],
  };
  const labels = { source: 'Anatomy source fingerprint', teaching: 'Teaching metadata', renderer: 'Viewer revision', checklist: 'Review checklist', material: 'Worksheet fingerprint', track: 'Selected track revision' };
  const comparisons = (Object.keys(labels) as (keyof typeof labels)[]).map(key => ({
    key, label: labels[key], state: key === 'track' && context.revisions[track] === null ? 'unavailable' as const : changed[key] ? 'changed' as const : 'same' as const,
  }));
  if (context.revisions[track] === null) return {
    headline: 'Current review track unavailable',
    explanation: 'There is no current review revision for this track. The saved record is historical; no current approval is inferred.',
    comparisons,
  };
  const headline = changed.source && changed.teaching ? 'Source and teaching revision metadata changed'
    : changed.source ? 'Anatomy source fingerprint changed'
    : changed.teaching ? 'Teaching revision metadata changed'
    : changed.checklist ? 'Review checklist changed'
    : changed.renderer ? 'Viewer revision changed; source and teaching fingerprints match'
    : changed.material ? 'Worksheet material fingerprint changed'
    : 'Review-track revision changed';
  return { headline, comparisons,
    explanation: 'These are recorded revision comparisons, not an old text diff or a clinical assessment. A viewer update does not by itself show a changed anatomical mesh. Review the current worksheet; this notice does not approve it or carry checklist confirmations forward.',
  };
}

export function bodyReviewChanges(saved: SavedBodyReview | undefined, context: BodyReviewContext, track: BodyReviewTrack) {
  return compare('body', saved, context, track, () => bodyReviewStale(saved!, context));
}
export function nestedReviewChanges(saved: SavedNestedReview | undefined, context: NestedReviewContext, track: NestedReviewTrack) {
  return compare('nested', saved, context, track, () => nestedReviewStale(saved!, context));
}
export function specimenReviewChanges(saved: SavedSpecimenReview | undefined, context: SpecimenReviewContext, track: SpecimenReviewTrack) {
  return compare('specimen', saved, context, track, () => specimenReviewStale(saved!, context));
}
