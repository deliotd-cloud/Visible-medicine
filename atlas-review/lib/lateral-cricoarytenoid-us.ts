import pins from '../content/lateral-cricoarytenoid-us-pins.json' with { type: 'json' };
import { lateralCricoarytenoidUsReference, lateralCricoarytenoidUsTopic } from '../content/lateral-cricoarytenoid-us';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const identities = new Map(pins.entries.map(e => [e.identity.id, sourceCanonical(e.identity)]));
export function lateralCricoarytenoidUsLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ultrasound' || identities.get(s.id) !== sourceCanonical(s)) return undefined;
  return {
    readiness: 'draft', title: `${s.name} · Ultrasound orientation · draft`,
    body: lateralCricoarytenoidUsTopic.body,
    bullets: [...lateralCricoarytenoidUsTopic.bullets,
      'This static source surface has no validated probe plane, tissue echogenicity, motion or patient registration. Restore assembled positions before comparing relationships.'],
    citations: [lateralCricoarytenoidUsReference, 'https://creativecommons.org/licenses/by/4.0/'],
    note: 'Original adapted summary of Schneider-Stickler, Ho and Moriggl (2023), CC BY 4.0. No figures imported. Radiologist review pending; no procedural instructions. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
