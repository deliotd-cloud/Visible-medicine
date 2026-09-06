import type { BodyStructure, BodySystem } from '../app/body-types';
import {
  stageStructures,
  type DissectionProfile,
} from '../app/dissection-data.ts';

/** Windows are independent visibility recipes, never extra numbered layers. */
export function dissectionSections(profile: DissectionProfile) {
  const hasPeels = profile.stages.some((stage) => stage.kind === 'peel');
  return {
    layers: hasPeels
      ? profile.stages.filter((stage) => stage.kind !== 'window')
      : [],
    windows: profile.stages.filter(
      (stage) => stage.kind === 'window' || !hasPeels,
    ),
  };
}

/** Compare actual enabled, non-removed catalogue IDs with the next recipe.
 * Stage changes enable all systems and clear manual overrides in the explorer.
 * Counts describe visibility state, not loading success or geometric occlusion.
 */
export function dissectionTransition(
  scope: BodyStructure[],
  profile: DissectionProfile,
  visibleIds: string[],
  stageId: string,
) {
  const stage = profile.stages.find((item) => item.id === stageId);
  if (!stage) return null;
  const before = new Set(visibleIds);
  const after = stageStructures(scope, profile, stageId);
  const afterIds = new Set(after.map((item) => item.id));
  return {
    stage,
    visible: after,
    removed: scope.filter(
      (item) => before.has(item.id) && !afterIds.has(item.id),
    ),
    restored: after.filter((item) => !before.has(item.id)),
    retained: after.filter((item) => before.has(item.id)),
  };
}

export function filterRemovedStructures(
  structures: BodyStructure[],
  query: string,
  system: BodySystem | 'all' = 'all',
) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return structures.filter((structure) => {
    if (system !== 'all' && structure.system !== system) return false;
    const searchable = [
      structure.name,
      structure.sourceName,
      structure.fmaId,
      structure.laterality,
    ]
      .join(' ')
      .toLowerCase();
    return words.every((word) => searchable.includes(word));
  });
}
