import type { SpecimenDepthLesson } from '../content/um-calf-depth';

// Region-specific draft scope, not new anatomy identity or an imaging approval.
// The legacy calf record has no scope property; preserve its exact lesson bytes.
const scopes = {
  'calf-depth': { revisions: ['um-calf-depth-20261005-v1'], name: 'Calf' },
  'thigh-depth': { revisions: ['um-thigh-depth-20261005-v1', 'um-deep-hip-depth-20261005-v1'], name: 'Hip/thigh' },
} as const;
export function specimenDepthReviewScope(depth: SpecimenDepthLesson | undefined) {
  if (!depth || depth.status !== 'draft') return null;
  const scope = depth.reviewScope ?? 'calf-depth';
  return Object.hasOwn(scopes, scope) && (scopes[scope].revisions as readonly string[]).includes(depth.revision) ? scope : null;
}
export function specimenDepthReviewName(depth: SpecimenDepthLesson) {
  const scope = specimenDepthReviewScope(depth);
  return scope ? scopes[scope].name : null;
}
