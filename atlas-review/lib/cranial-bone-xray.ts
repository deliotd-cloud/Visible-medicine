import pins from '../content/cranial-bone-xray-pins.json' with { type: 'json' };
import {
  cranialBoneXrayReferences as references,
  cranialBoneXrayTeaching as teaching,
  cranialBoneXrayNote as note,
} from '../content/cranial-bone-xray';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

type Family = keyof typeof teaching;
const bindings = new Map<string, { signature: string; family: Family }>(
  pins.entries
    .filter(entry => ['frontal', 'parietal', 'temporal', 'occipital', 'sphenoid', 'ethmoid'].includes(entry.family))
    .map(entry => [entry.identity.id, {
      signature: sourceCanonical(entry.identity), family: entry.family as Family,
    }]),
);

/** The entire pinned source identity must match; a shared name or FMA ID is insufficient. */
export function cranialBoneXrayLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
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
