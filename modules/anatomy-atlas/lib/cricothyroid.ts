import raw from '../public/models/bodyparts3d/cricothyroid/catalog.json' with { type: 'json' };
import type { BodyCatalog, BodyStructure } from '../app/body-types';

export const cricothyroidCatalog = raw as unknown as BodyCatalog & {
  parent: BodyStructure;
  selectableIds: string[];
  contextIds: string[];
  contextRecords: BodyStructure[];
  contextBundles: BodyCatalog['bundles'];
};
const canonical = (v: unknown): string =>
  Array.isArray(v)
    ? `[${v.map(canonical).join(',')}]`
    : v && typeof v === 'object'
      ? `{${Object.keys(v)
          .sort()
          .map(
            (k) =>
              `${JSON.stringify(k)}:${canonical((v as Record<string, unknown>)[k])}`,
          )
          .join(',')}}`
      : JSON.stringify(v);

/** The cartilage is a navigation landmark, never a muscle tissue parent. */
export function cricothyroidFor(parent: BodyStructure | null) {
  if (
    !parent ||
    parent.id !== cricothyroidCatalog.parent.id ||
    canonical(parent) !== canonical(cricothyroidCatalog.parent)
  )
    return [];
  return cricothyroidCatalog.structures.filter((s) =>
    cricothyroidCatalog.selectableIds.includes(s.id),
  );
}
export function cricothyroidViewCatalog(
  parent: BodyStructure | null,
  context = false,
) {
  const layers = cricothyroidFor(parent);
  const references =
    layers.length && context ? cricothyroidCatalog.contextRecords : [];
  const structures = [...layers, ...references];
  return {
    ...cricothyroidCatalog,
    structures,
    selectableIds: layers.map((s) => s.id),
    contextIds: references.map((s) => s.id),
    bundles: [
      ...cricothyroidCatalog.bundles,
      ...cricothyroidCatalog.contextBundles,
    ].filter((b) => structures.some((s) => s.bundle === b.id)),
  };
}
export function cricothyroidPresets(layers: BodyStructure[]) {
  return {
    all: layers.map((s) => s.id),
    straight: layers
      .filter((s) => ['FMA46611', 'FMA46612'].includes(s.fmaId))
      .map((s) => s.id),
    oblique: layers
      .filter((s) => ['FMA46613', 'FMA46614'].includes(s.fmaId))
      .map((s) => s.id),
    right: layers.filter((s) => s.laterality === 'right').map((s) => s.id),
    left: layers.filter((s) => s.laterality === 'left').map((s) => s.id),
  };
}
export function cricothyroidColour(s: BodyStructure) {
  if (['FMA46611', 'FMA46612'].includes(s.fmaId)) return '#bc6760';
  if (['FMA46613', 'FMA46614'].includes(s.fmaId)) return '#9b5350';
  return s.fmaId === 'FMA55099' ? '#77a8b6' : '#aac7bd';
}
export const cricothyroidNotes: Record<string, string> = {
  FMA46611:
    'Right straight-part source. Five detached duplicate-face islands are omitted from the display derivative; the main surface is unchanged.',
  FMA46612:
    'Left straight-part source. One detached duplicate-face island is omitted from the display derivative; the main surface is unchanged.',
  FMA46613:
    'Right oblique-part source, retaining all supplied triangles. Part boundaries and attachments remain unvalidated.',
  FMA46614:
    'Left oblique-part source, retaining all supplied triangles. Part boundaries and attachments remain unvalidated.',
};
export const cricothyroidReferences = [
  'https://anatomy.ttuhscep.edu/nervous_system/deepneck_tables.html',
  'https://pubmed.ncbi.nlm.nih.gov/18191374/',
];
