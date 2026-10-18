import type { BodyCatalog } from '../app/body-types';
import { coronaryArterialStudyFor } from './coronary-arterial-study.ts';

/** Additional geometry checks for the exact, source-admitted comparison. */
export function coronaryArterialReviewChecks(
  catalog: BodyCatalog | null,
  structureId: string,
): string[] {
  const study = coronaryArterialStudyFor(catalog);
  if (!study) return [];
  const participants = [...study.targets, ...study.context];
  if (!participants.some((item) => item.id === structureId)) return [];

  const sourceChecks = participants.map((item) => {
    const bundle = study.bundles.find((entry) => entry.id === item.bundle);
    // The study admission gate guarantees one exact bundle per participant.
    if (!bundle) throw new Error('Coronary arterial review bundle missing');
    return `Inspect the displayed source surface and boundary for ${item.name} (${item.fmaId}; ${item.id}); source files ${item.sources.map((entry) => entry.file).join(', ')}; bundle ${bundle.id} SHA-256 ${bundle.sha256}. Record any label, shape or relationship correction against this source revision.`;
  });

  return [
    ...sourceChecks,
    'At 0% separation, compare the four artery surfaces with the muted heart as nonselectable canvas context; confirm the heart cannot be clicked as a comparison target.',
    'During separation the heart context must be hidden. On reassembly, restore it only when still enabled and not removed; respect the current system visibility state.',
    'In thorax and whole-body, use Both sides and verify all four artery targets can each be clicked, labelled, isolated and framed by the camera.',
    'Record the clinical limits of these source surface unions: they do not establish a complete coronary tree, ostia, a continuous lumen, dominance, flow or patient registration.',
    'This worksheet reviews the five-source comparison as context for the selected structure. It does not approve the other structures or the whole study; each source and revision needs its own radiologist sign-off.',
  ];
}
