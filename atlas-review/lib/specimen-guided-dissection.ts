import type { DissectionView } from '../app/dissection-data';
import type { SpecimenDefinition, SpecimenAction } from './independent-specimen';

/** Declarative source-slug plan; the owning adapter must resolve and validate it. */
export type SpecimenGuidedStepSource = {
  id: string;
  title: string;
  caption: string;
  slugs: string[];
  selected: string;
  view: DissectionView;
};

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
    /** Source-derived camera framing only; never a tissue cut or registration. */
    cameraBounds?: NonNullable<SpecimenDefinition['closeUp']>;
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
  if (step.cameraBounds && (!Array.isArray(step.cameraBounds.min) || !Array.isArray(step.cameraBounds.max)
    || step.cameraBounds.min.length !== 3 || step.cameraBounds.max.length !== 3
    || step.cameraBounds.min.some((value, i) => !Number.isFinite(value)
      || !Number.isFinite(step.cameraBounds!.max[i]) || value >= step.cameraBounds!.max[i]))) return null;
  return { type: 'show-only', ids: [...step.ids], selectedId: step.selectedId };
}
