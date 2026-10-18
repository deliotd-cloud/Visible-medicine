import pins from '../content/plantar-arterial-us-pins.json' with { type: 'json' };
import { plantarArterialUsReference, plantarArterialUsTopics, plantarArterialUsEvidenceLimit, type PlantarArterialUsGroup } from '../content/plantar-arterial-us';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const identities = new Map(pins.entries.map(e => [e.identity.id, { signature: sourceCanonical(e.identity), group: e.group as PlantarArterialUsGroup }]));
export function plantarArterialUsLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ultrasound') return undefined;
  const bound = identities.get(s.id);
  if (!bound || sourceCanonical(s) !== bound.signature) return undefined;
  return {
    readiness: 'draft', title: `${s.name} · Ultrasound arterial orientation · draft`,
    body: plantarArterialUsTopics[bound.group].body,
    bullets: [plantarArterialUsEvidenceLimit,
      'The static source does not contain Doppler flow, waveforms, patency, perfusion or a validated lumen. Restore assembled positions before comparing relationships; apparent display gaps are not evidence of occlusion.',
      'A named source vessel does not establish its visibility or continuity on a patient study. There is no acquired ultrasound image or validated probe plane connected here.'],
    citations: [plantarArterialUsReference, 'https://creativecommons.org/licenses/by/4.0/'],
    note: 'Original adapted summary of Takahashi, França, Del Valle and Ferreira (2020), CC BY 4.0. No figures imported. Radiologist review pending; no acquisition or intervention protocol. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
