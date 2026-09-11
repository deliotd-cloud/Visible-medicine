import { limbArterialNeighbours, limbArterialPlan } from './limb-arterial';
import {
  lowerLimbArterialNeighbours,
  lowerLimbArterialPlan,
} from './lower-limb-arterial';
import {
  abdominalArterialNeighbours,
  abdominalArterialPlan,
  sharedAbdominalAortaId,
} from './abdominal-arterial';

type Args = Parameters<typeof limbArterialNeighbours>;
// The aorta is one existing source, shared by two maps. Both bindings must pass;
// never silently fall back to a partial graph if either map has stale source data.
export function arterialNeighbours(...args: Args) {
  if (args[3] !== sharedAbdominalAortaId)
    return (
      abdominalArterialNeighbours(...args) ?? limbArterialNeighbours(...args)
    );
  const abdominal = abdominalArterialNeighbours(...args),
    lower = lowerLimbArterialNeighbours(...args);
  if (!abdominal || !lower) return null;
  return {
    ...abdominal,
    territory: 'abdominal and lower-limb',
    rows: [...abdominal.rows, ...lower.rows],
    references: [...new Set([...abdominal.references, ...lower.references])],
  };
}
export function arterialPlan(...args: Args) {
  if (args[3] !== sharedAbdominalAortaId)
    return abdominalArterialPlan(...args) ?? limbArterialPlan(...args);
  const abdominal = abdominalArterialPlan(...args),
    lower = lowerLimbArterialPlan(...args);
  if (
    !abdominal ||
    !lower ||
    abdominal.action.type !== 'load-view' ||
    lower.action.type !== 'load-view'
  )
    return null;
  const hiddenByLower = new Set(lower.action.hiddenIds);
  // Intersection of removals preserves the union of both maps' artery/bone sets.
  return {
    ...abdominal,
    action: {
      type: 'load-view' as const,
      hiddenIds: abdominal.action.hiddenIds.filter((id) =>
        hiddenByLower.has(id),
      ),
    },
  };
}
