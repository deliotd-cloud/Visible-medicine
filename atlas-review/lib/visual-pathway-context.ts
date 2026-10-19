import raw from '../public/models/bodyparts3d/visual-pathway/sellar-context.json' with { type: 'json' };
import type { BodyCatalog, BodyStructure } from '../app/body-types';
import type { DissectionView } from '../app/dissection-data';
import { visualPathwayFor, visualPathwayViewCatalog } from './visual-pathway';

export const visualSellarSource = raw as unknown as {
  parent: BodyStructure;
  structures: BodyStructure[];
  bundles: BodyCatalog['bundles'];
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

export function visualRelationshipsFor(parent: BodyStructure | null) {
  const layers = visualPathwayFor(parent);
  const chiasm = layers.filter((s) => s.fmaId === 'FMA62045');
  const pituitary = visualSellarSource.structures.filter(
    (s) => s.fmaId === 'FMA13889',
  );
  if (
    !layers.length ||
    chiasm.length !== 1 ||
    pituitary.length !== 1 ||
    canonical(parent) !== canonical(visualSellarSource.parent)
  )
    return [];
  return [
    {
      id: 'sellar-landmarks',
      title: 'Chiasm & pituitary',
      spaceId: chiasm[0].id,
      context: pituitary,
      view: 'right' as DissectionView,
      guide:
        'Compare the chiasm above the pituitary gland from the side, then rotate. Their relationship varies between people. This whole-gland source does not separately identify the stalk or establish a normal clearance or a compressed pathway.',
      reference: 'https://pubmed.ncbi.nlm.nih.gov/30879711/',
    },
  ];
}

/** Reuse the exact existing gland only; never attach it as a neural child. */
export function visualContextViewCatalog(
  parent: BodyStructure | null,
  context = false,
  relationshipId: string | null = null,
) {
  const relation = visualRelationshipsFor(parent).find(
    (r) => r.id === relationshipId,
  );
  const base = visualPathwayViewCatalog(parent, context && !relation);
  if (!context || !relation) return base;
  return {
    ...base,
    structures: [...base.structures, ...relation.context],
    contextIds: relation.context.map((s) => s.id),
    bundles: [
      ...base.bundles,
      ...visualSellarSource.bundles.filter((b) =>
        relation.context.some((s) => s.bundle === b.id),
      ),
    ],
  };
}
