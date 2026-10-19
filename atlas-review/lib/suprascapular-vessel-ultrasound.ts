import pins from '../content/suprascapular-vessel-ultrasound-pins.json' with { type: 'json' };
import {
  suprascapularVesselUltrasoundReferences as references,
  suprascapularVesselUltrasoundTeaching as teaching,
  suprascapularVesselUltrasoundNote as note,
} from '../content/suprascapular-vessel-ultrasound';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

type Family = keyof typeof teaching;
const bindings = new Map<string, { signature: string; family: Family }>(
  pins.entries
    .filter(entry => entry.family === 'artery' || entry.family === 'vein')
    .map(entry => [entry.identity.id, {
      signature: sourceCanonical(entry.identity), family: entry.family as Family,
    }]),
);

/** The entire pinned source identity must match; a shared name or FMA ID is insufficient. */
export function suprascapularVesselUltrasoundLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
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
