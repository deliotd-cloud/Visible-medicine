// Original, source-bound teaching drafts. The links are for reading, not image reuse.
const upperDrainageStudy = 'https://pubmed.ncbi.nlm.nih.gov/33156146/';
const modifiedUbmStudy = 'https://pubmed.ncbi.nlm.nih.gov/21258078/';
const canalicularUbmStudy = 'https://link.springer.com/article/10.1007/s00417-019-04515-8';
const sacBModeStudy = 'https://pubmed.ncbi.nlm.nih.gov/28832742/';

const reviewNote = 'Original educational draft for Didanix Education/light. No acquired image or patient-space registration is supplied. Revision-bound radiologist review is pending; Atlas, case and lecture access remain independent.';

export const lacrimalDrainageUltrasoundTopics = {
  canaliculus: {
    body: 'Specialist ultrasound biomicroscopy can depict portions of the upper lacrimal drainage apparatus. A 40–70 MHz in-vivo study of 22 eyes mapped proximal canaliculi; a separate 80 MHz study examined canaliculi in 40 normal eyes. These are acquisition-specific observations, not a promise that routine ultrasound depicts each canaliculus.',
    bullets: [
      'The 80 MHz study reported only 2 mm tissue penetration. A modified ultrasound biomicroscopy study of 24 normal drainage systems also described medial-canthal positioning and eye-cup difficulties. Depth and access constrain what can be shown.',
      'The selected side has one canaliculus-labelled Atlas mesh. It does not resolve upper, lower or common canalicular subdivisions, demonstrate a lumen, or validate continuity with the sac or deeper duct.',
      'No current ultrasound image, patency or tear-flow measurement, full mesh-to-image correspondence, diagnostic accuracy, or congenital-disease applicability is established here.',
    ],
    citations: [upperDrainageStudy, canalicularUbmStudy, modifiedUbmStudy],
    note: reviewNote,
  },
  sac: {
    body: 'The lacrimal sac can be approached in selected specialist ultrasound studies, but its image appearance depends on acquisition and physiological or disease state. In a 40–70 MHz study of 22 eyes, the sac lumen differed at rest, during irrigation, and with nasolacrimal obstruction. A separate direct-contact 10 MHz B-mode study compared sacs in ten adults with normal drainage and ten with chronic dacryocystitis.',
    bullets: [
      'A modified ultrasound biomicroscopy study assessed 24 normal drainage systems using an adapted setup; ordinary probe placement at the medial canthus was a stated obstacle. These small, different study groups do not define one general healthy appearance.',
      'The selected sac-labelled Atlas surface is an unvalidated envelope. It does not identify an image cavity, contents, fluid, disease, tear flow, patency, or continuity through the full duct.',
      'No acquired sac image, patient-space registration, mesh-to-image correspondence, diagnostic accuracy or congenital applicability is supplied.',
    ],
    citations: [upperDrainageStudy, sacBModeStudy, modifiedUbmStudy],
    note: reviewNote,
  },
} as const;
