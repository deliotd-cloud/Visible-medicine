import pins from '../content/central-vessel-imaging-pins.json' with { type: 'json' };
import { thoracicEusTopics } from '../content/thoracic-eus-orientation';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const matches = pins.entries.filter(entry => entry.identity.fmaId === 'FMA4838');
if (matches.length !== 1) throw Error('Unexpected thoracic EUS source count.');
const source = matches[0].identity;
if (source.system !== 'vessels' || source.laterality !== 'unspecified' ||
    source.sources.length !== 1 || source.sources[0].file !== 'FJ3416')
  throw Error('Unexpected thoracic EUS source identity.');
const signature = sourceCanonical(source);

/** Exact donor selection only; EUS teaching does not create a patient imaging link. */
export function thoracicEusOrientationLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ultrasound' || s.id !== source.id || sourceCanonical(s) !== signature) return undefined;
  const topic = thoracicEusTopics.FMA4838;
  return {
    readiness: 'draft', title: `${s.name} · ${topic.title} · draft`, body: topic.body,
    bullets: [...topic.bullets,
      'EUS uses an internal acoustic window. These examples do not guarantee visibility on routine transthoracic ultrasound or show the whole vessel in every examination.',
      'Reassemble the atlas before comparing relationships. Screen orientation must be checked on the acquired image; no patient-space registration is provided.'],
    citations: [...topic.citations],
    note: 'Original source-bound educational draft; revision-bound radiologist review pending. No images, publisher text, patient scans or measurements imported. No diagnostic threshold, procedural route or clinical approval is supplied. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
