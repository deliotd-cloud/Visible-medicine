import pins from '../content/cranial-bone-imaging-pins.json' with { type: 'json' };
import {
  facialBoneXrayReferences as references,
  facialBoneXrayTeaching as teaching,
  facialBoneXrayNote as note,
} from '../content/facial-bone-xray';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

type Family = keyof typeof teaching;
const allowed = {
  'vm:anatomy:body:head-neck:left:bone:left-maxilla': { fmaId: 'FMA53650', file: 'FJ3269', family: 'maxilla' },
  'vm:anatomy:body:head-neck:right:bone:right-maxilla': { fmaId: 'FMA53649', file: 'FJ3375', family: 'maxilla' },
  'vm:anatomy:body:head-neck:left:bone:left-zygomatic-bone': { fmaId: 'FMA52893', file: 'FJ3287', family: 'zygomatic' },
  'vm:anatomy:body:head-neck:right:bone:right-zygomatic-bone': { fmaId: 'FMA52892', file: 'FJ3392', family: 'zygomatic' },
} as const;

const bindings = new Map<string, { signature: string; family: Family }>();
for (const entry of pins.entries) {
  const expected = allowed[entry.identity.id as keyof typeof allowed];
  if (!expected || entry.identity.fmaId !== expected.fmaId ||
      entry.identity.sources.length !== 1 || entry.identity.sources[0].file !== expected.file) continue;
  bindings.set(entry.identity.id, {
    signature: sourceCanonical(entry.identity),
    family: expected.family,
  });
}

/** Only the four pinned full source identities can receive these X-ray drafts. */
export function facialBoneXrayLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'xray') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;

  const lesson = teaching[binding.family];
  return {
    readiness: 'draft',
    title: `${s.name} · xray orientation · draft`,
    body: lesson.body,
    bullets: [...lesson.bullets],
    citations: lesson.citations.map(key => references[key]),
    note,
  };
}
