import pins from '../content/median-cubital-xray-pins.json' with { type: 'json' };
import {
  medianCubitalXrayReferences as references,
  medianCubitalXrayTeaching as teaching,
  medianCubitalXrayNote as note,
} from '../content/median-cubital-xray';
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

/** An injection-site label is not proof of visible segment identity or registration. */
export function medianCubitalXrayLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'xray') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  const lesson = teaching[binding.family];
  return {
    readiness: 'draft', title: `${s.name} · ${lesson.title} · draft`,
    body: lesson.body, bullets: [...lesson.bullets],
    citations: lesson.citations.map(key => references[key]), note,
  };
}
