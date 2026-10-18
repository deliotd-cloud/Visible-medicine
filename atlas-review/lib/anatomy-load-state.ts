import type { BodyStructure, BodySystem } from '../app/body-types';

export type AnatomyLoadState = { loaded: string[]; failed: string[] };
export const initialAnatomyLoads: AnatomyLoadState = { loaded: [], failed: [] };
export type AnatomyLoadAction =
  | { type: 'loaded' | 'failed'; id: string }
  | { type: 'retry'; ids: string[] };
const unique = (ids: string[]) => [
  ...new Set(ids.filter((id) => typeof id === 'string' && id.length > 0)),
];

/** A group cannot be both ready and failed. Retry clears only its own state. */
export function anatomyLoadReducer(
  state: AnatomyLoadState,
  action: AnatomyLoadAction,
): AnatomyLoadState {
  if (action.type === 'retry') {
    const ids = new Set(action.ids);
    if (
      !state.loaded.some((id) => ids.has(id)) &&
      !state.failed.some((id) => ids.has(id))
    )
      return state;
    return {
      loaded: state.loaded.filter((id) => !ids.has(id)),
      failed: state.failed.filter((id) => !ids.has(id)),
    };
  }
  if (!action.id) return state;
  if (
    action.type === 'loaded' &&
    state.loaded.includes(action.id) &&
    !state.failed.includes(action.id)
  )
    return state;
  if (
    action.type === 'failed' &&
    state.failed.includes(action.id) &&
    !state.loaded.includes(action.id)
  )
    return state;
  const loaded = state.loaded.filter((id) => id !== action.id);
  const failed = state.failed.filter((id) => id !== action.id);
  if (action.type === 'loaded') loaded.push(action.id);
  else failed.push(action.id);
  return { loaded, failed };
}
export function anatomyLoadSummary(
  required: string[],
  loaded: string[],
  failed: string[],
) {
  const requested = unique(required),
    ready = new Set(loaded),
    errors = new Set(failed);
  return {
    required: requested,
    loaded: requested.filter((id) => ready.has(id) && !errors.has(id)),
    failed: requested.filter((id) => errors.has(id)),
    pending: requested.filter((id) => !ready.has(id) && !errors.has(id)),
  };
}
/** Match the rendered scene's enabled/removed/ghost scope, not hidden quiz context. */
export function renderedAnatomyStructures(
  items: BodyStructure[],
  systems: Record<BodySystem, boolean>,
  hiddenIds: string[],
  ghostRemoved: boolean,
) {
  return items.filter(
    (s) => systems[s.system] && (!hiddenIds.includes(s.id) || ghostRemoved),
  );
}
export function requestedAnatomyBundles(
  items: BodyStructure[],
  systems: Record<BodySystem, boolean>,
  hiddenIds: string[],
  ghostRemoved: boolean,
) {
  return unique(
    renderedAnatomyStructures(items, systems, hiddenIds, ghostRemoved).map(
      (s) => s.bundle,
    ),
  );
}
