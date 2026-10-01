import raw from '../public/models/hra-pelvis/catalog.json' with { type: 'json' };
import type { DissectionView } from '../app/dissection-data';
import type { SpecimenDefinition } from './independent-specimen';
import { hraPelvisMatches } from './hra-pelvis';
import type { SpecimenGuidedDissection } from './specimen-guided-dissection';

type StepSource = {
  id: string;
  title: string;
  caption: string;
  slugs: string[];
  selected: string;
  view: DissectionView;
};

// These are visibility/selection instructions over admitted source surfaces.
// They do not identify dissection planes, a ureteric crossing, or a procedure.
const steps: StepSource[] = [
  {
    id: 'support-context',
    title: 'Source support context',
    caption: 'Show the supplied broad, cardinal and uterosacral source surfaces with cervix context. Select the broad ligament source region.',
    slugs: ['cervix', 'broad-ligament', 'right-cardinal-ligament-of-uterus', 'left-cardinal-ligament-of-uterus', 'right-uterosacral-ligament', 'left-uterosacral-ligament'],
    selected: 'broad-ligament',
    view: 'posterior',
  },
  {
    id: 'cardinal-context',
    title: 'Cardinal support source regions',
    caption: 'Set the broad ligament source surface aside by hiding it. Select a cardinal source region and compare the visible right and left regions with the cervix.',
    slugs: ['cervix', 'right-cardinal-ligament-of-uterus', 'left-cardinal-ligament-of-uterus', 'right-uterosacral-ligament', 'left-uterosacral-ligament'],
    selected: 'right-cardinal-ligament-of-uterus',
    view: 'anterior',
  },
  {
    id: 'posterior-uterosacral',
    title: 'Posterior uterosacral context',
    caption: 'Show the paired uterosacral source surfaces with the cervix and sacrum. Select the right source surface, then compare the visible pair.',
    slugs: ['cervix', 'sacrum', 'right-uterosacral-ligament', 'left-uterosacral-ligament'],
    selected: 'right-uterosacral-ligament',
    view: 'posterior',
  },
  {
    id: 'right-urinary-vessels',
    title: 'Right ureter and uterine vessel context',
    caption: 'Show the admitted right ureter with right uterine artery and vein source surfaces, cervix and bladder base. Select the right ureter for source comparison.',
    slugs: ['right-ureter', 'right-uterine-artery', 'right-uterine-vein', 'cervix', 'fundus-of-urinary-bladder-base'],
    selected: 'right-ureter',
    view: 'right',
  },
  {
    id: 'left-urinary-vessels',
    title: 'Left ureter and uterine vessel context',
    caption: 'Show the admitted left ureter with left uterine artery and vein source surfaces, cervix and bladder base. Select the left ureter for source comparison.',
    slugs: ['left-ureter', 'left-uterine-artery', 'left-uterine-vein', 'cervix', 'fundus-of-urinary-bladder-base'],
    selected: 'left-ureter',
    view: 'left',
  },
  {
    id: 'bilateral-urinary',
    title: 'Bilateral urinary comparison',
    caption: 'Show both admitted ureter source surfaces with the supplied bladder, cervix and uterine vessel context. Select the left ureter, then compare the visible sides.',
    slugs: ['left-ureter', 'right-ureter', 'left-uterine-artery', 'right-uterine-artery', 'left-uterine-vein', 'right-uterine-vein', 'cervix', 'fundus-of-urinary-bladder-dome', 'fundus-of-urinary-bladder-base', 'urinary-bladder-neck-smooth-muscle'],
    selected: 'left-ureter',
    view: 'anterior',
  },
];

export function hraPelvicGuidedDissection(
  definition: SpecimenDefinition,
): SpecimenGuidedDissection | null {
  if (!hraPelvisMatches(definition)) return null;
  const bySlug = new Map(definition.surfaces.map(surface => [surface.slug, surface.id]));
  const resolved = steps.map(step => {
    const ids = step.slugs.map(slug => bySlug.get(slug));
    const selectedId = bySlug.get(step.selected);
    if (ids.some(id => !id) || !selectedId || !ids.includes(selectedId) || new Set(ids).size !== ids.length)
      return null;
    return {
      id: step.id,
      title: step.title,
      caption: step.caption,
      ids: ids as string[],
      selectedId,
      view: step.view,
    };
  });
  if (resolved.some(step => !step) || new Set(resolved.map(step => step?.id)).size !== resolved.length)
    return null;
  return structuredClone({
    id: 'hra-female-pelvis-source-guide',
    title: 'Female pelvis source-guided dissection',
    status: 'draft',
    specimenKey: raw.specimenId,
    sourceFrame: raw.sourceFrame,
    limitation: 'Partial source surfaces only. Visibility steps do not validate a surgical plane, ureteric crossing, urinary continuity, source orientation or clinical interpretation. Revision-bound radiologist review remains required.',
    steps: resolved,
  } as SpecimenGuidedDissection);
}
