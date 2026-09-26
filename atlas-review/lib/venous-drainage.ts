import {
  systemicVenousNeighbours,
  systemicVenousPlan,
} from './systemic-venous';
import { portalVenousNeighbours, portalVenousPlan } from './portal-drainage';
type Args = Parameters<typeof systemicVenousNeighbours>;
export function venousDrainageNeighbours(...args: Args) {
  return systemicVenousNeighbours(...args) ?? portalVenousNeighbours(...args);
}
export function venousDrainagePlan(...args: Args) {
  return systemicVenousPlan(...args) ?? portalVenousPlan(...args);
}
