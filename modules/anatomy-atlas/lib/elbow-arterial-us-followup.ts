import pins from '../content/elbow-arterial-us-followup-pins.json' with { type: 'json' };
import {
  elbowArterialUsFollowupReferences as references,
  elbowArterialUsFollowupTeaching as teaching,
  elbowArterialUsFollowupNote as note,
} from '../content/elbow-arterial-us-followup';
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

/** Refuse renamed, partially matched, reordered or otherwise changed source identities. */
export function elbowArterialUsFollowupLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ultrasound') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  const lesson = teaching[binding.family];
  return {
    readiness: 'draft', title: `${s.name} · ultrasound evidence orientation · draft`,
    body: lesson.body, bullets: [...lesson.bullets],
    citations: lesson.citations.map(key => references[key]), note,
  };
}
