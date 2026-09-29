import type { NestedSection } from './nested-teaching';

// Original orientation notes only. No ultrasound images, guideline tables or
// age-specific measurements are reproduced or inferred from adult donor meshes.
export const ventricularUltrasoundReferences = {
  ventricularNeonatalUS: {
    title: 'ACR–AIUM–SPR–SRU · Neurosonography in neonates and infants',
    url: 'https://gravitas.acr.org/PPTS/DownloadPreviewDocument?DocId=42',
  },
  ventricularPosteriorFossaUS: {
    title: 'Steggerda et al. · Posterior-fossa ultrasound versus MRI in high-risk term infants (2015)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/25899415/',
  },
};
const draft = (body: string, ...references: string[]): NestedSection => ({body, references, readiness: 'draft'});
export const ventricularUltrasoundTeaching = {
  lateral: draft(
    'Neonatal/infant ultrasound uses the anterior fontanelle to compare the lateral ventricles in coronal and right/left parasagittal views. Relate each cavity to the caudothalamic groove and choroid plexus on the acquired images, not to model colours. This adult reference cavity does not encode an open fontanelle, infant proportions, echogenicity or age-specific size limits.',
    'ventricularNeonatalUS',
  ),
  third: draft(
    'In neonatal/infant neurosonography, the midline sagittal view includes the third and fourth ventricles and their neighbouring midline landmarks. Distinguish the third cavity from the lateral ventricles on complementary views. This adult source surface is not a neonatal size reference, an ultrasound image or proof of aqueductal patency; adult transcranial technique is outside this lesson.',
    'ventricularNeonatalUS',
  ),
  fourth: draft(
    'Neonatal/infant posterior-fossa assessment can include mastoid-fontanelle views in addition to anterior-fontanelle imaging. Orient the fourth ventricle between brainstem and cerebellum. In a retrospective study of 113 high-risk term infants, mastoid views improved detection, but MRI still found abnormalities missed by ultrasound. Seeing this cavity does not exclude posterior-fossa injury. This adult reference shape contains no neonatal acoustic window, echogenicity, ventricular measurements or registered scan.',
    'ventricularNeonatalUS', 'ventricularPosteriorFossaUS',
  ),
};
