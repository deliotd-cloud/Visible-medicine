import raw from '../public/models/bodyparts3d/pancreatic/catalog.json' with { type: 'json' };
import type { BodyCatalog, BodyStructure } from '../app/body-types';
import { pancreasDisplayCorrection } from './body-display-catalog.ts';

export type PancreaticStructure = BodyStructure & {
  parentId: string;
  role: 'duct' | 'tree' | 'context';
};
export const pancreaticCatalog = raw as unknown as Omit<
  BodyCatalog,
  'structures'
> & {
  parent: BodyStructure;
  structures: PancreaticStructure[];
  selectableIds: string[];
  contextIds: string[];
};
const canonical = (value: unknown): string =>
  Array.isArray(value)
    ? `[${value.map(canonical).join(',')}]`
    : value && typeof value === 'object'
      ? `{${Object.keys(value)
          .sort()
          .map(
            (key) =>
              `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`,
          )
          .join(',')}}`
      : JSON.stringify(value);

// Bind to the reviewed display derivative, never silently to the archived aggregate.
export function pancreaticFor(parent: BodyStructure | null) {
  if (
    parent?.id !== pancreaticCatalog.parent.id ||
    canonical(parent) !== canonical(pancreaticCatalog.parent) ||
    canonical(pancreaticCatalog.parent) !==
      canonical(pancreasDisplayCorrection.replacement)
  )
    return [];
  return pancreaticCatalog.structures.filter(
    (s) =>
      s.parentId === parent?.id &&
      pancreaticCatalog.selectableIds.includes(s.id),
  );
}
export function pancreaticViewCatalog(
  parent: BodyStructure | null,
  context = false,
) {
  const layers = pancreaticFor(parent);
  const references =
    layers.length && context
      ? pancreaticCatalog.structures.filter((s) =>
          pancreaticCatalog.contextIds.includes(s.id),
        )
      : [];
  const structures = [...layers, ...references];
  return {
    ...pancreaticCatalog,
    structures,
    selectableIds: layers.map((s) => s.id),
    contextIds: references.map((s) => s.id),
    bundles: pancreaticCatalog.bundles.filter((b) =>
      structures.some((s) => s.bundle === b.id),
    ),
  };
}
export function pancreaticPresets(layers: BodyStructure[]) {
  return {
    all: layers.map((s) => s.id),
    duct: layers
      .filter((s) => (s as PancreaticStructure).role === 'duct')
      .map((s) => s.id),
    tree: layers
      .filter((s) => (s as PancreaticStructure).role === 'tree')
      .map((s) => s.id),
  };
}
export function pancreaticColour(s: BodyStructure) {
  return (s as PancreaticStructure).role === 'duct'
    ? '#67ad9b'
    : (s as PancreaticStructure).role === 'tree'
      ? '#c7ac68'
      : '#b9b4a6';
}
export const pancreaticReferences = [
  'https://training.seer.cancer.gov/biliary/anatomy/',
];
export const pancreaticNotes: Record<string, string> = {
  FMA10419:
    'The source-labelled pancreatic duct is shown once, in its supplied position. This surface does not verify an open lumen, a junction or a papillary opening.',
  FMA63103:
    'This is the single duct-tree component from the source IS-A index. The PART-OF duct-tree group also includes the separately selectable pancreatic duct. These are not two complete independent trees, and this component has not been identified as an accessory duct.',
};
