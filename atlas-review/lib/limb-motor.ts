import { upperLimbMotorGroups, upperLimbMotorPlan } from './upper-limb-motor';
import { lowerLimbMotorGroups, lowerLimbMotorPlan } from './lower-limb-motor';
import { thoraxMotorGroups, thoraxMotorPlan } from './thorax-motor';
import type { BodyCatalog } from '../app/body-types';
// Region scopes are disjoint; no cross-specimen or nerve-tree inference.
export const limbMotorGroups = (
  catalog: BodyCatalog,
  region: string,
  side = 'both',
) => [
  ...upperLimbMotorGroups(catalog, region, side),
  ...lowerLimbMotorGroups(catalog, region, side),
  ...thoraxMotorGroups(catalog, region, side),
];
export const limbMotorPlan = (
  catalog: BodyCatalog,
  region: string,
  side: string,
  key: string,
  exam = false,
) =>
  upperLimbMotorPlan(catalog, region, side, key, exam) ??
  lowerLimbMotorPlan(catalog, region, side, key, exam) ??
  thoraxMotorPlan(catalog, region, side, key, exam);
