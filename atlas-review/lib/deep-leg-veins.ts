import data from '../public/models/bodyparts3d/deep-leg-veins/catalog.json' with { type: 'json' };
import {
  applyBodySourceAddition,
  sourceCanonical,
  type BodySourceAddition,
} from './body-source-additions.ts';
import type { BodyCatalog, BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';
const source = data as unknown as BodySourceAddition;
export function addDeepLegVeins(catalog: BodyCatalog) {
  return applyBodySourceAddition(catalog, source);
}
const facts: Record<string, [string, string]> = {
  FMA44336: [
    'Anterior tibial veins accompany the anterior tibial artery in the anterior leg compartment.',
    'Deep return from the anterior leg contributes to the popliteal venous system.',
  ],
  FMA44338: [
    'Posterior tibial veins accompany the posterior tibial artery in the deep posterior leg compartment.',
    'Deep return from the posterior leg contributes proximally to the popliteal venous system.',
  ],
  FMA51042: [
    'The deep femoral (profunda femoris) vein is a deep thigh vessel, distinct from the femoral vein.',
    'It returns blood from the deep thigh and joins femoral return in the common femoral region.',
  ],
};
export function deepLegVeinLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  const index = source.structures.findIndex(
    (p) => sourceCanonical(p) === sourceCanonical(s),
  );
  if (index < 0 || !['anatomy', 'function'].includes(tab)) return undefined;
  const key = source.structures[index - (index % 2)].fmaId;
  return {
    readiness: 'draft',
    title: `${s.name} · ${tab === 'anatomy' ? 'Anatomy' : 'Venous return'} · draft`,
    body: facts[key][tab === 'anatomy' ? 0 : 1],
    bullets: [
      'Calf deep veins commonly have companion channels. One source selection does not establish their full number, connections or variants.',
      'Anterior tibial selections include two separate source parts. Fibular veins, exact collecting junctions, valves and lumen are not supplied.',
      'Use Venous drainage to inspect typical same-side connections. It is a teaching map, not proof that source surfaces meet.',
    ],
    note: 'Anatomical and clinical review pending. No flow, compression response, thrombosis, ultrasound appearance or CT/MRI registration is inferred.',
    citations: [
      'https://pmc.ncbi.nlm.nih.gov/articles/PMC5381851/',
      'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html',
    ],
  };
}
