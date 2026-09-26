import raw from '../public/models/bodyparts3d/hepatic/biliary-context.json' with { type: 'json' };
import type { BodyCatalog, BodyStructure } from '../app/body-types';
import type { DissectionView } from '../app/dissection-data';
import {
  hepaticCatalog,
  hepaticColour,
  hepaticFor,
  hepaticViewCatalog,
} from './hepatic';

export const hepaticBiliarySource = raw as unknown as {
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

/** Context is a source-bound orientation aid, never a newly selectable duct. */
export function hepaticBiliaryRelationshipsFor(parent: BodyStructure | null) {
  const layers = hepaticFor(parent);
  if (
    !layers.length ||
    canonical(parent) !== canonical(hepaticBiliarySource.parent)
  )
    return [];
  const ducts = ['FMA71857', 'FMA71858'].map((fma) =>
    layers.filter((s) => s.fmaId === fma),
  );
  const context = ['FMA7202', 'FMA14539', 'FMA14668'].map((fma) =>
    hepaticBiliarySource.structures.filter((s) => s.fmaId === fma),
  );
  const tissue = hepaticCatalog.structures.filter((s) =>
    hepaticCatalog.contextIds.includes(s.id),
  );
  if (
    ducts.some((s) => s.length !== 1) ||
    context.some((s) => s.length !== 1) ||
    tissue.length !== 1
  )
    return [];
  return [
    {
      id: 'biliary-gallbladder',
      title: 'Bile ducts & gallbladder',
      spaceId: ducts[0][0].id,
      visibleIds: ducts.map((s) => s[0].id),
      context: [...tissue, ...context.map((s) => s[0])],
      view: 'anterior' as DissectionView,
      guide:
        'The liver produces bile and the gallbladder stores it. Compare both internal biliary groups with the gallbladder, cystic duct and source-labelled common hepatic duct. Rotate to examine depth; either internal group remains selectable.',
      reference:
        'https://www.niddk.nih.gov/health-information/digestive-diseases/gallstones/definition-facts',
    },
  ];
}

export function hepaticBiliaryViewCatalog(
  parent: BodyStructure | null,
  context = false,
  relationshipId: string | null = null,
) {
  const relation = context
    ? hepaticBiliaryRelationshipsFor(parent).find(
        (r) => r.id === relationshipId,
      )
    : null;
  if (!relation) return hepaticViewCatalog(parent, context);
  const base = hepaticViewCatalog(parent, true);
  const extra = relation.context.filter(
    (s) => !base.structures.some((item) => item.id === s.id),
  );
  return {
    ...base,
    structures: [...base.structures, ...extra],
    contextIds: relation.context.map((s) => s.id),
    bundles: [
      ...base.bundles,
      ...hepaticBiliarySource.bundles.filter(
        (b) =>
          extra.some((s) => s.bundle === b.id) &&
          !base.bundles.some((item) => item.id === b.id),
      ),
    ],
  };
}
export function hepaticBiliaryColour(s: BodyStructure) {
  return (
    (
      {
        FMA7202: '#c8a45d',
        FMA14539: '#82b8ab',
        FMA14668: '#c9c879',
      } as Record<string, string>
    )[s.fmaId] ?? hepaticColour(s)
  );
}
