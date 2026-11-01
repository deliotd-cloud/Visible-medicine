import type { NestedSection } from './nested-teaching';

export const renalVenousXrayReferences = {
  renalContrastVenography: {
    title: 'Takebayashi et al. · Left renal venography and Doppler correlation (1999; abstract)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/9888735/',
    scopedToConcept: true,
  },
  renalAdrenalContrastVenography: {
    title: 'Well et al. · Renal/adrenal venous landmarks in adrenal sampling (2022; CC BY 4.0)',
    url: 'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0279552',
    scopedToConcept: true,
  },
};

export const renalVeinXray: NestedSection = {
  body: 'On contrast renal venography, assess the opacified renal vein and any collateral channels. In the cited left-sided study, venograms and renocaval pressure measurements were interpreted together; vein enlargement alone did not distinguish normal from abnormal drainage. A pressure measurement is separate evidence, not a value read from the outline. This left-renal-vein example is not a right-sided diagnostic rule. The atlas is an orientation surface, not an unenhanced X-ray, measured pressure map or patient angiogram. Assemble the model before comparing it with acquired imaging.',
  references: ['renalContrastVenography'],
  readiness: 'draft',
};

export const adrenalVeinXray: NestedSection = {
  body: 'During adrenal venous sampling, contrast venography outlines the sampled vein under X-ray guidance. Well and colleagues compared CT/MRI landmarks with fluoroscopy, keeping the right renal and right adrenal venous openings distinct. In that study the left adrenal vein was accessed through the left renal vein, while the right-sided approach used the inferior vena cava. Blood-test results were used to confirm sampling; a venous outline alone is not a hormone measurement. These atlas surfaces supply no catheter route, contrast flow, procedural distances or registered patient coordinates. Summary adapted from Well et al. (2022), CC BY 4.0.',
  references: ['renalAdrenalContrastVenography', 'renalReuseLicense'],
  readiness: 'draft',
};
