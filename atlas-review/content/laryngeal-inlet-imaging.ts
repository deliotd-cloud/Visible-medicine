// Original orientation text; reading links only. No published images or models.
const anatomy = 'https://anatomy.ttuhscep.edu/nervous_system/deepneck_ans.html';
const ct = 'https://doi.org/10.1016/j.jasi.2017.05.004';
const mri = 'https://pubmed.ncbi.nlm.nih.gov/2298998/';
const reconstruction = 'https://pubmed.ncbi.nlm.nih.gov/9799998/';

export const laryngealInletImagingTopics = {
  corniculate: {
    ct: {
      body: 'Locate the arytenoid apex when orienting the corniculate cartilage on CT. This small paired cartilage caps the arytenoid; it is not the arytenoid body or its vocal process.',
      bullets: [
        'The published CT teaching example labels corniculate and cuneiform cartilages near the lower aryepiglottic folds. Compare their relationships across adjacent sections rather than identifying either from one isolated dot.',
        'Keep the corniculate apex relationship distinct from the cuneiform within the fold. These anatomical landmarks guide comparison; the example does not establish visibility in every examination.',
      ], citations: [anatomy, ct],
    },
    mri: {
      body: 'For MRI comparison, first orient the arytenoid and adjacent aryepiglottic fold, then consider the corniculate location at the arytenoid apex. Locating the surrounding fold does not establish a separately resolved cartilage boundary.',
      bullets: [
        'A 1.5 T study of two excised larynges and 62 subjects described aryepiglottic-fold detail. Fold visibility is not a guarantee of individual corniculate visibility or a universal signal pattern.',
        'A separate cadaver reconstruction combined thin-section MRI and CT and included corniculate units. Its combined-source model does not establish independent MRI conspicuity in a living patient or validate this Atlas surface.',
      ], citations: [anatomy, mri, reconstruction],
    },
  },
  cuneiform: {
    ct: {
      body: 'Orient the cuneiform cartilage within the aryepiglottic fold on CT. Use the epiglottis and nearby arytenoid region to follow the fold; do not substitute the corniculate cartilage sitting on the arytenoid apex.',
      bullets: [
        'The CT teaching example labels a cuneiform within the lower fold and a separate corniculate landmark. The selected cartilage is only one part of that fold, not the entire mucosal contour.',
        'Compare adjacent sections and retain the scan laterality. The reference illustrates anatomy but does not supply a detection rate, a fixed slice level or a patient contour for this model.',
      ], citations: [anatomy, ct],
    },
    mri: {
      body: 'Use the aryepiglottic fold as the MRI orientation landmark for the cuneiform cartilage embedded within it. A fold that can be followed on the scan is not equivalent to an individually segmented cuneiform.',
      bullets: [
        'The 1.5 T anatomical study described the aryepiglottic folds in 62 subjects and included two excised larynges for comparison. Fold visibility does not establish individual cuneiform visibility.',
        'Keep the expected anatomical location separate from what the acquired images actually resolve. Do not transfer the reported signal of larger hyaline cartilages to this small cartilage or infer disease from its non-visualisation.',
      ], citations: [anatomy, mri],
    },
  },
} as const;

export const laryngealInletImagingScope = 'Compare anatomy with separation at zero. This static source surface supplies no scan, patient-space registration, cartilage segmentation, laryngeal motion, diagnostic conclusion or procedural guidance.';
export const laryngealInletImagingNote = 'Original source-bound educational draft; revision-bound radiologist review pending. Anatomical orientation is not validation of scan visibility. Atlas, imaging-case and paid-lecture access remain independent.';
