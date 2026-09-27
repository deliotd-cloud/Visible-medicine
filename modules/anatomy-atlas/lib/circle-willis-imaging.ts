import pins from '../content/circle-willis-imaging-pins.json' with { type: 'json' };
import { circleWillisRelationships, circleWillisModalities } from '../content/circle-willis-imaging';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';
const bindings = new Map(pins.entries.map(e => [e.identity.id, sourceCanonical(e.identity)]));
const groups: Record<string, keyof typeof circleWillisRelationships> = { FMA50169: 'acom', FMA50029: 'aca', FMA50030: 'aca', FMA50584: 'pca', FMA50585: 'pca', FMA50085: 'pcom', FMA50086: 'pcom' };
export function circleWillisImagingLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if ((tab !== 'ct' && tab !== 'mri') || bindings.get(s.id) !== sourceCanonical(s)) return undefined;
  const relation = circleWillisRelationships[groups[s.fmaId]], modality = circleWillisModalities[tab];
  return { readiness: 'draft', title: `${s.name} · ${modality.title} · draft`,
    body: `${relation.body} ${modality.body}`,
    bullets: [...modality.bullets, 'Model limit: selected surface segments do not establish lumen, patency, flow or complete arterial continuity. Missing or asymmetric model detail is not proof of normal anatomical variability.', `Source limit: ${s.coverageNote}`],
    citations: [...relation.citations, ...modality.citations],
    note: 'Educational draft for revision-bound radiologist review. Set separation to zero before comparing relationships. No patient images, registration or clinical approval are supplied. Atlas, imaging-case and paid-lecture access remain independent.' };
}
