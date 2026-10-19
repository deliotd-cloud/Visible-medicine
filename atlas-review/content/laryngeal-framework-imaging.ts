export type LaryngealFrameworkImagingGroup = 'thyroid' | 'cricoid' | 'arytenoid';
export type LaryngealFrameworkImagingModality = 'ct' | 'mri' | 'ultrasound';

type FrameworkTopic = {
  body: string;
  bullets: readonly string[];
  citations: readonly string[];
};

export const laryngealFrameworkImagingReferences = {
  ultrasound: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4126113/',
  ultrasoundWindow: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11166737/',
  ct: 'https://pubmed.ncbi.nlm.nih.gov/3385869/',
  mri: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8349453/',
} as const;

const ultrasoundLimits = [
  'The anatomical ultrasound study examined 100 healthy volunteers and excluded short neck, morbid obesity and abnormal airway anatomy; its observations do not establish visibility in every patient.',
  'Air limits deeper visibility. Calcification may limit the thyroid window; an unseen structure is not evidence of absence.',
] as const;
const ultrasoundCitations = [laryngealFrameworkImagingReferences.ultrasound, laryngealFrameworkImagingReferences.ultrasoundWindow] as const;

// Original summaries; no source wording, images, scans or contours imported.
// Explicit modality entries prevent unsupported fallback teaching slots.
export const laryngealFrameworkImagingTopics: Record<
  LaryngealFrameworkImagingGroup,
  Partial<Record<LaryngealFrameworkImagingModality, FrameworkTopic>>
> = {
  thyroid: {
    ultrasound: {
      body: 'In a transverse ultrasound view, thyroid cartilage can form a hypoechoic inverted V. This cartilage window provides orientation to the laryngeal framework.',
      bullets: ultrasoundLimits,
      citations: ultrasoundCitations,
    },
  },
  cricoid: {
    ultrasound: {
      body: 'The transverse cricoid appearance includes a hypoechoic anterior arch. A posterior air–mucosa interface and reverberation boundary should not be mistaken for an image of the entire posterior cartilage ring.',
      bullets: ultrasoundLimits,
      citations: ultrasoundCitations,
    },
  },
  arytenoid: {
    ultrasound: {
      body: 'Arytenoid landmarks may be visible through the transverse thyroid-cartilage window. Distinguish cartilage landmarks from the adjacent vocal-fold tissue; a surface model does not reproduce the ultrasound appearance.',
      bullets: ultrasoundLimits,
      citations: ultrasoundCitations,
    },
    ct: {
      body: 'Orient the arytenoid in relation to the cricoid across adjacent CT sections. The cricoarytenoid saddle joint can superimpose on axial images, obscuring its interspace; an absent gap on one section does not establish ankylosis.',
      bullets: [
        'The reference compared CT with histology in eight autopsy larynges. Cartilage calcification, ossification and marrow appearance varied; this specimen evidence does not validate the Atlas surface against a patient scan.',
      ],
      citations: [laryngealFrameworkImagingReferences.ct],
    },
    mri: {
      body: 'Research MRI identified arytenoid cartilage and age-associated ossification in three fixed cadaver larynges: an infant, a child and an elderly adult. Use this as evidence of specimen anatomy, without assuming equivalent visibility on routine clinical MRI.',
      bullets: [
        'The study used 4.7 T research imaging, contrast immersion and histological comparison. Its specimen resolution does not validate routine clinical sequences or correspondence with this Atlas surface.',
      ],
      citations: [laryngealFrameworkImagingReferences.mri],
    },
  },
};

export const laryngealFrameworkImagingScope = 'This is a static reference surface, not vocal-fold motion, nerve function, a diagnosis, a registered scan or a probe-plane model. No procedural guidance is supplied.';
export const laryngealFrameworkImagingNote = 'Original teaching draft; revision-bound radiologist review is pending. Atlas, imaging-case and paid-lecture access remain independent.';
