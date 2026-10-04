import pins from '../content/hand-bone-ultrasound-pins.json' with {type: 'json'};
import {
  handBoneUltrasoundReferences as references,
  handBoneUltrasoundTeaching as teaching,
  handBoneUltrasoundReviewNote as note,
  type HandBoneUltrasoundLesson,
} from '../content/hand-bone-ultrasound';
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

/** Exact full-source hand-bone ultrasound drafts; radiologist review remains pending. */
export function handBoneUltrasoundLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  const binding = bindings.get(s.id);
  if (!binding || !binding.tabs.includes(tab) || sourceCanonical(s) !== binding.signature) return undefined;
  const lessons: Partial<Record<ContentTab, HandBoneUltrasoundLesson>> = teaching[binding.family];
  const lesson = lessons[tab];
  if (!lesson) return undefined;
  return {
    readiness: 'draft',
    title: `${s.name} · ultrasound evidence & limits · draft`,
    body: lesson.body,
    bullets: [...lesson.bullets],
    citations: lesson.citations.map(key => references[key].url),
    note,
  };
}
