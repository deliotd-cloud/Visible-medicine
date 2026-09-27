import { bodyReviewMaterial } from './body-review-material';
import renderer from '../content/body-renderer-revision.json';
import {
  bodyChecklists,
  bodyChecklistVersion,
  bodyDecisionScope,
  type BodyReviewContext,
} from './body-review-decisions';

async function hash(value: unknown) {
  const bytes = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(JSON.stringify(value)),
  );
  return Array.from(new Uint8Array(bytes), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
}
/** No account data is cached. Source identity and scope come from the corrected display catalogue. */
export async function bodyReviewContext(
  id: string,
): Promise<BodyReviewContext | null> {
  const material = await bodyReviewMaterial(id);
  if (!material) return null;
  const { source, fingerprints, topics } = material;
  const checklists = structuredClone(bodyChecklists);
  if (material.guidedTours.length) checklists.teaching.push({id:'guided-tour',label:'Review the complete guided tour: all captions, source surfaces, references, selected targets, fading and camera transitions. Record corrections in the intended learner scope.'});
  const scope = {
    catalogScope: bodyDecisionScope,
    structureId: id,
    checklistVersion: bodyChecklistVersion,
  };
  const teachingTabs = topics
    .filter((t) => t.readiness === 'draft')
    .map((t) => t.tab);
  const core = ['anatomy', 'function', 'clinical', 'pathology'];
  const blockers: BodyReviewContext['blockers'] = {
    geometry:
      topics.find((t) => t.tab === 'anatomy')?.readiness === 'identity-only'
        ? [
            'Source identity is unresolved. Resolve and re-audit this selection before approval.',
          ]
        : [],
    teaching: core
      .filter((tab) => !teachingTabs.some((t) => t === tab))
      .map((tab) => `The core ${tab} topic is not an authored draft.`),
    imaging: [
      'No validated acquired-image series or spatial registration is connected. Imaging approval is unavailable.',
    ],
  };
  return {
    ...scope,
    structureName: source.structure.name,
    materialHash: material.materialHash,
    sourceHash: fingerprints.source,
    teachingHash: fingerprints.teaching,
    rendererHash: renderer.sha256,
    checklists,
    blockers,
    teachingTabs,
    revisions: {
      geometry: await hash({
        ...scope,
        source: fingerprints.source,
        renderer: renderer.sha256,
        checks: bodyChecklists.geometry,
      }),
      teaching: await hash({
        ...scope,
        source: fingerprints.source,
        teaching: fingerprints.teaching,
        checks: checklists.teaching,
      }),
      imaging: null,
    },
  };
}
