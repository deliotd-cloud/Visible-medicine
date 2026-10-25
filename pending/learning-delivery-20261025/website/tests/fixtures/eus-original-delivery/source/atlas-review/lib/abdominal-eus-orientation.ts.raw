import branchPins from '../content/abdominal-branch-imaging-pins.json' with { type: 'json' };
import centralPins from '../content/central-vessel-imaging-pins.json' with { type: 'json' };
import { abdominalEusTopics } from '../content/abdominal-eus-orientation';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const expected = [
  [branchPins, 'FMA76574', 'FJ3432', 'unspecified'],
  [branchPins, 'FMA15391', 'FJ3443', 'unspecified'],
  [centralPins, 'FMA14768', 'FJ3499', 'left'],
] as const;
const bindings = new Map(expected.map(([pins, fmaId, file, laterality]) => {
  const matches = pins.entries.filter(entry => entry.identity.fmaId === fmaId);
  if (matches.length !== 1) throw Error('Unexpected abdominal EUS source count.');
  const s = matches[0].identity;
  if (s.system !== 'vessels' || s.laterality !== laterality || s.sources.length !== 1 || s.sources[0].file !== file)
    throw Error('Unexpected abdominal EUS source identity.');
  return [s.id, { signature: sourceCanonical(s), fmaId }] as const;
}));

/** Exact donor selections only; EUS orientation is not a patient imaging link. */
export function abdominalEusOrientationLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ultrasound') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || binding.signature !== sourceCanonical(s)) return undefined;
  const topic = abdominalEusTopics[binding.fmaId];
  return {
    readiness: 'draft', title: `${s.name} · ${topic.title} · draft`, body: topic.body,
    bullets: [...topic.bullets,
      'EUS uses an internal acoustic window. These examples do not guarantee visibility on routine transabdominal ultrasound or show the whole vessel in every examination.',
      'Reassemble the atlas before comparing relationships. Screen orientation must be checked on the acquired image; no patient-space registration is provided.'],
    citations: [...topic.citations],
    note: 'Original source-bound educational draft; revision-bound radiologist review pending. No images, publisher text, patient scans or measurements imported. No diagnostic threshold, procedural route or clinical approval is supplied. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
