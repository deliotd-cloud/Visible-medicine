import pins from '../content/cranial-bone-imaging-pins.json' with { type: 'json' };
import { mandibleXrayReferences, mandibleXrayTeaching, mandibleXrayNote } from '../content/mandible-xray';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const id = 'vm:anatomy:body:head-neck:midline:bone:mandible';
const identity = pins.entries.find(entry => entry.identity.id === id)?.identity;
const signature = identity?.fmaId === 'FMA52748' && identity.sources.length === 1 &&
  identity.sources[0].file === 'FJ3289' &&
  identity.sources[0].sha256 === 'c38102c34660e2b767a7b95a341380bf4a52c754c6235fcd322be5c7b8cb1745'
  ? sourceCanonical(identity) : null;

/** A whole-record source match is required; a name or FMA match is insufficient. */
export function mandibleXrayLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'xray' || !signature || s.id !== id || sourceCanonical(s) !== signature) return undefined;
  return {
    readiness: 'draft',
    title: 'Mandible · panoramic X-ray orientation · draft',
    body: mandibleXrayTeaching.body,
    bullets: [...mandibleXrayTeaching.bullets],
    citations: mandibleXrayTeaching.citations.map(key => mandibleXrayReferences[key]),
    note: mandibleXrayNote,
  };
}
