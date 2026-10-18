import pins from '../content/pelvic-venous-tour-pins.json' with { type: 'json' };
import { pelvicTributaryXrayTopics } from '../content/pelvic-tributary-xray';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

type Group = keyof typeof pelvicTributaryXrayTopics;
const expected = [
  ['FMA18904', 'left', 'iliolumbar', 'FJ3510'],
  ['FMA18913', 'left', 'inferior-gluteal', 'FJ3513'],
  ['FMA18916', 'left', 'obturator', 'FJ3527'],
  ['FMA18910', 'left', 'superior-gluteal', 'FJ3531'],
  ['FMA18903', 'right', 'iliolumbar', 'FJ3603'],
  ['FMA18912', 'right', 'inferior-gluteal', 'FJ3606'],
  ['FMA18918', 'right', 'internal-pudendal', 'FJ3610'],
  ['FMA18906', 'right', 'lateral-sacral', 'FJ3611'],
  ['FMA18915', 'right', 'obturator', 'FJ3612'],
  ['FMA18909', 'right', 'superior-gluteal', 'FJ3616'],
] as const;
if (pins.baseline !== 'b3a9ff28f407437a85b9c56278bd31944ba4033e' ||
  pins.tourRevision !== 'pelvic-venous-tour-20261010-r1' || pins.entries.length !== expected.length ||
  expected.some(([fma, side, group, file], i) => {
    const entry = pins.entries[i];
    return entry.fmaId !== fma || entry.id !== `vm:anatomy:body:pelvis:${side}:vessel:${side}-${group}-vein` ||
      entry.laterality !== side || entry.region !== 'pelvis' || entry.system !== 'vessels' || entry.category !== 'vessel' ||
      entry.bundle !== 'pelvic-veins' || entry.sourceTree !== 'isa' || entry.sources.length !== 1 || entry.sources[0].file !== file;
  })) throw Error('Unexpected ten pelvic tributary source identities.');
const bindings = new Map(pins.entries.map((entry, i) => [entry.id, {
  signature: sourceCanonical(entry), side: expected[i][1], group: expected[i][2] as Group,
}]));

/** Original teaching only, over the ten unchanged source selections; no patient image or transform. */
export function pelvicTributaryXrayLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'xray') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  const topic = pelvicTributaryXrayTopics[binding.group];
  return {
    readiness: 'draft', title: `${s.name} · ${topic.title} · draft`, body: topic.body,
    bullets: [
      'This section distinguishes contrast X-ray venography from a routine plain pelvic radiograph. CT venography (CTV), MR venography (MRV) and intravascular ultrasound (IVUS) are different examinations, not alternate renderings of this model.',
      `The ${binding.side} model label is not an acquired side marker. Check the actual examination side and projection; a projected crossing does not establish a venous junction.`,
      ...topic.bullets,
      ...(binding.group === 'superior-gluteal' ? ['Only a short supplied superior gluteal surface is displayed; it does not depict the full gluteal drainage territory.'] : []),
      ...(['internal-pudendal', 'lateral-sacral'].includes(binding.group) ? ['Only the separately supplied right selection is included here. The left-labelled candidate remains held for source coordinate/laterality review; no counterpart is mirrored or reconstructed.'] : []),
      'Source surfaces and the existing guided tour supply gross spatial context only. No acquired venogram, complete connected lumen, measured calibre, flow, reflux, patency, diagnostic threshold or safe procedural route is supplied.',
    ],
    citations: [...topic.citations],
    note: 'Original source-bound educational draft for radiologist review of this exact source and teaching revision. No clinical approval or patient-space registration is implied. No scan, publisher media or procedure protocol is included. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
