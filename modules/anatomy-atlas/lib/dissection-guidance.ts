import type { BodyStructure } from '../app/body-types';
import {
  matchesRule,
  stageStructures,
  type DissectionProfile,
  type DissectionState,
  type DissectionView,
} from '../app/dissection-data.ts';
import {
  dissectionSections,
  dissectionTransition,
} from './dissection-workbench.ts';

export const dissectionOrientation: Record<DissectionView, string> = {
  anterior: 'Anterior · from the front',
  posterior: 'Posterior · from behind',
  right: 'Right lateral · from the right',
  left: 'Left lateral · from the left',
  superior: 'Superior · from above',
  inferior: 'Inferior · from below',
};
export type GuideAvailability =
  | 'ready'
  | 'pending'
  | 'failed'
  | 'removed'
  | 'system-off';
export const guideAvailabilityText: Record<GuideAvailability, string> = {
  ready: 'Ready in view',
  pending: 'Loading',
  failed: 'Model unavailable',
  removed: 'Removed · select to restore',
  'system-off': 'System off · select to enable',
};

/** Authored name patterns resolve only to supplied identities. No clinical
 * relationship, missing counterpart or landmark is invented by this helper. */
export function dissectionLandmarks(
  scope: BodyStructure[],
  patterns: string[],
) {
  const matches = patterns.flatMap((pattern) =>
    scope
      .filter((s) => new RegExp(pattern, 'i').test(s.sourceName))
      .slice(0, 2),
  );
  return [...new Map(matches.map((s) => [s.id, s])).values()].slice(0, 8);
}

export function dissectionGuidance(
  scope: BodyStructure[],
  profile: DissectionProfile,
  state: DissectionState,
  visibleIds: string[],
  removedIds: string[],
  loaded: string[],
  failed: string[],
) {
  const visibleSet = new Set(visibleIds),
    removedSet = new Set(removedIds);
  const visible = scope.filter(
    (s) => visibleSet.has(s.id) && !removedSet.has(s.id),
  );
  const enabled = new Set(visible.map((s) => s.id));
  const focus = profile.focuses.find((f) => f.id === state.focusId);
  const stage = state.focusId
    ? undefined
    : profile.stages.find((s) => s.id === state.stageId);
  const recipe = focus ?? stage;
  const expected = recipe
    ? stageStructures(scope, profile, stage?.id ?? 'free', focus?.id)
    : [];
  const expectedSet = new Set(expected.map((s) => s.id));
  const missing = expected.filter((s) => !enabled.has(s.id));
  const added = recipe ? visible.filter((s) => !expectedSet.has(s.id)) : [];
  const targets = focus
    ? scope.filter((s) => matchesRule(s, focus.rule))
    : null;
  const targetSet = new Set(targets?.map((s) => s.id));
  const context = focus ? expected.filter((s) => !targetSet.has(s.id)) : null;
  const availability = (s: BodyStructure): GuideAvailability =>
    removedSet.has(s.id)
      ? 'removed'
      : !enabled.has(s.id)
        ? 'system-off'
        : failed.includes(s.bundle)
          ? 'failed'
          : loaded.includes(s.bundle)
            ? 'ready'
            : 'pending';
  const members = expected.map((structure) => ({
    structure,
    status: availability(structure),
    role: focus
      ? targetSet.has(structure.id)
        ? ('target' as const)
        : ('context' as const)
      : ('member' as const),
  }));
  const landmarks = dissectionLandmarks(scope, recipe?.landmarks ?? []).map(
    (structure) => ({ structure, status: availability(structure) }),
  );
  const { layers } = dissectionSections(profile);
  const index = stage ? layers.findIndex((s) => s.id === stage.id) : -1;
  const nextStage = index >= 0 ? layers[index + 1] : undefined;
  const next = nextStage
    ? dissectionTransition(
        scope,
        profile,
        visible.map((s) => s.id),
        nextStage.id,
      )
    : null;
  return {
    recipe: recipe
      ? {
          id: recipe.id,
          title: recipe.title,
          kind: focus ? ('focus' as const) : ('stage' as const),
          view: recipe.view,
        }
      : null,
    expected,
    visible,
    missing,
    added,
    targets,
    context,
    members,
    landmarks,
    next,
    counts: {
      ready: visible.filter((s) => availability(s) === 'ready').length,
      pending: visible.filter((s) => availability(s) === 'pending').length,
      failed: visible.filter((s) => availability(s) === 'failed').length,
      removed: scope.filter((s) => removedSet.has(s.id)).length,
      systemOff: scope.filter(
        (s) => !removedSet.has(s.id) && !enabled.has(s.id),
      ).length,
    },
    finalLayer: index >= 0 && index === layers.length - 1,
  };
}
export type DissectionGuidance = ReturnType<typeof dissectionGuidance>;

/** Every action re-resolves the current region/side and rejects practice mode. */
export function guidanceRecipeAction(
  guide: DissectionGuidance,
  kind: 'recipe' | 'next',
  exam: boolean,
) {
  if (exam) return null;
  if (kind === 'next')
    return guide.next?.visible.length
      ? { kind: 'stage' as const, id: guide.next.stage.id }
      : null;
  if (
    kind !== 'recipe' ||
    !guide.recipe ||
    !guide.expected.length ||
    (guide.targets && !guide.targets.length)
  )
    return null;
  return { kind: guide.recipe.kind, id: guide.recipe.id };
}
