import type { BodyCatalog } from '../app/body-types';
import type { NestedImagingTopic } from '../content/nested-teaching';
import {
  nestedSideMatches,
  nestedStudyTargets,
  type NestedRequest,
} from './nested-anatomy';
import { nestedTeachingFor } from './nested-teaching';

export function isComponentImagingTopic(
  topic: string,
): topic is NestedImagingTopic {
  return (
    topic === 'ct' ||
    topic === 'mri' ||
    topic === 'xray' ||
    topic === 'ultrasound'
  );
}

/** Local teaching navigation only. A child lesson is neither whole-organ
 * coverage nor an imaging correspondence, scan or lecture entitlement. */
export function componentImagingTargets(
  catalog: BodyCatalog,
  parentId: string,
  topic: string,
  side: string,
) {
  if (!isComponentImagingTopic(topic)) return [];
  const parent = catalog.structures.find((s) => s.id === parentId);
  if (!parent) return [];
  // Inspect only this parent, not every body part on each information-tab render.
  return nestedStudyTargets({ ...catalog, structures: [parent] }).filter(
    (target) => {
      if (!nestedSideMatches(target.structure, side)) return false;
      const concept = nestedTeachingFor(
        parent,
        target.study,
        target.structure,
      );
      return concept?.imaging?.[topic]?.readiness === 'draft';
    },
  );
}

/** Re-resolve when opening; do not trust stale picker state or caller hashes. */
export function resolveComponentImagingTarget(
  catalog: BodyCatalog,
  request: NestedRequest,
  topic: string,
  side: string,
) {
  return (
    componentImagingTargets(catalog, request.parentId, topic, side).find(
      (target) =>
        target.study === request.study &&
        target.structureId === request.structureId &&
        target.sourceHash === request.sourceHash &&
        target.parentHash === request.parentHash,
    ) ?? null
  );
}
