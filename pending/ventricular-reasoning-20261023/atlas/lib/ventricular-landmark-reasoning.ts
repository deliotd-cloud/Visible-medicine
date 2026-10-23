import pins from '../content/ventricular-landmark-reasoning-pins.json' with { type: 'json' };
import type { BodyStructure } from '../app/body-types';
import type { ReasoningConcept } from './reasoning-questions';
import { sourceCanonical } from './body-source-additions';

const identities = new Map(pins.entries.map(({ key, identity }) =>
  [`${key}:${identity.id}`, sourceCanonical(identity)] as const));
export function ventricularLandmarkReasoningSourceMatches(s: BodyStructure, key: string): boolean {
  const expected = identities.get(`${key}:${s.id}`);
  return expected !== undefined && sourceCanonical(s) === expected;
}

const ventricles = {
  title: 'UTHealth Neuroanatomy Online · ventricles and choroid plexus',
  url: 'https://nba.uth.tmc.edu/neuroanatomy/L4/Lab04p01_index.html',
};
const hypothalamus = {
  title: 'UTHealth Neuroanatomy Online · hypothalamic landmarks',
  url: 'https://nba.uth.tmc.edu/neuroanatomy/L11/Lab11p14_index.html',
};
const keys = ['choroid-plexus', 'mammillary-body', 'lamina-terminalis'] as const;
function concept(slug: typeof keys[number], prompt: string, explanation: string,
  reference: ReasoningConcept['references'][number]): ReasoningConcept {
  const key = `ventricular-landmark-${slug}`;
  const entries = pins.entries.filter(e => e.key === key);
  if (entries.length !== 1 || entries[0].identity.sources.length !== 2)
    throw new Error(`Missing exact two-part source identity: ${key}`);
  const { identity } = entries[0];
  return {
    key, region: 'head-neck', sourceRegions: identity.regions,
    sourceTissue: 'neural-organ', sourceTree: 'isa',
    bindings: [{ fma: identity.fmaId, side: 'midline', files: [identity.sources[0].file, identity.sources[1].file] }],
    prompt, explanation: explanation + ' Draft for radiologist review; no scan registration or patient-specific function is established.',
    references: [reference], distractors: keys.filter(other => other !== slug).map(other => `ventricular-landmark-${other}`),
    readiness: 'draft', revision: 1,
  };
}

// Original source-specific reasoning, not copied questions or a new diagnosis tool.
export const ventricularLandmarkReasoningConcepts: readonly ReasoningConcept[] = [
  concept('choroid-plexus',
    'Which supplied cerebral-hemisphere selection represents ventricular tissue involved in producing CSF, rather than an anterior wall or a hypothalamic landmark?',
    'The choroid plexus produces CSF. This cerebral-hemisphere source groups left and right components; it does not include every ventricular plexus or model secretion, CSF pressure, flow or patency.',
    ventricles),
  concept('mammillary-body',
    'Which supplied selection represents the paired landmarks of the posterior hypothalamic region, rather than the anterior boundary of the third ventricle?',
    'The mammillary bodies mark the posterior hypothalamic region. Lamina terminalis is anterior, while choroid plexus is ventricular tissue. The catalogue retains one grouped midline-tagged selection for the two source components, not independently labelled right and left bodies or resolved nuclei.',
    hypothalamus),
  concept('lamina-terminalis',
    'Which named selection corresponds to the usual thin anterior boundary of the third ventricle and hypothalamus?',
    'Lamina terminalis is that anterior boundary, not the posterior mammillary landmarks or the CSF-producing choroid plexus. Its two supplied files touch at one vertex and retain separate normals: the model is not a reconstructed continuous membrane or a validated procedural boundary.',
    ventricles),
];
