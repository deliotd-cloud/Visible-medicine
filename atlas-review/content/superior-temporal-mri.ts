import type { NestedSection } from './nested-teaching';
import { cerebralTeaching } from './cerebral-teaching.ts';

export const superiorTemporalMRIReferences = {
  superiorTemporalLandmarks: {
    title: 'USC LONI · Superior temporal gyrus: anterior and posterior segments',
    url: 'https://resource.loni.usc.edu/resources/downloads/research-protocols/masking-regions/superior-temporal-gyrus-anterior-posterior/',
  },
  temporalMultiplanarMRI: {
    title: 'Lehman et al. · Temporal lobe MRI landmarks (2016; abstract)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/26514961/',
  },
};

// Original orientation prose, not imported protocol text, images or masks.
const anterior = cerebralTeaching.anteriorSuperiorTemporal.imaging.mri;
export const superiorTemporalMRI: Record<'anterior' | 'posterior', NestedSection> = {
  anterior: {
    readiness: 'draft',
    body: 'First identify the superior temporal gyrus between the Sylvian fissure above and superior temporal sulcus below. Cross-reference coronal slices with a lateral or sagittal view; the gyrus can have a doubled appearance. An anterior/posterior division depends on the segmentation convention: the atlas part boundary is not automatically the boundary used in the LONI protocol. ' + anterior.body,
    references: ['superiorTemporalLandmarks', ...anterior.references],
  },
  posterior: {
    readiness: 'draft',
    body: 'Follow the superior temporal gyrus posteriorly between the Sylvian fissure and superior temporal sulcus, checking coronal and sagittal views together where neighbouring temporal and supramarginal gyri can appear to merge. A volumetric MRI study assessed temporal landmarks by cross-referencing all three planes; Heschl gyrus was identified separately. Distinguish anatomical orientation from functional localisation: this posterior source part is not a complete Wernicke area, a patient-specific segmentation, or proof of language dominance. No MRI signal or registered scan is supplied.',
    references: ['superiorTemporalLandmarks', 'temporalMultiplanarMRI'],
  },
};
