// Original educational wording and reading link only; no study prose, figures, scans or Doppler traces imported.
export const suprascapularVesselUltrasoundReferences = {
  notchDopplerStudy: 'https://doi.org/10.3390/jcm7120491',
} as const;

export const suprascapularVesselUltrasoundTeaching = {
  artery: {
    body: 'At the suprascapular notch on the superior scapular border, medial to the coracoid, Doppler flow spectrum can help identify the suprascapular artery. In a healthy-volunteer study, the artery was detected in every notch that could be imaged; some notches were obscured by the clavicle.',
    bullets: [
      'The artery usually passes above the superior transverse scapular ligament, but vessel, ligament and nerve relationships vary.',
      'Doppler colour alone does not establish arterial identity. A vessel unseen in one acquisition is not evidence that it is absent.',
    ],
    citations: ['notchDopplerStudy'],
  },
  vein: {
    body: 'At the suprascapular notch, the suprascapular vein was less consistently visible than the artery in a healthy-volunteer Doppler study. Flow spectrum helps distinguish venous from arterial signal when vessels are visualised.',
    bullets: [
      'The vein often passes below the superior transverse scapular ligament, but this relationship varies.',
      'Doppler colour alone does not establish venous identity. Non-visualisation in one acquisition does not establish absence.',
    ],
    citations: ['notchDopplerStudy'],
  },
} as const;

export const suprascapularVesselUltrasoundNote =
  'Original educational draft; revision-bound radiologist sign-off pending. The static vessel mesh supplies no sonogram, Doppler measurement or validated nerve/ligament relationship and is not registered to a scan. An actual acquisition is needed for sonographic assessment. No diagnostic or patient-specific inference is supplied. Atlas, case and paid-lecture access remain independent.';
