import { abdominalWallDefinition } from './abdominal-wall';
import type { SpecimenDefinition, SpecimenSurface } from './independent-specimen';

const canonical = (value: unknown): string => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
  : value && typeof value === 'object' ? `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical((value as Record<string, unknown>)[k])}`).join(',')}}` : JSON.stringify(value);
// Includes source/licence, frame, bundles, complete surfaces and recipes. Take
// the snapshot at module initialization, before callers can edit a definition.
const pin = canonical(abdominalWallDefinition);
export const abdominalSourceMatches = (definition: SpecimenDefinition) => canonical(definition) === pin;
export function abdominalSurfaceMatches(definition: SpecimenDefinition, surface: SpecimenSurface) {
  return abdominalSourceMatches(definition) && definition.surfaces.some(s => canonical(s) === canonical(surface));
}
