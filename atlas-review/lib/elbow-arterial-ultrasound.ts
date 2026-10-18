import pins from '../content/elbow-arterial-ultrasound-pins.json' with { type: 'json' };
import {
  elbowArterialUltrasoundReferences as references,
  elbowArterialUltrasoundTeaching as teaching,
  elbowArterialUltrasoundNote as note,
} from '../content/elbow-arterial-ultrasound';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';
type Family = keyof typeof teaching;
const bindings = new Map<string, { signature: string; family: Family }>(
  pins.entries.map(entry => [entry.identity.id, {
    signature: sourceCanonical(entry.identity), family: entry.family as Family,
  }]),
);
/** No label/FMA-only match: every source identity field must retain its pinned value. */
export function elbowArterialUltrasoundLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ultrasound') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  const lesson = teaching[binding.family];
  return {
    readiness: 'draft', title: `${s.name} · ultrasound orientation · draft`,
    body: lesson.body, bullets: [...lesson.bullets],
    citations: lesson.citations.map(key => references[key]), note,
  };
}
