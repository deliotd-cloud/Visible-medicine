import pins from '../content/acral-bone-imaging-pins.json' with { type: 'json' };
import { handBoneXrayFacts, handBoneXrayReferences, handBoneXrayShared } from '../content/hand-bone-xray';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';
export { handBoneXrayReferences } from '../content/hand-bone-xray';

type Group = keyof typeof handBoneXrayFacts;

// Both source-labelled sides are explicit. Carpals and foot bones are absent.
const fmaByGroup: Record<Group, readonly string[]> = {
  metacarpal1: ['FMA24465', 'FMA24464'],
  metacarpal2: ['FMA24467', 'FMA24466'],
  metacarpal3: ['FMA24469', 'FMA24468'],
  metacarpal4: ['FMA24471', 'FMA24470'],
  metacarpal5: ['FMA24473', 'FMA24472'],
  proximalThumb: ['FMA65470', 'FMA24450'],
  proximalFinger: ['FMA71915', 'FMA24451', 'FMA71908', 'FMA24452', 'FMA71916', 'FMA24453', 'FMA66791', 'FMA24454'],
  middleFinger: ['FMA23938', 'FMA24455', 'FMA23940', 'FMA24456', 'FMA23942', 'FMA24457', 'FMA23944', 'FMA24458'],
  distalThumb: ['FMA23951', 'FMA24459'],
  distalFinger: ['FMA23953', 'FMA24460', 'FMA23955', 'FMA24461', 'FMA23957', 'FMA24462', 'FMA23959', 'FMA24463'],
};

const groupByFma = new Map<string, Group>(
  (Object.entries(fmaByGroup) as [Group, readonly string[]][]).flatMap(([group, ids]) =>
    ids.map((id) => [id, group] as const),
  ),
);
const bindings = new Map(
  pins.entries.flatMap((entry) => {
    const group = entry.identity.region === 'hand' ? groupByFma.get(entry.identity.fmaId) : undefined;
    return group ? [[entry.identity.id, { signature: sourceCanonical(entry.identity), group }] as const] : [];
  }),
);

/** Draft X-ray orientation for only the 38 pinned metacarpals and hand phalanges. */
export function handBoneXrayLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'xray') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  const fact = handBoneXrayFacts[binding.group];
  return {
    readiness: 'draft',
    title: `${s.name} · X-ray orientation · draft`,
    body: fact.body,
    bullets: [fact.cue, ...handBoneXrayShared],
    citations: [...handBoneXrayReferences],
    note: 'Anatomy/radiology review pending for this source revision. Return separation to zero before comparing relationships. No radiograph or spatial registration is supplied. Confirm side and projection on the separate acquired study. This is orientation teaching, not a patient diagnosis or treatment recommendation. Case, Atlas and paid-lecture access remain independent.',
  };
}
