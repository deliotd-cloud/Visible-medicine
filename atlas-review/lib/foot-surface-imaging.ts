import pins from '../content/foot-surface-imaging-pins.json' with {type: 'json'};
import {
  footSurfaceImagingReferences as references,
  footSurfaceImagingTeaching as teaching,
  footSurfaceImagingReviewNote as note,
  type FootSurfaceImagingLesson,
} from '../content/foot-surface-imaging';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

type Family = keyof typeof teaching;
const bindings = new Map(pins.entries.map(entry => [entry.identity.id, {
  signature: sourceCanonical(entry.identity),
  family: entry.family as Family,
  tabs: Object.keys(entry.previous),
}]));

/** Source-bound educational ultrasound drafts, pending revision-bound radiologist review. */
export function footSurfaceImagingLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  const binding = bindings.get(s.id);
  if (!binding || !binding.tabs.includes(tab) || sourceCanonical(s) !== binding.signature) return undefined;
  const lessons: Partial<Record<ContentTab, FootSurfaceImagingLesson>> = teaching[binding.family];
  const lesson = lessons[tab];
  if (!lesson) return undefined;
  return {
    readiness: 'draft',
    title: `${s.name} · ${tab} evidence & limits · draft`,
    body: lesson.body,
    bullets: [...lesson.bullets],
    citations: lesson.citations.map(key => references[key].url),
    note,
  };
}
