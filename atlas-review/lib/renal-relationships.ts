import type { BodyStructure } from '../app/body-types';
import type { DissectionView } from '../app/dissection-data';
import { renalCatalog, renalFor, renalViewCatalog } from './renal';

/** Existing source groups and landmarks only. Side association is navigation. */
export function renalRelationshipsFor(parent: BodyStructure | null) {
  const layers = renalFor(parent);
  if (!layers.length || !parent) return [];
  const left = parent.laterality === 'left';
  const side = left ? 'Left' : 'Right';
  const renalVein = layers.filter((s) => s.role === 'renal-vein');
  const adrenalVein = layers.filter((s) => s.role === 'suprarenal-vein');
  if (renalVein.length !== 1 || adrenalVein.length !== 1) return [];
  const definitions = [
    {
      id: 'renal-venous-outflow',
      title: `${side} renal vein & cava`,
      spaceId: renalVein[0].id,
      visibleIds: [renalVein[0].id],
      landmarks: [parent.fmaId, 'FMA10951', ...(left ? ['FMA3789'] : [])],
      view: 'anterior' as DissectionView,
      guide: left
        ? 'Compare the supplied left renal vein with the aorta, cava and kidney, then rotate to examine depth. Venous courses can vary, including routes behind or around the aorta; this source is not a catalogue of those variants or evidence of compression.'
        : 'Compare the supplied right renal vein with the kidney and cava. Multiple right renal veins occur in anatomical imaging studies, but the two pieces of this source group must not be interpreted as a proven duplicated vein or a validated junction.',
      reference: 'https://pubmed.ncbi.nlm.nih.gov/25260644/',
    },
    {
      id: 'adrenal-venous-outflow',
      title: `${side} adrenal venous drainage`,
      spaceId: adrenalVein[0].id,
      visibleIds: [adrenalVein[0].id, ...(left ? [renalVein[0].id] : [])],
      landmarks: [left ? 'FMA15630' : 'FMA15629', 'FMA10951'],
      view: 'posterior' as DissectionView,
      guide: left
        ? 'The usual left adrenal venous route reaches the left renal vein. Compare both supplied venous groups with the gland and cava; either vein remains selectable. Additional channels and phrenic connections vary and are not reconstructed here. Source proximity does not prove an open lumen.'
        : 'The usual right adrenal venous route reaches the cava directly. Compare the supplied vein with the gland and cava from behind, then rotate. Imaging studies describe variation in its entry and neighbouring veins; this model does not validate an ostium, procedural route or every variant.',
      reference: left
        ? 'https://pubmed.ncbi.nlm.nih.gov/35362770/'
        : 'https://pubmed.ncbi.nlm.nih.gov/18647909/',
    },
  ];
  return definitions.flatMap(({ landmarks, ...d }) => {
    const context = landmarks.map((fma) =>
      renalCatalog.contextRecords.filter((s) => s.fmaId === fma),
    );
    if (context.some((matches) => matches.length !== 1)) return [];
    return [{ ...d, context: context.map((matches) => matches[0]) }];
  });
}

export function renalRelationshipViewCatalog(
  parent: BodyStructure | null,
  context = false,
  relationshipId: string | null = null,
) {
  const relation = renalRelationshipsFor(parent).find(
    (r) => r.id === relationshipId,
  );
  if (!context || !relation) return renalViewCatalog(parent, context);
  const base = renalViewCatalog(parent);
  return {
    ...base,
    structures: [...base.structures, ...relation.context],
    contextIds: relation.context.map((s) => s.id),
    bundles: [
      ...base.bundles,
      ...renalCatalog.contextBundles.filter((b) =>
        relation.context.some((s) => s.bundle === b.id),
      ),
    ],
  };
}
