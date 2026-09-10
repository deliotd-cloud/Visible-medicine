import raw from '../public/models/bodyparts3d/visual-pathway/catalog.json' with { type: 'json' };
import type { BodyCatalog, BodyStructure } from '../app/body-types';
import { ventricleCatalog, ventriclesFor } from './ventricles.ts';

export const visualPathwayCatalog = raw as unknown as BodyCatalog & {
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
export function visualPathwayFor(parent: BodyStructure | null) {
  if (
    !ventriclesFor(parent).length ||
    canonical(parent) !== canonical(visualPathwayCatalog.parent) ||
    canonical(visualPathwayCatalog.parent) !==
      canonical(ventricleCatalog.parent)
  )
    return [];
  return visualPathwayCatalog.structures.filter((s) =>
    visualPathwayCatalog.selectableIds.includes(s.id),
  );
}
export function visualPathwayViewCatalog(
  parent: BodyStructure | null,
  context = false,
) {
  const layers = visualPathwayFor(parent);
  const references =
    layers.length && context ? visualPathwayCatalog.contextRecords : [];
  const structures = [...layers, ...references];
  return {
    ...visualPathwayCatalog,
    structures,
    selectableIds: layers.map((s) => s.id),
    contextIds: references.map((s) => s.id),
    bundles: [
      ...visualPathwayCatalog.bundles,
      ...visualPathwayCatalog.contextBundles,
    ].filter((b) => structures.some((s) => s.bundle === b.id)),
  };
}
export function visualPathwayPresets(layers: BodyStructure[]) {
  return {
    all: layers.map((s) => s.id),
    chiasm: layers.filter((s) => s.fmaId === 'FMA62045').map((s) => s.id),
    tracts: layers.filter((s) => s.fmaId !== 'FMA62045').map((s) => s.id),
    right: layers.filter((s) => s.laterality !== 'left').map((s) => s.id),
    left: layers.filter((s) => s.laterality !== 'right').map((s) => s.id),
  };
}
export function visualPathwayColour(s: BodyStructure) {
  if (s.fmaId === 'FMA62045') return '#edd1a0';
  if (['FMA62382', 'FMA67936'].includes(s.fmaId)) return '#e2bd74';
  if (['FMA73303', 'FMA73304'].includes(s.fmaId)) return '#a690b5';
  return '#9ba7a5';
}
export const visualPathwayNotes: Record<string, string> = {
  FMA62045:
    'Two closed source halves are selected together as one chiasm. The seam is a modelling boundary, not a display of individual crossing fibres.',
  FMA62382:
    'Right optic-tract source surface. Its proximity to geniculate landmarks does not establish a validated termination or continuous fibre route.',
  FMA67936:
    'Left optic-tract source surface. The original near-midline extent is retained; no new fibres, optic radiations or patient correspondence are inferred.',
};
export const visualPathwayReferences = [
  'https://nba.uth.tmc.edu/neuroanatomy/L8/Lab08p07_index.html',
  'https://nba.uth.tmc.edu/neuroscience/s2/chapter15.html',
];
