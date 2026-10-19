// Original CT teaching summaries. Links are citations, not media licences.
export const craniofacialCalcificationCtReferences = {
  buch2014: 'https://pubmed.ncbi.nlm.nih.gov/23945224/',
  ko2010: 'https://pubmed.ncbi.nlm.nih.gov/20157406/',
  murtagh2001: 'https://pubmed.ncbi.nlm.nih.gov/11498437/',
} as const;

export const craniofacialCalcificationCtGroups = {
  trochlea: {
    body: 'Locate the side-specific superior-oblique tendon pulley in the superomedial orbit. Acquired CT may show mineralisation at the tendon turn; an incidental focus is not the complete cartilage, tendon or muscle.',
    bullets: [
      'Calcification alone neither diagnoses systemic disease nor excludes injury or a foreign body.',
      'The donor surface supplies no CT attenuation, calcific deposit, tissue-thickness measurement or validated patient boundary.',
    ],
    citations: [craniofacialCalcificationCtReferences.buch2014, craniofacialCalcificationCtReferences.ko2010],
  },
  stylohyoid: {
    body: 'Distinguish the stylohyoid ligament from the temporal styloid process and stylohyoid muscle. Acquired CT can show mineralised portions of the stylohyoid complex; these do not outline every part of a normal nonossified ligament.',
    bullets: [
      'Elongation or mineralisation can be incidental. Imaging alone does not establish Eagle syndrome or explain symptoms.',
      'This unvalidated donor reference encodes neither calcification, a patient measurement nor neurovascular compression.',
    ],
    citations: [craniofacialCalcificationCtReferences.murtagh2001],
  },
} as const;

export const craniofacialCalcificationCtNote = 'Original educational draft; exact revision-bound radiologist review and sign-off pending. Restore assembled anatomy with separation at zero. These notes provide no acquired image or validated spatial registration. Atlas, imaging-case and paid-lecture access remain independent.';
