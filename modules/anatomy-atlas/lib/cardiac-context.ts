import raw from '../public/models/bodyparts3d/cardiac/great-vessel-context.json' with { type: 'json' };
import type { BodyCatalog, BodyStructure } from '../app/body-types';
import type { DissectionView } from '../app/dissection-data';
import { cardiacCatalog, cardiacFor, cardiacReference } from './cardiac';

export const cardiacVesselSource = raw as unknown as {
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
const definitions: {
  id: string;
  title: string;
  space: string;
  context: string[];
  view: DissectionView;
  guide: string;
}[] = [
  {
    id: 'right-atrial-inflow',
    title: 'Right atrium & superior vena cava',
    space: 'FMA11359',
    context: ['FMA4720'],
    view: 'right',
    guide:
      'Compare the superior vena cava with the right atrial cavity. It returns venous blood from the upper body. The inferior vena cava and other venous inflows are not shown here.',
  },
  {
    id: 'pulmonary-outflow',
    title: 'Right ventricle & pulmonary arteries',
    space: 'FMA9291',
    context: ['FMA50872', 'FMA50873'],
    view: 'anterior',
    guide:
      'The right ventricle ejects through the pulmonary valve into the pulmonary trunk, then the right and left pulmonary arteries. Compare the two supplied artery surfaces; this view does not separately show the trunk or valve.',
  },
  {
    id: 'left-atrial-inflow',
    title: 'Left atrium & pulmonary veins',
    space: 'FMA9465',
    context: ['FMA49914', 'FMA49916', 'FMA49911', 'FMA49913'],
    view: 'posterior',
    guide:
      'Pulmonary veins return blood from the lungs to the left atrium. Compare the four source-labelled superior and inferior vein groups with the atrial cavity. Individual ostia and variant drainage patterns are not validated here.',
  },
  {
    id: 'aortic-outflow',
    title: 'Left ventricle & ascending aorta',
    space: 'FMA9466',
    context: ['FMA3736'],
    view: 'left',
    guide:
      'The left ventricle ejects through the aortic valve into the aorta. Compare its cavity with the ascending aortic surface. The valve, aortic root subdivisions and a continuous outflow lumen are not delineated in this study.',
  },
];

/** Existing source-bound orientation context only, never new selectable children. */
export function cardiacRelationshipsFor(parent: BodyStructure | null) {
  const spaces = cardiacFor(parent);
  if (
    !spaces.length ||
    canonical(parent) !== canonical(cardiacVesselSource.parent)
  )
    return [];
  return definitions.flatMap((d) => {
    const space = spaces.filter((s) => s.fmaId === d.space);
    const context = d.context.map((fma) =>
      cardiacVesselSource.structures.filter((s) => s.fmaId === fma),
    );
    if (space.length !== 1 || context.some((matches) => matches.length !== 1))
      return [];
    return [
      {
        id: d.id,
        title: d.title,
        spaceId: space[0].id,
        context: context.map((matches) => matches[0]),
        view: d.view,
        guide: d.guide,
        reference: cardiacReference,
      },
    ];
  });
}

/** Default/hidden/separated views keep the original chamber bundle alone. */
export function cardiacContextViewCatalog(
  parent: BodyStructure | null,
  relationshipId: string | null = null,
) {
  const context =
    cardiacRelationshipsFor(parent).find((r) => r.id === relationshipId)
      ?.context ?? [];
  return {
    ...cardiacCatalog,
    structures: [...cardiacCatalog.structures, ...context],
    contextIds: [...cardiacCatalog.contextIds, ...context.map((s) => s.id)],
    bundles: [
      ...cardiacCatalog.bundles,
      ...cardiacVesselSource.bundles.filter((b) =>
        context.some((s) => s.bundle === b.id),
      ),
    ],
  };
}
export function cardiacVesselColour(s: BodyStructure) {
  if (s.fmaId === 'FMA3736') return '#c86059';
  if (['FMA50872', 'FMA50873'].includes(s.fmaId)) return '#7286ad';
  if (s.fmaId === 'FMA4720') return '#748ba9';
  return '#b97973';
}
