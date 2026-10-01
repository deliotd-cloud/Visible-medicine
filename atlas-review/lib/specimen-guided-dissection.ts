import type { DissectionView } from '../app/dissection-data';
import type { SpecimenDefinition, SpecimenAction } from './independent-specimen';

/** Optional teaching sequence in an admitted independent specimen, not a new mesh or registration. */
export type SpecimenGuidedDissection = {
  id: string;
  title: string;
  status: 'draft';
  specimenKey: string;
  sourceFrame: string;
  limitation: string;
  steps: Array<{
    id: string;
    title: string;
    caption: string;
    ids: string[];
    selectedId: string;
    view: DissectionView;
  }>;
};

export function guidedDissectionAction(
  definition: SpecimenDefinition,
  guide: SpecimenGuidedDissection,
  index: number,
): SpecimenAction | null {
  if (guide.specimenKey !== definition.key || !Number.isInteger(index)) return null;
  const step = guide.steps[index];
  if (!step || !step.ids.length || new Set(step.ids).size !== step.ids.length
    || !step.ids.includes(step.selectedId)
    || step.ids.some(id => !definition.surfaces.some(s => s.id === id))
    || !['anterior', 'posterior', 'right', 'left', 'superior', 'inferior'].includes(step.view)) return null;
  return { type: 'show-only', ids: [...step.ids], selectedId: step.selectedId };
}
