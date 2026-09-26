export type LaryngealImagingGroup = 'epiglottis' | 'thyroid' | 'cricoid';
export const laryngealImagingSelections: { fmaId: string; files: string[]; group: LaryngealImagingGroup }[] = [
  { fmaId: 'FMA55130', files: ['FJ2770'], group: 'epiglottis' },
  { fmaId: 'FMA55099', files: ['FJ2808'], group: 'thyroid' },
  { fmaId: 'FMA9615', files: ['FJ2440', 'FJ2769'], group: 'cricoid' },
];
export const laryngealImagingReferences = {
  ct: 'https://pubs.rsna.org/doi/10.1148/rg.2019180076',
  mri: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4266916/',
  ossification: 'https://pubmed.ncbi.nlm.nih.gov/6804409/',
};
// Original orientation summaries. No figures, scans, contours or tables imported.
export const laryngealImagingTopics: Record<LaryngealImagingGroup, { ct: string; mri: string; scope: string }> = {
  epiglottis: {
    ct: 'Trace the epiglottis from its broad upper portion towards the narrow petiole behind the thyroid cartilage. Correlate adjacent sections rather than identifying it from a single slice.',
    mri: 'On axial T1-weighted images, follow the epiglottis above and below the hyoid level, using the adjacent fat as an anatomical contrast.',
    scope: 'This is one reference epiglottis surface, not separate supra- and infrahyoid segmentations. The study does not model swallowing, airway protection or an acquired mucosal boundary.',
  },
  thyroid: {
    ct: 'Recognise the thyroid cartilage as the anterior shield of the laryngeal framework. Compare its laminae and posterior horns across sections, using both bone and soft-tissue windows.',
    mri: 'Use the thyroid-cartilage framework to orient the larynx on axial T1-weighted images. Correlate its boundary with adjacent soft tissues rather than transferring the atlas outline onto the scan.',
    scope: 'The whole source surface is retained. Its colour and thickness do not encode patient cartilage signal, ossification, tumour invasion or a treatment contour.',
  },
  cricoid: {
    ct: 'Look for the cricoid ring below the thyroid cartilage, with a broader posterior lamina and narrower anterior arch. Follow it towards the upper trachea on adjacent sections.',
    mri: 'Find the cricoid at the lower laryngeal framework on axial T1-weighted images and follow its extent towards the trachea. Its relationship to nearby soft tissues must be checked on the acquired study.',
    scope: 'Two original source components remain grouped as one cricoid identity. They are not certified arch-versus-lamina segments, a complete airway lumen or a measured stenosis.',
  },
};
