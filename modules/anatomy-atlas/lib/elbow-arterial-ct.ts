import pins from '../content/elbow-arterial-ct-pins.json' with { type: 'json' };
import { elbowArterialCtReference, elbowArterialCtAnatomyReference, elbowArterialCtLicense, elbowArterialCtTopics, elbowArterialCtEvidenceLimit, type ElbowArterialCtGroup } from '../content/elbow-arterial-ct';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const identities = new Map(pins.entries.map(e => [e.identity.id, { signature: sourceCanonical(e.identity), group: e.group as ElbowArterialCtGroup }]));
export function elbowArterialCtLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ct') return undefined;
  const bound = identities.get(s.id);
  if (!bound || sourceCanonical(s) !== bound.signature) return undefined;
  return {
    readiness: 'draft', title: `${s.name} · CT arterial orientation · draft`,
    body: elbowArterialCtTopics[bound.group].body,
    bullets: [elbowArterialCtEvidenceLimit,
      'CTA refers to acquired contrast-enhanced imaging, not simulated mesh enhancement. No CT study, validated lumen, patency, perfusion or patient registration is connected here.',
      'Restore separation to 0% before comparing source positions. Apparent mesh gaps or overlap are not occlusion or a verified arterial junction; source branch identity is not patency.',
      'These prompts do not promise universal visibility, supply a diagnosis or provide acquisition or procedural guidance. Ultrasound evidence is not supplied by this CT reference.'],
    citations: [elbowArterialCtReference, elbowArterialCtAnatomyReference, elbowArterialCtLicense],
    note: 'Original CT orientation using the existing Atlas anatomy map; adapted compact CTA context credits Habarta et al. (2022), Creative Commons Attribution 4.0 (CC BY 4.0). Adaptation does not imply author endorsement. Factual anatomy reference only; no figures, scans or patient identifiers imported. Radiologist review pending, bound to this revision. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
