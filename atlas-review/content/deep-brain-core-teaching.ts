// Original teaching drafts. References are links, not imported article text or data.
// Source identity and all ten lessons require revision-bound radiologist review.
export const deepBrainCoreReferences = {
  akeret2022: {
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9314404/',
    licence: 'CC BY 4.0',
  },
  postans2019: {
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7132945/',
    licence: 'CC BY 4.0',
  },
  septum2024: {
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11300447/',
    licence: 'CC BY 4.0',
  },
  hitti2022: {
    url: 'https://www.frontiersin.org/journals/neuroscience/articles/10.3389/fnins.2022.837624/full',
    licence: 'CC BY 4.0',
  },
} as const;

export type DeepBrainCoreReference = keyof typeof deepBrainCoreReferences;
export type DeepBrainCoreTeachingLesson = {
  readonly body: string;
  readonly bullets: readonly string[];
  readonly citations: readonly DeepBrainCoreReference[];
};

export const deepBrainCoreReviewNote =
  'Original educational draft; revision-bound radiologist review pending. A source-labelled surface is not a patient image, tractogram, lesion map, nuclear parcellation or validated clinical boundary; no patient registration is supplied. Atlas, case and paid-lecture access remain independent.';

export const deepBrainCoreTeaching = {
  fornicealCommissure: {
    function: {
      body: 'The precise human functional role of the forniceal commissure remains unresolved. Histology found delicate crossing fibres between the crura; 7 T tractography in 178 people found no crossing connection, and nine dissections found no macroscopic tract. A separate study associated reconstructed dorsal hippocampal commissure measures with recognition-memory performance, without establishing causation or the identity of this surface.',
      bullets: [
        'The histology does not prove a direct hippocampus-to-hippocampus memory route.',
      ],
      citations: ['akeret2022', 'postans2019'],
    },
    clinical: {
      body: 'The subsplenial region is close to the splenium and fornical crura: splenial streamlines can be mistaken for forniceal ones. Failure to reconstruct the crossing also does not prove histological fibres are absent. This selection supplies no patient tractogram or functional disconnection test.',
      bullets: [
        'Assess a claimed pathway against the imaging method and neighbouring callosal fibres.',
      ],
      citations: ['akeret2022'],
    },
    pathology: {
      body: 'The significance of damage confined to this commissure remains unresolved. Adjacent splenial, fornical and septal tissue complicates an isolated lesion claim. Recognition-memory correlations from reconstructed pathways are a research clue, not a demonstrated deficit from focal commissural injury.',
      bullets: [
        'This surface cannot partition effects of a nearby lesion.',
      ],
      citations: ['akeret2022', 'postans2019'],
    },
  },
  septalSource: {
    function: {
      body: 'The source label “septum of telencephalon” covers a broad region. Human anatomy distinguishes the dorsal septum pellucidum from the basal septum verum containing septal nuclei, though their tissue boundary is not sharp. Connections to hippocampal circuitry are described anatomically; rhythm-regulation evidence largely comes from animal work, with precise human function unresolved.',
      bullets: [
        'Pellucidum, basal nuclei and connecting fibres are not individually segmented here.',
      ],
      citations: ['septum2024'],
    },
    clinical: {
      body: 'For clinical orientation, distinguish the ventricular partition from the basal septal region near the fornix and anterior commissure. Human dissection and histology map septum-verum connections, but do not certify their course within this atlas source. Interpret basal forebrain findings against patient imaging and neighbouring anatomy.',
      bullets: [
        'A septal-region finding does not identify a particular nucleus or pathway.',
      ],
      citations: ['septum2024'],
    },
    pathology: {
      body: 'A lesion near the basal septum may involve the fornix, neighbouring basal forebrain or subcallosal vessels; a mass near the foramen of Monro may affect ventricular flow. These are regional contexts, not evidence that this broad source surface predicts a syndrome or isolates a nucleus.',
      bullets: [
        'The mesh cannot identify a tumour, infarct, cellular pathology or symptom cause.',
      ],
      citations: ['septum2024'],
    },
  },
  striaMedullaris: {
    clinical: {
      body: 'The stria medullaris carries afferent fibres toward the habenular region along the dorsomedial thalamus. In a research series of 30 healthy participants, probabilistic diffusion tractography reconstructed the pathway using pallidal seed and ventral-tegmental target regions with a habenular waypoint. This demonstrates an imaging method, not reliable visibility on routine MRI, individual axonal continuity or a validated clinical target.',
      bullets: [
        'Left and right source selections share this teaching; neither is registered to a patient tractogram.',
        'Keep the stria medullaris distinct from the amygdala-related stria terminalis.',
      ],
      citations: ['hitti2022'],
    },
    pathology: {
      body: 'The habenular pathway is studied in relation to mood circuits, but the 2022 tractography cohort comprised healthy participants. Reported differences in reconstructed streamline counts by sex and handedness describe the method’s outputs; they are not axon counts or disease markers. The study did not test whether stria injury causes depression or whether stimulation of this tract treats it. A lesion near the habenula requires patient-specific evidence before attributing symptoms to these small fibres.',
      bullets: [
        'A reconstructed streamline or atlas surface is not a disease biomarker.',
        'Do not transfer research streamline differences to an individual lesion or treatment prediction.',
      ],
      citations: ['hitti2022'],
    },
  },
} as const satisfies {
  readonly fornicealCommissure: Record<'function' | 'clinical' | 'pathology', DeepBrainCoreTeachingLesson>;
  readonly septalSource: Record<'function' | 'clinical' | 'pathology', DeepBrainCoreTeachingLesson>;
  readonly striaMedullaris: Record<'clinical' | 'pathology', DeepBrainCoreTeachingLesson>;
};
