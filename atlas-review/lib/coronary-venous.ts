import raw from '../public/models/bodyparts3d/coronary-venous/catalog.json' with { type: 'json' };
import type { BodyCatalog, BodyStructure } from '../app/body-types';

export const coronaryVenousCatalog = raw as unknown as BodyCatalog & {
  parent: BodyStructure;
  selectableIds: string[];
  contextIds: string[];
};
const canonical = (value: unknown): string =>
  Array.isArray(value)
    ? `[${value.map(canonical).join(',')}]`
    : value && typeof value === 'object'
      ? `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(',')}}`
      : JSON.stringify(value);

/** Exact full parent record only. The aggregate stays outside this catalog. */
export function coronaryVenousFor(parent: BodyStructure | null) {
  if (!parent || parent.id !== coronaryVenousCatalog.parent.id ||
      parent.fmaId !== coronaryVenousCatalog.parent.fmaId ||
      canonical(parent) !== canonical(coronaryVenousCatalog.parent)) return [];
  return coronaryVenousCatalog.structures.filter((structure) =>
    coronaryVenousCatalog.selectableIds.includes(structure.id));
}

export function coronaryVenousPresets(layers: BodyStructure[]) {
  return {
    all: layers.map((s) => s.id),
    sinus: layers.filter((s) => s.fmaId === 'FMA4706').map((s) => s.id),
    small: layers.filter((s) => s.fmaId === 'FMA4714').map((s) => s.id),
  };
}
export const coronaryVenousNotes: Record<string, string> = {
  FMA4706: 'The coronary sinus is a major venous channel on the posterior heart. This single source surface does not verify an opening, joined lumen or flow.',
  FMA4714: 'Two original files remain one source-labelled small cardiac vein selection. They are not independently named branches or a validated junction.',
};
export const coronaryVenousReferences = [
  'https://www.ncbi.nlm.nih.gov/books/NBK549786/',
  'https://openstax.org/books/anatomy-and-physiology-2e/pages/19-1-heart-anatomy',
];
