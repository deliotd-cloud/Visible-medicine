import raw from '../public/models/bodyparts3d/renal/catalog.json' with { type: 'json' };
import type { BodyCatalog, BodyStructure } from '../app/body-types';

export type RenalStructure = BodyStructure & {
  parentId: string;
  role: 'ureteric' | 'suprarenal-artery' | 'renal-vein' | 'suprarenal-vein';
};
export const renalCatalog = raw as unknown as Omit<
  BodyCatalog,
  'structures'
> & {
  parents: BodyStructure[];
  structures: RenalStructure[];
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
export function renalFor(parent: BodyStructure | null) {
  const bound = renalCatalog.parents.find((p) => p.id === parent?.id);
  if (!bound || canonical(bound) !== canonical(parent)) return [];
  return renalCatalog.structures.filter(
    (s) => s.parentId === parent?.id && s.laterality === parent.laterality,
  );
}
export function renalViewCatalog(
  parent: BodyStructure | null,
  context = false,
) {
  const layers = renalFor(parent);
  const references =
    layers.length && context
      ? renalCatalog.contextRecords.filter(
          (s) =>
            s.laterality === parent?.laterality ||
            ['midline', 'unpaired', 'unspecified'].includes(s.laterality),
        )
      : [];
  const structures = [...layers, ...references];
  return {
    ...renalCatalog,
    structures,
    selectableIds: layers.map((s) => s.id),
    contextIds: references.map((s) => s.id),
    bundles: [...renalCatalog.bundles, ...renalCatalog.contextBundles].filter(
      (b) => structures.some((s) => s.bundle === b.id),
    ),
  };
}
export function renalColour(s: BodyStructure) {
  if (s.system === 'organs') return '#a6aaa5';
  const venous =
    (s as RenalStructure).role?.endsWith('vein') || s.fmaId === 'FMA10951';
  return venous ? '#657fb0' : '#c86059';
}
export function renalPresets(layers: BodyStructure[]) {
  return {
    all: layers.map((s) => s.id),
    arteries: layers
      .filter((s) => !(s as RenalStructure).role.endsWith('vein'))
      .map((s) => s.id),
    veins: layers
      .filter((s) => (s as RenalStructure).role.endsWith('vein'))
      .map((s) => s.id),
    adrenal: layers
      .filter((s) => (s as RenalStructure).role.startsWith('suprarenal'))
      .map((s) => s.id),
  };
}
export const renalReferences = [
  'https://anatomy.ttuhscep.edu/anatomytables/arteries_abdomen.html',
  'https://anatomy.ttuhscep.edu/anatomytables/veins_abdomen.html',
  'https://training.seer.cancer.gov/anatomy/urinary/components/kidney.html',
];
export const renalNotes: Record<string, string> = {
  FMA70492:
    'Two source files form this right ureteric arterial group. Detached components retain their shared label; no individual branch endpoint or lumen is reconstructed.',
  FMA70493:
    'A source-labelled left ureteric arterial segment, not the entire blood supply of the ureter or a continuous intrarenal tree.',
  FMA69265:
    'The supplied right inferior suprarenal artery is shown. Its left counterpart is withheld because of a source defect; the asymmetry is a model limitation.',
  FMA14335:
    'Two source components form the right renal vein group. This is a draft surface representation, not a flow study or validated hilar junction.',
  FMA14336:
    'Two source components form the left renal vein group. Course and source context can be inspected, but compression, patency and variants cannot be diagnosed here.',
  FMA14343:
    'Right suprarenal venous source surface. The adrenal gland and cava are optional context, not validated attachment endpoints.',
  FMA14349:
    'Left suprarenal venous source surface. Study its relationship with the left renal vein; anatomical drainage does not prove source-mesh continuity.',
};
