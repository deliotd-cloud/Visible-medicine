// Original CT orientation draft. Linked studies supply facts, not reusable images.
export const suprascapularArterialCtReferences = {
  ctaCase: 'https://pubmed.ncbi.nlm.nih.gov/21686592/',
  cadaverSeries: 'https://pubmed.ncbi.nlm.nih.gov/23641375/',
} as const;

export const suprascapularArterialCtTeaching = {
  body: 'On an already acquired CT angiographic study where the vessel is opacified and the superior scapular border is covered, use serial sections and reformats to seek its course towards the notch. Check the observed proximal origin rather than assuming a fixed branch from the thyrocervical trunk.',
  bullets: [
    'A published CTA case identified an aneurysmal suprascapular artery arising directly from the subclavian artery. That single abnormal case does not establish normal-artery visibility on routine CT.',
    'A cadaveric series found one subligamentous arterial variant with an absent accompanying vein. It demonstrates possible notch-relationship variation, not population prevalence or proof that CT resolves the artery, ligament, nerve and vein separately.',
    'The selected surface has no CT enhancement, measured lumen or verified patient-specific origin; an unseen segment in an acquired series is not proof of absence.',
  ],
  citations: [suprascapularArterialCtReferences.ctaCase, suprascapularArterialCtReferences.cadaverSeries],
} as const;
