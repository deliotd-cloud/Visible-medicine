export type OrbitalApexCtGroup =
  | 'superior-oculomotor'
  | 'inferior-oculomotor'
  | 'trochlear'
  | 'frontal'
  | 'lacrimal'
  | 'nasociliary'
  | 'ciliary-ganglion';

type OrbitalApexCtTopic = {
  readiness: 'draft' | 'pending';
  body: string;
  bullets: readonly string[];
  citations: readonly string[];
};

export const orbitalApexCtReferences = {
  daniels1985: 'https://pubmed.ncbi.nlm.nih.gov/3877415/',
  martins2011: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3335518/',
} as const;

const ctLimit = 'Daniels et al. correlated coronal CT with cadaver sections and illustrated apical anatomy in clinical CT. This does not establish routine visibility of any named small branch, diagnostic sensitivity, or an acquisition protocol.';
const bonyLandmarks = 'The dissection places the optic strut between the optic canal and superior orbital fissure. Relating that anatomy to the CT landmarks is an educational comparison, not a branch-level CT annotation.';
const citations = [orbitalApexCtReferences.daniels1985, orbitalApexCtReferences.martins2011];

// Original factual summaries only. The dissection source supplies nerve relations;
// the CT abstract supplies apical orientation, not branch-level CT visibility.
// The 1985 full paper and 1995 osseous paper were not accessible in this review;
// do not derive protocols, detection rates or additional findings from their titles.
export const orbitalApexCtTopics: Record<OrbitalApexCtGroup, OrbitalApexCtTopic> = {
  'superior-oculomotor': {
    readiness: 'draft',
    body: 'The superior division of CN III takes the annular route at the superior orbital fissure toward superior rectus and levator palpebrae. Relate that anatomical course to the apical CT landmarks; the mesh does not demonstrate a resolved branch on CT.',
    bullets: [bonyLandmarks, ctLimit],
    citations,
  },
  'inferior-oculomotor': {
    readiness: 'draft',
    body: 'The inferior division of CN III passes through the annular part of the superior orbital fissure and extends into the lower orbit. Compare that route with the bony fissure on CT; this source mesh does not establish visibility of the division or its distal branches in a patient.',
    bullets: [bonyLandmarks, ctLimit],
    citations,
  },
  trochlear: {
    readiness: 'draft',
    body: 'CN IV courses through the lateral sector of the superior orbital fissure outside the annulus before crossing toward the superior oblique muscle. The fissure is the CT landmark; the illustrated nerve course comes from anatomy and should not be read as a line identified on CT.',
    bullets: [bonyLandmarks, ctLimit],
    citations,
  },
  frontal: {
    readiness: 'draft',
    body: 'The frontal branch of V1 enters the orbit through the lateral superior orbital fissure outside the annulus and continues along the upper orbit. Use the fissure as a CT orientation landmark; the dissection-based branch course is not a claim that the frontal nerve is individually visible on CT.',
    bullets: [bonyLandmarks, ctLimit],
    citations,
  },
  lacrimal: {
    readiness: 'draft',
    body: 'The lacrimal branch of V1 also travels through the lateral superior orbital fissure outside the annulus, then toward the lacrimal gland. Compare its anatomical route with the bony fissure for CT orientation; do not infer direct CT resolution of this small branch.',
    bullets: [bonyLandmarks, ctLimit],
    citations,
  },
  nasociliary: {
    readiness: 'draft',
    body: 'The nasociliary branch of V1 takes the central annular route through the superior orbital fissure, unlike the frontal and lacrimal branches outside the annulus. This is a dissection-based relationship to a CT bony landmark, not direct visualization of the nerve or its smaller divisions.',
    bullets: [bonyLandmarks, ctLimit],
    citations,
  },
  'ciliary-ganglion': {
    readiness: 'pending',
    body: 'CT-specific teaching for the ciliary ganglion is pending. The inspected CT abstract and anatomical dissection do not establish reliable direct visualization of this small ganglion.',
    bullets: ['Keep this source structure distinct from the optic nerve, ocular muscles and the annular route. Its model position is not a CT finding.'],
    citations,
  },
};

export const orbitalApexCtScope = 'Source-bound static anatomy only. Restore assembled separation before comparing relationships; explode and isolate are model controls, not CT planes. No scan, patient registration, pathology assessment or nerve-function inference is supplied.';
export const orbitalApexCtNote = 'Original educational source draft; revision-bound radiologist review and sign-off are pending. Atlas, imaging-case and paid-lecture access remain independent.';
