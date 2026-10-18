// Original educational prose. Reading links do not grant rights to figures, tables or patient images.
export const pharyngealMuscleTeachingReferences = {
  universityLarynx: 'https://anatomy.ttuhscep.edu/schemes/larynx_tables.html',
  universitySwallowing: 'https://anatomy.ttuhscep.edu/schemes/swallowing_tables.html',
  universityDissection: 'https://anatomy.ttuhscep.edu/nervous_system/deepneck_ans.html',
  superiorStyloStudy: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7769097/',
  salpingoStudy: 'https://pubs.asha.org/doi/abs/10.1044/2021_JSLHR-20-00483',
  palatoStudy: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7895782/',
} as const;

type Topic = {
  anatomy: string;
  function: string;
  prompt: string;
  limit: string;
  question: string;
  choices: readonly [string, string, string, string];
  correctAnswer: string;
  explanation: string;
  references: readonly string[];
};

/** Five usual-anatomy concepts; left/right source records remain separately pinned. */
export const pharyngealMuscleTeachingTopics = {
  superior: {
    anatomy: 'The superior pharyngeal constrictor spreads from pterygoid, pterygomandibular and mandibular attachment regions toward the posterior pharyngeal midline. It lies above the represented inferior constrictor; the middle constrictor is not supplied as an admitted selection.',
    function: 'This upper circular-wall muscle contributes to narrowing the upper pharynx during swallowing. Its usual motor route is vagal through the pharyngeal plexus, unlike the glossopharyngeal motor supply of stylopharyngeus.',
    prompt: 'Compare the selected upper constrictor with the lower constrictor and styloid-origin longitudinal muscle. Source geometry does not validate a midline raphe or its attachment footprints.',
    limit: 'The original cadaver study describes superior-constrictor and stylopharyngeus variation; this fixed source does not encode those variants or a complete pharyngeal wall.',
    question: 'Which represented pharyngeal muscle arises across pterygoid–mandibular regions and helps narrow the upper pharynx?',
    choices: ['Stylopharyngeus', 'Superior pharyngeal constrictor', 'Inferior pharyngeal constrictor', 'Palatopharyngeus'],
    correctAnswer: 'Superior pharyngeal constrictor',
    explanation: 'The superior constrictor has the upper pterygoid–mandibular attachment pattern and circular-wall role. Stylopharyngeus and palatopharyngeus are longitudinal; the inferior constrictor attaches lower to laryngeal cartilages.',
    references: [pharyngealMuscleTeachingReferences.universityLarynx, pharyngealMuscleTeachingReferences.superiorStyloStudy],
  },
  inferior: {
    anatomy: 'The inferior pharyngeal constrictor occupies the lower pharyngeal wall, with usual attachment regions on the thyroid and cricoid cartilages. Its posterior fibres meet the pharyngeal midline in usual anatomy; the source does not independently segment a raphe or the cricopharyngeal portion.',
    function: 'It contributes to lower-pharyngeal constriction during swallowing. Vagal motor supply reaches it through pharyngeal-plexus and laryngeal branches; an exterior muscle surface does not show contraction, bolus passage or upper-oesophageal-sphincter opening.',
    prompt: 'Contrast its laryngeal-cartilage attachment region with the upper constrictor’s pterygoid–mandibular region. The absent middle constrictor must not be inferred from the gap.',
    limit: 'Do not use its lower edge as a patient-specific sphincter boundary, surgical landmark or complete muscle-layer map.',
    question: 'Which represented muscle has usual thyroid- and cricoid-cartilage attachment regions and contributes to lower-pharyngeal constriction?',
    choices: ['Salpingopharyngeus', 'Superior pharyngeal constrictor', 'Inferior pharyngeal constrictor', 'Stylopharyngeus'],
    correctAnswer: 'Inferior pharyngeal constrictor',
    explanation: 'The inferior constrictor is the represented lower circular-wall muscle related to thyroid and cricoid cartilages. The superior constrictor is higher; stylopharyngeus and salpingopharyngeus are longitudinal muscles.',
    references: [pharyngealMuscleTeachingReferences.universityLarynx, pharyngealMuscleTeachingReferences.universityDissection],
  },
  stylo: {
    anatomy: 'Stylopharyngeus descends from the temporal styloid process toward the pharyngeal wall and thyroid-cartilage region. In usual anatomy it passes between superior and middle constrictors, but the middle constrictor and the precise fibre interweaving are not validated source surfaces here.',
    function: 'This longitudinal muscle helps elevate and shorten the pharynx and raise the larynx during swallowing. Its motor supply is glossopharyngeal nerve IX, the important exception to the usual vagal supply of the other represented pharyngeal muscles.',
    prompt: 'Use the styloid origin to distinguish this selection from the soft-palate and auditory-tube-related longitudinal muscles. The cadaver study reports variable relationships with the superior constrictor.',
    limit: 'Neither cranial nerve IX nor an individual insertion pattern is independently represented or tested by the source mesh.',
    question: 'Which represented longitudinal pharyngeal muscle starts at the styloid process and is the usual CN IX motor exception?',
    choices: ['Stylopharyngeus', 'Palatopharyngeus', 'Salpingopharyngeus', 'Superior pharyngeal constrictor'],
    correctAnswer: 'Stylopharyngeus',
    explanation: 'Stylopharyngeus has the styloid-process origin and glossopharyngeal motor supply. Palatopharyngeus begins in the palate, salpingopharyngeus near the auditory tube, and the superior constrictor is circular-wall muscle.',
    references: [pharyngealMuscleTeachingReferences.universityLarynx, pharyngealMuscleTeachingReferences.superiorStyloStudy],
  },
  salpingo: {
    anatomy: 'Salpingopharyngeus begins near the cartilaginous pharyngeal end of the auditory tube and descends in the lateral pharyngeal wall. Its inferior course and blending with neighbouring longitudinal fibres vary; the source does not validate an individual terminal attachment.',
    function: 'As a longitudinal pharyngeal muscle it contributes to pharyngeal elevation and shortening during swallowing. Its usual motor context is vagal, unlike stylopharyngeus; this selection does not demonstrate auditory-tube opening.',
    prompt: 'Identify the superior auditory-tube relationship, then compare with the palate-origin palatopharyngeus and styloid-origin stylopharyngeus. Do not turn surface proximity into a verified tissue junction.',
    limit: 'The original cadaver/MRI study observed variation at both the superior origin and inferior course. No tube lumen, opening mechanism or dynamic swallowing sequence is modelled.',
    question: 'Which represented longitudinal muscle is distinguished by its superior relationship to the cartilaginous auditory tube?',
    choices: ['Palatopharyngeus', 'Stylopharyngeus', 'Inferior pharyngeal constrictor', 'Salpingopharyngeus'],
    correctAnswer: 'Salpingopharyngeus',
    explanation: 'Salpingopharyngeus is the auditory-tube-related longitudinal muscle. Palatopharyngeus comes from the palate, stylopharyngeus from the styloid process, and the inferior constrictor has a lower circular-wall role.',
    references: [pharyngealMuscleTeachingReferences.salpingoStudy, pharyngealMuscleTeachingReferences.universityDissection],
  },
  palato: {
    anatomy: 'Palatopharyngeus descends from the soft-palate region through the posterior palatal arch toward the pharyngeal wall and laryngeal region. Cadaveric work finds complex inferior fibre relationships; this source is not a segmented map of those bundles.',
    function: 'This longitudinal muscle contributes to shortening and elevating the pharynx during swallowing, with additional soft-palate relationships. Its usual motor context is vagal through the pharyngeal plexus; no velopharyngeal seal or swallowing outcome is simulated.',
    prompt: 'Compare its soft-palate origin with the styloid and auditory-tube origins of the other represented longitudinal muscles. The selected muscle is not the mucosal palatopharyngeal fold.',
    limit: 'The palate, mucosal covering, fibre-bundle insertions and patient-specific functional effect are not established by this one source surface.',
    question: 'Which represented longitudinal muscle descends from the soft palate through the posterior palatal arch?',
    choices: ['Superior pharyngeal constrictor', 'Palatopharyngeus', 'Salpingopharyngeus', 'Stylopharyngeus'],
    correctAnswer: 'Palatopharyngeus',
    explanation: 'Palatopharyngeus has the soft-palate and posterior-arch relationship. Salpingopharyngeus is auditory-tube-related, stylopharyngeus is styloid-origin, and the superior constrictor narrows the upper wall.',
    references: [pharyngealMuscleTeachingReferences.universitySwallowing, pharyngealMuscleTeachingReferences.palatoStudy],
  },
} as const satisfies Record<string, Topic>;
