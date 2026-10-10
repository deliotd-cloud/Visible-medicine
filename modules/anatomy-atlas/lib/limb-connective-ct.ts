import pins from '../content/limb-connective-ct-pins.json' with { type: 'json' };
import { limbConnectiveCtTeaching as teaching } from '../content/limb-connective-ct';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const groups = {
  FMA44249: teaching.longPlantar, FMA44250: teaching.longPlantar,
  FMA40120: teaching.wristRetinaculum, FMA40121: teaching.wristRetinaculum,
  FMA58776: teaching.iliotibialTract, FMA58777: teaching.iliotibialTract,
} as const;
const bindings = new Map(pins.entries.map(entry => [entry.identity.id, sourceCanonical(entry.identity)]));

/** Exact retained source records only; no patient registration or clinical approval. */
export function limbConnectiveCtLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ct' || bindings.get(s.id) !== sourceCanonical(s)) return undefined;
  const topic = groups[s.fmaId as keyof typeof groups];
  if (!topic) return undefined;
  return {
    readiness: 'draft', title: `${s.name} · ${topic.title} · draft`,
    body: topic.body, bullets: [...topic.bullets], citations: [...topic.citations],
    note: 'Original educational draft for revision-bound radiologist review. No CT scan is loaded or registered to this source mesh; this is not an acquisition recommendation or clinical approval. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
