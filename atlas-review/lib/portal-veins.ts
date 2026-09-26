import data from '../public/models/bodyparts3d/portal-veins/catalog.json' with { type: 'json' };
import {
  applyBodySourceAddition,
  sourceCanonical,
  type BodySourceAddition,
} from './body-source-additions.ts';
import type { BodyCatalog, BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';
const source = data as unknown as BodySourceAddition;
export function addPortalVeins(catalog: BodyCatalog) {
  return applyBodySourceAddition(catalog, source);
}
export const portalReferences = {
  anatomy: 'https://anatomy.ttuhscep.edu/anatomytables/veins_abdomen.html',
  dissection: 'https://anatomy.ttuhscep.edu/schemes/duodenum_vid_C480.html',
  mesentericVariants: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10856009/',
  colicVariants: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5257301/',
};
const facts: Record<string, [string, string]> = {
  FMA14331: [
    'The splenic vein runs behind the pancreas and joins the superior mesenteric vein to form the portal vein.',
    'It carries splenic return into the portal circulation.',
  ],
  FMA15390: [
    'The left gastroepiploic (gastro-omental) vein follows the greater-curvature side of the stomach.',
    'It drains towards the splenic vein.',
  ],
  FMA15397: [
    'The right gastroepiploic (gastro-omental) vein follows the greater-curvature side of the stomach.',
    'It contributes to superior mesenteric venous return; the collecting pattern varies.',
  ],
  FMA15399: [
    'The left gastric vein is associated with the lesser curvature of the stomach.',
    'It carries gastric return towards the portal vein.',
  ],
  FMA15400: [
    'The right gastric vein is associated with the lesser curvature of the stomach.',
    'It carries gastric return towards the portal vein.',
  ],
};
export function portalVeinLesson(
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
      'One whole source surface remains selectable. Smaller tributaries, lumens and exact junctions are not established.',
      'Gastroepiploic and gastro-omental are alternative names. Left/right gastric names do not require every point to remain on one side of the midline.',
      'Use Portal venous drainage to explore the available relationships; hide a covering structure or extract the selected vessel, then Undo or reset separation.',
    ],
    note: 'Anatomical and clinical review pending. No flow, thrombosis, portal hypertension, scan appearance or patient registration is inferred.',
    citations: [portalReferences.anatomy, portalReferences.dissection],
  };
}
