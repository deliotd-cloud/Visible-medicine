export const orbitalRingCtReferences = {
  martins2011: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3335518/',
  daniels1985: 'https://pubmed.ncbi.nlm.nih.gov/3877415/',
  naito2019: 'https://pubmed.ncbi.nlm.nih.gov/31675425/',
  lacey2022: 'https://pubmed.ncbi.nlm.nih.gov/35058545/',
  ma2022: 'https://pubmed.ncbi.nlm.nih.gov/36355368/',
} as const;

// Original factual summaries, not reused publication text or media. Anatomical
// location is compared with CT landmarks; no patient-space correspondence follows.
export const orbitalRingCtTopic = {
  readiness: 'draft' as const,
  body: 'The common tendinous-ring region is at the orbital apex, around the orbital opening of the optic canal and the central superior orbital fissure. The optic strut separates the canal from the fissure. Compare these landmarks with the assembled model for orientation. This is anatomical location teaching, not direct tendon depiction on CT; the selected tendon surface is not a contour identified on CT.',
  bullets: [
    'Evidence of depiction is not a routine-visibility promise. Daniels et al. correlated coronal cadaver CT with sections and demonstrated apical annulus anatomy in selected clinical CT studies. The inspected abstract does not establish whether individual ring fibres or their precise boundaries are separable on a particular scan, nor a diagnostic sensitivity or protocol.',
    'The detailed annular boundary is disputed. Naito et al. found a shared C-shaped origin for three recti with an independent superior rectus origin; Lacey et al. found a common tendinous origin. Ma et al. described posterior fibrous origins joining into a complete ring further anteriorly. These anatomical studies do not validate the topology, thickness or attachment footprint of this source mesh.',
    'Keep the tendon region distinct from the optic nerve, rectus muscles and bony openings. Their proximity may help explain location but cannot substitute for direct tendon identification. Absence of a distinguishable ring on a slice does not prove anatomical absence; no pathology assessment or nerve-function inference is supplied.',
  ],
  citations: Object.values(orbitalRingCtReferences),
};

export const orbitalRingCtScope = 'Source-bound static anatomy only. Restore assembled separation before comparing relationships; explode and isolate are model controls, not CT planes. No acquired-image annotation or patient registration is supplied.';
export const orbitalRingCtNote = 'Original educational source draft; revision-bound radiologist review and sign-off are pending. Source geometry remains unvalidated. Atlas, imaging-case and paid-lecture access remain independent.';
