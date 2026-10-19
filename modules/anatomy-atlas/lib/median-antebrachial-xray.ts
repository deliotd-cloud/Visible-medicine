import pins from '../content/median-antebrachial-xray-pins.json' with { type: 'json' };
import {
  medianAntebrachialXrayReferences as references,
  medianAntebrachialXrayTeaching as teaching,
  medianAntebrachialXrayNote as note,
} from '../content/median-antebrachial-xray';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const identities = new Map(pins.entries.map(entry => [entry.identity.id, sourceCanonical(entry.identity)]));

/** Method-specific factual context, never a claim of normal plain-film depiction. */
export function medianAntebrachialXrayLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'xray') return undefined;
  const identity = identities.get(s.id);
  if (!identity || sourceCanonical(s) !== identity) return undefined;
  return {
    readiness: 'draft', title: `${s.name} · ${teaching.title} · draft`,
    body: teaching.body, bullets: [...teaching.bullets],
    citations: Object.values(references), note,
  };
}
