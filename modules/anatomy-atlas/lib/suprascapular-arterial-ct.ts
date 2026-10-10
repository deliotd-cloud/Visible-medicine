import pins from '../content/suprascapular-arterial-ct-pins.json' with { type: 'json' };
import { suprascapularArterialCtTeaching as teaching } from '../content/suprascapular-arterial-ct';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const bindings = new Map(pins.entries.map(entry => [entry.identity.id, sourceCanonical(entry.identity)]));
/** Exact retained source records only; no image registration or clinical approval. */
export function suprascapularArterialCtLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ct' || bindings.get(s.id) !== sourceCanonical(s)) return undefined;
  return {
    readiness: 'draft', title: `${s.name} · CT arterial orientation · draft`,
    body: teaching.body, bullets: [...teaching.bullets], citations: [...teaching.citations],
    note: 'Original educational draft for revision-bound radiologist review. No scan is loaded or registered to this source mesh; this is not an acquisition recommendation or clinical approval. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
