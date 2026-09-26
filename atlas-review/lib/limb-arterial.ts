import {
  lowerLimbArterialNeighbours,
  lowerLimbArterialPlan,
} from './lower-limb-arterial';
import {
  upperLimbArterialNeighbours,
  upperLimbArterialPlan,
} from './upper-limb-arterial';

// Disjoint, explicitly admitted source maps. Neither is allowed to repair the other.
export function limbArterialNeighbours(
  ...args: Parameters<typeof lowerLimbArterialNeighbours>
) {
  return (
    lowerLimbArterialNeighbours(...args) ?? upperLimbArterialNeighbours(...args)
  );
}
export function limbArterialPlan(
  ...args: Parameters<typeof lowerLimbArterialPlan>
) {
  return lowerLimbArterialPlan(...args) ?? upperLimbArterialPlan(...args);
}
