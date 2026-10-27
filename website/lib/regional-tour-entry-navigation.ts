import { atlasBodyRegions } from './atlas-navigation';
import type { RegionalLearningTour } from './regional-learning-discovery';

const token = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,139}$/;
const source = /^[0-9a-f]{40}$/;
const fields = ['regionalTour', 'tourRevision', 'tourSource'] as const;
const validStep = (value: unknown): value is string =>
  typeof value === 'string' && /^[1-9][0-9]{0,2}$/.test(value) && Number(value) <= 200;

/** Manual fallback is still limited to the server catalogue's canonical region. */
export function regionalTourRegionHref(tour: Pick<RegionalLearningTour, 'regionId' | 'href'>): string | null {
  return tour ? atlasBodyRegions.find(item => item.id === tour.regionId && item.href === tour.href)?.href ?? null : null;
}

/** Build a viewer entry only for a public tour bound to a canonical region link. */
export function regionalTourEntryHref(
  tour: Pick<RegionalLearningTour, 'id' | 'revision' | 'regionId' | 'href'>,
  sourceRevision: string | null,
): string | null {
  if (!tour || typeof tour.id !== 'string' || !token.test(tour.id) ||
      typeof tour.revision !== 'string' || !token.test(tour.revision) ||
      typeof sourceRevision !== 'string' || !source.test(sourceRevision)) return null;
  const region = atlasBodyRegions.find(item => item.id === tour.regionId && item.href === tour.href);
  if (!region) return null;
  return `/atlas/3d?${new URLSearchParams({
    region: region.id,
    regionalTour: tour.id,
    tourRevision: tour.revision,
    tourSource: sourceRevision,
  })}`;
}

/** An ordinal is meaningful only within this exact source and tour revision. */
export function regionalTourStepHref(
  tour: Pick<RegionalLearningTour, 'id' | 'revision' | 'regionId' | 'href' | 'steps'>,
  sourceRevision: string | null,
  stepIndex: number,
): string | null {
  const href = regionalTourEntryHref(tour, sourceRevision);
  if (!href || !Array.isArray(tour.steps) || tour.steps.length > 200 ||
      !Number.isSafeInteger(stepIndex) || stepIndex < 0 || stepIndex >= tour.steps.length) return null;
  return `${href}&regionalStep=${stepIndex + 1}`;
}

/** Validate the public tour query as a complete, revision-bound unit. */
export function regionalTourEntrySuffix(params: Record<string, string | string[] | undefined>): string | null {
  if (!params || typeof params !== 'object' || Array.isArray(params)) return null;
  const present = fields.filter(key => key in params);
  const hasStep = 'regionalStep' in params;
  if (present.length === 0 && !hasStep) return '';
  if (present.length !== fields.length || !fields.every(key => Object.hasOwn(params, key))) return null;
  const [id, revision, sourceRevision] = fields.map(key => params[key]);
  if (typeof id !== 'string' || !token.test(id) ||
      typeof revision !== 'string' || !token.test(revision) ||
      typeof sourceRevision !== 'string' || !source.test(sourceRevision)) return null;
  if (hasStep && (!Object.hasOwn(params, 'regionalStep') || !validStep(params.regionalStep))) return null;
  const query = new URLSearchParams({ regionalTour: id, tourRevision: revision, tourSource: sourceRevision });
  if (hasStep) query.set('regionalStep', params.regionalStep as string);
  return `&${query}`;
}
