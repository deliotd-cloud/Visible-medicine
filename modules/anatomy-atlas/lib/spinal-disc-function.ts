import pins from '../content/spine-imaging-pins.json' with { type: 'json' };
import {
  spinalDiscFunctionFacts,
  spinalDiscFunctionGroups,
} from '../content/spinal-disc-function';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

type DiscGroup = keyof typeof spinalDiscFunctionGroups;
const isDiscGroup = (group: string): group is DiscGroup =>
  group === 'cervicalDisc' || group === 'thoracicDisc' || group === 'lumbarDisc';

// Bind the complete retained identity, including geometry and provenance.
const bindings = new Map(
  pins.entries
    .filter((entry) => isDiscGroup(entry.group))
    .map((entry) => [
      entry.identity.id,
      { signature: sourceCanonical(entry.identity), group: entry.group as DiscGroup },
    ]),
);

/** Draft function teaching for the 22 retained source-labelled whole-disc selections. */
export function spinalDiscFunctionLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (tab !== 'function') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;

  const region = spinalDiscFunctionGroups[binding.group];
  return {
    readiness: 'draft',
    title: `${s.name} · Function · draft`,
    body: region.body,
    bullets: [
      spinalDiscFunctionFacts.shared,
      ...region.bullets,
      ...(s.sourceName === 'intervertebral disk of axis'
        ? ['The axis source label refers to a disc below C2. There is no C1–C2 intervertebral disc.']
        : []),
    ],
    note: 'The 22 selections are whole-disc surfaces: annulus, nucleus and endplates are not independently segmented, and one source level remains unresolved. Source names do not automatically assign a two-vertebra patient imaging interval. Mesh shape, cutaway and explode provide no numerical pressure, strain, motion, diagnosis or CT/MR registration. Revision-bound radiologist review is pending. Case, Atlas and lecture access remain independent.',
    citations: [...region.references],
  };
}
