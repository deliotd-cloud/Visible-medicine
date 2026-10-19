import { motorNerves, type MotorNerveKey, type MotorSupply } from '../content/um-limb-motor';
import { specimenTeachingFor } from './um-limb-teaching';
import type { SpecimenAction, SpecimenDefinition, SpecimenSurface } from './independent-specimen';

export type MotorTarget = { surface: SpecimenSurface; supply: MotorSupply };
/** Only exact pinned muscle lessons participate. Never infer supply from names,
 * adjacency, text matching, nerve roots or another specimen's geometry. */
export function specimenMotorGroups(definition: SpecimenDefinition) {
  const muscles = definition.surfaces.filter(s => s.tissue === 'muscle').map(surface => ({ surface, lesson: specimenTeachingFor(definition, surface) }));
  return (Object.keys(motorNerves) as MotorNerveKey[]).map(key => ({
    key, ...motorNerves[key], targets: muscles.flatMap(({ surface, lesson }): MotorTarget[] =>
      (lesson?.motorGroups ?? []).filter(supply => supply.nerve === key).map(supply => ({ surface, supply }))),
  })).filter(group => group.targets.length);
}
export function motorStudyAction(definition: SpecimenDefinition, nerve: string): SpecimenAction | null {
  const group = specimenMotorGroups(definition).find(g => g.key === nerve);
  if (!group) return null;
  const targets = new Set(group.targets.map(t => t.surface.id));
  return { type: 'show-only', ids: definition.surfaces.filter(s => targets.has(s.id) || s.tissue === 'skeleton').map(s => s.id), selectedId: group.targets[0].surface.id };
}
