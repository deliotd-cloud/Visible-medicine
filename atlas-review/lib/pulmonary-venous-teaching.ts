import pins from '../content/pulmonary-venous-teaching-pins.json' with { type: 'json' };
import {
  pulmonaryVenousTeachingConcepts,
  pulmonaryVenousTeachingReferences,
  type PulmonaryVenousTeachingGroup,
} from '../content/pulmonary-venous-teaching';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const bound = new Map(pins.entries.map(entry => [entry.identity.id, {
  signature: sourceCanonical(entry.identity),
  group: entry.group as PulmonaryVenousTeachingGroup,
}]));

const note = 'Revision-bound radiologist review pending; this draft has no clinical approval. Return separation to zero for anatomical relationships. Source surfaces show selected exterior donor segments, not vessel lumen, validated branches or full lobar or surgical routes. No patient scan or spatial registration is connected. Confirm patient, side, series, acquisition and orientation in the separate Didanix Education/light viewer. Atlas, case and lecture access remain independent. Not a diagnosis, acquisition protocol, treatment or procedural guide.';

/** Lessons apply only to the four exact retained source identities and three named tabs. */
export function pulmonaryVenousTeachingLesson(structure: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ct' && tab !== 'mri' && tab !== 'quiz') return undefined;
  const binding = bound.get(structure.id);
  if (!binding || sourceCanonical(structure) !== binding.signature) return undefined;

  const concept = pulmonaryVenousTeachingConcepts[binding.group][tab];
  const citations = concept.references.map(key => pulmonaryVenousTeachingReferences[key]);
  if (tab === 'quiz') {
    const question = pulmonaryVenousTeachingConcepts[binding.group].quiz;
    return {
      readiness: 'draft',
      title: `${structure.name} · Pulmonary venous quick check · draft`,
      body: question.body,
      bullets: [...question.choices],
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      citations: [...citations],
      note,
    };
  }

  const imaging = pulmonaryVenousTeachingConcepts[binding.group][tab];
  return {
    readiness: 'draft',
    title: `${structure.name} · ${tab === 'ct' ? 'CT' : 'MRI'} orientation · draft`,
    body: imaging.body,
    bullets: [...imaging.bullets],
    citations: [...citations],
    note,
  };
}
