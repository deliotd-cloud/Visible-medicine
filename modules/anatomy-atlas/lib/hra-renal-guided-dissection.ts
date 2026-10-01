import raw from '../public/models/hra-renal/catalog.json' with { type: 'json' };
import type { SpecimenDefinition } from './independent-specimen';
import type { SpecimenGuidedDissection } from './specimen-guided-dissection';
import { hraRenalMatches } from './hra-renal';

// Every visibility set and selection is an existing, source-bound renal study.
// Study order is an inspection sequence, not a physical dissection route.
const steps = [
  {
    id: 'right-supplied-layers', study: 'layers-right',
    title: 'Right supplied layers',
    caption: 'Start with the supplied right capsule and renal source surfaces. The right renal-column group is held for source defects; its absence is not normal anatomy.',
  },
  {
    id: 'right-interior', study: 'internal-right',
    title: 'Right interior source regions',
    caption: 'Hide the outer right source surfaces to inspect the supplied pyramids, papillae and collecting regions. Source letters do not link an individual papilla to a calyx.',
  },
  {
    id: 'right-collecting', study: 'collecting-right',
    title: 'Right collecting source groups',
    caption: 'Compare the right minor and major calyx source groups with the pelvis. Papillae and the ureter are outside this close-up study; open ends do not establish a continuous lumen.',
  },
  {
    id: 'left-supplied-layers', study: 'layers-left',
    title: 'Left supplied layers',
    caption: 'Compare the supplied left capsule and deeper source surfaces. The left outer cortex is held for source defects; the visible columns do not replace complete cortex.',
  },
  {
    id: 'left-interior', study: 'internal-left',
    title: 'Left interior source regions',
    caption: 'Inspect the supplied left pyramids, papillae and collecting regions. The source has eleven papilla parts and ten minor-calyx parts; no individual drainage connection is established.',
  },
  {
    id: 'left-collecting', study: 'collecting-left',
    title: 'Left collecting source groups',
    caption: 'Compare the left minor and major calyx source groups with the pelvis. Papillae and the ureter are outside this close-up study; source parts do not prove a continuous route.',
  },
  {
    id: 'bilateral-hila', study: 'hila',
    title: 'Bilateral hilar source comparison',
    caption: 'Show both supplied hila and pelves with the renal arteries and admitted right renal vein. The left renal vein is held; this view does not establish a complete vascular tree.',
  },
  {
    id: 'bilateral-pelves-ureters', study: 'ureters',
    title: 'Bilateral pelves and ureters',
    caption: 'Compare the supplied renal pelves and long ureter surfaces in their separate study. Bladder insertion, patency and continuity are not validated.',
  },
] as const;

export function hraRenalGuidedDissection(
  definition: SpecimenDefinition,
): SpecimenGuidedDissection | null {
  if (!hraRenalMatches(definition)) return null;
  const admitted = new Set(definition.surfaces.map(surface => surface.id));
  const resolved = steps.map(step => {
    const study = definition.studies.find(item => item.id === step.study);
    if (!study || !study.ids.length || new Set(study.ids).size !== study.ids.length
      || study.ids.some(id => !admitted.has(id)) || !study.ids.includes(study.selectedId)
      || !['anterior', 'posterior', 'right', 'left', 'superior', 'inferior'].includes(study.view))
      return null;
    return {
      id: step.id,
      title: step.title,
      caption: step.caption,
      ids: [...study.ids],
      selectedId: study.selectedId,
      view: study.view,
    };
  });
  if (resolved.some(step => !step) || new Set(resolved.map(step => step?.id)).size !== resolved.length)
    return null;
  return structuredClone({
    id: 'hra-renal-source-guide',
    title: 'Kidney source-guided dissection',
    status: 'draft',
    specimenKey: raw.specimenId,
    sourceFrame: raw.sourceFrame,
    limitation: 'Partial independent HRA female reference. Left outer cortex, right renal columns and left renal vein remain held; renal fascia, fat, nephron detail and complete vessels are not supplied. Visibility does not establish drainage connections, surgical planes, inter-donor registration or clinical interpretation. Revision-bound radiologist review remains required.',
    steps: resolved,
  } as SpecimenGuidedDissection);
}
