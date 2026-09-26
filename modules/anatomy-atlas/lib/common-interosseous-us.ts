import pins from '../content/common-interosseous-us-pins.json' with { type: 'json' };
import { commonInterosseousUsReference, commonInterosseousUsTopics, commonInterosseousUsEvidenceLimit, type CommonInterosseousUsGroup } from '../content/common-interosseous-us';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const identities = new Map(pins.entries.map(e => [e.identity.id, { signature: sourceCanonical(e.identity), group: e.group as CommonInterosseousUsGroup }]));
export function commonInterosseousUsLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ultrasound') return undefined;
  const bound = identities.get(s.id);
  if (!bound || sourceCanonical(s) !== bound.signature) return undefined;
  return {
    readiness: 'draft', title: `${s.name} · Ultrasound arterial orientation · draft`,
    body: commonInterosseousUsTopics[bound.group].body,
    bullets: [commonInterosseousUsEvidenceLimit,
      'The static source does not contain Doppler flow, waveforms, patency, perfusion or a validated lumen. Restore assembled positions before comparing relationships; apparent display gaps are not evidence of occlusion.',
      'A named source vessel does not establish its visibility or continuity on a patient study. There is no acquired ultrasound image or validated probe plane connected here.'],
    citations: [commonInterosseousUsReference],
    note: 'Original adapted summary of Mohana Borges and Souza (2021), Creative Commons Attribution. The article contains the reuse statement. No figures imported. Radiologist review pending; no acquisition or intervention protocol. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
