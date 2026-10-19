// Original factual synthesis. Reading references do not license imported media.
export const orbitalSensoryMriGroups = {
  anteriorEthmoidal: ['FMA52677', 'FMA52676'],
  posteriorEthmoidal: ['FMA52716', 'FMA52715'],
  infratrochlear: ['FMA52699', 'FMA52698'],
  ophthalmic: ['FMA52623', 'FMA52622'],
  ciliaryConnection: ['FMA52674', 'FMA52673'],
  longCiliary: ['FMA82735', 'FMA82734'],
  supraorbital: ['FMA52657', 'FMA52656'],
  supratrochlear: ['FMA52644', 'FMA52643'],
} as const;

const anatomy = 'https://anatomy.ttuhscep.edu/nervous_system/eye_tables.html';
const flair = 'https://pubmed.ncbi.nlm.nih.gov/42034568/';
const crani = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10017653/';
const distalLimit = 'The cited orbital FLAIR study assessed frontal, lacrimal and nasociliary nerves and the ciliary ganglion, not this individual distal branch. Depicting a parent nerve or nearby ganglion does not validate identification of this branch.';

export const orbitalSensoryMriTopics = {
  anteriorEthmoidal: {
    body: 'Orient this nasociliary branch toward the anterior ethmoidal foramen on the medial orbital wall, then toward the anterior nasal region. This is an expected anatomical route, not a traced nerve in an acquired MRI.',
    bullets: [distalLimit, 'Use the foramen as a landmark, not as proof that its nerve has been resolved. Do not relabel an adjacent vessel or the whole neurovascular passage as a segmented nerve.'],
    citations: [anatomy, flair],
  },
  posteriorEthmoidal: {
    body: 'Relate this nasociliary branch to the posterior ethmoidal foramen and its posterior ethmoid and sphenoid sinus territories. Keep it distinct from the anterior ethmoidal branch when studying the medial orbital wall.',
    bullets: [distalLimit, 'A model can separate adjacent branches more clearly than an acquired image. An expected course is an orientation aid, not evidence that a continuous nerve boundary is visible on that scan.'],
    citations: [anatomy, flair],
  },
  infratrochlear: {
    body: 'The infratrochlear nerve is a nasociliary branch serving the medial eyelid region. Do not confuse it with the supratrochlear branch of the frontal nerve simply because both are near the medial orbit.',
    bullets: [distalLimit, 'Compare parentage in the assembled 3D model before looking for image landmarks. Neither a familiar location nor a similar name establishes an MRI label.'],
    citations: [anatomy, flair],
  },
  ophthalmic: {
    body: 'V1 is the ophthalmic division of the trigeminal nerve; its principal orbital branches are frontal, lacrimal and nasociliary. Follow the division toward the superior orbital fissure, keeping it separate from the optic nerve and optic canal.',
    bullets: [
      'In an eleven-patient 3-T 3D CRANI study, V1 identification was limited: 29.5% before and 36% after contrast. These are study-specific identification results, not diagnostic sensitivity or a recommendation to administer contrast.',
      'That acquisition assessed the course toward the supraorbital rim. It does not validate every distal branch, all routine brain MRI sequences or the extent of this particular source mesh.',
    ],
    citations: [anatomy, crani],
  },
  ciliaryConnection: {
    body: 'This selection represents the nasociliary connection to the ciliary ganglion. Keep that incoming sensory connection distinct from the ganglion itself and the short ciliary nerves leaving it.',
    bullets: [distalLimit, 'A visible ganglion is not a resolved connecting nerve. This mesh does not demonstrate fibre type, impulse direction or a functional test result.'],
    citations: [anatomy, flair],
  },
  longCiliary: {
    body: 'Long ciliary nerves arise from the nasociliary nerve and bypass the ciliary ganglion on their way to the eye. They must not be substituted for short ciliary nerves emerging from the ganglion.',
    bullets: [distalLimit, 'The named source object is not a patient-specific count of nerve twigs. Do not infer the number, continuity or integrity of fine nerves from a selected surface or from failure to see them on MRI.'],
    citations: [anatomy, flair],
  },
  supraorbital: {
    body: 'This frontal-nerve branch reaches the supraorbital notch or foramen and continues toward the forehead. The bony exit is an anatomical landmark, not the nerve itself.',
    bullets: [distalLimit, 'The CRANI study followed V1 toward the supraorbital rim, but did not provide validation of each distal supraorbital twig. Keep a parent-pathway observation separate from branch-specific confidence.'],
    citations: [anatomy, flair, crani],
  },
  supratrochlear: {
    body: 'The supratrochlear nerve is a frontal-nerve branch serving the medial forehead and upper eyelid. Contrast that parentage with the nasociliary origin of the infratrochlear nerve.',
    bullets: [distalLimit, 'Do not transfer a frontal-nerve detection rate to this smaller branch. A clear branch in the 3D atlas does not ensure an independently recognizable structure on the loaded MRI.'],
    citations: [anatomy, flair],
  },
} as const;
