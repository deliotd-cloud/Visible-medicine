import type { NestedSection } from './nested-teaching';

// Original orientation exercises, not validated CT segmentations or protocols.
export const nestedCTOrientationReferences = {
  nestedCTAuditory: {
    title: 'Sitek, Calabrese, Johnson, Ghosh and Chandrasekaran (2022) · Structural Connectivity of Human Inferior Colliculus Subdivisions · Frontiers in Neuroscience · CC BY 4.0; original orientation note, no figures reused',
    url: 'https://www.frontiersin.org/journals/neuroscience/articles/10.3389/fnins.2022.751595/full',
  },
  nestedCTTemporal: {
    title: 'Ozker, Yoshor and Beauchamp (2018) · Converging Evidence From Electrocorticography and BOLD fMRI for a Sharp Functional Boundary in Superior Temporal Gyrus · Frontiers in Human Neuroscience · CC BY 4.0; original orientation notes, no figures reused',
    url: 'https://www.frontiersin.org/journals/human-neuroscience/articles/10.3389/fnhum.2018.00141/full',
  },
  nestedCTVisual: {
    title: 'Mendoza, Shotbolt, Faiq, Parra and Chan (2022) · Advanced Diffusion MRI of the Visual System in Glaucoma: From Experimental Animal Models to Humans · Biology 11:454 · CC BY 4.0; original orientation notes, no figures reused',
    url: 'https://doi.org/10.3390/biology11030454',
  },
  nestedCTACRVision2025: {
    title: 'American College of Radiology · ACR Appropriateness Criteria: Vision Loss (New 2025) · professional guideline; original paraphrase, no figures or tables reused',
    url: 'https://acsearch.acr.org/docs/3196640/Narrative',
  },
  nestedCTChen2009: {
    title: 'Chen and colleagues (2009) · adult cadaver sections correlated with MRI for optic-tract anatomy; original paraphrase, no figures reused',
    url: 'https://pubmed.ncbi.nlm.nih.gov/19837645/',
  },
  nestedCTReuseLicense: {
    title: 'Creative Commons Attribution 4.0 International · retain credit and change notices; no publisher endorsement',
    url: 'https://creativecommons.org/licenses/by/4.0/',
  },
};
const draft = (body: string, reference: string): NestedSection => ({
  body, references: [reference, 'nestedCTReuseLicense'], readiness: 'draft',
});
const visualDraft = (body: string, references: string[]): NestedSection => ({
  body, references, readiness: 'draft',
});
export const nestedCTOrientation: Record<string, NestedSection> = {
  'inferior-collicular-brachia': draft(
    'Orient to the dorsal midbrain on multiplanar CT, then compare the supplied brachial surface with the expected ascending auditory route toward the medial geniculate region. That relay is not separately segmented here. The cited connectivity study uses diffusion MRI, not CT validation. A coloured envelope must not be read as a CT-visible axon bundle, demonstrated endpoint or evidence of hearing function; review actual patient imaging separately.',
    'nestedCTAuditory',
  ),
  'cerebral-superior-temporal-anterior': draft(
    'On multiplanar CT, orient to the superior temporal surface below the lateral fissure. This anterior source part is not the whole gyrus. Research used the posterior margin of Heschl’s gyrus to separate anterior and posterior study regions; that is not validation of this mesh boundary. Do not infer primary auditory cortex or a speech-processing territory from the CT outline. Check individual anatomy and dedicated functional evidence when required.',
    'nestedCTTemporal',
  ),
  'cerebral-superior-temporal-posterior': draft(
    'Use the lateral fissure and posterior superior temporal surface as CT orientation landmarks, comparing consecutive planes rather than assigning a territory from one slice. This source subdivision is not a CT-defined Wernicke area. The cited anterior/posterior distinction comes from anatomical and functional research, not a patient-specific CT boundary. Neither the mesh nor its laterality establishes language dominance, comprehension ability or the cause of a clinical deficit.',
    'nestedCTTemporal',
  ),
  'visual-optic-chiasm': visualDraft(
    'Use the suprasellar region to orient to the chiasm on CT. For suspected chiasmal disease, MRI better characterizes sellar and suprasellar soft tissues; targeted CT can add information about calcification or adjacent bone. The supplied surface is an anatomical guide, not a traced CT boundary, patient registration, or proof of compression or a visual-field deficit.',
    ['nestedCTACRVision2025', 'nestedCTVisual'],
  ),
  'visual-optic-tracts': visualDraft(
    'Orient from the postchiasmal route beside the cerebral peduncle toward the expected geniculate region. Adult cadaver sections and MRI support that anatomical relationship; they do not establish tract visibility on CT. Use this as regional CT orientation only. MRI can provide further pathway detail. The supplied surface contains no axons, validated termination, patient registration, or scan-based visual-field map.',
    ['nestedCTChen2009', 'nestedCTVisual'],
  ),
};
