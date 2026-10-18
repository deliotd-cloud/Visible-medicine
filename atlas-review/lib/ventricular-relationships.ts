import type { BodyStructure } from '../app/body-types';
import type { DissectionView } from '../app/dissection-data';
import {
  ventricleCatalog,
  ventriclesFor,
  ventricleReference,
} from './ventricles';

const lateral =
  'Around the body of the lateral ventricle, compare the callosum above, the caudate alongside and the thalamus below. These whole source structures do not delineate individual ventricular walls.';
const definitions: {
  id: string;
  title: string;
  space: string;
  context: string[];
  view: DissectionView;
  guide: string;
}[] = [
  {
    id: 'left-landmarks',
    title: 'Left ventricular landmarks',
    space: 'FMA78450',
    context: ['FMA72827', 'FMA258716', 'FMA86464'],
    view: 'left',
    guide: lateral,
  },
  {
    id: 'right-landmarks',
    title: 'Right ventricular landmarks',
    space: 'FMA78449',
    context: ['FMA72826', 'FMA258714', 'FMA86464'],
    view: 'right',
    guide: lateral,
  },
  {
    id: 'third-landmarks',
    title: 'Third ventricle & thalami',
    space: 'FMA78454',
    context: ['FMA258714', 'FMA258716'],
    view: 'anterior',
    guide:
      'Compare the third ventricular space between the thalami. The hypothalamic contribution to its lateral walls is not separately shown in this view.',
  },
];

/** Only exact existing space/context identities; no new anatomy or wall meshes. */
export function ventricularRelationshipsFor(parent: BodyStructure) {
  const spaces = ventriclesFor(parent);
  if (!spaces.length) return [];
  return definitions.flatMap((definition) => {
    const space = spaces.filter((s) => s.fmaId === definition.space);
    const context = definition.context.map((fma) =>
      ventricleCatalog.structures.filter(
        (s) => ventricleCatalog.contextIds.includes(s.id) && s.fmaId === fma,
      ),
    );
    if (space.length !== 1 || context.some((matches) => matches.length !== 1))
      return [];
    return [
      {
        id: definition.id,
        title: definition.title,
        spaceId: space[0].id,
        context: context.map((matches) => matches[0]),
        view: definition.view,
        guide: definition.guide,
        reference: ventricleReference,
      },
    ];
  });
}
