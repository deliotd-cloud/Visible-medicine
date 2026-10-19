// Original orientation drafts; external articles are reading references, not imported assets.
export const elbowArterialUltrasoundReferences = {
  ulnarAnatomy: 'https://doi.org/10.3390/diagnostics13071332',
  ulnarPerfusion: 'https://pubmed.ncbi.nlm.nih.gov/34479732/',
  radialCrossings: 'https://doi.org/10.1007/s00256-024-04740-1',
} as const;
type Reference = keyof typeof elbowArterialUltrasoundReferences;
type Family = { body: string; bullets: readonly string[]; citations: readonly Reference[] };
export const elbowArterialUltrasoundTeaching: Record<
  'superiorUlnarCollateral' | 'inferiorUlnarCollateral' | 'posteriorUlnarRecurrent' | 'radialRecurrent', Family
> = {
  superiorUlnarCollateral: {
    body: 'The superior ulnar collateral artery provides an orientation point where the ulnar nerve crosses the medial intermuscular septum. Ferre-Martinez and colleagues correlated ultrasound with dissection in 11 cadaveric upper limbs. Their arteries were latex-injected: the reported sonographic identification is not evidence of normal in-vivo blood flow or routine clinical detectability.',
    bullets: [
      'Compare a candidate vessel with the septum and neighbouring nerve on acquired images; the selected arterial mesh does not supply validated nerve geometry.',
      'Keep superior and inferior ulnar collateral arteries distinct. A nearby vascular signal alone does not establish the named branch or its full course.',
      'No Doppler threshold, nerve-compression diagnosis or safe intervention route is inferred from this static surface.',
    ],
    citations: ['ulnarAnatomy'],
  },
  inferiorUlnarCollateral: {
    body: 'The inferior ulnar collateral artery must be distinguished from its posterior branch. Ferre-Martinez and colleagues described that branch accompanying the ulnar nerve through the elbow tunnel during dissection of a muscular variant. This anatomical observation does not establish sonographic visibility of the complete parent artery or show that the variant exists in a learner scan.',
    bullets: [
      'A separate contrast-enhanced ultrasound experiment examined this artery in cannulated cadaveric limbs with simulated flow. It is perfusion research, not a routine colour-Doppler identification protocol.',
      'The parent selection is not a separate posterior-branch segmentation. Do not transfer a branch observation onto every point of the model.',
      'No variant, collateral sufficiency, nerve ischaemia or operative target can be established from the atlas surface.',
    ],
    citations: ['ulnarAnatomy', 'ulnarPerfusion'],
  },
  posteriorUlnarRecurrent: {
    body: 'The posterior ulnar recurrent artery was described alongside the ulnar nerve at the rear of the elbow tunnel in anatomical work. Rossmann and colleagues studied its contribution to nerve perfusion using contrast-enhanced ultrasound in 20 cadaveric donors with simulated flow; its observed territory overlapped those of the ulnar collateral arteries. Those experimental territories are not patient-specific perfusion maps.',
    bullets: [
      'Keep this posterior recurrent selection separate from the anterior ulnar recurrent artery; a peri-elbow vascular signal alone does not identify either branch.',
      'Do not interpret the cadaver experiment as evidence that standard clinical ultrasound resolves the whole artery or its intraneural supply.',
      'The model supplies no contrast enhancement, flow measurement or patient registration; non-visualisation cannot be used here to diagnose absence or occlusion.',
    ],
    citations: ['ulnarAnatomy', 'ulnarPerfusion'],
  },
  radialRecurrent: {
    body: 'The radial recurrent artery has branches forming the leash of Henry near the deep branch of the radial nerve. Mohana-Borges and colleagues examined neurovascular crossings with high-resolution ultrasound and Doppler in 55 participants, alongside six ex-vivo samples. They found variable branch-to-nerve relationships. The named parent artery here is not a validated reconstruction of every crossing vessel or of the nerve.',
    bullets: [
      'Distinguish the ascending and muscular branches from the parent artery when comparing acquired images. Forearm position was part of the study assessment, not a fixed model-to-scan correspondence.',
      'The volunteer analysis excluded examinations where the nerve or vessels could not be detected, or Doppler was unavailable. It cannot supply an unselected clinical detection rate.',
      'No universal crossing pattern, nerve-entrapment diagnosis, injection window or safe needle route follows from this reference surface.',
    ],
    citations: ['radialCrossings'],
  },
};
export const elbowArterialUltrasoundNote =
  'Original educational draft; revision-bound radiologist sign-off pending. No ultrasound images, Doppler data or patient-to-atlas registration are supplied. This is reference anatomy orientation, not diagnostic or procedural guidance. Atlas, case and paid-lecture access remain independent.';
