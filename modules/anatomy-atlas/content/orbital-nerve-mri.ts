export type OrbitalNerveMriGroup =
  | 'superior-oculomotor'
  | 'inferior-oculomotor'
  | 'trochlear'
  | 'frontal'
  | 'lacrimal'
  | 'nasociliary'
  | 'ciliary-ganglion';

type OrbitalMriTopic = {
  body: string;
  bullets: readonly string[];
  citations: readonly string[];
};

export const orbitalNerveMriReferences = {
  arizono: 'https://pubmed.ncbi.nlm.nih.gov/42034568/',
  li: 'https://pubmed.ncbi.nlm.nih.gov/33811598/',
} as const;

const flairLimits = [
  'Arizono et al. studied 46 subjects (92 orbits) without orbital disease, using fat-suppressed 3D FLAIR within brain MRI and three readers. Disease-cohort performance was not validated.',
] as const;
const dessLimits = [
  'Li et al. studied 30 healthy volunteers at 3 T with 3D-DESS-WE and two readers. Agreement across studied ocular motor nerves was kappa 0.83–1.00, not a nerve-specific diagnostic sensitivity.',
] as const;

// Original summaries; no article wording, figures, scans or contours imported.
export const orbitalNerveMriTopics: Record<OrbitalNerveMriGroup, OrbitalMriTopic> = {
  'superior-oculomotor': {
    body: 'The intraorbital superior division of CN III was assessed with 3D-DESS-WE. This supports sequence-specific depiction in healthy volunteers; it does not establish equivalent visibility on every MRI acquisition.',
    bullets: dessLimits,
    citations: [orbitalNerveMriReferences.li],
  },
  'inferior-oculomotor': {
    body: 'The inferior division of CN III was identified in all studied orbits on fat-suppressed 3D FLAIR. This division-level observation does not establish equal reliability for every distal branch.',
    bullets: flairLimits,
    citations: [orbitalNerveMriReferences.arizono],
  },
  trochlear: {
    body: 'Li et al. assessed the intraorbital trochlear nerve with 3D-DESS-WE. Orbital-course evidence should not be substituted for evidence about its cisternal segment or nerve function.',
    bullets: dessLimits,
    citations: [orbitalNerveMriReferences.li],
  },
  frontal: {
    body: 'The frontal nerve was identified in all studied orbits on fat-suppressed 3D FLAIR. That finding does not establish visibility of all distal V1 branches.',
    bullets: flairLimits,
    citations: [orbitalNerveMriReferences.arizono],
  },
  lacrimal: {
    body: 'The lacrimal nerve belonged to a group detected in 96.7–98.9% of orbits, with observed reader agreement of 78.3–81.5%. These grouped ranges are not individual lacrimal-nerve estimates.',
    bullets: flairLimits,
    citations: [orbitalNerveMriReferences.arizono],
  },
  nasociliary: {
    body: 'Nasociliary and smaller CN III branches had grouped detectability of 87.0–95.7%, but poor reader agreement (17.4–38.0%; AC1 −0.13 to −0.08). Do not give this identification the same confidence as the frontal nerve.',
    bullets: flairLimits,
    citations: [orbitalNerveMriReferences.arizono],
  },
  'ciliary-ganglion': {
    body: 'The ciliary ganglion belonged to a group detected in 96.7–98.9% of orbits, with observed agreement of 78.3–81.5%. These grouped results do not establish visibility of ciliary nerve branches.',
    bullets: flairLimits,
    citations: [orbitalNerveMriReferences.arizono],
  },
};

export const orbitalNerveMriScope = 'This is a static reference mesh, not a patient scan or validated Atlas registration. MRI visibility is not diagnostic sensitivity; nerve function and pathology are not established.';
export const orbitalNerveMriNote = 'Original teaching draft; revision-bound radiologist review and sign-off are pending. Atlas, imaging-case and paid-lecture access remain independent.';
