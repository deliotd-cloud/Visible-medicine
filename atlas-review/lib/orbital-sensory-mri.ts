import pins from '../content/orbital-nerve-quiz-pins.json' with { type: 'json' };
import { orbitalSensoryMriGroups, orbitalSensoryMriTopics } from '../content/orbital-sensory-mri';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

type Group = keyof typeof orbitalSensoryMriGroups;
const bindings = new Map<string, { signature: string; group: Group }>();
for (const [group, fmas] of Object.entries(orbitalSensoryMriGroups)) {
  for (const fma of fmas) {
    const matches = pins.entries.filter(e => e.group === group && e.identity.fmaId === fma);
    if (matches.length !== 1) throw Error('Unexpected orbital sensory MRI source binding');
    const identity = matches[0].identity;
    if (bindings.has(identity.id)) throw Error('Duplicate orbital sensory MRI identity');
    bindings.set(identity.id, { signature: sourceCanonical(identity), group: group as Group });
  }
}

/** Sixteen exact existing source records only; no new geometry or scan mapping. */
export function orbitalSensoryMriLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'mri') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  const topic = orbitalSensoryMriTopics[binding.group];
  return {
    readiness: 'draft',
    title: `${s.name} · MRI orientation · draft`,
    body: topic.body,
    bullets: [...topic.bullets,
      'These are anatomy and visibility-limit lessons, not annotations on the supplied head scans. No validated patient registration, diagnostic sensitivity or routine visibility of every small branch is established.',
      'Study source relationships with separation set to zero. Explode and isolation are model controls, not acquired MRI planes or proof of normal nerve function.'],
    citations: [...topic.citations],
    note: 'Original source-bound educational draft; revision-bound radiologist review pending. No scans, article text, figures, diagnostic thresholds or acquisition protocol imported. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
