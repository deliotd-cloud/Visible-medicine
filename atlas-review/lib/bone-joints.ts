import { footJointNeighbours, footJointPlan } from './foot-joints';
import { handJointNeighbours, handJointPlan } from './hand-joints';
export function boneJointNeighbours(
  ...args: Parameters<typeof footJointNeighbours>
) {
  return footJointNeighbours(...args) ?? handJointNeighbours(...args);
}
export function boneJointPlan(...args: Parameters<typeof footJointPlan>) {
  return footJointPlan(...args) ?? handJointPlan(...args);
}
