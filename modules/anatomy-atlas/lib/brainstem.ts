import raw from '../public/models/bodyparts3d/brainstem/catalog.json' with { type: 'json' };
import type { BodyCatalog, BodyStructure } from '../app/body-types';
import { ventriclesFor, ventricleCatalog } from './ventricles.ts';

export const brainstemCatalog = raw as unknown as BodyCatalog & {
  parent: BodyStructure;
  selectableIds: string[];
  contextIds: string[];
};
export function brainstemFor(parent: BodyStructure | null) {
  // Both studies require the same full, source-pinned parent. Never accept a stale sidecar.
  if (
    !ventriclesFor(parent).length ||
    JSON.stringify(brainstemCatalog.parent) !==
      JSON.stringify(ventricleCatalog.parent)
  )
    return [];
  return brainstemCatalog.structures.filter((s) =>
    brainstemCatalog.selectableIds.includes(s.id),
  );
}
export const brainstemNotes: Record<string, string> = {
  FMA61993:
    'The upper brainstem division, between the diencephalon and pons. Its posterior surface includes the superior and inferior colliculi; this view keeps the complete source-defined midbrain together.',
  FMA67943:
    'The rounded anterior bulge between midbrain and medulla. Fibre pathways pass through it, including connections with the cerebellum; these pathways are not independently segmented here.',
  FMA62004:
    'The lowest brainstem division, continuing from the pons towards the spinal cord. Surface shape alone does not identify its internal nuclei or crossing pathways.',
  FMA67944:
    'The cerebellum lies behind the brainstem and contributes to movement coordination. Both source halves are selected together; lobules, deep nuclei and peduncles are not individually modelled in this view.',
};
export const brainstemReferences = [
  'https://nba.uth.tmc.edu/neuroanatomy/L10/Lab10p29_index.html',
  'https://nba.uth.tmc.edu/neuroanatomy/L1/Lab01p36_index.html',
];
export function brainstemPresets(layers: BodyStructure[]) {
  return {
    all: layers.map((s) => s.id),
    brainstem: layers.filter((s) => s.fmaId !== 'FMA67944').map((s) => s.id),
    cerebellum: layers.filter((s) => s.fmaId === 'FMA67944').map((s) => s.id),
  };
}
