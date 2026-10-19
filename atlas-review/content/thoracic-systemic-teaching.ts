// Original educational drafts for four source-labelled thoracic arterial selections.
// Usual anatomy is distinct from this static, unvalidated source geometry.
export const thoracicSystemicTeachingReferences = {
  universityThorax: 'https://anatomy.ttuhscep.edu/anatomytables/arteries_thorax.html',
  bronchialOriginStudy: 'https://pubmed.ncbi.nlm.nih.gov/34087845/',
  esophagealCtStudy: 'https://pubmed.ncbi.nlm.nih.gov/21084913/',
  esophagealCaseSeries: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12408246/',
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

/** Draft Anatomy, Function and one four-choice Quiz concept per exact FMA identity. */
export const thoracicSystemicTeachingTopics = {
  FMA4149: {
    anatomy: 'The esophageal artery is one named arterial selection near the thoracic oesophagus. In usual anatomy, small oesophageal arteries and other regional branches contribute to the organ at different levels. This label does not identify the parent vessel or a complete supply network for the displayed surface.',
    function: 'Oesophageal arterial branches deliver blood to the oesophageal wall. The selected surface shows no measured flow, patent lumen or exclusive perfusion territory.',
    prompt: 'Compare this individually named artery with the separate grouped set of thoracic-aortic oesophageal branches. Their source labels alone do not establish a junction between them.',
    limit: 'FJ1934 is one source-labelled surface, not a map of all oesophageal feeders, wall layers or bleeding sites.',
    question: 'What can be concluded from the selected esophageal artery label?',
    choices: ['It identifies one oesophageal arterial source selection', 'It proves every artery supplying the oesophagus is shown', 'It proves this surface joins the grouped aortic branches', 'It locates an arterial bleeding point'],
    correctAnswer: 'It identifies one oesophageal arterial source selection',
    explanation: 'The name identifies a supplied arterial selection; it does not establish the whole supply, a specific connection or a clinical bleeding site.',
    references: [thoracicSystemicTeachingReferences.universityThorax, thoracicSystemicTeachingReferences.esophagealCtStudy],
  },
  FMA10704: {
    anatomy: 'The source explicitly names this a variant bronchial artery. FMA14177, “bronchial branch of arch of aorta”, is another definition on the same FJ3418 component, not a second selectable artery. Bronchial arterial origins vary in actual anatomy; the label does not validate this surface’s precise origin.',
    function: 'Bronchial arteries are systemic vessels that contribute to blood supply of the lower trachea and bronchial tree. This variant-labelled surface does not demonstrate its own perfusion territory, calibre or connections.',
    prompt: 'Compare the variant-labelled selection with FMA68109, the separately supplied bronchial artery. Neither surface is a universal branching template.',
    limit: 'FJ3418 does not verify an arch ostium, a patent junction or the presence or absence of a spinal arterial connection.',
    question: 'How should the FMA14177 name on this variant bronchial component be treated?',
    choices: ['As an alias on the same source component', 'As a second validated bronchial artery selection', 'As proof of a patent aortic-arch origin', 'As the normal bronchial branching pattern'],
    correctAnswer: 'As an alias on the same source component',
    explanation: 'The audit places both definitions on FJ3418. FMA10704 remains the single variant-labelled selection, and its precise origin is unvalidated.',
    references: [thoracicSystemicTeachingReferences.universityThorax, thoracicSystemicTeachingReferences.bronchialOriginStudy],
  },
  FMA68109: {
    anatomy: 'The bronchial artery is a systemic arterial selection associated with the airway. In usual anatomy, bronchial arteries approach the lower trachea and bronchial tree; their origins and number vary. This source label does not establish an exact origin or a complete bronchial tree.',
    function: 'Bronchial arteries contribute blood to airway and supporting lung tissues. Their tissue-supply role differs from the pulmonary arterial route through the lungs; this mesh does not simulate either circulation.',
    prompt: 'Contrast this bronchial selection with the explicitly variant-labelled FMA10704 and with pulmonary arteries. Compare roles without inferring a patient-specific connection.',
    limit: 'FJ1933 cannot establish a patent origin, complete branching, flow distribution or a safe intervention route.',
    question: 'Which statement best describes the selected bronchial artery?',
    choices: ['It is a systemic vessel contributing to airway tissue supply', 'It is the pulmonary arterial trunk', 'Its source surface proves every bronchial artery is present', 'Its origin and branch count are fixed in all people'],
    correctAnswer: 'It is a systemic vessel contributing to airway tissue supply',
    explanation: 'Bronchial arteries contribute systemic blood supply to airway tissues; their individual origins and branching patterns vary.',
    references: [thoracicSystemicTeachingReferences.universityThorax, thoracicSystemicTeachingReferences.bronchialOriginStudy],
  },
  FMA71537: {
    anatomy: 'The source names this selection a set of oesophageal branches of the thoracic aorta. It is one grouped source identity, not separately validated individual arteries. Thoracic-aortic branches can contribute to oesophageal supply in usual anatomy, alongside other regional arteries.',
    function: 'These named branches represent a potential arterial contribution to the thoracic oesophageal wall. The group does not show how many distinct patent vessels supply a person or how much tissue each supplies.',
    prompt: 'Compare the grouped aortic-branch label with the individually named esophageal artery FMA4149. Keep the group intact when selecting or quizzing it.',
    limit: 'FJ3431 does not enumerate branch count, establish a connection to FMA4149, or identify a clinical intervention target.',
    question: 'What does the FMA71537 source identity represent?',
    choices: ['One grouped set of oesophageal branches of the thoracic aorta', 'A verified count of separate aortic branches', 'Every arterial contributor to the oesophagus', 'A validated connection to FMA4149'],
    correctAnswer: 'One grouped set of oesophageal branches of the thoracic aorta',
    explanation: 'FMA71537 is a single grouped selection by source definition; individual branch number and continuity are not established.',
    references: [thoracicSystemicTeachingReferences.universityThorax, thoracicSystemicTeachingReferences.esophagealCtStudy, thoracicSystemicTeachingReferences.esophagealCaseSeries],
  },
} as const satisfies Record<'FMA4149' | 'FMA10704' | 'FMA68109' | 'FMA71537', Topic>;
