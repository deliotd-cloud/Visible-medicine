import raw from '../public/models/bodyparts3d/hepatic/catalog.json' with { type: 'json' };
import type { BodyCatalog, BodyStructure } from '../app/body-types';

export type HepaticStructure = BodyStructure & {
  parentId: string;
  kind: 'artery' | 'portal' | 'biliary' | 'venous' | 'context';
};
export const hepaticCatalog = raw as unknown as Omit<
  BodyCatalog,
  'structures'
> & {
  parent: BodyStructure;
  structures: HepaticStructure[];
  selectableIds: string[];
  contextIds: string[];
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
export function hepaticFor(parent: BodyStructure | null) {
  return parent?.id === hepaticCatalog.parent.id &&
    canonical(parent) === canonical(hepaticCatalog.parent)
    ? hepaticCatalog.structures.filter((s) =>
        hepaticCatalog.selectableIds.includes(s.id),
      )
    : [];
}
export function hepaticViewCatalog(
  parent: BodyStructure | null,
  context = false,
) {
  const layers = hepaticFor(parent);
  const structures = layers.length
    ? [
        ...layers,
        ...(context
          ? hepaticCatalog.structures.filter((s) =>
              hepaticCatalog.contextIds.includes(s.id),
            )
          : []),
      ]
    : [];
  return {
    ...hepaticCatalog,
    structures,
    selectableIds: layers.map((s) => s.id),
    contextIds: context && layers.length ? hepaticCatalog.contextIds : [],
    bundles: hepaticCatalog.bundles.filter((b) =>
      structures.some((s) => s.bundle === b.id),
    ),
  };
}
export const hepaticReference =
  'https://training.seer.cancer.gov/anatomy/digestive/regions/accessory.html';
export const hepaticColours: Record<HepaticStructure['kind'], string> = {
  artery: '#c86059',
  portal: '#657fb0',
  biliary: '#54a88a',
  venous: '#a181be',
  context: '#b58c7b',
};
export function hepaticColour(s: BodyStructure) {
  return hepaticColours[(s as HepaticStructure).kind];
}
export const hepaticNotes: Record<string, string> = {
  FMA14778:
    'Right hepatic arterial group: eight original source parts. Branch labels do not establish normal origins, lumen continuity or segmental perfusion territories.',
  FMA14779:
    'Left hepatic arterial group: seven original source parts. Variants and the relationship to individual liver segments remain unvalidated.',
  FMA15414:
    'Right portal venous group: nine source parts. Keep this separate from hepatic venous drainage; no blood flow is simulated.',
  FMA15415:
    'Left portal venous group: eight source parts. Exact source grouping is retained, not a patient-specific portal or surgical map.',
  FMA71857:
    'Right hepatic biliary tree: six supplied duct parts. Green identifies biliary context, not bile flow or duct patency.',
  FMA71858:
    'Left hepatic biliary tree: eight supplied duct parts. The source does not establish continuous lumens, junctions or a complete drainage tree.',
  FMA15800:
    'Two source components share this anterior inferior middle-hepatic-vein tributary label. They are not the whole middle hepatic vein or complete hepatic venous outflow.',
};
export function hepaticPresets(layers: BodyStructure[]) {
  return {
    all: layers.map((s) => s.id),
    ...Object.fromEntries(
      ['artery', 'portal', 'biliary', 'venous'].map((kind) => [
        kind,
        layers
          .filter((s) => (s as HepaticStructure).kind === kind)
          .map((s) => s.id),
      ]),
    ),
  };
}
