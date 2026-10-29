import data from '../public/models/bodyparts3d/cubital-veins/catalog.json' with { type: 'json' };
import { applyBodySourceAddition, sourceCanonical, type BodySourceAddition } from './body-source-additions.ts';
import type { BodyCatalog, BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const source = data as unknown as BodySourceAddition;
export function addCubitalVeins(catalog: BodyCatalog) {
  return applyBodySourceAddition(catalog, source);
}
export function cubitalVeinLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (!source.structures.some(p => sourceCanonical(p) === sourceCanonical(s))) return undefined;
  const cubital = ['FMA22964', 'FMA22965'].includes(s.fmaId);
  const citations = ['https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/vein-tables/selected-veins-of-the-upper-limb/'];
  const note = 'Draft for radiologist review. Original source surfaces are not evidence of a patent lumen, donor-specific connection, valve function or a safe puncture route.';
  if (tab === 'anatomy' || tab === 'function') return {
    readiness: 'draft', title: `${s.name} · ${tab === 'anatomy' ? 'Superficial venous anatomy' : 'Venous return'} · draft`,
    body: cubital
      ? (tab === 'anatomy' ? 'The median cubital vein is a superficial connection in the elbow region between cephalic and basilic venous routes. Its arrangement is variable.' : 'A common superficial route carries some cephalic return towards the basilic vein. The relationship map describes typical anatomy, not simulated flow.')
      : (tab === 'anatomy' ? 'The median antebrachial vein is a superficial vessel of the anterior forearm receiving return from the palm and forearm. Its size and termination vary, and it may be absent.' : 'It contributes superficial palm and anterior forearm return. Termination may be into the basilic or median cubital vein; these are alternatives, not two proven outlets in this source.'),
    bullets: ['Select Venous drainage to inspect same-side connections using the existing dissection controls.', 'Keep separation at 0% to compare original positions; gaps between meshes are not repaired or interpreted as occlusion.', 'The supplied paired sources are reference-model geometry, not independently validated examples of right–left population variation.'],
    note, citations,
  };
  if (tab === 'quiz') return {
    readiness: 'draft', title: `${s.name} · Self-check · draft`,
    body: cubital ? 'Which two superficial venous routes commonly communicate through the median cubital vein?' : 'Does a median antebrachial vein have a fixed, universal termination?',
    bullets: [cubital ? 'Answer: cephalic and basilic routes, with variable arrangements.' : 'Answer: no. Basilic or median cubital terminations are described; size and presence also vary.', 'A source surface or teaching link cannot establish the pattern in an individual patient.'], note, citations,
  };
  return { readiness: 'pending', title: `${s.name} · Review pending`, body: 'Structure-specific clinical, pathology and imaging teaching has not yet been validated for this source.', bullets: [], note: 'No acquired scan, ultrasound appearance, needle trajectory or registered CT/MRI correspondence is supplied.' };
}
