import { atlasBodyRegions } from './atlas-navigation';
import type { RegionalLearningTour } from './regional-learning-discovery';

const token = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,139}$/;
const source = /^[0-9a-f]{40}$/;
const fields = ['regionalTour', 'tourRevision', 'tourSource'] as const;

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

/** Validate the public tour query as a complete, revision-bound unit. */
export function regionalTourEntrySuffix(params: Record<string, string | string[] | undefined>): string | null {
  if (!params || typeof params !== 'object' || Array.isArray(params)) return null;
  const present = fields.filter(key => key in params);
  if (present.length === 0) return '';
  if (present.length !== fields.length || !fields.every(key => Object.hasOwn(params, key))) return null;
  const [id, revision, sourceRevision] = fields.map(key => params[key]);
  if (typeof id !== 'string' || !token.test(id) ||
      typeof revision !== 'string' || !token.test(revision) ||
      typeof sourceRevision !== 'string' || !source.test(sourceRevision)) return null;
  return `&${new URLSearchParams({ regionalTour: id, tourRevision: revision, tourSource: sourceRevision })}`;
}
