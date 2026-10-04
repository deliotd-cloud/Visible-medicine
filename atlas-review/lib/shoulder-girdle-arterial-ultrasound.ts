import pins from '../content/shoulder-girdle-arterial-ultrasound-pins.json' with { type: 'json' };
import {
  shoulderGirdleArterialUltrasoundReferences as references,
  shoulderGirdleArterialUltrasoundTeaching as teaching,
  shoulderGirdleArterialUltrasoundNote as note,
} from '../content/shoulder-girdle-arterial-ultrasound';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

type Family = keyof typeof teaching;
const bindings = new Map<string, { signature: string; family: Family }>(
  pins.entries.map(entry => [entry.identity.id, {
    signature: sourceCanonical(entry.identity),
    family: entry.family as Family,
  }]),
);

/** Only a complete pinned source identity can receive the US draft. */
export function shoulderGirdleArterialUltrasoundLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (tab !== 'ultrasound') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  const lesson = teaching[binding.family];
  return {
    readiness: 'draft',
    title: `${s.name} · ultrasound orientation · draft`,
    body: lesson.body,
    bullets: [...lesson.bullets],
    citations: lesson.citations.map(key => references[key]),
    note,
  };
}
