import pins from '../content/orbital-support-mri-pins.json' with { type: 'json' };
import { orbitalSupportMriFacts, orbitalSupportMriLimitations, orbitalSupportMriReferences } from '../content/orbital-support-mri';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

type Family = keyof typeof orbitalSupportMriFacts;
const bindings = new Map(pins.entries.filter(entry => Object.hasOwn(orbitalSupportMriFacts, entry.family)).map(entry => [
  entry.identity.id, { signature: sourceCanonical(entry.identity), family: entry.family as Family },
]));

/** Exact retained source identities only; no FMA/name or side fallback. */
export function orbitalSupportMriLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'mri') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  const fact = orbitalSupportMriFacts[binding.family];
  return {
    readiness: 'draft', title: `${s.name} · MRI orientation · draft`,
    body: fact.body, bullets: [fact.distinction, ...orbitalSupportMriLimitations],
    citations: [...orbitalSupportMriReferences],
    note: 'Revision-bound radiologist review pending. No scan, patient registration, diagnostic finding or clinical approval is supplied. Atlas, imaging-case and lecture access remain independent.',
  };
}
