// Original short orientation drafts. Reading links are not licences for images or prose.
export const lacrimalDrainageReferences = {
  crossSection: 'https://pubmed.ncbi.nlm.nih.gov/35522773/',
  dacryocystography: 'https://pubmed.ncbi.nlm.nih.gov/30954539/',
} as const;

export type LacrimalDrainageModality = 'ct' | 'mri';
type Reference = keyof typeof lacrimalDrainageReferences;
type Focus = { body: string; pitfall: string; references: Reference[] };
type Group = { fmas: readonly string[]; limit: string; focus: Record<LacrimalDrainageModality, Focus> };

export const lacrimalDrainageGroups: Record<string, Group> = {
  canaliculus: {
    fmas: ['FMA59582', 'FMA59583'],
    limit: 'One canaliculus-labelled source per side; upper, lower and common subdivisions, lumen and continuity are not validated.',
    focus: {
      ct: { body: 'Orient this tiny medial-eyelid selection towards the lacrimal sac, separate from the superolateral lacrimal gland. CT depicts surrounding orbital and lacrimal bone more reliably than canalicular detail.', pitfall: 'Even specialised dacryocystography has limited canalicular detail; a routine CT image cannot be matched to this entire surface or used to judge its channel.', references: ['crossSection', 'dacryocystography'] },
      mri: { body: 'Use the medial eyelid and lacrimal sac as orientation landmarks on orbital MRI; the small canalicular course may be unresolved. MR dacryocystography is a distinct specialised examination.', pitfall: 'A visible fluid signal or absence of one is not proof of this source surface, lumen or function.', references: ['crossSection', 'dacryocystography'] },
    },
  },
  sac: {
    fmas: ['FMA59545', 'FMA59546'],
    limit: 'Sac-labelled source envelope only; no validated internal cavity, canalicular junction, filling or disease extent.',
    focus: {
      ct: { body: 'Locate the lacrimal sac region at the inferomedial orbit beside its bony fossa, distinct from the superolateral lacrimal gland. CT can show the neighbouring bone and regional anatomy.', pitfall: 'The source envelope cannot be registered to a patient sac or substituted for an acquired study.', references: ['crossSection'] },
      mri: { body: 'Orient the sac region against the medial orbit and surrounding soft tissues on orbital MRI. Apparent signal and enhancement depend on the actual sequences and examination.', pitfall: 'A source-labelled sac has no measured cavity or lesion, and MRI appearance alone cannot validate this model.', references: ['crossSection'] },
    },
  },
  duct: {
    fmas: ['FMA59555', 'FMA59556'],
    limit: 'Nasolacrimal-duct-labelled source only; bony canal, membranous portion, distal opening and lumen are not separately validated.',
    focus: {
      ct: { body: 'Follow the bony nasolacrimal canal inferiorly from the sac region toward the inferior nasal meatus on suitable CT sections. The surrounding bone is an orientation landmark for this source selection.', pitfall: 'The bony canal is not the membranous duct; routine CT does not establish its full soft-tissue course or internal channel.', references: ['crossSection', 'dacryocystography'] },
      mri: { body: 'Use the medial orbital and nasal soft tissues to orient the duct region on orbital MRI. Specialised MR dacryocystography can depict more of the drainage pathway than routine orbital images.', pitfall: 'The membranous duct is not consistently resolved in detail; no patient course or function is encoded by this surface.', references: ['crossSection', 'dacryocystography'] },
    },
  },
};
