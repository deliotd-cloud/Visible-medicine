// Original formative wording about usual anatomy, not validation of source meshes.
const eye = 'https://anatomy.ttuhscep.edu/nervous_system/eye_tables.html';
const nerves = 'https://iowaprotocols.medicine.uiowa.edu/protocols/cranial-nerve-anatomycranial-nerves';
const dissector = 'https://anatomy.ttuhscep.edu/schemes/eye_ans.html';
const viscera = 'https://anatomy.ttuhscep.edu/modules/intro_autonomics_2_module/autonomics_09.html';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string, reference: string) => ({
  body, choices, correctAnswer, explanation, references: [reference],
});

export const orbitalNerveQuizQuestions = {
  anteriorEthmoidal: question('Which branch gives rise to the anterior ethmoidal nerve?',
    ['Nasociliary nerve', 'Frontal nerve', 'Trochlear nerve', 'Lacrimal nerve'],
    'Nasociliary nerve', 'It is a nasociliary branch carrying sensation from anterior nasal and ethmoidal regions.', eye),
  frontal: question('Which pair branches from the frontal nerve?',
    ['Ethmoidal and long ciliary', 'Supraorbital and supratrochlear', 'Lacrimal and nasociliary', 'Superior and inferior oculomotor'],
    'Supraorbital and supratrochlear', 'These frontal branches distribute sensation across the forehead.', eye),
  inferiorOculomotor: question('Which muscle receives motor supply from the inferior division of CN III?',
    ['Superior oblique', 'Superior rectus', 'Inferior oblique', 'Lateral rectus'],
    'Inferior oblique', 'The inferior division also supplies medial and inferior rectus.', dissector),
  infratrochlear: question('Which territory belongs to the infratrochlear nerve?',
    ['Lateral cheek', 'Posterior scalp', 'Lower lip', 'Medial eyelids'],
    'Medial eyelids', 'This nasociliary branch supplies medial eyelid skin and conjunctiva.', nerves),
  lacrimal: question('The lacrimal nerve belongs to which trigeminal division?',
    ['Ophthalmic V1', 'Maxillary V2', 'Mandibular V3', 'None; it is CN VII'],
    'Ophthalmic V1', 'It carries lateral upper eyelid sensation and conveys secretomotor fibres to the gland.', eye),
  nasociliary: question('Which nerve gives rise to long ciliary and ethmoidal branches?',
    ['Frontal', 'Nasociliary', 'Trochlear', 'Supraorbital'],
    'Nasociliary', 'This V1 branch also sends a sensory connection toward the ciliary ganglion.', nerves),
  ciliaryConnection: question('What travels from nasociliary nerve toward the ciliary ganglion?',
    ['Preganglionic motor fibres', 'Postganglionic lacrimal fibres', 'Sensory fibres', 'CN IV motor fibres'],
    'Sensory fibres', 'They pass through the ganglion without synapsing there.', dissector),
  ophthalmic: question('Which set contains the principal orbital branches of V1?',
    ['Zygomatic, buccal, infraorbital', 'Mandibular, lingual, auriculotemporal', 'Optic, trochlear, abducens', 'Frontal, lacrimal, nasociliary'],
    'Frontal, lacrimal, nasociliary', 'The ophthalmic division divides into these sensory orbital branches.', eye),
  posteriorEthmoidal: question('Which sinus receives sensation through the posterior ethmoidal nerve?',
    ['Sphenoid sinus', 'Maxillary sinus', 'Frontal sinus only', 'No paranasal sinus'],
    'Sphenoid sinus', 'It also supplies posterior ethmoid air cells.', nerves),
  longCiliary: question('How do long ciliary nerves relate to the ciliary ganglion?',
    ['They synapse there', 'They bypass it', 'They arise from CN IV', 'They supply superior rectus'],
    'They bypass it', 'They are nasociliary branches carrying ocular sensory fibres.', eye),
  superiorOculomotor: question('Which muscle receives motor supply from the superior division of CN III?',
    ['Inferior oblique', 'Lateral rectus', 'Superior rectus', 'Superior oblique'],
    'Superior rectus', 'The superior division also supplies levator palpebrae superioris.', dissector),
  supraorbital: question('The supraorbital nerve branches from which nerve?',
    ['Nasociliary', 'Lacrimal', 'Trochlear', 'Frontal'],
    'Frontal', 'It continues sensory supply toward the forehead.', nerves),
  supratrochlear: question('Which area receives supratrochlear sensation?',
    ['Medial forehead', 'Lower lip', 'Lateral cheek', 'Tongue'],
    'Medial forehead', 'This frontal branch also reaches the medial upper eyelid.', eye),
  trochlear: question('Which extraocular muscle is supplied by CN IV?',
    ['Lateral rectus', 'Superior oblique', 'Inferior rectus', 'Levator palpebrae superioris'],
    'Superior oblique', 'The trochlear nerve is the motor nerve of superior oblique.', dissector),
  ciliaryGanglion: question('Which fibres synapse in the ciliary ganglion?',
    ['V1 sensory', 'Postganglionic sympathetic', 'Preganglionic parasympathetic from CN III', 'CN IV motor'],
    'Preganglionic parasympathetic from CN III', 'Postganglionic fibres then reach the pupillary sphincter and ciliary muscle.', viscera),
} as const;
export type OrbitalNerveQuizGroup = keyof typeof orbitalNerveQuizQuestions;
