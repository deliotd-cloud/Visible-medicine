import type { BodyStructure } from '../app/body-types';
import {
  matchesRule,
  stageStructures,
  type DissectionProfile,
} from '../app/dissection-data.ts';

export type StudyMembership = {
  focusId: string;
  title: string;
  role: 'target' | 'context';
  targets: BodyStructure[];
  context: BodyStructure[];
  visibleIds: string[];
};

/** Membership is authored study metadata, not an anatomical connection.
 * Automatic skeletal background is deliberately not a relationship claim.
 * The caller supplies the current region/side, never the entire source index.
 */
export function relatedStudyViews(
  scope: BodyStructure[],
  profile: DissectionProfile,
  selectedId: string | null,
): StudyMembership[] {
  const selected = scope.find((item) => item.id === selectedId);
  if (!selected) return [];
  return profile.focuses
    .flatMap((focus): StudyMembership[] => {
      const target = matchesRule(selected, focus.rule);
      const explicitContext = focus.context?.some((rule) =>
        matchesRule(selected, rule),
      );
      if (!target && !explicitContext) return [];
      const targets = scope.filter((item) => matchesRule(item, focus.rule));
      if (!targets.length) return [];
      const visibleIds = stageStructures(scope, profile, 'free', focus.id).map(item => item.id);
      // A source-bound recipe may reject stale, missing or duplicated inputs.
      // Do not offer a relationship that would open an empty/incompatible view.
      if (!visibleIds.includes(selected.id)) return [];
      const targetIds = new Set(targets.map((item) => item.id));
      return [
        {
          focusId: focus.id,
          title: focus.title,
          role: target ? 'target' : 'context',
          targets,
          context: scope.filter(
            (item) =>
              !targetIds.has(item.id) &&
              focus.context?.some((rule) => matchesRule(item, rule)),
          ),
          visibleIds,
        },
      ];
    })
    .sort(
      (a, b) =>
        Number(a.role === 'context') - Number(b.role === 'context') ||
        a.targets.length +
          a.context.length -
          (b.targets.length + b.context.length) ||
        a.title.localeCompare(b.title) ||
        a.focusId.localeCompare(b.focusId),
    );
}

/** Focus moves independently of selection; Enter/Space explicitly activates. */
export function structureNavigationIndex(
  key: string,
  index: number,
  count: number,
): number | null {
  if (!Number.isInteger(count) || count <= 0) return null;
  const current = Math.min(
    count - 1,
    Math.max(0, Number.isInteger(index) ? index : 0),
  );
  switch (key) {
    case 'ArrowDown':
      return Math.min(count - 1, current + 1);
    case 'ArrowUp':
      return Math.max(0, current - 1);
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return null;
  }
}

export function filterStudyStructures(
  scope: BodyStructure[],
  query: string,
  system = 'all',
  enabledIds?: ReadonlySet<string>,
) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return scope.filter((item) => {
    if (system !== 'all' && item.system !== system) return false;
    if (enabledIds && !enabledIds.has(item.id)) return false;
    const text = [
      item.id,
      item.name,
      item.sourceName,
      item.fmaId,
      item.laterality,
    ]
      .join(' ')
      .toLowerCase();
    return terms.every((term) => text.includes(term));
  });
}
