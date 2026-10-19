import data from '../public/models/bodyparts3d/hepatic-veins/catalog.json' with { type: 'json' };
import {
  applyBodySourceAddition,
  sourceCanonical,
  type BodySourceAddition,
} from './body-source-additions.ts';
import type { BodyCatalog, BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';
const source = data as unknown as BodySourceAddition;
export function addHepaticVeins(catalog: BodyCatalog) {
  return applyBodySourceAddition(catalog, source);
}
export const hepaticVeinReferences = {
  anatomy: 'https://anatomy.ttuhscep.edu/anatomytables/veins_abdomen.html',
};
const facts: Record<string, [string, string]> = {
  FMA14340: [
    'The middle hepatic vein is one of the main hepatic veins draining the liver. This is the whole source-labelled surface, not a validated territory map.',
    'It carries hepatic venous return towards the inferior vena cava. Portal inflow is a separate pathway through the liver.',
  ],
  FMA15791: [
    'This source-labelled right hepatic tributary group contains four original files and seven disconnected components. They remain one selectable group, not seven newly named veins.',
    'These source-labelled tributaries contribute to right hepatic venous return. Their exact connections and drainage territories are not validated.',
  ],
  FMA15794: [
    'This source-labelled left hepatic tributary group contains five original files and five disconnected components. They remain one selectable group, not five newly named veins.',
    'These source-labelled tributaries contribute to left hepatic venous return. Their exact connections and drainage territories are not validated.',
  ],
};
export function hepaticVeinLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (
    !['anatomy', 'function'].includes(tab) ||
    !source.structures.some((p) => sourceCanonical(p) === sourceCanonical(s))
  )
    return undefined;
  return {
    readiness: 'draft',
    title: `${s.name} · ${tab === 'anatomy' ? 'Anatomy' : 'Venous return'} · draft`,
    body: facts[s.fmaId][tab === 'anatomy' ? 0 : 1],
    bullets: [
      'Hide covering tissue or use Venous drainage → Show available veins & bones; extract the selected group and Undo or reset separation.',
      'All original source faces are retained; no bridging, mirroring, cropping or inferred continuity. A tributary group moves together, preserving its internal spacing.',
      'The separate liver-branches dissection retains its own source groups, including the anterior inferior tributary of the middle hepatic vein. Root and nested selections are not interchangeable.',
    ],
    note: 'Anatomical and clinical review pending. No flow, thrombosis, venous territory, scan appearance or patient registration is inferred.',
    citations: [hepaticVeinReferences.anatomy],
  };
}
