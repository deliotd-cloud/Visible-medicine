import pins from '../content/tongue-imaging-pins.json' with { type: 'json' };
import { tongueImagingTopics } from '../content/tongue-imaging';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

type Group = keyof typeof tongueImagingTopics;
const bound = new Map(pins.entries.map(entry => [entry.identity.id, {
  signature: sourceCanonical(entry.identity), group: entry.group as Group,
}]));

/** Five exact root-body sources; CT/MRI orientation only. */
export function tongueImagingLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ct' && tab !== 'mri') return undefined;
  const match = bound.get(s.id);
  if (!match || sourceCanonical(s) !== match.signature) return undefined;
  const topic = tongueImagingTopics[match.group][tab];
  return {
    readiness: 'draft',
    title: `${s.name} · ${tab.toUpperCase()} orientation · draft`,
    body: topic.body,
    bullets: [
      topic.limit,
      `Source identity: ${s.fmaId} · ${s.laterality} · ${s.sources.length} recorded component${s.sources.length === 1 ? '' : 's'}. Boundaries and relationships require independent review.`,
    ],
    citations: [...topic.citations],
    note: 'Educational draft; revision-bound radiologist review pending. This reference model is not spatially registered to a patient scan and does not supply acquired-image masks.',
  };
}
