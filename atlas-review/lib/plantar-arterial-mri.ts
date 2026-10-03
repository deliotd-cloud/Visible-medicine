import pins from '../content/plantar-arterial-mri-pins.json' with { type: 'json' };
import {
  plantarArterialMriReferences as references,
  plantarArterialMriLandmarks as landmarks,
  plantarArterialMriContext as context,
  plantarArterialMriStudies as studies,
} from '../content/plantar-arterial-mri';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const bindings = new Map(pins.entries.map(entry => [entry.identity.id, {
  signature: sourceCanonical(entry.identity), family: entry.family as keyof typeof landmarks,
}]));

/** Admission uses the complete independent source identity, not FMA/name alone. */
export function plantarArterialMriLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'mri') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  const smallBranch = binding.family === 'deep' || binding.family === 'superficial';
  return {
    readiness: 'draft', title: `${s.name} · MRI / MRA orientation · draft`, body: context,
    bullets: [
      landmarks[binding.family],
      `Independent original ${s.laterality} source ${s.fmaId}: ${s.sources.map(p => p.file).join(', ')}. The opposite side is another donor-source selection, not a mirrored substitute or patient contour.`,
      smallBranch ? studies.unenhanced : studies.comparison,
      binding.family === 'lateral' || binding.family === 'arch' ? studies.flow :
        'An apparent vessel overlap on a projection needs checking in the acquired sections. Arterial and venous signal, a crossing and a true branch junction must not be decided from this red surface alone.',
      smallBranch ? 'Individual-branch visibility remains unproven here. Do not transfer larger plantar-vessel performance or a published stenosis threshold to this fine branch.' :
        'Trace the parent and arch on the actual acquisition. Motion, sequence sensitivity and overlapping venous signal can limit interpretation; missing atlas tributaries and endpoint gaps are not scan findings.',
      'Return separation to zero before comparing anatomical relationships. Explode, clipping and camera movement do not supply an MRI slice plane or a patient-to-atlas transform.',
    ],
    citations: [...new Set([
      references.anatomy,
      ...(binding.family === 'arch' ? [references.arch] : []),
      ...(binding.family === 'deep' ? [references.deep] : []),
      smallBranch ? references.unenhanced : references.comparative,
      ...(binding.family === 'lateral' || binding.family === 'arch' ? [references.pitfalls] : []),
    ])],
    note: 'Original educational draft; revision-bound radiologist sign-off pending, with no clinical or imaging approval. No acquisition protocol, diagnostic cutoff, perfusion assessment, complete digital supply or revascularisation target is inferred. Atlas, case and paid-lecture access remain independent.',
  };
}
