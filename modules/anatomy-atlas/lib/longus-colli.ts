import data from '../public/models/bodyparts3d/longus-colli/catalog.json' with { type: 'json' };
import {
  applyBodySourceAddition,
  sourceCanonical,
  type BodySourceAddition,
} from './body-source-additions.ts';
import {
  longusColliReferences,
  longusColliStudySets,
} from '../content/longus-colli-studies.ts';
import type { BodyCatalog, BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';
const source = data as unknown as BodySourceAddition;
export function addLongusColli(catalog: BodyCatalog) {
  return applyBodySourceAddition(catalog, source);
}
export function longusColliStudyReady(
  catalog: BodyCatalog | null,
  region: string,
  recipeId: string | null,
  side = 'both',
) {
  const study = longusColliStudySets.find((s) => s.id === recipeId);
  if (!study) return true;
  if (
    !catalog ||
    !study.regions.includes(region) ||
    !['both', 'left'].includes(side)
  )
    return false;
  try {
    return (
      source.structures.every((p) =>
        catalog.structures.some((s) => s.id === p.id),
      ) && addLongusColli(catalog) === catalog
    );
  } catch {
    return false;
  }
}
const attachments: Record<string, string> = {
  FMA46284:
    'The superior oblique part classically ascends from anterior transverse-process tubercles at C3–C5 towards the anterior atlas tubercle.',
  FMA46286:
    'The vertical part classically spans the front of the lower cervical and upper thoracic vertebral bodies (C5–T3) towards C2–C4.',
  FMA46288:
    'The inferior oblique part classically ascends from the T1–T3 vertebral bodies towards the anterior transverse-process tubercles at C5–C6.',
};
export function longusColliLesson(
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
    title:
      s.name +
      ' · ' +
      (tab === 'anatomy' ? 'Attachments' : 'Function') +
      ' · draft',
    body:
      tab === 'anatomy'
        ? attachments[s.fmaId]
        : 'Longus colli contributes to cervical flexion and unilateral lateral bending. These are actions of the muscle group, not measured motion of this isolated source part.',
    bullets: [
      'Only the three supplied left parts are present. Longus capitis is a different, skull-reaching muscle; its surface is not a substitute for missing longus colli.',
      tab === 'anatomy'
        ? 'Attachment levels describe standard teaching anatomy; the source mesh does not certify individual footprints or level-specific slips.'
        : 'Motor supply is through cervical anterior rami; published segment ranges differ and require clinical review. No nerve route or contraction is generated.',
      'Open the Longus colli study to inspect the parts. Use Whole body for the complete available context, or Spine for vertebral context; preserve source position at zero separation.',
    ],
    note: 'Independent anatomical and radiological review pending. No fascial plane, right-side geometry, tendon calcification, fluid collection, patient scan or registration is inferred.',
    citations: longusColliReferences,
  };
}
