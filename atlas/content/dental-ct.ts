// Original educational copy; linked papers are references, not imported media or datasets.
const sharedMethod =
  'Dental CBCT reconstructs a three-dimensional X-ray volume. Use the selected tooth’s jaw, side and class as orientation labels; this exterior model is not an acquired CT or CBCT image.';
const artifactLimit =
  'A phantom study found different metal streaks across its tested CT/CBCT systems; its results do not rank every scanner or protocol.';
const methodReferences = Object.freeze([
  'https://www.fda.gov/radiation-emitting-products/medical-x-ray-imaging/dental-cone-beam-computed-tomography',
  'https://pubmed.ncbi.nlm.nih.gov/37052806/',
]);

export const dentalCtGroups = Object.freeze({
  incisors: Object.freeze([
    'FMA55680', 'FMA55681', 'FMA55682', 'FMA55683',
    'FMA57140', 'FMA57141', 'FMA57142', 'FMA57143',
  ]),
  canines: Object.freeze(['FMA55686', 'FMA55687', 'FMA55798', 'FMA55799']),
  premolars: Object.freeze([
    'FMA55688', 'FMA55689', 'FMA55690', 'FMA55691',
    'FMA55692', 'FMA55693', 'FMA55694', 'FMA55695',
  ]),
  molars: Object.freeze([
    'FMA55697', 'FMA55698', 'FMA55699', 'FMA55700',
    'FMA55703', 'FMA55704', 'FMA55705', 'FMA55706',
  ]),
});

export const dentalCtTopics = Object.freeze({
  incisors: Object.freeze({
    body: `This group contains eight source-labelled central and lateral incisors across the upper and lower arches. ${sharedMethod}`,
    bullets: Object.freeze([
      'For a relevant acquired examination, follow the crown-to-root direction and neighbouring teeth across review planes. Confirm side from the images, rather than transferring the model orientation to a patient.',
      artifactLimit,
      'Central and lateral labels describe different tooth positions. They do not certify a patient-specific match, clinical numbering or internal canal configuration.',
    ]),
    citations: methodReferences,
  }),
  canines: Object.freeze({
    body: `The four canine records represent one labelled tooth in each jaw-side combination. ${sharedMethod}`,
    bullets: Object.freeze([
      'Use the selected source label to distinguish upper from lower and left from right; compare any acquired hard-tissue outline independently.',
      artifactLimit,
      'The exterior surface does not establish the number, course or patency of internal canals, or a diagnostic finding in a canine.',
    ]),
    citations: methodReferences,
  }),
  premolars: Object.freeze({
    body: `These eight records cover first and second premolars on both sides of both arches. ${sharedMethod}`,
    bullets: Object.freeze([
      'A study of 60 extracted mandibular premolars found incomplete agreement between CBCT and micro-CT for internal canal features. Those specimen results do not describe every premolar or validate this mesh’s interior.',
      artifactLimit,
      'Distinguish the first or second source label before comparing images. No root count, canal classification or pathology is assigned from the exterior model.',
    ]),
    citations: Object.freeze([...methodReferences, 'https://pubmed.ncbi.nlm.nih.gov/35720827/']),
  }),
  molars: Object.freeze({
    body: `This subset contains eight labelled first and second molars; it does not include third molars. ${sharedMethod}`,
    bullets: Object.freeze([
      'Review the actual crown and root outlines across relevant image planes. First/second, arch and side remain separate identity fields; a familiar shape alone does not establish correspondence.',
      artifactLimit,
      'Do not infer individual root/canal configuration, a fracture or infection from this generic surface. Acquisition and artefacts belong to the actual examination.',
    ]),
    citations: methodReferences,
  }),
});

export const dentalCtNote =
  "Educational CT teaching draft; radiologist review is pending. These meshes show whole external tooth surfaces. Enamel, dentine, pulp, canals and periodontal tissues are not separately segmented. An acquired scan and a validated image match or spatial registration are not supplied. Access to the Atlas, imaging cases and lectures is managed separately.";
