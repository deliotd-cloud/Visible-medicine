import type { NestedSection } from './nested-teaching';

export const brainImagingReferences = {
  headCT: {
    title: 'ACR/RSNA · Head CT (reviewed June 2026)',
    url: 'https://www.radiologyinfo.org/en/info/headct',
  },
  posteriorFossaCT: {
    title:
      'Hwang et al. · CT and MRI detection of posterior-fossa infarction (2012)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/22305149/',
  },
  brainstemFGATIR: {
    title:
      'Shepherd et al. · MRI discrimination of brainstem nuclei and pathways (2020)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/32354712/',
  },
  ventricularFLAIR: {
    title: 'Bakshi et al. · Ventricular CSF pulsation artefact on FLAIR (2000)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/10730642/',
  },
  aqueductPhaseMRI: {
    title:
      'Stoquart-El Sankari et al. · Phase-contrast MRI in aqueductal stenosis (2009)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/18832663/',
  },
};
const draft = (body: string, ...references: string[]): NestedSection => ({
  body,
  references,
  readiness: 'draft',
});

// Original introductory notes, not scan interpretation, protocols or source-mesh approval.
export const brainImagingTeaching = {
  lateral: {
    ct: draft(
      'Compare both lateral ventricles through the image series, not just one slice. Head CT can demonstrate ventricular enlargement, but the assessment includes surrounding brain tissue and the other cavities. This atlas supplies a cavity surface, not CT attenuation, a patient volume or a diagnostic size threshold.',
      'headCT',
    ),
    mri: draft(
      'In a study of otherwise normal adult MRI examinations, axial FLAIR could show bright CSF pulsation artefact within the lateral ventricles. A bright focus is therefore not automatically a lesion: its sequence and wider imaging context matter. This static cavity has no FLAIR signal or moving CSF.',
      'ventricularFLAIR',
    ),
  },
  third: {
    ct: draft(
      'Review the third ventricle within the overall pattern of ventricular enlargement and adjacent brain findings. Head CT provides cross-sectional and reformatted views, not a direct measurement of CSF motion. Separating this midline cavity in the atlas does not demonstrate an obstruction or explain a patient’s ventricular size.',
      'headCT',
    ),
    mri: draft(
      'Distinguish ventricular shape from CSF flow assessment. In a small study of suspected aqueductal stenosis, phase-contrast MRI supplied flow information when conventional appearances could be inconclusive. The third-to-fourth ventricular connection must be assessed on the actual examination; a gap between these model surfaces is not evidence of stenosis or absent flow.',
      'aqueductPhaseMRI',
    ),
  },
  fourth: {
    ct: draft(
      'Follow the fourth ventricle across the available CT planes and compare its outline with the rest of the ventricular system. CT can depict enlarged ventricles, but the source cavity alone cannot determine the cause. Its apparent size in a rotated or separated teaching view is not a clinical measurement.',
      'headCT',
    ),
    mri: draft(
      'CSF pulsation artefact was particularly common in the fourth ventricle on axial FLAIR in a normal-adult study and could mimic or obscure a lesion. Interpret signal with the other sequences and planes. This source surface contains neither MR signal nor the fluid dynamics responsible for that artefact.',
      'ventricularFLAIR',
    ),
  },
  midbrain: {
    ct: draft(
      'Do not use a reassuring brainstem outline on noncontrast CT to exclude an acute infarct. Posterior-fossa research documents limited detection, influenced by timing and beam-hardening artefact. This midbrain compound has no attenuation or vascular-territory information.',
      'posteriorFossaCT',
    ),
    mri: draft(
      'Establish the midbrain level and cross-reference orthogonal planes. A small 3-T study using a white-matter-suppressing inversion-recovery sequence (FGATIR) demonstrated internal brainstem detail, with some nuclei located indirectly. This compound does not segment those nuclei; visibility depends on the actual acquisition, not the detail of a coloured surface.',
      'brainstemFGATIR',
    ),
  },
  pons: {
    ct: draft(
      'Posterior-fossa CT may underestimate infarct extent in the pons. Compare image findings with the wider examination rather than assigning a lesion to one displayed half. The two source halves here do not represent unilateral disease.',
      'posteriorFossaCT',
    ),
    mri: draft(
      'Use axial, sagittal and coronal images to place a pontine finding, distinguishing the external contour from internal pathways. Research MRI using a white-matter-suppressing sequence improved internal contrast, but does not establish routine visibility of every nucleus. The paired model halves are not a signal abnormality or a tract map.',
      'brainstemFGATIR',
    ),
  },
  medulla: {
    ct: draft(
      'Noncontrast CT has important limitations for posterior-fossa infarction. An apparently intact medullary contour cannot exclude injury to small internal pathways. The atlas displays a compound surface, not the image resolution or attenuation needed to assess them.',
      'posteriorFossaCT',
    ),
    mri: draft(
      'Cross-reference the medullary level in all three planes before relating a finding to internal circuitry. Research brainstem MRI distinguished some pathways directly and located other structures indirectly. This paired source compound provides neither nuclei nor tract crossings; its boundary must not be used as a patient-specific lesion map.',
      'brainstemFGATIR',
    ),
  },
  cerebellum: {
    ct: draft(
      'A normal-looking cerebellum on initial noncontrast CT does not exclude acute infarction. Posterior-fossa detection is limited by factors including timing and artefact. This combined cerebellar surface cannot display subtle attenuation change or infarct extent.',
      'posteriorFossaCT',
    ),
    mri: draft(
      'A posterior-fossa stroke study found diffusion-weighted MRI lesions missed on initial CT. For cerebellar study, examine the actual images and both sides; this combined source selection supplies no diffusion signal, infarct territory or patient correspondence.',
      'posteriorFossaCT',
    ),
  },
} satisfies Record<string, { ct: NestedSection; mri: NestedSection }>;
