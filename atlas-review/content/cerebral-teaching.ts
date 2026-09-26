import type { NestedSection } from './nested-teaching';

export const cerebralTeachingReferences = {
  insularRibbonCT: {
    title: 'Truwit et al. · Loss of the insular ribbon on early stroke CT (1990)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/2389039/',
  },
  insularDiffusionMRI: {
    title: 'Min et al. · Insular infarction in minor stroke with proximal occlusion (2020)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/32160209/',
  },
  temporalAtrophyMRI: {
    title: 'Chan et al. · Temporal atrophy in semantic dementia and Alzheimer disease (2001)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/11310620/',
  },
  semanticPPA: {
    title: 'NIA · Frontotemporal disorders: causes, symptoms and diagnosis',
    url: 'https://www.nia.nih.gov/health/frontotemporal-disorders/what-are-frontotemporal-disorders-causes-symptoms-and-treatment',
  },
};

const draft = (body: string, ...references: string[]): NestedSection => ({
  body,
  references,
  readiness: 'draft',
});

// Regional disease examples are not functional labels or findings in the mesh.
export const cerebralTeaching = {
  insula: {
    pathology: draft(
      'Insular infarction can accompany middle cerebral artery ischaemia. Early swelling may obscure the normal grey–white boundary of the insular cortex: the insular ribbon sign. This is an imaging change, not disappearance of the insula. The atlas contains no infarct or vascular-territory map, and a whole-insula selection cannot establish an individual lesion’s extent or symptoms.',
      'insularRibbonCT',
    ),
    imaging: {
      ct: draft(
        'On an independently approved acute-stroke CT, examine the insular grey–white interface for loss of definition. Early CT has limited sensitivity, so an apparently preserved ribbon does not exclude early ischaemia. The coloured source surface has no CT attenuation or adjacent white-matter segmentation; hiding it is not a simulation of this sign.',
        'insularRibbonCT',
      ),
      mri: draft(
        'A study of minor stroke with proximal middle cerebral or internal carotid artery occlusion used initial and follow-up diffusion-weighted MRI to assess insular involvement and evolving lesion patterns. Compare the insula and neighbouring brain on the actual images. This model supplies no diffusion signal, infarct percentage, patient registration or prediction of deterioration; the study’s selected cohort is not a universal diagnostic rule.',
        'insularDiffusionMRI',
      ),
    },
  },
  anteriorSuperiorTemporal: {
    pathology: draft(
      'Anterior-temporal degeneration provides a regional teaching example: semantic primary progressive aphasia can gradually impair understanding of words and recognition of familiar objects or faces. MRI research in semantic dementia describes changes across multiple anterior temporal structures, not an isolated superior temporal fragment. This source boundary therefore cannot identify a single “semantic centre”, the underlying protein pathology or a person’s language dominance.',
      'semanticPPA',
      'temporalAtrophyMRI',
    ),
    imaging: {
      mri: draft(
        'Volumetric MRI research in semantic dementia found an anterior-predominant, asymmetric temporal atrophy pattern, greater on the left in that cohort. Medial and inferolateral structures were among the most affected; assessment was not confined to the superior gyrus. Compare the wider distribution on an approved study. This static fragment supplies no serial volume measurement, diagnostic threshold, complete temporal lobe or patient-specific correspondence.',
        'temporalAtrophyMRI',
      ),
    },
  },
};
