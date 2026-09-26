import raw from '../public/models/bodyparts3d/pulmonary/catalog.json' with { type: 'json' };
import type { BodyCatalog, BodyStructure } from '../app/body-types';

export type PulmonaryStructure = BodyStructure & {
  parentId: string;
  level: 'upper' | 'middle' | 'lower';
  roleCounts: {
    airway: number;
    artery: number;
    vein: number;
    unclassified: number;
  };
};
export const pulmonaryCatalog = raw as unknown as Omit<
  BodyCatalog,
  'structures'
> & {
  parents: BodyStructure[];
  structures: PulmonaryStructure[];
  selectableIds: string[];
  contextIds: string[];
};
export function pulmonaryFor(parent: BodyStructure | null) {
  const binding = pulmonaryCatalog.parents.find((p) => p.id === parent?.id);
  if (
    !parent ||
    !binding ||
    [
      'id',
      'fmaId',
      'name',
      'sourceTree',
      'system',
      'category',
      'laterality',
      'region',
      'bundle',
      'nodeName',
    ].some(
      (key) =>
        parent[key as keyof BodyStructure] !==
        binding[key as keyof BodyStructure],
    ) ||
    parent.regions.join('|') !== binding.regions.join('|') ||
    parent.sources.length !== binding.sources.length ||
    new Set(parent.sources.map((s) => s.file)).size !== parent.sources.length ||
    !binding.sources.every((s) =>
      parent.sources.some((p) => p.file === s.file && p.sha256 === s.sha256),
    )
  )
    return [];
  return pulmonaryCatalog.structures.filter((s) => s.parentId === parent.id);
}
/** Scope geometry AND bundle loading to the selected lung; never show the other side as context. */
export function pulmonaryViewCatalog(parent: BodyStructure | null) {
  const structures = pulmonaryFor(parent);
  return {
    ...pulmonaryCatalog,
    structures,
    selectableIds: structures.map((s) => s.id),
    bundles: pulmonaryCatalog.bundles.filter((b) =>
      structures.some((s) => s.bundle === b.id),
    ),
  };
}
export const pulmonaryReferences = [
  'https://training.seer.cancer.gov/lung/anatomy/',
  'https://training.seer.cancer.gov/anatomy/respiratory/passages/bronchi.html',
];
export const pulmonaryNotes: Record<string, string> = {
  FMA7333:
    'Right upper lobe branch group. These source-labelled airways and vessels do not delineate the lobe tissue or its fissures.',
  FMA7383:
    'Right middle lobe branch group. The generic source name “middle lobe of lung” is scoped by its exact right-lung parent membership.',
  FMA7337:
    'Right lower lobe branch group. Separation is an illustration aid, not a surgical plane or a complete segmental map.',
  FMA7370:
    'Left upper lobe branch group. Includes supplied lingular branches; the lingula is part of the upper lobe, not a separate middle lobe. One duplicate source face is retained.',
  FMA7371:
    'Left lower lobe branch group. No tissue envelope, fissure surface, alveoli or registered CT mask is supplied.',
};
export function pulmonaryPresets(layers: BodyStructure[]) {
  return {
    all: layers.map((s) => s.id),
    ...Object.fromEntries(
      ['upper', 'middle', 'lower'].flatMap((level) => {
        const ids = layers
          .filter((s) => (s as PulmonaryStructure).level === level)
          .map((s) => s.id);
        return ids.length ? [[level, ids]] : [];
      }),
    ),
  };
}
