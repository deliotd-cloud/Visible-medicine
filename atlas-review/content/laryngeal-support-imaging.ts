// Original orientation notes; references are reading links, not licensed image assets.
export const laryngealSupportImagingReferences = {
  anatomy: 'https://anatomy.ttuhscep.edu/schemes/larynx_tables.html',
  imaging: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3624744/',
  mr: 'https://pubmed.ncbi.nlm.nih.gov/2298998/',
  cricothyroid: 'https://www.elsevier.com/resources/anatomy/respiratory-system/upper-respiratory-system/cricothyroid-membrane/24990',
} as const;
type Ref = keyof typeof laryngealSupportImagingReferences;
export type LaryngealSupportImagingGroup = 'thyrohyoidMembrane' | 'medianThyrohyoid' | 'lateralThyrohyoid' | 'hyoEpiglottic' | 'thyroEpiglottic' | 'medianCricothyroid' | 'vocal';
export type LaryngealSupportImagingMode = 'ct' | 'mri';
type Fact = { text: string; references: readonly Ref[] };
const fact = (text: string, ...references: Ref[]): Fact => ({ text, references });

export const laryngealSupportImagingModes = {
  ct: fact('If an existing CT includes the larynx, compare soft-tissue and bone windows with adjacent planes. These notes orient a search; a coloured source surface is not a CT segmentation.', 'imaging'),
  mri: fact('First confirm laryngeal coverage and the acquired sequence. Compare corresponding T1/T2 levels where available. The source model supplies neither MR signal nor proof that a thin ligament is separately resolved.', 'imaging'),
} as const;

export const laryngealSupportImagingGroups: Record<LaryngealSupportImagingGroup, {
  landmark: Fact; ct: Fact; mri: Fact;
}> = {
  thyrohyoidMembrane: {
    landmark: fact('Use the hyoid above and thyroid cartilage below to orient the membrane.', 'anatomy'),
    ct: fact('The membrane forms the anterior pre-epiglottic boundary; examine that interface rather than treating adjacent fat as membrane.', 'imaging'),
    mri: fact('Orient the anterior pre-epiglottic interface. The catalogue separates right and left surfaces, but this is not a patient-specific membrane segmentation.', 'imaging'),
  },
  medianThyrohyoid: {
    landmark: fact('The central ligament links the superior thyroid notch with the hyoid.', 'anatomy'),
    ct: fact('Use the notch-to-hyoid corridor as the search location, not the lateral horn-to-horn connection.', 'anatomy'),
    mri: fact('Check the central notch-to-hyoid relationship. Do not assign the whole thyrohyoid membrane to this narrower label.', 'anatomy'),
  },
  lateralThyrohyoid: {
    landmark: fact('The lateral ligament joins the greater hyoid horn and superior thyroid horn on its side.', 'anatomy'),
    ct: fact('Locate both ipsilateral horns before following the interval; retain the selected anatomical side.', 'anatomy'),
    mri: fact('Use the ipsilateral horn-to-horn relationship for orientation; an unresolved interval cannot confirm a distinct ligament.', 'anatomy'),
  },
  hyoEpiglottic: {
    landmark: fact('This ligament marks the superior limit of the pre-epiglottic space.', 'imaging'),
    ct: fact('Compare sagittal and axial views of the superior pre-epiglottic boundary.', 'imaging'),
    mri: fact('Use the same superior boundary as an orientation landmark, without interpreting the mesh as a visible MR band.', 'imaging'),
  },
  thyroEpiglottic: {
    landmark: fact('The epiglottic stem connects to the inner thyroid cartilage through this ligament.', 'anatomy'),
    ct: fact('Look towards the inferior pre-epiglottic boundary, distinct from its superior hyoepiglottic limit.', 'imaging'),
    mri: fact('Orient the inferior pre-epiglottic boundary; the source does not supply a patient-space attachment or resolved MR outline.', 'imaging'),
  },
  medianCricothyroid: {
    landmark: fact('The median band connects the upper cricoid arch and lower thyroid cartilage anteriorly.', 'cricothyroid'),
    ct: fact('Follow the anterior midline thyroid-to-cricoid interval. This label is not the complete lateral conus elasticus.', 'cricothyroid'),
    mri: fact('Use the anterior cartilage interval as context. A model band is not evidence of separately visible ligament fibres or a safe airway access route.', 'cricothyroid'),
  },
  vocal: {
    landmark: fact('The vocal ligament runs from thyroid cartilage to the arytenoid vocal process; it is not the entire vocal fold or vocalis muscle.', 'anatomy'),
    ct: fact('Seek the thyroid-to-vocal-process relationship; the model cannot separate ligament from surrounding fold tissue in a CT.', 'anatomy'),
    mri: fact('A published 1.5-T laryngeal MR study did not distinguish vocal ligaments or conus elasticus as separate structures. This acquisition-specific finding cautions against promising a separately visible ligament on routine MRI; it does not establish a universal limit for all sequences.', 'mr'),
  },
};
